import { queryDatabase, withTransaction, type TransactionQuery } from '../../config/database.js';

/**
 * Privacy retention and purge service (SNZ-055).
 *
 * Two duties: (1) scheduled cleanup of failed job rows past the retention
 * window — user history (`completed` jobs) is only ever removed by account
 * deletion; (2) full account purges. Orphaned foreign-key rows cannot occur
 * by construction (every FK cascades or nulls, asserted in SNZ-006..010),
 * so there is nothing extra to sweep. Audit rows carry IDs and counts only
 * — never writing content. Scheduling (cron/trigger) belongs to deployment,
 * not this process: callers invoke `runRetentionCleanup()` on their cadence.
 */
export const DEFAULT_RETENTION_FAILED_JOB_DAYS = 30;

export interface RetentionResult {
  purgedFailedJobs: number;
}

/** Deletes `failed` jobs older than the retention window; returns the count. */
export async function purgeFailedJobs(
  olderThanDays: number = DEFAULT_RETENTION_FAILED_JOB_DAYS,
  query: TransactionQuery = queryDatabase,
): Promise<number> {
  const rows = await query<{ id: string }>(
    `DELETE FROM writing_jobs
     WHERE status = 'failed' AND created_at < now() - $1 * INTERVAL '1 day'
     RETURNING id`,
    [olderThanDays],
  );
  return rows.length;
}

/**
 * Permanently purges one user's data: profile row (cascading to
 * preferences, jobs, and usage events by FK) plus an audit record of the
 * purge itself. Used by `DELETE /api/v1/account` after the auth user is
 * removed.
 */
export async function purgeUserAccount(userId: string): Promise<void> {
  await withTransaction(async (query) => {
    await query('DELETE FROM profiles WHERE id = $1', [userId]);
    await query(
      `INSERT INTO audit_events (actor_user_id, event_type, target_type, target_id, metadata)
       VALUES ($1, 'ACCOUNT_DELETED', 'profile', $2, '{}'::jsonb)`,
      [userId, userId],
    );
  });
}

/** Runs all scheduled retention work and summarizes it for the audit log. */
export async function runRetentionCleanup(
  olderThanDays: number = DEFAULT_RETENTION_FAILED_JOB_DAYS,
): Promise<RetentionResult> {
  const purgedFailedJobs = await purgeFailedJobs(olderThanDays);
  return { purgedFailedJobs };
}
