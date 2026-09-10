import { createSharedMarker, isNonEmptyString } from '@snyzer/shared';

/**
 * SNZ-001 backend skeleton.
 * The Express application (`app.ts` / `server.ts`) arrives in SNZ-002.
 * This module only proves shared imports compile and build cleanly.
 */
export const BACKEND_WORKSPACE = 'backend' as const;

export function getBackendInfo() {
  const marker = createSharedMarker(BACKEND_WORKSPACE);
  return {
    workspace: marker.workspace,
    sharedVersion: marker.version,
    hasValidWorkspace: isNonEmptyString(marker.workspace),
  };
}
