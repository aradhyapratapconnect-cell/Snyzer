import { AIProviderUnavailableError, AITimeoutError } from './aiErrors.js';

/**
 * Resilient AI call wrapper (SNZ-024).
 *
 * Runs `operation` with an `AbortController` timeout and retries transient
 * failures with exponential backoff — at most `maxRetries` retries, never
 * unbounded. Retryable: provider outages (`AIProviderUnavailableError`,
 * covering HTTP 429/502/503/504), timeouts, and network errors. Everything
 * else (validation, malformed output, unexpected gateway responses) fails
 * fast. Thrown errors are domain errors only; request specifics such as
 * headers and keys are never embedded in messages.
 */
export const DEFAULT_AI_TIMEOUT_MS = 20_000;
export const DEFAULT_AI_MAX_RETRIES = 2;
export const DEFAULT_AI_BACKOFF_BASE_MS = 500;

export interface AICallOptions {
  timeoutMs?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  /** Injectable clock for tests; defaults to real timers. */
  sleep?: (ms: number) => Promise<void>;
}

const realSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function isTimeout(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

function isRetryable(error: unknown): boolean {
  if (isTimeout(error)) {
    return true;
  }
  if (error instanceof AIProviderUnavailableError) {
    return true;
  }
  // Network-level failures (fetch TypeError etc.) are transient.
  return error instanceof TypeError;
}

export async function aiCallWithRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: AICallOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_AI_MAX_RETRIES;
  const backoffBaseMs = options.backoffBaseMs ?? DEFAULT_AI_BACKOFF_BASE_MS;
  const sleep = options.sleep ?? realSleep;

  let attempt = 0;
  for (;;) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
    try {
      const result = await operation(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (error) {
      clearTimeout(timer);
      if (isTimeout(error)) {
        if (attempt >= maxRetries) {
          throw new AITimeoutError();
        }
      } else if (!isRetryable(error) || attempt >= maxRetries) {
        throw error;
      }
      attempt += 1;
      await sleep(backoffBaseMs * 2 ** (attempt - 1));
    }
  }
}
