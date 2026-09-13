# Snyzer

AI-assisted writing improvement. Paste a draft, pick a mode and tone, and get
back a revised text with quality metrics — then manage history, style
presets, and settings. Live revision streaming, client-side document export,
and a hardened security baseline are built in.

## Features

- **Writing workspace** — plain (textarea) and rich (Tiptap) editors, mode
  (Natural / Clarity / Formal / Concise), tone, and style-target sliders.
- **Live streaming revisions** — tokens render progressively over SSE with
  automatic fallback to the synchronous endpoint where streaming is blocked.
- **Analysis panel** — readability, clarity, repetition, sentence variety,
  vocabulary complexity, and formality for every revision.
- **History** — paginated past jobs with a detail dialog, load-into-workspace,
  and deletion.
- **Style presets** — save control snapshots (max 5), apply in one click,
  persisted per user.
- **Document export** — draft or revision as Markdown / Plain Text, 100%
  client-side.
- **Preferences & account** — theme, layout, editor mode, default tone;
  permanent account purge on request.
- **Security baseline** — Supabase JWT auth, strict RLS, per-user rate
  limits, security headers + CORS whitelist, input sanitization, retention
  purges, and an automated security audit (`npm run security:audit -w
@snyzer/backend`).

## Tech stack

- **Shared** (`shared/`) — `@snyzer/shared`: Zod contracts consumed by both
  ends (single source of truth for API shapes and enums).
- **Backend** (`backend/`) — `@snyzer/backend`: Node 20+ · Express 4 · `pg`
  pooling · plain-SQL migrations · OpenRouter (`response_format: json_object`,
  SSE streaming) · Pino JSON logs · Vitest + supertest.
- **Frontend** (`frontend/`) — `@snyzer/frontend`: React 19 · Vite 6 ·
  Tailwind 3 · React Router 7 · Zustand · Radix primitives · Tiptap ·
  Vitest + Testing Library · Playwright E2E.
- **Database/Auth** — Supabase Postgres (RLS on every table) + Supabase Auth.
- **AI** — OpenRouter chat completions (default `openai/gpt-4o-mini`,
  overridable per deployment).

## Project structure

```text
snyzer/
├── shared/                 @snyzer/shared — Zod schemas, types
├── backend/
│   ├── src/                Express app, routes, controllers, services, security
│   ├── migrations/         versioned SQL (profiles → … → user_presets)
│   └── tests/              Vitest unit + supertest integration suites
├── frontend/
│   ├── src/                routes, features, components, stores, hooks, lib
│   └── tests/              Vitest component/store suites
├── e2e/                    Playwright core user-flow specs (mocked transport)
├── scripts/                workspace checks, cleaners, build verifier, smoke test
├── docs/DEPLOYMENT.md      release procedure + hardening checklist
├── Snyzer_Documentation/   PRD, architecture, security, frontend spec, tickets
├── playwright.config.ts    headless Chromium E2E runner
├── vercel.json             frontend deployment (static + SPA rewrites)
├── .env.example            placeholder-only environment template
└── package.json            npm workspaces root
```

## Prerequisites

- Node.js ≥ 20 and npm 11 (`packageManager: npm@11.12.1`).
- A Supabase project (Postgres + Auth) for anything beyond mocked tests.
- An OpenRouter API key for live revisions (mocked offline otherwise).

## Local installation

```bash
git clone https://github.com/aradhyapratapconnect-cell/Snyzer.git
cd Snyzer
npm ci
cp .env.example .env   # then fill in real values locally — never commit this file
```

## Environment variables

See `.env.example` (placeholders only — no real secrets). Summary:

**Backend** (validated at startup in `backend/src/config/env.ts`; the server
refuses to boot when required values are missing):

| Variable                    | Required | Default / example                                                                         |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `PORT`                      | No       | `5000`                                                                                    |
| `NODE_ENV`                  | No       | `production` in production (enables prod error sanitization)                              |
| `LOG_LEVEL`                 | No       | `debug` (dev) / `info` (prod)                                                             |
| `DATABASE_URL`              | Yes      | `postgresql://user:password@localhost:5432/snyzer` — remote hosts always use verified TLS |
| `SUPABASE_URL`              | Yes      | `https://your-project.supabase.co`                                                        |
| `SUPABASE_SECRET_KEY`       | Yes      | service-role key — **backend only**                                                       |
| `OPENROUTER_API_KEY`        | Yes      | **backend only**                                                                          |
| `OPENROUTER_SITE_URL`       | No       | public site URL for attribution                                                           |
| `OPENROUTER_APP_NAME`       | No       | `Snyzer`                                                                                  |
| `MAX_TEXT_LENGTH`           | No       | `10000`                                                                                   |
| `RATE_LIMIT_WINDOW_SECONDS` | No       | `60`                                                                                      |
| `RATE_LIMIT_MAX_REQUESTS`   | No       | `30`                                                                                      |
| `DAILY_JOB_LIMIT`           | No       | `50`                                                                                      |
| `CORS_ALLOWED_ORIGINS`      | Yes      | exact frontend origin(s), comma-separated — never `*`                                     |

**Frontend** (build-time, `VITE_*` only — nothing secret may use this prefix):

| Variable                        | Required | Notes                       |
| ------------------------------- | -------- | --------------------------- |
| `VITE_SUPABASE_URL`             | Yes      | same project as the backend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes      | publishable key only        |

## Local development

```bash
npm run dev -w @snyzer/frontend   # Vite dev server (proxies /api to :5000)
# backend (needs real env): npm run build -w @snyzer/backend && npm run start -w @snyzer/backend
npm run db:migrate -w @snyzer/backend   # apply pending SQL migrations via DATABASE_URL
```

## Commands (repo root)

| Command                  | What it does                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `npm test`               | workspace checks + all unit/integration suites (shared/backend/frontend)                                |
| `npm run test:e2e`       | Playwright headless Chromium flows (`e2e/`, mocked transport)                                           |
| `npm run test:coverage`  | V8 coverage reports per workspace                                                                       |
| `npm run typecheck`      | strict `tsc` across all workspaces                                                                      |
| `npm run lint`           | ESLint, zero warnings allowed                                                                           |
| `npm run format`         | Prettier check (`format:write` to fix)                                                                  |
| `npm run build`          | shared → backend → frontend production artifacts                                                        |
| `npm run verify:build`   | asserts dist completeness, sourcemaps, chunk split, no test leakage                                     |
| `npm run smoke`          | `BASE_URL=… npm run smoke` — live health-check gate                                                     |
| `npm run clean`          | remove per-workspace `dist/` folders                                                                    |
| backend `security:audit` | `npm run security:audit -w @snyzer/backend` — bundle secrets, error sanitization, protected routes, RLS |

## Production build

```bash
npm ci
npm run typecheck && npm run lint && npm run format
npm test && npm run test:e2e
npm run build
npm run verify:build
npm run security:audit -w @snyzer/backend
```

Frontend needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` set at
build time; the backend emits `dist/` with sourcemaps and zero dev
dependencies required at runtime (`npm ci --omit=dev && node
backend/dist/server.js`).

## Deployment

Full procedure, hardening checklist, and troubleshooting:
**[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

- **Frontend → Vercel**: import the repo, set `VITE_*` env vars in the
  project settings, deploy — `vercel.json` already pins install/build/output
  and SPA rewrites. Point `/api` at the backend (rewrite or same-origin
  proxy) and list the exact frontend origin in `CORS_ALLOWED_ORIGINS`.
- **Backend → Node host** (Render / Railway / Fly.io / VPS): `npm ci
--omit=dev`, run migrations, `node dist/server.js`. Express is a
  long-lived process — it is not adapted to serverless functions.
- **Post-deploy**: `BASE_URL=https://… npm run smoke` must print OK.

## Security notes

- Backend secrets (`SUPABASE_SECRET_KEY`, `OPENROUTER_API_KEY`,
  `DATABASE_URL`) never leave the server: no `VITE_*` prefix, never imported
  by frontend code, scanned by the audit on every release.
- Auth is Supabase JWT verified server-side (`requireAuth`); every query is
  scoped to `req.user.id` and RLS enforces `auth.uid()` equality per table.
- Client-facing errors are sanitized envelopes — no stacks, messages, or
  connection strings (verified by audit in production mode).
- Rate limits key on user ID (IP fallback); writing creation is throttled
  separately; all rejections carry `Retry-After`.
- User writing is stored and rendered as inert text; only control bytes are
  stripped (PostgreSQL rejects NUL).
- If a secret is ever committed, treat it as compromised: rotate/revoke it —
  removing the commit is not enough.

## Development information

- Ticket backlog (SNZ-001…SNZ-064) with acceptance criteria:
  `Snyzer_Documentation/Feature Ticket.md`. Source-of-truth specs (PRD,
  architecture, security, frontend) live beside it.
- Conventions: TypeScript strict everywhere, Zod at every boundary,
  camelCase API ↔ snake_case storage, one commit per ticket
  (`feat(snz-NNN): …`), no pushes without explicit approval.
- Frontend `/api` proxy for local dev only; production is same-origin or an
  explicit backend origin plus CORS whitelist.

## License

No license file is declared yet — default copyright applies (all rights
reserved). Add a `LICENSE` before accepting outside contributions.
