import { describe, expect, it } from 'vitest';
import { AIMalformedResponseError } from '../src/services/ai/aiErrors.js';
import {
  MAX_REVISED_TEXT_LENGTH,
  validateAIRevision,
} from '../src/services/ai/aiResponseValidator.js';

/**
 * SNZ-025 unit tests: valid, fenced, malformed, partial, out-of-range, and
 * oversize model outputs. No network involved.
 */
const validContent = JSON.stringify({
  revisedText: 'Clear writing triumphs.',
  analysis: {
    readability: 72,
    clarity: 80,
    repetition: 12,
    sentenceVariety: 68,
    vocabularyComplexity: 55,
    formality: 61,
  },
});

describe('validateAIRevision', () => {
  it('accepts valid revision JSON', () => {
    const result = validateAIRevision(validContent);

    expect(result.revisedText).toBe('Clear writing triumphs.');
    expect(result.analysis.clarity).toBe(80);
  });

  it('recovers fenced JSON exactly once', () => {
    const fenced = '```json\n' + validContent + '\n```';
    expect(validateAIRevision(fenced).revisedText).toBe('Clear writing triumphs.');

    const plainFence = '```\n' + validContent + '\n```';
    expect(validateAIRevision(plainFence).revisedText).toBe('Clear writing triumphs.');
  });

  it('fails safely on malformed, partial, and non-object payloads', () => {
    for (const content of [
      'not json{{{',
      '{"revisedText": "only half',
      JSON.stringify({ revisedText: '', analysis: {} }),
      JSON.stringify({ analysis: { readability: 1 } }),
      JSON.stringify({ revisedText: 'ok' }),
      JSON.stringify({ revisedText: 'ok', analysis: { readability: 1 } }),
      JSON.stringify('just a string'),
      JSON.stringify(null),
      '',
      '   ',
    ]) {
      expect(
        () => validateAIRevision(content),
        `should reject: ${content.slice(0, 40)}`,
      ).toThrowError(AIMalformedResponseError);
    }
  });

  it('clamps out-of-range metrics into [0, 100]', () => {
    const parsed = JSON.parse(validContent) as {
      revisedText: string;
      analysis: Record<string, number>;
    };
    parsed.analysis['clarity'] = 180;
    parsed.analysis['repetition'] = -20;

    const result = validateAIRevision(JSON.stringify(parsed));

    expect(result.analysis.clarity).toBe(100);
    expect(result.analysis.repetition).toBe(0);
  });

  it('rejects non-numeric metrics and oversize output instead of truncating', () => {
    const parsed = JSON.parse(validContent) as {
      revisedText: string;
      analysis: Record<string, unknown>;
    };
    parsed.analysis['clarity'] = 'very clear';
    expect(() => validateAIRevision(JSON.stringify(parsed))).toThrowError(AIMalformedResponseError);

    const big = JSON.parse(validContent) as { revisedText: string; analysis: unknown };
    big.revisedText = 'x'.repeat(MAX_REVISED_TEXT_LENGTH + 1);
    expect(() => validateAIRevision(JSON.stringify(big))).toThrowError(AIMalformedResponseError);
    expect(MAX_REVISED_TEXT_LENGTH).toBe(20_000);
  });

  it('never throws raw parse errors or crashes the process', () => {
    expect(() => validateAIRevision('\0\0binary\0garbage{{{')).toThrowError(
      AIMalformedResponseError,
    );
  });
});
