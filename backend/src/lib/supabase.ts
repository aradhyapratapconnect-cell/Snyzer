import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getBackendEnv } from '../config/env.js';

/**
 * Supabase admin client (SNZ-012).
 *
 * Uses the SECRET key, so this module must never be imported by frontend
 * code — it is backend-only. Session persistence/refresh are disabled: the
 * backend verifies bearer tokens statelessly per request instead of holding
 * a session. Lazy singleton so importing never touches the network or env.
 */
let admin: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (admin === undefined) {
    const env = getBackendEnv();
    admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
