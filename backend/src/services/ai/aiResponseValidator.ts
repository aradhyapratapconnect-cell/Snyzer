import { AnalysisSchema } from '@snyzer/shared';
import { AIMalformedResponseError } from './aiErrors.js';
import type { Analysis } from '@snyzer/shared';

/**
 * AI output validation (SNZ-025).
 *
 * Model output is untrusted external data: this module parses the raw
 * content string, enforces the revision contract, clamps metrics into
 * [0, 100], and fails safely with `AIMalformedResponseError` (never a
 * crash, never a partial save) when the payload is unusable. A single
 * recovery is attempted — stripping Markdown code fences models love to
 * add — before giving up. Oversize output is rejected, not truncated.
 */
export const MAX_REVISED_TEXT_LENGTH = 20_000;

export interface ValidatedRevision {
  revisedText: string;
  analysis: Analysis;
}

function tryParseJson(content: string): unknown {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return undefined;
  }
}

function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1] !== undefined ? fenced[1].trim() : content;
}

function clampMetric(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(numeric)) {
    throw new AIMalformedResponseError();
  }
  return Math.min(100, Math.max(0, numeric));
}

function toValidatedRevision(parsed: unknown, maxLength: number): ValidatedRevision {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new AIMalformedResponseError();
  }
  const { revisedText, analysis } = parsed as { revisedText?: unknown; analysis?: unknown };
  if (typeof revisedText !== 'string' || revisedText.trim() === '') {
    throw new AIMalformedResponseError();
  }
  if (revisedText.length > maxLength) {
    throw new AIMalformedResponseError();
  }
  if (typeof analysis !== 'object' || analysis === null) {
    throw new AIMalformedResponseError();
  }
  const metrics = analysis as Record<string, unknown>;
  const clamped = {
    readability: clampMetric(metrics['readability']),
    clarity: clampMetric(metrics['clarity']),
    repetition: clampMetric(metrics['repetition']),
    sentenceVariety: clampMetric(metrics['sentenceVariety']),
    vocabularyComplexity: clampMetric(metrics['vocabularyComplexity']),
    formality: clampMetric(metrics['formality']),
  };
  // Final gate against the shared contract (rejects missing keys).
  const checked = AnalysisSchema.safeParse(clamped);
  if (!checked.success) {
    throw new AIMalformedResponseError();
  }
  return { revisedText, analysis: checked.data };
}

/**
 * Validates raw model content into a revision. Throws
 * `AIMalformedResponseError` when the content is unusable.
 */
export function validateAIRevision(
  content: string,
  options: { maxLength?: number } = {},
): ValidatedRevision {
  const maxLength = options.maxLength ?? MAX_REVISED_TEXT_LENGTH;
  const direct = tryParseJson(content);
  if (direct !== undefined) {
    return toValidatedRevision(direct, maxLength);
  }
  const unfenced = stripCodeFences(content);
  if (unfenced !== content) {
    const recovered = tryParseJson(unfenced);
    if (recovered !== undefined) {
      return toValidatedRevision(recovered, maxLength);
    }
  }
  throw new AIMalformedResponseError();
}
