-- SNZ-062: per-user style presets.
--
-- One `public.user_presets` row per saved control snapshot (`user_id`
-- references `public.profiles`, so this file must run after SNZ-006).
-- Domain values are enforced with CHECK constraints matching the shared
-- `PresetCreateSchema`; the per-user count cap (5) is enforced at the API
-- layer (SNZ-062 controller), where the quota error can explain itself.
-- Tenant isolation follows the SNZ-010 pattern inline: plain
-- `ENABLE ROW LEVEL SECURITY` (never FORCE — the backend owner must bypass),
-- `auth.uid()` equality policies, service_role ALL, anon revoked.
-- Safe to re-run (`IF NOT EXISTS` / `IF EXISTS` throughout).

CREATE TABLE IF NOT EXISTS public.user_presets (
  -- `gen_random_uuid()` is builtin since PostgreSQL 13, no extension needed.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  mode TEXT NOT NULL CHECK (mode IN ('natural', 'clarity', 'formal', 'concise')),
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'casual', 'academic', 'direct')),
  clarity INTEGER NOT NULL CHECK (clarity BETWEEN 0 AND 100),
  sentence_variety INTEGER NOT NULL CHECK (sentence_variety BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_presets_user_created
  ON public.user_presets (user_id, created_at DESC);

ALTER TABLE public.user_presets ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.user_presets TO service_role;
REVOKE ALL ON public.user_presets FROM anon;

DROP POLICY IF EXISTS user_presets_select_own ON public.user_presets;
CREATE POLICY user_presets_select_own ON public.user_presets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_presets_insert_own ON public.user_presets;
CREATE POLICY user_presets_insert_own ON public.user_presets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_presets_delete_own ON public.user_presets;
CREATE POLICY user_presets_delete_own ON public.user_presets
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Every preset column is user-controlled; no privileged fields here.
REVOKE ALL ON public.user_presets FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_presets TO authenticated;
