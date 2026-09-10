# Snyzer

AI-assisted writing improvement application. Monorepo foundation (SNZ-001).

## Workspaces

- `shared/` — `@snyzer/shared`: shared TypeScript types and validation helpers.
- `backend/` — `@snyzer/backend`: Node.js + Express API (`src/app.ts`, `src/server.ts`).
- `frontend/` — `@snyzer/frontend`: React + Vite + Tailwind app (`src/main.tsx`).
- `docs/` — workspace placeholder; canonical docs live in `Snyzer_Documentation/`.

## Commands (run from repo root)

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm test
```

## Environment

Copy `.env.example` to `.env` and fill in values (never commit real secrets):

- Backend (`backend/src/config/env.ts`, SNZ-004) requires `DATABASE_URL`,
  `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `OPENROUTER_API_KEY`; the server
  crashes on startup when any is missing or invalid.
- Frontend requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`;
  `npm run build -w @snyzer/frontend` halts when they are absent. Backend
  secrets must never use a `VITE_` prefix.

- `npm run build` builds `shared` first, then `backend` and `frontend`.
- `npm test` runs the workspace integration check
  (`scripts/verify-workspaces.mjs`) plus every workspace test suite
  (e.g. backend supertest/vitest suite via `npm run test -w @snyzer/backend`).
- `npm run clean` removes per-workspace `dist/` folders.
- Backend server: `npm run build -w @snyzer/backend` then
  `npm run start -w @snyzer/backend` (serves `GET /api/v1/health`).
- Database migrations: `npm run db:migrate -w @snyzer/backend` (applies
  pending `backend/migrations/*.sql` using `DATABASE_URL`).
- Frontend dev server: `npm run dev -w @snyzer/frontend`; production bundle:
  `npm run build -w @snyzer/frontend` (emits `frontend/dist/`).

## Conventions

- TypeScript strict mode everywhere (`tsconfig.base.json` + per-workspace
  `tsconfig.json`).
- Path alias `@/*` maps to `./src/*` in `backend/` and `frontend/`.
- `@snyzer/shared` is importable from both `backend` and `frontend`.
- Secrets stay out of the repo: see `.env.example` (placeholders only) and
  `.gitignore` (`node_modules/`, `dist/`, `.env*`).
