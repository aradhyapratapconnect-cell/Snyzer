-- SNZ-009 (part 1): usage accounting records.
--
-- One row per billable AI interaction. `job_id` uses `ON DELETE SET NULL`
-- so accounting survives history deletion; `user_id` cascades with the
-- profile. Token counters default to 0 so writers never insert NULLs.
-- Safe to re-run (`IF NOT EXISTS` throughout).

CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.writing_jobs (id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast per-user usage lookups newest-first.
CREATE INDEX IF NOT EXISTS idx_usage_events_user_created
  ON public.usage_events (user_id, created_at DESC);
