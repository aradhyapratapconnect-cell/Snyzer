import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * SNZ-011 integration check with the REAL Supabase client (no mocks).
 * Runs against stubbed public env vars; `getSession()` only reads local
 * storage, so no network or real project is touched.
 */
vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'dummy-publishable-key');

const { getSupabaseClient } = await import('../src/lib/supabase.js');
const { _resetAuthInitForTests, useAuthStore } = await import('../src/stores/useAuthStore.js');

beforeEach(() => {
  _resetAuthInitForTests();
});

describe('supabase client startup', () => {
  it('initializes without throwing and resolves to signed-out', async () => {
    expect(() => getSupabaseClient()).not.toThrow();

    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });
});
