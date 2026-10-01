/**
 * Backwards-compatible alias for the Vercel Express entrypoint.
 *
 * The canonical production entrypoint is `src/app.mts` (a Vercel-recognized
 * entry name with an explicit ESM extension that default-exports the
 * instantiated app). This module only re-exports that same instance so any
 * stale reference to a previous entrypoint keeps resolving to the identical
 * app.
 */
export { default } from './app.mjs';
