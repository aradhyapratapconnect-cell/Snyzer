/**
 * Public API entry point (SNZ-020 facade).
 *
 * Domain modules (`writing`, `history`, `preferences`, `presets`, `account`)
 * build on this facade. The implementation lives in `lib/apiClient.ts` — the
 * single transport that attaches the Supabase Bearer token and normalizes
 * backend envelopes into `ApiClientError`s. This module only re-exports it so
 * API consumers share one import surface.
 */
export { API_BASE_PATH, ApiClientError, apiRequest } from '../lib/apiClient.js';
export type { ApiMethod, ApiRequestOptions } from '../lib/apiClient.js';
