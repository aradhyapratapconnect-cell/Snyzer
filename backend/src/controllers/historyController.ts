import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { queryDatabase } from '../config/database.js';
import { UnauthorizedError } from '../middleware/errorHandler.js';

/**
 * Writing-history endpoints (SNZ-027 list; detail/delete arrive SNZ-028/029).
 *
 * Every query filters explicitly by the authenticated `user_id` in addition
 * to RLS, orders newest-first to use `idx_writing_jobs_user_created`, and
 * returns truncated previews — never full texts — in list views.
 */
export const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
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
