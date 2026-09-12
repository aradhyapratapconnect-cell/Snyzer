import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../src/middleware/errorHandler.js';
import {
  AIMalformedResponseError,
  AIProviderUnavailableError,
  AITimeoutError,
} from '../src/services/ai/aiErrors.js';
import {
  aiCallWithRetry,
  DEFAULT_AI_BACKOFF_BASE_MS,
  DEFAULT_AI_MAX_RETRIES,
  DEFAULT_AI_TIMEOUT_MS,
} from '../src/services/ai/aiCallWithRetry.js';

/**
 * SNZ-024 unit tests: bounded retries, exponential backoff intervals,
 * timeout aborts, fail-fast cases, and secret-free domain errors. Clocks are
 * injected; no real waiting except one short abort test.
 */
function recorder() {
  const delays: number[] = [];
  return {
    delays,
    sleep: (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    },
  };
}

describe('aiCallWithRetry', () => {
  it('returns first-try successes without sleeping', async () => {
    const clock = recorder();
    const operation = vi.fn(async (_signal: AbortSignal) => 'ok');

    await expect(aiCallWithRetry(operation, { sleep: clock.sleep })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(clock.delays).toEqual([]);
  });

  it('retries transient outages with exponential backoff up to the ceiling', async () => {
    const clock = recorder();
    const operation = vi
      .fn<(_signal: AbortSignal) => Promise<string>>()
      .mockRejectedValueOnce(new AIProviderUnavailableError())
      .mockRejectedValueOnce(new AIProviderUnavailableError())
      .mockRejectedValueOnce(new AIProviderUnavailableError());

    await expect(aiCallWithRetry(operation, { sleep: clock.sleep })).rejects.toBeInstanceOf(
      AIProviderUnavailableError,
    );
    expect(operation).toHaveBeenCalledTimes(DEFAULT_AI_MAX_RETRIES + 1);
    expect(clock.delays).toEqual([DEFAULT_AI_BACKOFF_BASE_MS, DEFAULT_AI_BACKOFF_BASE_MS * 2]);
  });

  it('recovers when a retry succeeds', async () => {
    const clock = recorder();
    const operation = vi
      .fn<(_signal: AbortSignal) => Promise<string>>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce('recovered');

    await expect(aiCallWithRetry(operation, { sleep: clock.sleep })).resolves.toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(clock.delays).toEqual([DEFAULT_AI_BACKOFF_BASE_MS]);
  });

  it('fails fast on validation and malformed-output errors', async () => {
    const clock = recorder();
    for (const error of [new ValidationError('bad'), new AIMalformedResponseError()]) {
      const operation = vi.fn(async (_signal: AbortSignal) => {
        throw error;
      });
      await expect(aiCallWithRetry(operation, { sleep: clock.sleep })).rejects.toBe(error);
      expect(operation).toHaveBeenCalledTimes(1);
    }
    expect(clock.delays).toEqual([]);
  });

  it('aborts hung operations and surfaces a timeout after retries', async () => {
    const clock = recorder();
    const seen: AbortSignal[] = [];
    // Mimics fetch: rejects once the abort signal fires.
    const hanging = vi.fn(
      (signal: AbortSignal) =>
        new Promise<string>((_resolve, reject) => {
          seen.push(signal);
          signal.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );

    await expect(
      aiCallWithRetry(hanging, { timeoutMs: 10, maxRetries: 1, sleep: clock.sleep }),
    ).rejects.toBeInstanceOf(AITimeoutError);
    expect(hanging).toHaveBeenCalledTimes(2);
    expect(seen.every((signal) => signal.aborted)).toBe(true);
    expect(clock.delays).toEqual([DEFAULT_AI_BACKOFF_BASE_MS]);
  }, 10000);

  it('exposes the documented defaults and bounded constants', () => {
    expect(DEFAULT_AI_TIMEOUT_MS).toBe(20_000);
    expect(DEFAULT_AI_MAX_RETRIES).toBe(2);
    expect(DEFAULT_AI_BACKOFF_BASE_MS).toBe(500);
  });
});

describe('AI domain errors', () => {
  it('carry gateway statuses with distinct codes and generic messages', () => {
    expect([
      new AIProviderUnavailableError().status,
      new AIProviderUnavailableError().code,
    ]).toEqual([503, 'AI_PROVIDER_UNAVAILABLE']);
    expect([new AITimeoutError().status, new AITimeoutError().code]).toEqual([504, 'AI_TIMEOUT']);
    expect([new AIMalformedResponseError().status, new AIMalformedResponseError().code]).toEqual([
      502,
      'AI_MALFORMED_RESPONSE',
    ]);
    for (const error of [
      new AIProviderUnavailableError(),
      new AITimeoutError(),
      new AIMalformedResponseError(),
    ]) {
      expect(error.message).not.toMatch(/sk-|Bearer|http/i);
    }
  });
});
