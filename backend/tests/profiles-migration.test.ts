import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { discoverMigrations, runMigrations } from '../src/config/migrator.js';

/**
 * SNZ-006 tests: profiles migration structure and runner wiring.
 *
 * No live database exists in this environment (and pg-mem cannot execute
 * plpgsql/TRIGGER DDL), so these tests assert the migration artifact's
 * required clauses plus end-to-end runner wiring with the real file against
 * a fake pool. Live execution against Supabase is verified when the project
 * database is provisioned.
 */
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

async function profilesSql(): Promise<{ version: string; sql: string }> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('_profiles.sql'));
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

describe('profiles migration structure', () => {
  it('exists with a timestamped version that sorts first', async () => {
    const { version } = await profilesSql();

    expect(version).toMatch(/^\d+_profiles\.sql$/);
    const discovered = await discoverMigrations(MIGRATIONS_DIR);
    expect(discovered[0]?.version).toBe(version);
  });

  it('defines the profiles table owned by auth.users with cascade delete', async () => {
    const { sql } = await profilesSql();

    containsClause(sql, 'CREATE TABLE IF NOT EXISTS public.profiles');
    containsClause(sql, 'id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE');
    containsClause(sql, 'display_name TEXT');
    containsClause(sql, "role TEXT NOT NULL DEFAULT 'FREE_USER'");
    containsClause(sql, 'created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
    containsClause(sql, 'updated_at TIMESTAMPTZ NOT NULL DEFAULT now()');
  });

  it('auto-provisions a profile on signup without overwriting existing rows', async () => {
    const { sql } = await profilesSql();

    containsClause(sql, 'CREATE TRIGGER on_auth_user_created');
    containsClause(sql, 'AFTER INSERT ON auth.users');
    containsClause(sql, 'EXECUTE FUNCTION public.handle_new_user()');
    containsClause(sql, 'SECURITY DEFINER');
    containsClause(sql, "NEW.raw_user_meta_data ->> 'display_name'");
    containsClause(sql, 'ON CONFLICT (id) DO NOTHING');
  });

  it('keeps updated_at fresh on updates', async () => {
    const { sql } = await profilesSql();

    containsClause(sql, 'CREATE TRIGGER set_profiles_updated_at');
    containsClause(sql, 'BEFORE UPDATE ON public.profiles');
    containsClause(sql, 'NEW.updated_at = now()');
  });

  it('contains no secrets or credentials', async () => {
    const { sql } = await profilesSql();

    expect(sql.toLowerCase()).not.toContain('password');
    expect(sql.toLowerCase()).not.toContain('secret');
    expect(sql).not.toMatch(/sk-[A-Za-z0-9]/);
  });
});

describe('profiles migration runner wiring', () => {
  it('applies the real profiles file transactionally via runMigrations', async () => {
    const { version, sql } = await profilesSql();
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
