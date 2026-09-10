# Snyzer — Technical Architecture Document

## 1. Architecture Goal
Snyzer should launch with a maintainable SaaS architecture without unnecessary infrastructure. AI providers stay behind the backend and are accessed through an abstraction layer.

## 2. Recommended Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast development and strong typing |
| Styling | Tailwind CSS | Consistent design system |
| Components | shadcn/ui + Magic UI | Accessible foundations plus polished enhancements |
| State | Zustand | Lightweight client state |
| Animation | Framer Motion selectively | Rich transitions where useful; CSS/Tailwind for simple states |
| Editors | Textarea + controlled rich-text editor | Simple and advanced writing modes |
| Backend | Node.js + Express + TypeScript | Lightweight API layer |
| Auth | Supabase Auth | Managed identity/session system |
| Database | PostgreSQL via Supabase | Relational storage + RLS |
| Data access | Prisma or Supabase client | Pick one primary approach |
| AI | OpenRouter | Model/provider abstraction |
| Hosting | Vercel + managed Node host | Simple deployment |
| Queue/cache | None initially | Add only when justified |

## 3. Request Flow
Browser → Snyzer API → auth → validation → usage check → AI abstraction → OpenRouter → response validation → PostgreSQL → browser.

The OpenRouter key exists only on the backend.

## 4. File Structure
```text
frontend/
  src/
    app/
    components/
      ui/
      editor/
      analysis/
      history/
      settings/
    features/
      auth/
      writing/
      history/
      preferences/
    hooks/
    lib/
    stores/
    types/
    styles/
    main.tsx

backend/
  src/
    config/
    middleware/
    routes/
    controllers/
    services/
      ai/
      writing/
      usage/
      history/
    repositories/
    validators/
    security/
    utils/
    types/
    app.ts
    server.ts

shared/
  types/
  schemas/

docs/
  PRD.md
  SECURITY_AND_ACCESS.md
  TECHNICAL_ARCHITECTURE.md
  FRONTEND_SPECIFICATION.md
```

## 5. Database Schema

### profiles
`id UUID`, `display_name TEXT`, `role TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.

One profile maps to one authenticated Snyzer user.

### user_preferences
`user_id UUID PK`, `theme TEXT`, `workspace_layout TEXT`, `editor_mode TEXT`, `default_tone TEXT`, `created_at`, `updated_at`.

Theme: light | dark | system. Layout: side_by_side | input_first. Editor: plain | rich.

### writing_jobs
`id UUID PK`, `user_id UUID FK`, `input_text TEXT`, `output_text TEXT`, `mode TEXT`, `tone TEXT`, `settings JSONB`, `analysis JSONB`, `model TEXT`, `input_tokens INTEGER`, `output_tokens INTEGER`, `total_tokens INTEGER`, `processing_ms INTEGER`, `status TEXT`, `error_code TEXT`, `created_at`, `completed_at`.

Status: queued | processing | completed | failed.

One Snyzer user can have many writing jobs.

### usage_events
`id UUID PK`, `user_id UUID FK`, `job_id UUID FK nullable`, `provider TEXT`, `model TEXT`, `input_tokens INTEGER`, `output_tokens INTEGER`, `total_tokens INTEGER`, `estimated_cost NUMERIC nullable`, `status TEXT`, `created_at`.

Used for usage/accounting analysis and rate enforcement.

### audit_events
`id UUID PK`, `actor_user_id UUID nullable`, `event_type TEXT`, `target_type TEXT nullable`, `target_id UUID nullable`, `metadata JSONB`, `created_at`.

Stores security-relevant events without unnecessary writing content.

## 6. API

### Writing
`POST /api/v1/writing/jobs`
- Auth required.
- Input: text, mode, tone, editor mode, preferences.
- Response: job ID, output, analysis, metadata.
- Errors: 400, 401, 403, 413, 429, 502/503.

`GET /api/v1/writing/jobs`
- Auth required.
- Returns only the current user's history.

`GET /api/v1/writing/jobs/:id`
- Auth required.
- Returns only an owned job.

`DELETE /api/v1/writing/jobs/:id`
- Auth required.
- Deletes only an owned job.

### Preferences
`GET /api/v1/preferences`
`PATCH /api/v1/preferences`

### Health
`GET /api/v1/health`
- No secrets or sensitive diagnostics.

## 7. AI Abstraction
Use an internal interface such as:
`AIProvider.generateWritingRevision(request) -> validated result`

The Snyzer writing service should not depend directly on OpenRouter-specific behavior. This permits future providers.

Do not guarantee permanent availability of a particular free model.

## 8. Environment Variables

Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Backend:
- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_SITE_URL` (optional)
- `OPENROUTER_APP_NAME` (optional)
- `MAX_TEXT_LENGTH`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`

Never place secrets in `VITE_*` variables.

## 9. Configuration
- Backend owns limits; frontend mirrors them only for UX.
- Production uses HTTPS.
- Separate environments/secrets.
- Log structured metadata rather than raw Snyzer text by default.
- Set request timeouts.
- Validate incoming JSON.
- Add request IDs.
- Keep dependencies updated.

## 10. Scaling
V1: synchronous requests, managed PostgreSQL, one AI gateway, basic rate limiting.

Later, only when needed:
1. Redis.
2. Durable job queue.
3. Provider fallback.
4. Observability/tracing.
5. Background workers.
6. Database read replicas.

