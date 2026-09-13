import type { AIWritingRequest, AIWritingResponse, StreamSummary, StreamToken } from './types.js';

/**
 * AI provider abstraction (SNZ-021).
 *
 * Writing business logic (services, controllers) depends only on this
 * interface — never on a vendor SDK. Swapping or adding providers
 * (OpenRouter in SNZ-022, others later) means adding an implementation, not
 * touching consumers. `MockAIProvider` (mockProvider.ts) is the offline/test
 * implementation of this contract.
 */
export interface AIProvider {
  /** Stable identifier, e.g. `'openrouter'` or `'mock'`. Never a secret. */
  readonly providerName: string;

  /**
   * Model attempted for usage accounting (known even when a call fails
   * before responding). Added in SNZ-026 for failure-path usage events.
   */
  readonly modelName: string;

  /** Generates a revised text plus quality analysis for the request. */
  generateWritingRevision(request: AIWritingRequest): Promise<AIWritingResponse>;

  /**
   * Streams a revision (SNZ-061). Yields displayable text deltas as the model
   * produces them and resolves with run metadata on completion. Optional so
   * providers without streaming stay valid — services fall back to the
   * synchronous call and emit the full text as a single token.
   */
  streamWritingRevision?(
    request: AIWritingRequest,
  ): AsyncGenerator<StreamToken, StreamSummary, void>;
}
