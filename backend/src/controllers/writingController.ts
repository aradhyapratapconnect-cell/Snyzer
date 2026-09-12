import type { NextFunction, Request, Response } from 'express';
import type { WritingJobRequest } from '@snyzer/shared';
import { getBackendEnv } from '../config/env.js';
import { UnauthorizedError } from '../middleware/errorHandler.js';
import { executeWritingJob } from '../services/writing/writingService.js';

/**
 * Writing-job endpoints (SNZ-026; quota SNZ-030).
 *
 * `POST /api/v1/writing/jobs` runs the full revision lifecycle for the
 * authenticated user: the route stack (`requireAuth` → `validate` →
 * handler) guarantees identity and a parsed `WritingJobRequest` body before
 * this handler runs. Length and quota enforcement use the configured server
 * values, checked before the AI provider is ever contacted.
 */
export async function createWritingJob(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    const env = getBackendEnv();
    const job = await executeWritingJob(
      { userId: req.user.id, job: req.body as WritingJobRequest },
      { maxTextLength: env.MAX_TEXT_LENGTH, maxDailyJobs: env.DAILY_JOB_LIMIT },
    );
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
}
