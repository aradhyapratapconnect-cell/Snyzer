/**
 * Shared Zod domain schemas (SNZ-016; helpers predate from SNZ-001).
 *
 * Only Zod may be imported here — no backend-only or frontend-only
 * dependencies, so both workspaces can consume these contracts.
 */
export * from './writing.js';
export * from './preferences.js';
export * from './auth.js';

export const SHARED_SCHEMAS_VERSION = '0.1.0' as const;

/** Narrowing helper used to prove runtime exports work across workspaces. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
