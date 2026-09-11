-- SNZ-007: per-user workspace preferences.
--
-- One `public.user_preferences` row per profile (`user_id` references
-- `public.profiles`, created in the SNZ-006 migration, so this file must run
-- after it). Domain values are enforced with CHECK constraints; `default_tone`
-- stays free TEXT here — its allowed values are enforced at the API layer
-- (SNZ-031) once the shared tone enum lands (SNZ-016).
-- Safe to re-run (`IF NOT EXISTS` / `OR REPLACE` throughout).

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system'
    CHECK (theme IN ('light', 'dark', 'system')),
  workspace_layout TEXT NOT NULL DEFAULT 'side_by_side'
    CHECK (workspace_layout IN ('side_by_side', 'input_first')),
  editor_mode TEXT NOT NULL DEFAULT 'plain'
    CHECK (editor_mode IN ('plain', 'rich')),
  default_tone TEXT NOT NULL DEFAULT 'professional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keeps `updated_at` fresh on every update (function defined in SNZ-006).
DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
