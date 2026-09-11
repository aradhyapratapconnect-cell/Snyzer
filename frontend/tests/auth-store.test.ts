import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Session, User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _resetAuthInitForTests,
  initialAuthState,
  useAuthStore,
} from '../src/stores/useAuthStore.js';

/**
 * SNZ-011 unit tests: auth store transitions with mocked Supabase Auth
 * responses. No network or real credentials involved.
 */
type AuthChangeCallback = (event: string, session: Session | null) => void;

const mocks = vi.hoisted(() => {
  let changeCallback: AuthChangeCallback | undefined;
  const getSession = vi.fn();
  const onAuthStateChange = vi.fn((callback: AuthChangeCallback) => {
    changeCallback = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  return {
    getSession,
    onAuthStateChange,
    emit: (event: string, session: Session | null) => changeCallback?.(event, session),
  };
});

vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({
    auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange },
  }),
}));

function userFixture(overrides: Partial<User> = {}): User {
  return { id: 'user-1', email: 'ada@example.com', ...overrides } as User;
}

function sessionFixture(user: User): Session {
  return {
    access_token: 'access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'refresh-token',
    user,
  } as Session;
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetAuthInitForTests();
  useAuthStore.setState({ ...initialAuthState, initialize: useAuthStore.getState().initialize });
});

describe('useAuthStore', () => {
  it('initializes to signed-out when no persisted session exists', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('populates user and session when a persisted session exists', async () => {
    const user = userFixture();
    mocks.getSession.mockResolvedValue({ data: { session: sessionFixture(user) }, error: null });

    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();

    expect(state.isInitialized).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('user-1');
    expect(state.session?.access_token).toBe('access-token');
  });

  it('updates the store on sign-in events', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await useAuthStore.getState().initialize();

    mocks.emit('SIGNED_IN', sessionFixture(userFixture({ id: 'user-2' })));
    const state = useAuthStore.getState();

    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('user-2');
  });

  it('clears the store on sign-out events', async () => {
    const user = userFixture();
    mocks.getSession.mockResolvedValue({ data: { session: sessionFixture(user) }, error: null });
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    mocks.emit('SIGNED_OUT', null);
    const state = useAuthStore.getState();

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isInitialized).toBe(true);
  });

  it('subscribes only once across repeat initialize calls', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

    await useAuthStore.getState().initialize();
    await useAuthStore.getState().initialize();

    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('never references secret credentials in the client module', async () => {
    const raw = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'supabase.ts'),
      'utf8',
    );
    // Scan code only: doc comments legitimately name the forbidden keys.
    const source = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');

    expect(source).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
    expect(source).not.toContain('SUPABASE_SECRET_KEY');
    expect(source).not.toContain('service_role');
    expect(source).not.toContain('service-role');
  });
});
