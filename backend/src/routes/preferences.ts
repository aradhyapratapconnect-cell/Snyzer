import { Router } from 'express';
import { UserPreferencesUpdateSchema } from '@snyzer/shared';
import { getPreferences, updatePreferences } from '../controllers/preferencesController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

/**
 * Preference routes (SNZ-031).
 */
export const preferencesRouter = Router();

preferencesRouter.get('/preferences', requireAuth, asyncHandler(getPreferences));

preferencesRouter.patch(
  '/preferences',
  requireAuth,
  validate({ body: UserPreferencesUpdateSchema }),
  asyncHandler(updatePreferences),
);
