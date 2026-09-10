# Snyzer

AI-assisted writing improvement application. Monorepo foundation (SNZ-001).

## Workspaces

- `shared/` — `@snyzer/shared`: shared TypeScript types and validation helpers.
- `backend/` — `@snyzer/backend`: Node.js + Express API (Express arrives in SNZ-002).
- `frontend/` — `@snyzer/frontend`: React + Vite app (React/Vite arrives in SNZ-003).
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
- `npm test` runs the SNZ-001 workspace integration check
  (`scripts/verify-workspaces.mjs`).
- `npm run clean` removes per-workspace `dist/` folders.

## Conventions

- TypeScript strict mode everywhere (`tsconfig.base.json` + per-workspace
  `tsconfig.json`).
- Path alias `@/*` maps to `./src/*` in `backend/` and `frontend/`.
- `@snyzer/shared` is importable from both `backend` and `frontend`.
- Secrets stay out of the repo: see `.env.example` (placeholders only) and
  `.gitignore` (`node_modules/`, `dist/`, `.env*`).
