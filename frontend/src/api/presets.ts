import type { Preset, PresetCreate } from '@snyzer/shared';
import { apiRequest } from './client.js';

/**
 * Presets API (SNZ-062).
 *
 * Typed wrappers over the `/api/v1/presets` endpoints. At most
 * `MAX_PRESETS_PER_USER` (5) presets per user, enforced server-side.
 */
export interface PresetsResponse {
  presets: Preset[];
}

export interface PresetResponse {
  preset: Preset;
}

/** Lists the caller's presets, newest first. */
export function fetchPresets(): Promise<PresetsResponse> {
  return apiRequest<PresetsResponse>('/presets');
}

/** Saves a preset under a name. */
export function createPreset(input: PresetCreate): Promise<PresetResponse> {
  return apiRequest<PresetResponse>('/presets', { method: 'POST', body: input });
}

/** Deletes one preset owned by the caller. */
export function deletePreset(id: string): Promise<{ deleted: boolean }> {
  return apiRequest(`/presets/${id}`, { method: 'DELETE' });
}
