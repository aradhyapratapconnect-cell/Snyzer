import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultPreferences, usePreferencesStore } from '../src/stores/usePreferencesStore.js';

/**
 * SNZ-032 unit tests: preferences store hydration, optimistic updates, and
 * rollback — with a mocked API client. No network involved.
 */
const mocks = vi.hoisted(() => {
  class ApiClientError extends Error {
    code: string;
    status: number;
    details?: unknown;
    constructor(options: { code: string; message: string; status: number; details?: unknown }) {
      super(options.message);
      this.name = 'ApiClientError';
      this.code = options.code;
      this.status = options.status;
      if (options.details !== undefined) {
        this.details = options.details;
      }
    }
  }
  return { ApiClientError, apiRequest: vi.fn() };
});

vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: mocks.ApiClientError,
  apiRequest: (...args: unknown[]) => mocks.apiRequest(...args),
}));

const apiRequestMock = mocks.apiRequest;
const ApiClientError = mocks.ApiClientError;

const serverPreferences = {
  theme: 'dark',
  workspaceLayout: 'input_first',
  editorMode: 'rich',
  defaultTone: 'casual',
} as const;

function resetStore() {
  usePreferencesStore.setState({
    ...defaultPreferences,
    status: 'idle',
    error: null,
    loaded: false,
    loadPreferences: usePreferencesStore.getState().loadPreferences,
    updatePreferences: usePreferencesStore.getState().updatePreferences,
    clearError: usePreferencesStore.getState().clearError,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetStore();
});

describe('usePreferencesStore', () => {
  it('starts with server-matching defaults', () => {
    const state = usePreferencesStore.getState();

    expect(state.theme).toBe('system');
    expect(state.workspaceLayout).toBe('side_by_side');
    expect(state.editorMode).toBe('plain');
    expect(state.defaultTone).toBe('professional');
    expect(state.status).toBe('idle');
  });

  it('hydrates from the backend on load', async () => {
    apiRequestMock.mockResolvedValue({ preferences: serverPreferences });

    await usePreferencesStore.getState().loadPreferences();
    const state = usePreferencesStore.getState();

    expect(apiRequestMock).toHaveBeenCalledWith('/preferences');
    expect(state.theme).toBe('dark');
    expect(state.workspaceLayout).toBe('input_first');
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('reports load failures without inventing values', async () => {
    apiRequestMock.mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'down', status: 0 }),
    );

    await usePreferencesStore.getState().loadPreferences();
    const state = usePreferencesStore.getState();

    expect(state.status).toBe('error');
    expect(state.error).toBe('Could not reach the server.');
    expect(state.theme).toBe('system');
  });

  it('applies updates optimistically and confirms from the server', async () => {
    apiRequestMock.mockResolvedValue({ preferences: { ...serverPreferences, theme: 'light' } });

    const pending = usePreferencesStore.getState().updatePreferences({ theme: 'light' });
    expect(usePreferencesStore.getState().theme).toBe('light');
    expect(usePreferencesStore.getState().status).toBe('saving');

    await pending;
    expect(apiRequestMock).toHaveBeenCalledWith('/preferences', {
      method: 'PATCH',
      body: { theme: 'light' },
    });
    const state = usePreferencesStore.getState();
    expect(state.status).toBe('idle');
    expect(state.editorMode).toBe('rich');
  });

  it('rolls back to previous values when the server rejects', async () => {
    apiRequestMock.mockResolvedValue({ preferences: serverPreferences });
    await usePreferencesStore.getState().loadPreferences();
    apiRequestMock.mockRejectedValue(
      new ApiClientError({ code: 'INVALID_INPUT', message: 'Bad theme.', status: 400 }),
    );

    await usePreferencesStore.getState().updatePreferences({ theme: 'light' });
    const state = usePreferencesStore.getState();

    expect(state.theme).toBe('dark');
    expect(state.workspaceLayout).toBe('input_first');
    expect(state.status).toBe('error');
    expect(state.error).toContain('Bad theme.');
    expect(state.error).toContain('reverted');
  });

  it('clears errors on demand', async () => {
    apiRequestMock.mockRejectedValue(new Error('boom'));
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().error).not.toBeNull();

    usePreferencesStore.getState().clearError();

    expect(usePreferencesStore.getState().error).toBeNull();
    expect(usePreferencesStore.getState().status).toBe('idle');
  });

  it('marks values loaded after successful hydration or save', async () => {
    apiRequestMock.mockResolvedValue({ preferences: serverPreferences });
    await usePreferencesStore.getState().loadPreferences();
    expect(usePreferencesStore.getState().loaded).toBe(true);

    resetStore();
    apiRequestMock.mockResolvedValue({ preferences: { ...serverPreferences, theme: 'light' } });
    await usePreferencesStore.getState().updatePreferences({ theme: 'light' });
    expect(usePreferencesStore.getState().loaded).toBe(true);
  });

  it('stays unloaded when hydration fails so later mounts retry', async () => {
    apiRequestMock.mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', message: 'down', status: 0 }),
    );

    await usePreferencesStore.getState().loadPreferences();

    expect(usePreferencesStore.getState().loaded).toBe(false);
    expect(usePreferencesStore.getState().status).toBe('error');
  });
});
