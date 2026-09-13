import { Router } from 'express';
import { PresetCreateSchema, PresetIdParamsSchema } from '@snyzer/shared';
import { createPreset, deletePreset, listPresets } from '../controllers/presetsController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

/**
 * Style preset routes (SNZ-062).
 */
export const presetsRouter = Router();

presetsRouter.get('/presets', requireAuth, asyncHandler(listPresets));

presetsRouter.post(
  '/presets',
  requireAuth,
  validate({ body: PresetCreateSchema }),
  asyncHandler(createPreset),
);

presetsRouter.delete(
  '/presets/:id',
  requireAuth,
  validate({ params: PresetIdParamsSchema }),
  asyncHandler(deletePreset),
);
