import type {
  EditorMode,
  Theme,
  Tone,
  UserPreferences,
  UserPreferencesUpdate,
  WorkspaceLayout,
} from '@snyzer/shared';
import { create } from 'zustand';
import { ApiClientError } from '../lib/apiClient.js';
import { fetchPreferences, savePreferences } from '../api/preferences.js';

/**
 * User preferences store (SNZ-032).
 *
 * Mirrors the server record for instant UI response: `loadPreferences`
 * hydrates from the backend after login, while `updatePreferences` applies
 * changes optimistically, persists via PATCH, and rolls back to the previous
 * values with an error message when the server rejects. The server remains
 * the source of truth — the store never invents values.
 */
export interface PreferencesState extends UserPreferences {
  status: 'idle' | 'loading' | 'saving' | 'error';
  error: string | null;
  loadPreferences: () => Promise<void>;
  updatePreferences: (patch: UserPreferencesUpdate) => Promise<void>;
  clearError: () => void;
}

export const defaultPreferences: UserPreferences = {
  theme: 'system',
  workspaceLayout: 'side_by_side',
  editorMode: 'plain',
  defaultTone: 'professional',
};

function loadErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.code === 'NETWORK_ERROR') {
    return 'Could not reach the server.';
  }
  return 'Could not load your preferences.';
}

function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === 'NETWORK_ERROR') {
      return 'Could not reach the server. Your change was reverted.';
    }
    return `${error.message} Your change was reverted.`;
  }
  return 'Could not save your preferences. Your change was reverted.';
}

export const usePreferencesStore = create<PreferencesState>()((set, get) => ({
  ...defaultPreferences,
  status: 'idle',
  error: null,
  loadPreferences: async () => {
    set({ status: 'loading', error: null });
    try {
      const { preferences } = await fetchPreferences();
      set({ ...preferences, status: 'idle' });
    } catch (error) {
      set({ status: 'error', error: loadErrorMessage(error) });
    }
  },
  updatePreferences: async (patch: UserPreferencesUpdate) => {
    const previous: UserPreferences = {
      theme: get().theme,
      workspaceLayout: get().workspaceLayout,
      editorMode: get().editorMode,
      defaultTone: get().defaultTone,
    };
    set({ ...patch, status: 'saving', error: null });
    try {
      const { preferences } = await savePreferences(patch);
      set({ ...preferences, status: 'idle' });
    } catch (error) {
      set({ ...previous, status: 'error', error: saveErrorMessage(error) });
    }
  },
  clearError: () => {
    set({ error: null, status: 'idle' });
  },
}));

export type { EditorMode, Theme, Tone, WorkspaceLayout };
