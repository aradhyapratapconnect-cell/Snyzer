import type { WritingJobRequest, WritingJobResponse } from '@snyzer/shared';
import { withTransaction } from '../../config/database.js';
import { AppError, TextTooLongError } from '../../middleware/errorHandler.js';
import type { AIProvider } from '../ai/AIProvider.js';
import { createOpenRouterProviderFromEnv } from '../ai/OpenRouterProvider.js';
import { checkDailyJobQuota, DEFAULT_DAILY_JOB_LIMIT } from '../usage/usageService.js';

/**
 * Writing-job orchestration (SNZ-026; quota SNZ-030).
 *
 * Lifecycle per request: enforce the configured text limit → in one
 * transaction, take the per-user advisory lock, enforce the daily quota, and
 * persist the job as `processing` → run the AI provider → atomically (one
 * transaction) mark the job `completed`/`failed` and record the usage event
 * → return the §17 response job object. The lock makes check-then-insert
 * race-safe across concurrent requests. Failures update the job row before
 * propagating so no job is stuck in `processing` and every attempt is
 * accounted.
 *
 * Column mapping: `writing_jobs` has no `editor_mode` column, so editor mode
 * and preference targets ride in `settings` JSONB. Usage pricing arrives
 * with billing (`estimated_cost` stays NULL here).
 */
export interface WritingJobInput {
  userId: string;
  job: WritingJobRequest;
}

export interface WritingServiceDeps {
  provider?: AIProvider;
  maxTextLength?: number;
  maxDailyJobs?: number;
}

export type CompletedJob = WritingJobResponse['job'];

interface JobRow {
  id: string;
}

function errorCodeOf(error: unknown): string {
  return error instanceof AppError ? error.code : 'INTERNAL_ERROR';
}

export async function executeWritingJob(
  input: WritingJobInput,
  deps: WritingServiceDeps = {},
): Promise<CompletedJob> {
  const maxTextLength = deps.maxTextLength ?? 10_000;
  if (input.job.inputText.length > maxTextLength) {
    throw new TextTooLongError();
  }
  const provider = deps.provider ?? createOpenRouterProviderFromEnv();
  const maxDailyJobs = deps.maxDailyJobs ?? DEFAULT_DAILY_JOB_LIMIT;

  const settings = JSON.stringify({
    editorMode: input.job.editorMode,
    preferences: input.job.preferences,
  });
  const created = await withTransaction(async (query) => {
    // Serializes this user's check-and-insert against concurrent requests.
    await query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.userId]);
    await checkDailyJobQuota(input.userId, query, maxDailyJobs);
    return query<JobRow>(
      `INSERT INTO writing_jobs (user_id, input_text, mode, tone, settings, status)
       VALUES ($1, $2, $3, $4, $5::jsonb, 'processing')
       RETURNING id`,
      [input.userId, input.job.inputText, input.job.mode, input.job.tone, settings],
    );
  });
  const jobId = created[0]?.id;
  if (jobId === undefined) {
    throw new Error('Failed to persist writing job.');
  }

  try {
    const result = await provider.generateWritingRevision({
      inputText: input.job.inputText,
      mode: input.job.mode,
      tone: input.job.tone,
      editorMode: input.job.editorMode,
      targetMetrics: input.job.preferences,
    });
    await withTransaction(async (query) => {
      await query(
        `UPDATE writing_jobs
         SET output_text = $1, analysis = $2::jsonb, model = $3,
             input_tokens = $4, output_tokens = $5, total_tokens = $6,
             processing_ms = $7, status = 'completed', completed_at = now()
         WHERE id = $8 AND user_id = $9`,
        [
          result.revisedText,
          JSON.stringify(result.analysis),
          result.model,
          result.usage.inputTokens,
          result.usage.outputTokens,
          result.usage.totalTokens,
          result.processingMs,
          jobId,
          input.userId,
        ],
      );
      await query(
        `INSERT INTO usage_events
           (user_id, job_id, provider, model, input_tokens, output_tokens, total_tokens, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')`,
        [
          input.userId,
          jobId,
          provider.providerName,
          result.model,
          result.usage.inputTokens,
          result.usage.outputTokens,
          result.usage.totalTokens,
        ],
      );
    });
    return {
      id: jobId,
      status: 'completed',
      outputText: result.revisedText,
      analysis: result.analysis,
    };
  } catch (error) {
    const code = errorCodeOf(error);
    await withTransaction(async (query) => {
      await query(
        `UPDATE writing_jobs
         SET status = 'failed', error_code = $1, completed_at = now()
         WHERE id = $2 AND user_id = $3`,
        [code, jobId, input.userId],
      );
      await query(
        `INSERT INTO usage_events (user_id, job_id, provider, model, status)
         VALUES ($1, $2, $3, $4, 'failed')`,
        [input.userId, jobId, provider.providerName, provider.modelName],
      );
    });
    throw error;
  }
}
