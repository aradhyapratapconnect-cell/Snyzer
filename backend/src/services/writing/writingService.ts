import type { WritingJobRequest, WritingJobResponse } from '@snyzer/shared';
import { withTransaction } from '../../config/database.js';
import { AppError, TextTooLongError, ValidationError } from '../../middleware/errorHandler.js';
import { sanitizePlainText } from '../../security/sanitizer.js';
import type { AIProvider } from '../ai/AIProvider.js';
import { createOpenRouterProviderFromEnv } from '../ai/OpenRouterProvider.js';
import type { AIWritingRequest, TokenUsage } from '../ai/types.js';
import { validateAIRevision } from '../ai/aiResponseValidator.js';
import { checkDailyJobQuota, DEFAULT_DAILY_JOB_LIMIT } from '../usage/usageService.js';

/**
 * Writing-job orchestration (SNZ-026; quota SNZ-030; sanitization SNZ-054;
 * streaming SNZ-061).
 *
 * Lifecycle per request: enforce the configured text limit → sanitize
 * control bytes (markup stays verbatim as inert text) → in one transaction,
 * take the per-user advisory lock, enforce the daily quota, and persist the
 * job as `processing` → run the AI provider (sync or token-streamed) →
 * atomically (one transaction) mark the job `completed`/`failed` and record
 * the usage event → return the §17 response job object. The lock makes
 * check-then-insert race-safe across concurrent requests. Failures update
 * the job row before propagating so no job is stuck in `processing` and
 * every attempt is accounted.
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

interface PreparedJob {
  jobId: string;
  inputText: string;
  provider: AIProvider;
  aiRequest: AIWritingRequest;
}

/** Length/sanitization checks plus the locked quota-check-and-insert. */
async function prepareProcessingJob(
  input: WritingJobInput,
  deps: WritingServiceDeps,
): Promise<PreparedJob> {
  const maxTextLength = deps.maxTextLength ?? 10_000;
  if (input.job.inputText.length > maxTextLength) {
    throw new TextTooLongError();
  }
  // Strip control bytes before persistence (PostgreSQL rejects NUL) and
  // inference. Markup is preserved verbatim — it is inert text everywhere
  // the pipeline carries it.
  const inputText = sanitizePlainText(input.job.inputText);
  if (inputText.trim() === '') {
    throw new ValidationError('Text must not be blank.');
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
      [input.userId, inputText, input.job.mode, input.job.tone, settings],
    );
  });
  const jobId = created[0]?.id;
  if (jobId === undefined) {
    throw new Error('Failed to persist writing job.');
  }
  return {
    jobId,
    inputText,
    provider,
    aiRequest: {
      inputText,
      mode: input.job.mode,
      tone: input.job.tone,
      editorMode: input.job.editorMode,
      targetMetrics: input.job.preferences,
    },
  };
}

interface FinishedResult {
  revisedText: string;
  analysis: CompletedJob['analysis'];
  usage: TokenUsage;
  processingMs: number;
  model: string;
}

async function completeJob(
  userId: string,
  prepared: PreparedJob,
  result: FinishedResult,
): Promise<CompletedJob> {
  const { provider, jobId } = prepared;
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
        userId,
      ],
    );
    await query(
      `INSERT INTO usage_events
         (user_id, job_id, provider, model, input_tokens, output_tokens, total_tokens, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')`,
      [
        userId,
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
}

async function failJob(userId: string, prepared: PreparedJob, error: unknown): Promise<void> {
  const code = errorCodeOf(error);
  const { provider, jobId } = prepared;
  await withTransaction(async (query) => {
    await query(
      `UPDATE writing_jobs
       SET status = 'failed', error_code = $1, completed_at = now()
       WHERE id = $2 AND user_id = $3`,
      [code, jobId, userId],
    );
    await query(
      `INSERT INTO usage_events (user_id, job_id, provider, model, status)
       VALUES ($1, $2, $3, $4, 'failed')`,
      [userId, jobId, provider.providerName, provider.modelName],
    );
  });
}

export async function executeWritingJob(
  input: WritingJobInput,
  deps: WritingServiceDeps = {},
): Promise<CompletedJob> {
  const prepared = await prepareProcessingJob(input, deps);
  try {
    const result = await prepared.provider.generateWritingRevision(prepared.aiRequest);
    return await completeJob(input.userId, prepared, result);
  } catch (error) {
    await failJob(input.userId, prepared, error);
    throw error;
  }
}

/**
 * Streaming variant (SNZ-061). Same guards and persistence as the sync path;
 * `emit` receives displayable text deltas as the model produces them.
 * Providers without streaming fall back to one synchronous call with a single
 * emission. The accumulated raw output is validated identically — display
 * tokens are never trusted for persistence.
 */
export async function executeWritingJobStream(
  input: WritingJobInput,
  deps: WritingServiceDeps = {},
  emit: (text: string) => void = () => {},
): Promise<CompletedJob> {
  const prepared = await prepareProcessingJob(input, deps);
  try {
    if (prepared.provider.streamWritingRevision === undefined) {
      const result = await prepared.provider.generateWritingRevision(prepared.aiRequest);
      emit(result.revisedText);
      return await completeJob(input.userId, prepared, result);
    }
    const stream = prepared.provider.streamWritingRevision(prepared.aiRequest);
    for (;;) {
      const next = await stream.next();
      if (next.done === true) {
        const { revisedText, analysis } = validateAIRevision(next.value.content);
        return await completeJob(input.userId, prepared, {
          revisedText,
          analysis,
          usage: next.value.usage,
          processingMs: next.value.processingMs,
          model: next.value.model,
        });
      }
      emit(next.value.text);
    }
  } catch (error) {
    await failJob(input.userId, prepared, error);
    throw error;
  }
}
