import { AnalysisSchema } from '@snyzer/shared';
import { describe, expect, it } from 'vitest';
import { ValidationError as BackendValidationError } from '../src/middleware/errorHandler.js';
import type { AIProvider } from '../src/services/ai/AIProvider.js';
import { MockAIProvider } from '../src/services/ai/mockProvider.js';
import type { AIWritingRequest, AIWritingResponse } from '../src/services/ai/types.js';

/**
 * SNZ-021 contract tests: the mock provider honors the `AIProvider`
 * interface, its outputs satisfy the shared schemas, and consumers written
 * against the interface accept any implementation without changes.
 */
const request: AIWritingRequest = {
  inputText: '  Clear writing wins.  ',
  mode: 'clarity',
  tone: 'professional',
  editorMode: 'plain',
  targetMetrics: { clarity: 80 },
};

/** Example controller-style consumer depending only on the abstraction. */
async function runRevision(
  provider: AIProvider,
  req: AIWritingRequest,
): Promise<AIWritingResponse> {
  return provider.generateWritingRevision(req);
}

describe('MockAIProvider contract', () => {
  it('identifies as the mock provider', () => {
    expect(new MockAIProvider().providerName).toBe('mock');
  });

  it('returns a complete response whose analysis satisfies the shared schema', async () => {
    const response = await new MockAIProvider().generateWritingRevision(request);

    expect(typeof response.revisedText).toBe('string');
    expect(response.revisedText.length).toBeGreaterThan(0);
    expect(() => AnalysisSchema.parse(response.analysis)).not.toThrow();
    expect(response.usage.totalTokens).toBe(
      response.usage.inputTokens + response.usage.outputTokens,
    );
    expect(response.processingMs).toBeGreaterThanOrEqual(0);
    expect(typeof response.model).toBe('string');
  });

  it('rejects blank input with a validation error', async () => {
    await expect(
      new MockAIProvider().generateWritingRevision({ ...request, inputText: '   ' }),
    ).rejects.toBeInstanceOf(BackendValidationError);
    await expect(
      new MockAIProvider().generateWritingRevision({ ...request, inputText: '   ' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('is swappable: interface consumers accept any implementation unchanged', async () => {
    const alternative: AIProvider = {
      providerName: 'inline-fake',
      generateWritingRevision: async () => ({
        revisedText: 'fake revision',
        analysis: {
          readability: 1,
          clarity: 1,
          repetition: 1,
          sentenceVariety: 1,
          vocabularyComplexity: 1,
          formality: 1,
        },
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        processingMs: 1,
        model: 'inline-fake',
      }),
    };

    const viaMock = await runRevision(new MockAIProvider(), request);
    const viaFake = await runRevision(alternative, request);

    expect(viaMock.revisedText).toContain('Clear writing wins.');
    expect(viaFake.model).toBe('inline-fake');
  });
});
