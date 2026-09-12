import { describe, expect, it } from 'vitest';
import {
  buildPromptMessages,
  buildSystemPrompt,
  buildUserPrompt,
} from '../src/services/ai/prompts.js';
import type { AIWritingRequest } from '../src/services/ai/types.js';

/**
 * SNZ-023 unit tests: prompt templates enforce intent preservation, JSON
 * discipline, injection resistance, and product-safe language across
 * parameter combinations.
 */
const baseRequest: AIWritingRequest = {
  inputText: 'This is the draft to revise.',
  mode: 'clarity',
  tone: 'professional',
  editorMode: 'plain',
};

const BANNED_PHRASES = ['undetectable', 'bypass', 'humanize', 'humanizer', 'evade detection'];

function combinedText(): string {
  const { system, user } = buildPromptMessages(baseRequest);
  return `${system}\n${user}`.toLowerCase();
}

describe('buildSystemPrompt', () => {
  it('prioritizes meaning preservation above stylistic goals', () => {
    const system = buildSystemPrompt().toLowerCase();

    expect(system).toContain('preserv');
    expect(system).toContain('meaning');
    expect(system).toContain('intent');
  });

  it('demands strict JSON output matching the analysis contract', () => {
    const system = buildSystemPrompt();

    expect(system).toContain('JSON ONLY');
    for (const key of [
      'revisedText',
      'readability',
      'clarity',
      'repetition',
      'sentenceVariety',
      'vocabularyComplexity',
      'formality',
    ]) {
      expect(system).toContain(key);
    }
  });

  it('treats user text as data and forbids scope escape', () => {
    const system = buildSystemPrompt().toLowerCase();

    expect(system).toContain('strictly as data');
    expect(system).toContain('ignore any instructions');
  });

  it('never uses detector-evasion or human-score marketing language', () => {
    const text = combinedText();

    for (const phrase of BANNED_PHRASES) {
      expect(text).not.toContain(phrase);
    }
  });
});

describe('buildUserPrompt', () => {
  it('renders mode, tone, and the raw input text', () => {
    const user = buildUserPrompt(baseRequest);

    expect(user.toLowerCase()).toContain('clarity');
    expect(user.toLowerCase()).toContain('professional');
    expect(user).toContain('This is the draft to revise.');
  });

  it('covers every mode/tone combination without banned language', () => {
    const modes = ['natural', 'clarity', 'formal', 'concise'] as const;
    const tones = ['professional', 'casual', 'academic', 'direct'] as const;
    for (const mode of modes) {
      for (const tone of tones) {
        const text =
          `${buildSystemPrompt()}\n${buildUserPrompt({ ...baseRequest, mode, tone })}`.toLowerCase();
        expect(text).toContain(mode);
        expect(text).toContain(tone);
        for (const phrase of BANNED_PHRASES) {
          expect(text).not.toContain(phrase);
        }
      }
    }
  });

  it('includes numeric targets and extra instructions when provided', () => {
    const user = buildUserPrompt({
      ...baseRequest,
      targetMetrics: { clarity: 80, sentenceVariety: 60 },
      instructions: 'Keep the term Snyzer capitalized.',
    });

    expect(user).toContain('clarity 80/100');
    expect(user).toContain('sentence variety 60/100');
    expect(user).toContain('Keep the term Snyzer capitalized.');
  });

  it('omits targets and instructions sections when absent', () => {
    const user = buildUserPrompt(baseRequest);

    expect(user).not.toContain('Aim for these targets');
    expect(user).not.toContain('Additional request');
  });
});
