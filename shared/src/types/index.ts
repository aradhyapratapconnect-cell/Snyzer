/**
 * Shared workspace markers for SNZ-001.
 *
 * Full domain schemas (writing requests, preferences, API envelopes) arrive in
 * SNZ-016. This module only proves that `@snyzer/shared` types resolve cleanly
 * in both frontend and backend workspaces.
 */

export type SnyzerWorkspace = 'frontend' | 'backend' | 'shared';

export interface SharedMarker {
  readonly workspace: SnyzerWorkspace;
  readonly version: string;
}

export const SHARED_PACKAGE_VERSION = '0.1.0' as const;

export function createSharedMarker(workspace: SnyzerWorkspace): SharedMarker {
  return { workspace, version: SHARED_PACKAGE_VERSION };
}
