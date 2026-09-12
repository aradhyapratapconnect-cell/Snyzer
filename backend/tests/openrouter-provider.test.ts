import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadGatewayError, ServiceUnavailableError } from '../src/middleware/errorHandler.js';
import {
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_API_URL,
  OpenRouterProvider,
} from '../src/services/ai/OpenRouterProvider.js';
import type { AIWritingRequest } from '../src/services/ai/types.js';

/**
 * SNZ-022 integration tests: OpenRouter provider against mocked HTTP.
 * Asserts request shape, header handling, usage mapping, and failure
 * mapping. No real network calls.
 */
const fetchMock = vi.fn();

const request: AIWritingRequest = {
  inputText: 'Clear writing wins.',
  mode: 'clarity',
  tone: 'professional',
  editorMode: 'plain',
};

function okPayload(overrides: Record<string, unknown> = {}) {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            revisedText: 'Clear writing triumphs.',
            analysis: {
              readability: 72,
              clarity: 80,
              repetition: 12,
              sentenceVariety: 68,
              vocabularyComplexity: 55,
              formality: 61,
            },
          }),
        },
      },
    ],
    usage: { prompt_tokens: 120, completion_tokens: 60, total_tokens: 180 },
    ...overrides,
  };
}

function okResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenRouterProvider', () => {
  it('POSTs a structured payload with auth and optional metadata headers', async () => {
    fetchMock.mockResolvedValue(okResponse(okPayload()));
    const provider = new OpenRouterProvider({
      apiKey: 'test-key',
      model: 'test/model',
      siteUrl: 'https://snyzer.example.com',
      appName: 'Snyzer Test',
    });

    const result = await provider.generateWritingRevision(request);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(url).toBe(OPENROUTER_API_URL);
    expect(init.method).toBe('POST');
    expect(init.headers['Authorization']).toBe('Bearer test-key');
    expect(init.headers['HTTP-Referer']).toBe('https://snyzer.example.com');
    expect(init.headers['X-Title']).toBe('Snyzer Test');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['model']).toBe('test/model');
    expect(Array.isArray(body['messages'])).toBe(true);
    expect(result.revisedText).toBe('Clear writing triumphs.');
    expect(result.usage).toEqual({ inputTokens: 120, outputTokens: 60, totalTokens: 180 });
    expect(result.model).toBe('test/model');
    expect(result.processingMs).toBeGreaterThanOrEqual(0);
  });

  it('defaults the model and omits empty optional headers', async () => {
    fetchMock.mockResolvedValue(okResponse(okPayload()));
    const provider = new OpenRouterProvider({ apiKey: 'test-key' });

    await provider.generateWritingRevision(request);

    const [, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body['model']).toBe(DEFAULT_OPENROUTER_MODEL);
    expect(init.headers).not.toHaveProperty('HTTP-Referer');
    expect(init.headers).not.toHaveProperty('X-Title');
  });

  it('rejects an empty API key at construction', () => {
    expect(() => new OpenRouterProvider({ apiKey: '' })).toThrow();
  });

  it('derives zeroed usage when provider metadata is absent', async () => {
    fetchMock.mockResolvedValue(okResponse({ ...okPayload(), usage: undefined }));
    const provider = new OpenRouterProvider({ apiKey: 'test-key' });

    const result = await provider.generateWritingRevision(request);

    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });

  it('maps rate limits and gateway errors to service errors', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-key' });

    fetchMock.mockResolvedValue(new Response('slow down', { status: 429 }));
    await expect(provider.generateWritingRevision(request)).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );

    fetchMock.mockResolvedValue(new Response('bad gateway', { status: 502 }));
    await expect(provider.generateWritingRevision(request)).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
  });

  it('maps malformed payloads without leaking the key', async () => {
    const provider = new OpenRouterProvider({ apiKey: 'super-secret-key' });

    fetchMock.mockResolvedValue(okResponse({ choices: [] }));
    const failure = await provider.generateWritingRevision(request).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(BadGatewayError);

    fetchMock.mockResolvedValue(okResponse({ choices: [{ message: { content: 'not json{{{' } }] }));
    const failure2 = await provider.generateWritingRevision(request).catch((e: unknown) => e);
    expect(failure2).toBeInstanceOf(BadGatewayError);
    expect((failure2 as Error).message).not.toContain('super-secret-key');
  });

  it('maps network failures to service errors', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const provider = new OpenRouterProvider({ apiKey: 'test-key' });

    await expect(provider.generateWritingRevision(request)).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
  });
});
