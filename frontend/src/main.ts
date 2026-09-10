import { createSharedMarker, isNonEmptyString } from '@snyzer/shared';

/**
 * SNZ-001 frontend skeleton.
 * The React + Vite entry (`main.tsx`, router, Tailwind) arrives in SNZ-003.
 * This module only proves shared imports compile and build cleanly.
 */
export const FRONTEND_WORKSPACE = 'frontend' as const;

export function getFrontendInfo() {
  const marker = createSharedMarker(FRONTEND_WORKSPACE);
  return {
    workspace: marker.workspace,
    sharedVersion: marker.version,
    hasValidWorkspace: isNonEmptyString(marker.workspace),
  };
}
