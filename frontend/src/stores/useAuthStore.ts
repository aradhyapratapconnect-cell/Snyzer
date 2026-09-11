import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase.js';

/**
 * Authentication state (SNZ-011).
 *
 * Mirrors the Supabase session for UI routing and API calls: components read
 * `isInitialized` (session check in flight), `isAuthenticated`, `user`, and
 * `session`. `initialize()` loads the persisted session once and subscribes
 * to `onAuthStateChange` so login/logout anywhere refresh the store. It is
 * idempotent — repeat calls reuse the existing subscription.
 */
export interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  initialize: () => Promise<void>;
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
    const { data } = await supabase.auth.getSession();
    set({ ...applySession(data.session), isInitialized: true });
    supabase.auth.onAuthStateChange((_event, session) => {
      set(applySession(session));
    });
  },
}));

/** Test-only reset for the module-level initialization guard. */
export function _resetAuthInitForTests(): void {
  initialized = false;
}
