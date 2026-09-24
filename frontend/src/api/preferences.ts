import type { UserPreferences, UserPreferencesUpdate } from '@snyzer/shared';
import { apiRequest } from './client.js';

/**
 * Preferences API (SNZ-031/032).
 *
 * Typed wrappers over `GET /api/v1/preferences` and
 * `PATCH /api/v1/preferences`. The server is the source of truth; callers
 * mirror optimistically and roll back on rejection.
 */
export interface PreferencesResponse {
  preferences: UserPreferences;
}

/** Loads the caller's preferences (auto-creates server defaults). */
export function fetchPreferences(): Promise<PreferencesResponse> {
  return apiRequest<PreferencesResponse>('/preferences');
}

/** Persists a partial preferences patch. */
export function savePreferences(patch: UserPreferencesUpdate): Promise<PreferencesResponse> {
  return apiRequest<PreferencesResponse>('/preferences', { method: 'PATCH', body: patch });
}
