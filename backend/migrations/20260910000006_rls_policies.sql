-- SNZ-010: Row-Level Security tenant isolation.
--
-- Design notes (SECURITY_AND_ACCESS section 4):
-- - Plain `ENABLE ROW LEVEL SECURITY`, deliberately NOT `FORCE`: the backend
--   connects directly as the table owner (DATABASE_URL) and must bypass RLS;
--   `service_role` bypasses via BYPASSRLS. FORCE would subject the owner to
--   `auth.uid()` policies (NULL on direct connections) and break the backend.
-- - Policies bind strictly to `auth.uid()` with equality — no role trusts.
-- - Privileged fields are denied via column-level GRANTs (the only declarative
--   mechanism): clients cannot UPDATE `profiles.role`, token/cost columns, or
--   INSERT token/cost/model columns at all.
-- - `usage_events` is SELECT-own-only: counters and costs are exclusively
--   server-written (SECURITY_AND_ACCESS section 5). No INSERT/UPDATE/DELETE
--   policies exist for JWT roles, so such writes are denied by default.
-- - `audit_events` and `schema_migrations` get RLS with zero policies:
--   deny-all for JWT roles, service-role/owner only.
-- Safe to re-run (IF EXISTS / idempotent GRANTs throughout).

-- Service role keeps full access for backend operations (bypasses RLS).
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_preferences TO service_role;
GRANT ALL ON public.writing_jobs TO service_role;
GRANT ALL ON public.usage_events TO service_role;
GRANT ALL ON public.audit_events TO service_role;

-- Anonymous users get nothing anywhere.
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.user_preferences FROM anon;
REVOKE ALL ON public.writing_jobs FROM anon;
REVOKE ALL ON public.usage_events FROM anon;
REVOKE ALL ON public.audit_events FROM anon;

-- ---------------------------------------------------------------- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid() AND role = 'FREE_USER');

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_delete_own ON public.profiles;
CREATE POLICY profiles_delete_own ON public.profiles
  FOR DELETE TO authenticated USING (id = auth.uid());

-- Clients read/insert/delete own rows, but may UPDATE only display fields:
-- `role` (and all other columns) are not updatable by JWT roles.
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.profiles TO authenticated;
GRANT UPDATE (display_name, updated_at) ON public.profiles TO authenticated;

-- ------------------------------------------------------- user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_preferences_select_own ON public.user_preferences;
CREATE POLICY user_preferences_select_own ON public.user_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_insert_own ON public.user_preferences;
CREATE POLICY user_preferences_insert_own ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_update_own ON public.user_preferences;
CREATE POLICY user_preferences_update_own ON public.user_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_preferences_delete_own ON public.user_preferences;
CREATE POLICY user_preferences_delete_own ON public.user_preferences
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Every preferences column is user-controlled; no privileged fields here.
REVOKE ALL ON public.user_preferences FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;

-- ----------------------------------------------------------- writing_jobs
ALTER TABLE public.writing_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS writing_jobs_select_own ON public.writing_jobs;
CREATE POLICY writing_jobs_select_own ON public.writing_jobs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS writing_jobs_insert_own ON public.writing_jobs;
CREATE POLICY writing_jobs_insert_own ON public.writing_jobs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS writing_jobs_update_own ON public.writing_jobs;
CREATE POLICY writing_jobs_update_own ON public.writing_jobs
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS writing_jobs_delete_own ON public.writing_jobs;
CREATE POLICY writing_jobs_delete_own ON public.writing_jobs
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Token counts, costs, model, and server timestamps are server-controlled:
-- JWT roles can neither INSERT nor UPDATE them (they fall back to defaults
-- only when the backend service role writes).
REVOKE ALL ON public.writing_jobs FROM authenticated;
GRANT SELECT, DELETE ON public.writing_jobs TO authenticated;
GRANT INSERT (user_id, input_text, output_text, mode, tone, settings, analysis, status, error_code)
  ON public.writing_jobs TO authenticated;
GRANT UPDATE (input_text, output_text, mode, tone, settings, analysis, status, error_code)
  ON public.writing_jobs TO authenticated;

-- ----------------------------------------------------------- usage_events
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_events_select_own ON public.usage_events;
CREATE POLICY usage_events_select_own ON public.usage_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Read-own-only: no INSERT/UPDATE/DELETE policies, so JWT writes are denied.
REVOKE ALL ON public.usage_events FROM authenticated;
GRANT SELECT ON public.usage_events TO authenticated;

-- ----------------------------------------------------------- audit_events
-- No user ownership column: backend service-role only. RLS with zero
-- policies denies all JWT-role access while service_role/owner bypass.
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_events FROM authenticated;

-- ------------------------------------------------------- schema_migrations
-- Runner bookkeeping: owner only. RLS with zero policies denies JWT roles.
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.schema_migrations FROM authenticated;
REVOKE ALL ON public.schema_migrations FROM anon;
