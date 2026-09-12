import { Router } from 'express';
import { WritingJobRequestSchema } from '@snyzer/shared';
import { listWritingJobs, HistoryQuerySchema } from '../controllers/historyController.js';
import { createWritingJob } from '../controllers/writingController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

/**
 * Writing routes (SNZ-026 creation, SNZ-027 history list). Detail/delete
 * endpoints arrive in SNZ-028/029 on this same router.
 */
export const writingRouter = Router();

writingRouter.post(
  '/writing/jobs',
  requireAuth,
  validate({ body: WritingJobRequestSchema }),
  asyncHandler(createWritingJob),
);

writingRouter.get(
  '/writing/jobs',
  requireAuth,
  validate({ query: HistoryQuerySchema }),
  asyncHandler(listWritingJobs),
);
