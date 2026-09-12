import type { AIWritingRequest, AIWritingResponse } from './types.js';

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

  /** Generates a revised text plus quality analysis for the request. */
  generateWritingRevision(request: AIWritingRequest): Promise<AIWritingResponse>;
}
