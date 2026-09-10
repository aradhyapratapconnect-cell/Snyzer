/**
 * Minimal shared runtime helpers for SNZ-001.
 *
 * Zod-based domain schemas arrive in SNZ-016. No backend-only or
 * frontend-only dependencies may be imported here.
 */

export const SHARED_SCHEMAS_VERSION = '0.1.0' as const;

/** Narrowing helper used to prove runtime exports work across workspaces. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
