-- SNZ-008: writing job lifecycle records.
--
-- One row per revision request, owned by `profiles.id` (cascades on profile
-- deletion). `mode`/`tone` stay free TEXT here — their enums land in the
-- shared schemas (SNZ-016) with API-layer validation (SNZ-017/SNZ-026).
-- `gen_random_uuid()` is builtin since PostgreSQL 13, no extension needed.
-- Safe to re-run (`IF NOT EXISTS` throughout).

CREATE TABLE IF NOT EXISTS public.writing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  output_text TEXT,
  mode TEXT NOT NULL,
  tone TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  analysis JSONB,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  processing_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Fast per-user history queries ordered newest-first.
CREATE INDEX IF NOT EXISTS idx_writing_jobs_user_created
  ON public.writing_jobs (user_id, created_at DESC);
