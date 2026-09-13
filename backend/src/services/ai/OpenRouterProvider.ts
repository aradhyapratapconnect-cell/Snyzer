import { getBackendEnv } from '../../config/env.js';
import { BadGatewayError } from '../../middleware/errorHandler.js';
import type { AIProvider } from './AIProvider.js';
import {
  DEFAULT_AI_MAX_RETRIES,
  DEFAULT_AI_TIMEOUT_MS,
  aiCallWithRetry,
} from './aiCallWithRetry.js';
import { AIProviderUnavailableError, AITimeoutError } from './aiErrors.js';
import { buildPromptMessages } from './prompts.js';
import { extractDisplayablePrefix } from './streamingParser.js';
import { validateAIRevision } from './aiResponseValidator.js';
import type {
  AIWritingRequest,
  AIWritingResponse,
  StreamSummary,
  StreamToken,
  TokenUsage,
} from './types.js';

/**
 * OpenRouter implementation of `AIProvider` (SNZ-022; prompts SNZ-023).
 *
 * Server-side HTTPS only — the API key travels from validated env (or
 * explicit options, never the browser) into the `Authorization` header.
 * Model selection is a constructor option so deployments are never pinned to
 * one model; the default is a documented starting point, not a guarantee.
 * Prompts come from `prompts.ts`; calls run through the SNZ-024
 * timeout/retry wrapper; strict output validation arrives in SNZ-025.
 */
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Starting-point default — override per deployment; no model is guaranteed. */
export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';

export interface OpenRouterOptions {
  apiKey: string;
  model?: string;
  siteUrl?: string;
  appName?: string;
  /** Timeout/retry tuning; defaults suit production (SNZ-024). */
  resilience?: {
    timeoutMs?: number;
    maxRetries?: number;
    backoffBaseMs?: number;
  };
}

interface OpenRouterMessage {
  role: 'system' | 'user';
  content: string;
}

/** Builds a provider from validated env (crashes when the key is missing). */
export function createOpenRouterProviderFromEnv(): OpenRouterProvider {
  const env = getBackendEnv();
  return new OpenRouterProvider({
    apiKey: env.OPENROUTER_API_KEY,
    siteUrl: env.OPENROUTER_SITE_URL,
    appName: env.OPENROUTER_APP_NAME,
  });
}

export class OpenRouterProvider implements AIProvider {
  readonly providerName = 'openrouter';
  private readonly apiKey: string;
  private readonly model: string;

  /** Model attempted (used for usage accounting, even on failures). */
  get modelName(): string {
    return this.model;
  }
  private readonly siteUrl?: string;
  private readonly appName?: string;
  private readonly resilience: { timeoutMs?: number; maxRetries?: number; backoffBaseMs?: number };

  constructor(options: OpenRouterOptions) {
    if (options.apiKey === '') {
      throw new Error('OpenRouterProvider requires a non-empty apiKey.');
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_OPENROUTER_MODEL;
    this.siteUrl = options.siteUrl;
    this.appName = options.appName;
    this.resilience = options.resilience ?? {};
  }

  /** Prompt payload built from the engineered templates in `prompts.ts`. */
  protected buildMessages(request: AIWritingRequest): OpenRouterMessage[] {
    const { system, user } = buildPromptMessages(request);
    return [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
  }

  async generateWritingRevision(request: AIWritingRequest): Promise<AIWritingResponse> {
    const started = Date.now();
    const response = await aiCallWithRetry(
      async (signal) => {
        let res: Response;
        try {
          res = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify({
              model: this.model,
              messages: this.buildMessages(request),
              temperature: 0.3,
              max_tokens: 4000,
              response_format: { type: 'json_object' },
            }),
            signal,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
          }
          throw new AIProviderUnavailableError(
            'AI provider is unreachable. Please try again later.',
          );
        }
        if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
          throw new AIProviderUnavailableError(
            'AI provider is unavailable. Please try again later.',
          );
        }
        if (!res.ok) {
          throw new BadGatewayError('AI provider returned an unexpected error.');
        }
        return res;
      },
      { timeoutMs: DEFAULT_AI_TIMEOUT_MS, maxRetries: DEFAULT_AI_MAX_RETRIES, ...this.resilience },
    );

    const payload: unknown = await response.json();
    return {
      ...this.extractResult(payload),
      usage: this.extractUsage(payload),
      processingMs: Date.now() - started,
      model: this.model,
    };
  }

  /**
   * Streams a revision via OpenRouter SSE (SNZ-061).
   *
   * Same prompt contract as the synchronous call; `response_format:
   * json_object` is kept so the accumulated content validates identically.
   * Each yielded token is clean displayable text (via `streamingParser`),
   * never raw JSON. No retries — a retried stream would emit tokens twice;
   * failures surface immediately so the caller can fall back. Usage comes
   * from the terminal chunk (`stream_options.include_usage`).
   */
  async *streamWritingRevision(
    request: AIWritingRequest,
  ): AsyncGenerator<StreamToken, StreamSummary, void> {
    const started = Date.now();
    const timeoutMs = this.resilience.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    let res: Response;
    try {
      try {
        res = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({
            model: this.model,
            messages: this.buildMessages(request),
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
            stream: true,
            stream_options: { include_usage: true },
          }),
          signal: controller.signal,
        });
      } catch {
        throw new AIProviderUnavailableError('AI provider is unreachable. Please try again later.');
      }
      if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
        throw new AIProviderUnavailableError('AI provider is unavailable. Please try again later.');
      }
      if (!res.ok || res.body === null) {
        throw new BadGatewayError('AI provider returned an unexpected error.');
      }
      let accumulated = '';
      let emitted = '';
      let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) {
              continue;
            }
            const payload = trimmed.slice('data:'.length).trim();
            if (payload === '[DONE]') {
              continue;
            }
            const chunkUsage = this.readStreamChunk(payload);
            if (chunkUsage !== undefined) {
              if (typeof chunkUsage === 'string') {
                accumulated += chunkUsage;
                const displayable = extractDisplayablePrefix(accumulated);
                if (displayable.length > emitted.length) {
                  const delta = displayable.slice(emitted.length);
                  emitted = displayable;
                  yield { text: delta };
                }
              } else {
                usage = chunkUsage;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      return { usage, processingMs: Date.now() - started, model: this.model, content: accumulated };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AITimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Reads one OpenRouter SSE data payload. Returns the content delta string,
   * a usage object for terminal chunks, or undefined for heartbeats.
   */
  private readStreamChunk(payload: string): string | TokenUsage | undefined {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload) as unknown;
    } catch {
      return undefined;
    }
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined;
    }
    const record = parsed as {
      choices?: Array<{ delta?: { content?: unknown } }>;
      usage?: { prompt_tokens?: unknown; completion_tokens?: unknown; total_tokens?: unknown };
    };
    const delta = record.choices?.[0]?.delta?.content;
    if (typeof delta === 'string' && delta !== '') {
      return delta;
    }
    if (record.usage !== undefined) {
      return this.extractUsage(parsed);
    }
    return undefined;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
    if (this.siteUrl !== undefined && this.siteUrl !== '') {
      headers['HTTP-Referer'] = this.siteUrl;
    }
    if (this.appName !== undefined && this.appName !== '') {
      headers['X-Title'] = this.appName;
    }
    return headers;
  }

  private extractResult(payload: unknown): {
    revisedText: string;
    analysis: AIWritingResponse['analysis'];
  } {
    // Structural envelope problems (not model output) stay BadGateway;
    // model content validation (incl. clamping) lives in the validator.
    return validateAIRevision(this.readContent(payload));
  }

  private readContent(payload: unknown): string {
    if (typeof payload !== 'object' || payload === null) {
      throw new BadGatewayError('AI provider returned a malformed response.');
    }
    const choices = (payload as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new BadGatewayError('AI provider returned a malformed response.');
    }
    const content = (choices[0] as { message?: { content?: unknown } })?.message?.content;
    if (typeof content !== 'string' || content === '') {
      throw new BadGatewayError('AI provider returned a malformed response.');
    }
    return content;
  }

  private extractUsage(payload: unknown): TokenUsage {
    const usage = (payload as { usage?: unknown }).usage as
      { prompt_tokens?: unknown; completion_tokens?: unknown; total_tokens?: unknown } | undefined;
    const inputTokens = typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
    const outputTokens = typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : 0;
    const totalTokens =
      typeof usage?.total_tokens === 'number' ? usage.total_tokens : inputTokens + outputTokens;
    return { inputTokens, outputTokens, totalTokens };
  }
}
