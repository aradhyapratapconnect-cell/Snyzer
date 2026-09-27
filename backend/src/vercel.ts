/**
 * Backwards-compatible alias for the Vercel Express entrypoint.
 *
 * The canonical production entrypoint is `src/app.ts` (a Vercel-recognized
 * entry name that default-exports the instantiated app). This module only
 * re-exports that same instance so any stale reference to the previous
 * `src/vercel.ts` entrypoint keeps resolving to the identical app.
 */
export { default } from './app.js';
