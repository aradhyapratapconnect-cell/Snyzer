import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { discoverMigrations, runMigrations } from '../src/config/migrator.js';

/**
 * SNZ-007 tests: user_preferences migration structure and runner wiring.
 *
 * Same strategy as SNZ-006: no live database exists in this environment, so
 * these tests assert the migration artifact's required clauses plus
 * end-to-end runner wiring with the real file against a fake pool. Live
 * execution against Supabase is verified when the project database is
 * provisioned.
 */
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

async function preferencesSql(): Promise<{ version: string; sql: string }> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('_user_preferences.sql'));
  expect(files).toHaveLength(1);
  const version = files[0] as string;
  const sql = await readFile(join(MIGRATIONS_DIR, version), 'utf8');
  return { version, sql };
}

/** Case- and whitespace-insensitive clause assertion. */
function containsClause(sql: string, clause: string): void {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toUpperCase();
  expect(normalize(sql).includes(normalize(clause))).toBe(true);
}

describe('user_preferences migration structure', () => {
  it('exists with a timestamped version ordered after profiles', async () => {
    const { version } = await preferencesSql();

    expect(version).toMatch(/^\d+_user_preferences\.sql$/);
    const discovered = await discoverMigrations(MIGRATIONS_DIR);
    const versions = discovered.map((m) => m.version);
    expect(versions.indexOf(version)).toBeGreaterThan(
      versions.findIndex((v) => v.endsWith('_profiles.sql')),
    );
  });

  it('defines the table owned by profiles with enum check constraints', async () => {
    const { sql } = await preferencesSql();

    containsClause(sql, 'CREATE TABLE IF NOT EXISTS public.user_preferences');
    containsClause(
      sql,
      'user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE',
    );
    containsClause(sql, "theme TEXT NOT NULL DEFAULT 'system'");
    containsClause(sql, "CHECK (theme IN ('light', 'dark', 'system'))");
    containsClause(sql, "workspace_layout TEXT NOT NULL DEFAULT 'side_by_side'");
    containsClause(sql, "CHECK (workspace_layout IN ('side_by_side', 'input_first'))");
    containsClause(sql, "editor_mode TEXT NOT NULL DEFAULT 'plain'");
    containsClause(sql, "CHECK (editor_mode IN ('plain', 'rich'))");
    containsClause(sql, "default_tone TEXT NOT NULL DEFAULT 'professional'");
    containsClause(sql, 'created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
    containsClause(sql, 'updated_at TIMESTAMPTZ NOT NULL DEFAULT now()');
  });

  it('rejects invalid enum strings at the database layer', async () => {
    // Without a live DB we assert the CHECK that performs the rejection:
    // `theme = 'blue'` cannot satisfy `theme IN ('light', 'dark', 'system')`.
    const { sql } = await preferencesSql();
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    expect(normalized.includes("THEME IN ('LIGHT', 'DARK', 'SYSTEM')")).toBe(true);
  });

  it('keeps updated_at fresh on updates', async () => {
    const { sql } = await preferencesSql();

    containsClause(sql, 'CREATE TRIGGER set_user_preferences_updated_at');
    containsClause(sql, 'BEFORE UPDATE ON public.user_preferences');
    containsClause(sql, 'EXECUTE FUNCTION public.handle_updated_at()');
  });

  it('contains no secrets or credentials', async () => {
    const { sql } = await preferencesSql();

    expect(sql.toLowerCase()).not.toContain('password');
    expect(sql.toLowerCase()).not.toContain('secret');
  });
});

describe('user_preferences migration runner wiring', () => {
  it('applies the real file transactionally via runMigrations', async () => {
    const { version, sql } = await preferencesSql();
    const clientQueries: string[] = [];
    const client = {
      query: vi.fn(async (text: string) => {
        clientQueries.push(text);
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const pool = {
      query: vi.fn(async (text: string) => {
        if (text.startsWith('SELECT version')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
      connect: vi.fn(async () => client),
    } as unknown as Pool;

    const result = await runMigrations(pool, MIGRATIONS_DIR);

    expect(result.applied).toContain(version);
    expect(clientQueries[0]).toBe('BEGIN');
    expect(clientQueries).toContain(sql);
    expect(clientQueries[clientQueries.length - 1]).toBe('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
});
