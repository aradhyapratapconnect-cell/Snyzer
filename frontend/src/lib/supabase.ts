import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getFrontendEnv } from './env.js';

/**
 * Supabase Auth client (SNZ-011).
 *
 * Initialized ONLY with public credentials (`VITE_SUPABASE_URL`,
 * `VITE_SUPABASE_PUBLISHABLE_KEY`). The secret/service-role key must never
 * appear in frontend code — it stays server-side (SNZ-004, SNZ-012).
 * Lazy singleton so importing this module never touches the network or env;
 * session lifecycle is driven by `useAuthStore.initialize()`.
 */
let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client === undefined) {
    const env = getFrontendEnv();
    client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
