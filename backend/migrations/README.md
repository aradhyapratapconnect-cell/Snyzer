# backend/migrations/

Plain-SQL migration files, applied in lexicographic filename order by
`npm run db:migrate -w @snyzer/backend` (see `src/config/migrator.ts`).

## Naming

`<UTC-timestamp>_<snake_case_description>.sql`, e.g.
`20260910000000_profiles.sql`. Timestamps keep ordering chronological.

## Rules

- One migration per file; files run inside a transaction.
- Applied versions are tracked in `schema_migrations` — never edit a file
  after it has been applied anywhere shared; add a new migration instead.
- Never store secrets, example credentials, or user content in migrations.
- The first migrations arrive in SNZ-006 (profiles table + signup trigger).
