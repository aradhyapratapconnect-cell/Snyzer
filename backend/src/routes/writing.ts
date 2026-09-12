import { Router } from 'express';
import { WritingJobRequestSchema } from '@snyzer/shared';
import {
  deleteWritingJob,
  getWritingJob,
  listWritingJobs,
  HistoryQuerySchema,
  JobIdParamsSchema,
} from '../controllers/historyController.js';
import { createWritingJob } from '../controllers/writingController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { createWritingJobsLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';

/**
 * Writing routes (SNZ-026 creation, SNZ-027 list, SNZ-028 detail, SNZ-029
 * delete; creation throttled SNZ-052).
 */
export const writingRouter = Router();

// Authenticated-user buckets: abuse accounting starts after identity is known.
const writingJobsLimiter = createWritingJobsLimiter();

writingRouter.post(
  '/writing/jobs',
  requireAuth,
  writingJobsLimiter,
  validate({ body: WritingJobRequestSchema }),
  asyncHandler(createWritingJob),
);

writingRouter.get(
  '/writing/jobs',
  requireAuth,
  validate({ query: HistoryQuerySchema }),
  asyncHandler(listWritingJobs),
);

writingRouter.get(
  '/writing/jobs/:id',
  requireAuth,
  validate({ params: JobIdParamsSchema }),
  asyncHandler(getWritingJob),
);

writingRouter.delete(
  '/writing/jobs/:id',
  requireAuth,
  validate({ params: JobIdParamsSchema }),
  asyncHandler(deleteWritingJob),
);
