import { ValidationError } from '../../middleware/errorHandler.js';
import type { AIProvider } from './AIProvider.js';
import type { AIWritingRequest, AIWritingResponse, StreamSummary, StreamToken } from './types.js';

/**
 * Deterministic offline provider (SNZ-021).
 *
 * Implements `AIProvider` without any network so unit/integration tests
 * (here, and SNZ-026's endpoint tests) can exercise the full revision
 * workflow. Returns the trimmed input as the "revision" with fixed,
 * schema-valid analysis — it performs no real improvement and makes no
 * quality claims. Never wire this into production paths.
 */
export class MockAIProvider implements AIProvider {
  readonly providerName = 'mock';
  readonly modelName = 'mock';

  async generateWritingRevision(request: AIWritingRequest): Promise<AIWritingResponse> {
    if (request.inputText.trim() === '') {
      throw new ValidationError('Input text is required.');
    }
    const started = Date.now();
    return {
      revisedText: request.inputText.trim(),
      analysis: {
        readability: 70,
        clarity: 70,
        repetition: 10,
        sentenceVariety: 60,
        vocabularyComplexity: 50,
        formality: 60,
      },
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      processingMs: Date.now() - started,
      model: 'mock',
    };
  }

  /**
   * Deterministic word-chunk stream (SNZ-061). Emits the trimmed input in
   * stable word-sized deltas so endpoint and frontend tests can prove token
   * assembly without network.
   */
  async *streamWritingRevision(
    request: AIWritingRequest,
  ): AsyncGenerator<StreamToken, StreamSummary, void> {
    if (request.inputText.trim() === '') {
      throw new ValidationError('Input text is required.');
    }
    const started = Date.now();
    const revisedText = request.inputText.trim();
    for (const word of revisedText.split(/\s+/)) {
      yield { text: `${word} ` };
    }
    return {
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      processingMs: Date.now() - started,
      model: 'mock',
      content: JSON.stringify({
        revisedText,
        analysis: {
          readability: 70,
          clarity: 70,
          repetition: 10,
          sentenceVariety: 60,
          vocabularyComplexity: 50,
          formality: 60,
        },
      }),
    };
  }
}
