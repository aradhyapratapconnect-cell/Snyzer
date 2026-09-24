import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase.js';

/**
 * Authentication state (SNZ-011; sign-out SNZ-014).
 *
 * Mirrors the Supabase session for UI routing and API calls: components read
 * `isInitialized` (session check in flight), `isAuthenticated`, `user`, and
 * `session`. `initialize()` loads the persisted session once and subscribes
 * to `onAuthStateChange` so login/logout anywhere refresh the store. It is
 * idempotent — repeat calls reuse the existing subscription. `signOut()`
 * revokes the session and always resets local state, even if the server call
 * fails. A failed token refresh surfaces as `SIGNED_OUT`, which clears the
 * store so the UI prompts re-authentication (route guards arrive SNZ-015).
 */
export interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const initialAuthState = {
  isInitialized: false,
  isAuthenticated: false,
  user: null,
  session: null,
} as const;

let initialized = false;

function applySession(session: Session | null): Partial<AuthState> {
  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: session !== null,
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...initialAuthState,
  initialize: async () => {
    if (initialized) {
      return;
    }
    initialized = true;
    const supabase = getSupabaseClient();
    try {
      const { data } = await supabase.auth.getSession();
      set({ ...applySession(data.session), isInitialized: true });
    } catch {
      // A failed session fetch must not trap the app on the loading state;
      // treat it as signed out and let the guards prompt re-authentication.
      set({ isInitialized: true, isAuthenticated: false, user: null, session: null });
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      set(applySession(session));
    });
  },
  signOut: async () => {
    try {
      await getSupabaseClient().auth.signOut();
    } catch {
      // Best effort: a failed revocation must not keep the user signed in.
    } finally {
      set({ ...applySession(null), isInitialized: true });
    }
  },
}));

/** Test-only reset for the module-level initialization guard. */
export function _resetAuthInitForTests(): void {
  initialized = false;
}
