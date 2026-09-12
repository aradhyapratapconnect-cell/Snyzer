import type { Analysis, EditorMode, Tone, WritingMode, WritingPreferences } from '@snyzer/shared';

/**
 * Provider-agnostic AI writing contracts (SNZ-021).
 *
 * These types deliberately reuse the shared SNZ-016 contracts (`Tone`,
 * `WritingMode`, `Analysis`, …) so provider outputs always match what the
 * API validates and stores. No provider-specific (OpenRouter/OpenAI/…)
 * types may appear here — vendor details live behind `AIProvider`.
 */

/** Revision request: raw text plus style targets and prompt instructions. */
export interface AIWritingRequest {
  inputText: string;
  mode: WritingMode;
  tone: Tone;
  editorMode: EditorMode;
  targetMetrics?: WritingPreferences;
  /** Extra prompt instructions (e.g. preserve specific terms). */
  instructions?: string;
}

/** Token accounting reported by the provider. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** Revision result: improved text, metric breakdown, and run metadata. */
export interface AIWritingResponse {
  revisedText: string;
  analysis: Analysis;
  usage: TokenUsage;
  processingMs: number;
  model: string;
}
