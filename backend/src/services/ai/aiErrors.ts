import { AppError } from '../../middleware/errorHandler.js';

/**
 * AI provider domain errors (SNZ-024). Distinct codes let controllers and
 * clients distinguish provider outages from our own failures; statuses reuse
 * the gateway range so the central serializer needs no changes. Messages are
 * generic — request specifics (never keys) stay out of error text.
 */
export class AIProviderUnavailableError extends AppError {
  constructor(message = 'AI provider is unavailable. Please try again later.') {
    super({ status: 503, code: 'AI_PROVIDER_UNAVAILABLE', message });
  }
}

export class AITimeoutError extends AppError {
  constructor(message = 'AI provider timed out. Please try again later.') {
    super({ status: 504, code: 'AI_TIMEOUT', message });
  }
}

export class AIMalformedResponseError extends AppError {
  constructor(message = 'AI provider returned an unusable response. Please try again.') {
    super({ status: 502, code: 'AI_MALFORMED_RESPONSE', message });
  }
}
