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

- `npm run build` builds `shared` first, then `backend` and `frontend`.
- `npm test` runs the workspace integration check
  (`scripts/verify-workspaces.mjs`) plus every workspace test suite
  (e.g. backend supertest/vitest suite via `npm run test -w @snyzer/backend`).
- `npm run clean` removes per-workspace `dist/` folders.
- Backend server: `npm run build -w @snyzer/backend` then
  `npm run start -w @snyzer/backend` (serves `GET /api/v1/health`).
- Frontend dev server: `npm run dev -w @snyzer/frontend`; production bundle:
  `npm run build -w @snyzer/frontend` (emits `frontend/dist/`).

## Conventions

- TypeScript strict mode everywhere (`tsconfig.base.json` + per-workspace
  `tsconfig.json`).
- Path alias `@/*` maps to `./src/*` in `backend/` and `frontend/`.
- `@snyzer/shared` is importable from both `backend` and `frontend`.
- Secrets stay out of the repo: see `.env.example` (placeholders only) and
  `.gitignore` (`node_modules/`, `dist/`, `.env*`).
