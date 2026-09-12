import type { TransactionQuery } from '../../config/database.js';
import { RateLimitError } from '../../middleware/errorHandler.js';

/**
 * Usage accounting and quota enforcement (SNZ-030).
 *
 * Quotas are enforced strictly server-side from database counts — browser
 * counters are never trusted. `checkDailyJobQuota` counts the user's jobs
 * created since UTC midnight and throws `RateLimitError` (429) at the
 * limit. Callers must run it inside the same transaction as the job INSERT
 * while holding the per-user advisory lock (see writingService) so
 * concurrent requests cannot both slip under a nearly-exhausted quota.
 * Token pricing arrives with billing; `estimated_cost` stays NULL.
 */
export const DEFAULT_DAILY_JOB_LIMIT = 50;

export interface QuotaStatus {
  used: number;
  limit: number;
}

export async function checkDailyJobQuota(
  userId: string,
  query: TransactionQuery,
  limit: number,
): Promise<QuotaStatus> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM writing_jobs
     WHERE user_id = $1 AND created_at >= date_trunc('day', now())`,
    [userId],
  );
  const used = Number(rows[0]?.count ?? 0);
  if (used >= limit) {
    throw new RateLimitError(
      `You have reached your daily writing limit (${limit} jobs). It resets tomorrow — please try again then.`,
    );
  }
  return { used, limit };
}
