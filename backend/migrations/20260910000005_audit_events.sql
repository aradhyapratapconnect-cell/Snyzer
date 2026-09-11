-- SNZ-009 (part 2): security audit records.
--
-- Append-only log of security-relevant events (logins, deletions, quota
-- blocks). `actor_user_id` is nullable (system-initiated events) and uses
-- `ON DELETE SET NULL` so audit rows survive profile deletion. `metadata`
-- is queryable JSONB and must NEVER contain raw writing content — writers
-- (e.g. SNZ-029 deletion logging) store IDs and codes only.
-- Safe to re-run (`IF NOT EXISTS` throughout).

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast per-actor audit lookups newest-first.
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created
  ON public.audit_events (actor_user_id, created_at DESC);
