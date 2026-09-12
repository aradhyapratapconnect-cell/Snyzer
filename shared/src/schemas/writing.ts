import { z } from 'zod';

/**
 * Writing-job contracts (SNZ-016). Shapes mirror FRONTEND_SPECIFICATION
 * section 17 exactly. This module must stay dependency-free apart from Zod
 * so both frontend and backend can consume it.
 */

/** Maximum input length; overridable per deployment via MAX_TEXT_LENGTH. */
export const MAX_INPUT_TEXT_LENGTH = 10_000;

export const WritingModeSchema = z.enum(['natural', 'clarity', 'formal', 'concise']);
export type WritingMode = z.infer<typeof WritingModeSchema>;

export const ToneSchema = z.enum(['professional', 'casual', 'academic', 'direct']);
export type Tone = z.infer<typeof ToneSchema>;

export const EditorModeSchema = z.enum(['plain', 'rich']);
export type EditorMode = z.infer<typeof EditorModeSchema>;

export const WritingJobStatusSchema = z.enum(['queued', 'processing', 'completed', 'failed']);
export type WritingJobStatus = z.infer<typeof WritingJobStatusSchema>;

/**
 * Numeric style targets (0–100), all optional. Validation rejects empties
 * and out-of-range values but never rewrites user content.
 */
export const WritingPreferencesSchema = z.object({
  clarity: z.number().min(0).max(100).optional(),
  sentenceVariety: z.number().min(0).max(100).optional(),
});
export type WritingPreferences = z.infer<typeof WritingPreferencesSchema>;

export const WritingJobRequestSchema = z.object({
  inputText: z
    .string()
    .min(1, 'Text is required.')
    .max(MAX_INPUT_TEXT_LENGTH, `Text must be at most ${MAX_INPUT_TEXT_LENGTH} characters.`)
    .refine((text) => text.trim().length > 0, 'Text must not be blank.'),
  mode: WritingModeSchema,
  tone: ToneSchema,
  editorMode: EditorModeSchema,
  preferences: WritingPreferencesSchema.default({}),
});
export type WritingJobRequest = z.infer<typeof WritingJobRequestSchema>;

const analysisMetric = z.number().min(0).max(100);

export const AnalysisSchema = z.object({
  readability: analysisMetric,
  clarity: analysisMetric,
  repetition: analysisMetric,
  sentenceVariety: analysisMetric,
  vocabularyComplexity: analysisMetric,
  formality: analysisMetric,
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const WritingJobResponseSchema = z.object({
  job: z.object({
    id: z.string().uuid(),
    status: WritingJobStatusSchema,
    outputText: z.string(),
    analysis: AnalysisSchema,
  }),
});
export type WritingJobResponse = z.infer<typeof WritingJobResponseSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
