import { BadGatewayError, ServiceUnavailableError } from '../../middleware/errorHandler.js';
import { getBackendEnv } from '../../config/env.js';
import type { AIProvider } from './AIProvider.js';
import type { AIWritingRequest, AIWritingResponse, TokenUsage } from './types.js';

/**
 * OpenRouter implementation of `AIProvider` (SNZ-022).
 *
 * Server-side HTTPS only — the API key travels from validated env (or
 * explicit options, never the browser) into the `Authorization` header.
 * Model selection is a constructor option so deployments are never pinned to
 * one model; the default is a documented starting point, not a guarantee.
 * Prompt templates graduate to `prompts.ts` in SNZ-023; resilience
 * (timeouts/retries) and strict output validation arrive in SNZ-024/025.
 */
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Starting-point default — override per deployment; no model is guaranteed. */
export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';

export interface OpenRouterOptions {
  apiKey: string;
  model?: string;
  siteUrl?: string;
  appName?: string;
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
  private readonly siteUrl?: string;
  private readonly appName?: string;

  constructor(options: OpenRouterOptions) {
    if (options.apiKey === '') {
      throw new Error('OpenRouterProvider requires a non-empty apiKey.');
    }
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_OPENROUTER_MODEL;
    this.siteUrl = options.siteUrl;
    this.appName = options.appName;
  }

  /** First-pass prompt (SNZ-023 replaces this with engineered templates). */
  protected buildMessages(request: AIWritingRequest): OpenRouterMessage[] {
    return [
      {
        role: 'system',
        content:
          'You improve writing quality while preserving meaning. ' +
          'Respond with JSON only: {"revisedText": string, "analysis": {' +
          '"readability": number, "clarity": number, "repetition": number, ' +
          '"sentenceVariety": number, "vocabularyComplexity": number, "formality": number}}.',
      },
      {
        role: 'user',
        content: `Mode: ${request.mode}. Tone: ${request.tone}.\n\nText:\n${request.inputText}`,
      },
    ];
  }

  async generateWritingRevision(request: AIWritingRequest): Promise<AIWritingResponse> {
    const started = Date.now();
    let response: Response;
    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          model: this.model,
          messages: this.buildMessages(request),
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        }),
      });
    } catch {
      throw new ServiceUnavailableError('AI provider is unreachable. Please try again later.');
    }

    if (response.status === 429) {
      throw new ServiceUnavailableError('AI provider is rate limited. Please try again later.');
    }
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new ServiceUnavailableError('AI provider is unavailable. Please try again later.');
    }
    if (!response.ok) {
      throw new BadGatewayError('AI provider returned an unexpected error.');
    }

    const payload: unknown = await response.json();
    return {
      ...this.extractResult(payload),
      usage: this.extractUsage(payload),
      processingMs: Date.now() - started,
      model: this.model,
    };
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
    const content = this.readContent(payload);
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new BadGatewayError('AI provider returned a malformed response.');
    }
    if (typeof parsed !== 'object' || parsed === null) {
      throw new BadGatewayError('AI provider returned a malformed response.');
    }
    const { revisedText, analysis } = parsed as {
      revisedText?: unknown;
      analysis?: AIWritingResponse['analysis'];
    };
    if (typeof revisedText !== 'string' || revisedText === '' || analysis === undefined) {
      throw new BadGatewayError('AI provider returned a malformed response.');
    }
    return { revisedText, analysis };
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
