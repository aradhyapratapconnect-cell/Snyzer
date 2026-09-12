import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { queryDatabase, withTransaction } from '../config/database.js';
import { NotFoundError, UnauthorizedError } from '../middleware/errorHandler.js';

/**
 * Writing-history endpoints (SNZ-027 list, SNZ-028 detail, SNZ-029 delete).
 *
 * Every query filters explicitly by the authenticated `user_id` in addition
 * to RLS. List views return truncated previews; only the owned detail view
 * returns full texts. Missing and foreign-owned jobs are indistinguishable
 * (404 either way) so IDs cannot be probed across tenants.
 */
export const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const JobIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const PREVIEW_CHARS = 200;

interface JobSummaryRow {
  id: string;
  input_preview: string;
  output_preview: string | null;
  mode: string;
  tone: string;
  status: string;
  created_at: string;
}

interface CountRow {
  count: string;
}

interface JobDetailRow {
  id: string;
  input_text: string;
  output_text: string | null;
  mode: string;
  tone: string;
  settings: unknown;
  analysis: unknown;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  processing_ms: number | null;
  status: string;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function listWritingJobs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    // Re-parsed here so the controller stays safe even without the route
    // validation middleware; parsing parsed values is idempotent.
    const { limit, offset } = HistoryQuerySchema.parse(req.query);
    const userId = req.user.id;

    const jobs = await queryDatabase<JobSummaryRow>(
      `SELECT id,
              LEFT(input_text, ${PREVIEW_CHARS}) AS input_preview,
              LEFT(output_text, ${PREVIEW_CHARS}) AS output_preview,
              mode, tone, status, created_at
       FROM writing_jobs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    const counted = await queryDatabase<CountRow>(
      'SELECT COUNT(*) AS count FROM writing_jobs WHERE user_id = $1',
      [userId],
    );

    res.status(200).json({
      jobs,
      total: Number(counted[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
}

export async function getWritingJob(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    // Re-parsed for the same defense-in-depth reason as the list handler:
    // malformed UUIDs fail here with 400 instead of reaching the database.
    const { id } = JobIdParamsSchema.parse(req.params);

    const rows = await queryDatabase<JobDetailRow>(
      `SELECT id, input_text, output_text, mode, tone, settings, analysis,
              model, input_tokens, output_tokens, total_tokens, processing_ms,
              status, error_code, created_at, completed_at
       FROM writing_jobs
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id],
    );
    const job = rows[0];
    if (job === undefined) {
      throw new NotFoundError();
    }
    res.status(200).json({ job });
  } catch (error) {
    next(error);
  }
}

export async function deleteWritingJob(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    // Same UUID validation as the detail handler: malformed IDs halt here.
    const { id } = JobIdParamsSchema.parse(req.params);
    const userId = req.user.id;

    // Delete and audit together: the audit row references a job that must
    // still exist at commit time, and neither may persist without the other.
    // Metadata carries IDs only — never writing content (SNZ-009 rule).
    const deleted = await withTransaction(async (query) => {
      const rows = await query<{ id: string }>(
        'DELETE FROM writing_jobs WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId],
      );
      if (rows[0] === undefined) {
        return null;
      }
      await query(
        `INSERT INTO audit_events (actor_user_id, event_type, target_type, target_id, metadata)
         VALUES ($1, 'JOB_DELETED', 'writing_job', $2, '{}'::jsonb)`,
        [userId, id],
      );
      return rows[0].id;
    });

    if (deleted === null) {
      // Missing and foreign-owned are indistinguishable (no probing oracle).
      // The transaction above committed nothing when no row matched.
      throw new NotFoundError();
    }
    res.status(200).json({ deleted: true, id: deleted });
  } catch (error) {
    next(error);
  }
}
