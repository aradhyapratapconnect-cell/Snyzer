import { z } from 'zod';
import { ToneSchema, WritingModeSchema } from './writing.js';

/**
 * Style preset contracts (SNZ-062). A preset snapshots the workspace
 * controls — mode, tone, and the two slider metrics — under a user-chosen
 * name. Value sets match the `user_presets` CHECK constraints so API,
 * database, and UI can never disagree.
 */
export const MAX_PRESETS_PER_USER = 5;

export const PresetCreateSchema = z.object({
  name: z.string().trim().min(1).max(60),
  mode: WritingModeSchema,
  tone: ToneSchema,
  clarity: z.number().int().min(0).max(100),
  sentenceVariety: z.number().int().min(0).max(100),
});
export type PresetCreate = z.infer<typeof PresetCreateSchema>;

export const PresetSchema = PresetCreateSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type Preset = z.infer<typeof PresetSchema>;

export const PresetIdParamsSchema = z.object({ id: z.string().uuid() });
