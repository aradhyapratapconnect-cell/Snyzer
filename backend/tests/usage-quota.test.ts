import type { QueryResultRow } from 'pg';
import { describe, expect, it } from 'vitest';
import { RateLimitError } from '../src/middleware/errorHandler.js';
import type { TransactionQuery } from '../src/config/database.js';
import { checkDailyJobQuota, DEFAULT_DAILY_JOB_LIMIT } from '../src/services/usage/usageService.js';

/**
 * SNZ-030 unit tests: server-side daily quota checks against a stubbed
 * query function. No database involved.
 */
function countQuery(count: string): TransactionQuery {
  return async <T extends QueryResultRow>(): Promise<T[]> => [{ count }] as unknown as T[];
}

describe('checkDailyJobQuota', () => {
  it('allows requests under the limit and reports usage', async () => {
    await expect(checkDailyJobQuota('user-1', countQuery('1'), 2)).resolves.toEqual({
      used: 1,
      limit: 2,
    });
  });

  it('blocks requests at the limit with a guidance message', async () => {
    const failure = await checkDailyJobQuota('user-1', countQuery('2'), 2).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(RateLimitError);
    expect(failure).toMatchObject({ status: 429, code: 'RATE_LIMITED' });
    expect((failure as Error).message).toContain('daily writing limit');
  });

  it('exposes a sane default daily limit', () => {
    expect(DEFAULT_DAILY_JOB_LIMIT).toBe(50);
  });
});
