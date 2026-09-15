# Snyzer Deployment Guide (SNZ-060)

How to ship Snyzer to production: environment configuration, build,
migrate, verify, and smoke-test. Nothing here is pushed anywhere
automatically — every step below is an explicit local command.

## 1. Architecture

- **Frontend** (`frontend/`): static Vite bundle. Host anywhere static
  files are served (Vercel, Netlify, S3+CloudFront, …). It talks to the
  backend same-origin at `/api/v1` (production) or via the dev proxy
  (local development only).
- **Backend** (`backend/`): the Express app in `src/app.ts`
  (`createApp()`), runnable two ways without source changes:
  - **Vercel (recommended)**: `api/index.ts` wraps the same app as a
    single Vercel Function in the one `Snyzer` project — frontend and
    API deploy together under one domain (frontend statics from
    `frontend/dist`, API through the `/api/*` rewrite). No separate
    backend project.
  - **Node host**: long-lived Node 20+ process (`node
dist/server.js`) on Render, Railway, Fly.io, a VPS, … Requires
    network access to Supabase Postgres and OpenRouter.
- **Database**: Supabase Postgres. Schema is managed by the SQL
  migrations in `backend/migrations/` (applied with
  `npm run db:migrate -w @snyzer/backend`).

## 2. Environment variables

Never commit real values. Start from `.env.example`. Backend secrets
must never carry a `VITE_` prefix and must never appear in frontend
code (enforced by `npm run security:audit -w @snyzer/backend`).

### Backend (`PORT`, `NODE_ENV`, …)

| Variable                    | Required | Example / default                                                                                                 |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `PORT`                      | No       | `5000`                                                                                                            |
| `NODE_ENV`                  | No       | `production` (set it — enables prod error sanitization)                                                           |
| `LOG_LEVEL`                 | No       | `info`                                                                                                            |
| `DATABASE_URL`              | Yes      | `postgresql://user:password@db.example.supabase.co:5432/postgres` (remote hosts always use verified TLS, SNZ-060) |
| `SUPABASE_URL`              | Yes      | `https://your-project.supabase.co`                                                                                |
| `SUPABASE_SECRET_KEY`       | Yes      | service-role key — backend only                                                                                   |
| `OPENROUTER_API_KEY`        | Yes      | backend only                                                                                                      |
| `OPENROUTER_SITE_URL`       | No       | public site URL for OpenRouter attribution                                                                        |
| `OPENROUTER_APP_NAME`       | No       | `Snyzer`                                                                                                          |
| `MAX_TEXT_LENGTH`           | No       | `10000`                                                                                                           |
| `RATE_LIMIT_WINDOW_SECONDS` | No       | `60`                                                                                                              |
| `RATE_LIMIT_MAX_REQUESTS`   | No       | `30`                                                                                                              |
| `DAILY_JOB_LIMIT`           | No       | `50`                                                                                                              |
| `CORS_ALLOWED_ORIGINS`      | Yes      | `https://app.example.com` (comma-separated exact origins; empty denies all cross-origin traffic; never `*`)       |

### Frontend (build-time `VITE_*`)

| Variable                        | Required | Notes                                    |
| ------------------------------- | -------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`             | Yes      | Same project as the backend.             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes      | Publishable key only — never the secret. |

## 3. Release procedure

```sh
# 0. From a clean tree on main:
npm run clean
npm run build          # shared -> backend -> frontend, < 60 s expected
npm run typecheck
npm run lint           # zero warnings allowed
npm run format         # prettier clean

# 1. Verify the deployable surface:
npm run verify:build   # dist contents, sourcemaps, chunk split, no test leakage
npm test               # unit + integration across all workspaces
npm run test:e2e        # headless Chromium core flows (mocked transport)

# 2. Run the security gate (after the frontend build so dist/ exists):
npm run security:audit -w @snyzer/backend
# Must print "Security audit passed." Only a FAIL blocks the release;
# SKIP lines (e.g. live RLS without a reachable DB) are expected locally.

# 3. Apply database migrations against the production database:
DATABASE_URL="<prod-url>" npm run db:migrate -w @snyzer/backend

# 4. Deploy backend (install production deps only), then the frontend bundle:
#    backend:  npm ci --omit=dev && node dist/server.js
#    frontend: upload frontend/dist/ to static hosting (or connect Vercel —
#    see "Vercel frontend deployment" below; vercel.json is committed).

# 5. Point the frontend at the backend:
#    - Same origin (recommended): serve frontend/dist and proxy /api to the backend.
#    - Split origins: set CORS_ALLOWED_ORIGINS to the exact frontend origin.

# 6. Smoke-test the live deployment:
BASE_URL="https://api.example.com" npm run smoke
# Expected: [smoke] OK ... -> 200 { status: 'ok' }
```

## 4. Production hardening checklist

- [ ] `NODE_ENV=production` — generic 500 envelope, no stacks (SNZ-018, audited SNZ-056).
- [ ] HTTPS enforced at the edge (platform TLS + redirect); HSTS header is
      emitted by the backend (SNZ-053).
- [ ] `CORS_ALLOWED_ORIGINS` lists exactly the production frontend origin(s).
- [ ] Database connects over verified TLS (automatic for non-local hosts;
      covered by `database-ssl.test.ts`).
- [ ] `SUPABASE_SECRET_KEY` / `OPENROUTER_API_KEY` exist only in the
      backend runtime environment — never in `frontend/dist` (audited).
- [ ] RLS enabled with the `service_role` / `authenticated` / `anon`
      grants from `20260910000006_rls_policies.sql` (audited when reachable).
- [ ] Rate limits reviewed for launch traffic (`RATE_LIMIT_*`, SNZ-052).
- [ ] Retention cadence decided: invoke `runRetentionCleanup()` (failed-job
      purge, 30-day default) on an ops schedule (SNZ-055).

## 5. Vercel deployment (single project: frontend + API)

One Vercel project (`Snyzer`, Root Directory = repository root) serves
both halves. `vercel.json` pins the commands and routing:

- **Install Command**: `npm ci && npm run build -w @snyzer/shared` —
  hoists the workspaces, then compiles `@snyzer/shared` so both the
  Vite build and the API function can resolve it. Nothing else is
  needed before the build phase.
- **Build Command**: `npm run build -w @snyzer/frontend` — Vite bundle
  into `frontend/dist`. Runs the `prebuild` env guard, so the two
  `VITE_*` variables below must exist in the Vercel project
  environment at build time.
- **Output Directory**: `frontend/dist`.
- **API**: `api/index.ts` (default-exports the existing Express app)
  becomes the `api/index.ts` function; `{ "source": "/api/:path*",
"destination": "/api/index" }` routes every `/api/*` request to it.
  The entrypoint restores the original `/api/v1/...` path before the
  Express router sees it (see `api/index.ts`), so the API behaves
  exactly as it does locally. Max duration is pinned to 60 s
  (`functions["api/index.ts"].maxDuration`) — the Hobby ceiling.
- **SPA fallback**: `{ "source": "/((?!api/).*)", "destination":
"/index.html" }` keeps client-side routes working without touching
  `/api/*` or static assets.

Environment variables (Project → Settings → Environment Variables):

1. `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` — Production
   **and** Preview (they are baked into the frontend bundle at build
   time).
2. Backend secrets for Production **and** Preview: `DATABASE_URL`,
   `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENROUTER_API_KEY`, plus
   tuning (`RATE_LIMIT_*`, `DAILY_JOB_LIMIT`, `MAX_TEXT_LENGTH`,
   optional `OPENROUTER_SITE_URL` / `APP_NAME`). Set
   `CORS_ALLOWED_ORIGINS` to the production origin (and custom domain
   if any); leave it unset for same-origin-only traffic.
3. Add the production URL (`https://<app>.vercel.app`, plus any custom
   domain) to Supabase **Site URL** and **Redirect URLs** so email
   links and OAuth-style redirects land back on the app.

Worst known case: a full AI call (three 20 s attempts + backoff) can
just exceed the Hobby 60 s function limit; the request then fails as
a platform timeout. If slow generations time out often, raise
`maxDuration` on a paid plan (Pro: up to 300 s) instead of changing
application code.

The Node-host path (module: `node backend/dist/server.js`) remains
supported for environments that need a long-lived process; the new
`vercel.json` does not affect it.

## 6. Rollback

Backend and frontend are versioned together by commit. To roll back, redeploy
the previous green commit's artifacts (`node dist/server.js` +
`frontend/dist/`) and re-run `npm run smoke`. Migrations are additive —
no down-migration is needed for any release in the current series.

## 7. Troubleshooting

| Symptom                              | Likely cause / fix                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `verify:build` reports missing dist  | Run `npm run build` first; frontend needs `VITE_*` set (see `.env.example`).         |
| Security audit `bundle-secrets` FAIL | A backend secret reached the bundle — remove the import, rebuild, re-audit.          |
| Smoke test `FAIL ... fetch failed`   | Backend not listening, wrong `BASE_URL`, or edge TLS/proxy misrouting.               |
| Smoke test returns non-200           | Check backend logs (`requestId` field) and `CORS_ALLOWED_ORIGINS` for browser calls. |
| `CORS` errors in the browser only    | Origin not in `CORS_ALLOWED_ORIGINS` (exact match, no trailing slash).               |
| DB connection hangs at boot          | Wrong `DATABASE_URL`, IP allow-list, or missing TLS on a custom Postgres host.       |
