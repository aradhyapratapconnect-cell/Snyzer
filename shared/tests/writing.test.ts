import { describe, expect, it } from 'vitest';
import {
  AnalysisSchema,
  ApiErrorResponseSchema,
  MAX_INPUT_TEXT_LENGTH,
  WritingJobRequestSchema,
  WritingJobResponseSchema,
} from '../src/schemas/writing.js';

/** SNZ-016: writing-contract parsing — valid, empty, blank, oversize, enums. */
const validRequest = {
  inputText: 'Clarity matters more than cleverness.',
  mode: 'clarity',
  tone: 'professional',
  editorMode: 'plain',
  preferences: { clarity: 70, sentenceVariety: 60 },
};

describe('WritingJobRequestSchema', () => {
  it('accepts a valid request and defaults preferences', () => {
    // `undefined` models an absent optional object for parsing purposes.
    const parsed = WritingJobRequestSchema.parse({ ...validRequest, preferences: undefined });
    expect(parsed.preferences).toEqual({});
    expect(parsed.mode).toBe('clarity');
  });

  it('rejects empty and whitespace-only input', () => {
    for (const inputText of ['', '   ', '\n\t  ']) {
      const result = WritingJobRequestSchema.safeParse({ ...validRequest, inputText });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0]?.path).toEqual(['inputText']);
      }
    }
  });

  it('rejects text exceeding the shared maximum', () => {
    const result = WritingJobRequestSchema.safeParse({
      ...validRequest,
      inputText: 'x'.repeat(MAX_INPUT_TEXT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    expect(MAX_INPUT_TEXT_LENGTH).toBe(10_000);
  });

  it('rejects unknown mode, tone, and editorMode values', () => {
    expect(
      WritingJobRequestSchema.safeParse({ ...validRequest, mode: 'shakespeare' }).success,
    ).toBe(false);
    expect(WritingJobRequestSchema.safeParse({ ...validRequest, tone: 'mysterious' }).success).toBe(
      false,
    );
    expect(
      WritingJobRequestSchema.safeParse({ ...validRequest, editorMode: 'markdown' }).success,
    ).toBe(false);
  });

  it('rejects out-of-range preference targets', () => {
    expect(
      WritingJobRequestSchema.safeParse({ ...validRequest, preferences: { clarity: 101 } }).success,
    ).toBe(false);
    expect(
      WritingJobRequestSchema.safeParse({ ...validRequest, preferences: { clarity: -1 } }).success,
    ).toBe(false);
  });
});

describe('WritingJobResponseSchema', () => {
  it('accepts the section-17 success envelope', () => {
    const parsed = WritingJobResponseSchema.parse({
      job: {
        id: '11111111-1111-4111-8111-111111111111',
        status: 'completed',
        outputText: 'Clarity beats cleverness.',
        analysis: {
          readability: 72,
          clarity: 80,
          repetition: 12,
          sentenceVariety: 68,
          vocabularyComplexity: 55,
          formality: 61,
        },
      },
    });

    expect(parsed.job.status).toBe('completed');
  });

  it('rejects malformed jobs and out-of-range metrics', () => {
    expect(WritingJobResponseSchema.safeParse({ job: null }).success).toBe(false);
    expect(
      WritingJobResponseSchema.safeParse({
        job: {
          id: 'not-a-uuid',
          status: 'completed',
          outputText: 'x',
          analysis: {
            readability: 72,
            clarity: 80,
            repetition: 12,
            sentenceVariety: 68,
            vocabularyComplexity: 55,
            formality: 61,
          },
        },
      }).success,
    ).toBe(false);
    expect(
      AnalysisSchema.safeParse({
        readability: 72,
        clarity: 800,
        repetition: 12,
        sentenceVariety: 68,
        vocabularyComplexity: 55,
        formality: 61,
      }).success,
    ).toBe(false);
  });
});

describe('ApiErrorResponseSchema', () => {
  it('accepts the section-17 error envelope with optional details', () => {
    expect(
      ApiErrorResponseSchema.parse({
        error: { code: 'TEXT_TOO_LONG', message: 'Your text is longer than the supported limit.' },
      }).error.code,
    ).toBe('TEXT_TOO_LONG');
    expect(
      ApiErrorResponseSchema.parse({
        error: { code: 'INVALID_INPUT', message: 'Validation error', details: [{ path: 'x' }] },
      }).error.details,
    ).toEqual([{ path: 'x' }]);
  });

  it('rejects envelopes without code or message', () => {
    expect(ApiErrorResponseSchema.safeParse({ error: { code: 'X' } }).success).toBe(false);
    expect(ApiErrorResponseSchema.safeParse({ error: {} }).success).toBe(false);
  });
});
