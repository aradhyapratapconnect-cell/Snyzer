import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { discoverMigrations, runMigrations } from '../src/config/migrator.js';

/**
 * SNZ-062 tests: user_presets migration structure and runner wiring.
 *
 * No live database exists in this environment, so these tests assert the
 * migration artifact's required clauses plus end-to-end runner wiring with
 * the real file against a fake pool. Live execution against Supabase is
 * verified when the project database is provisioned.
 */
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

async function presetsSql(): Promise<{ version: string; sql: string }> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('_user_presets.sql'));
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

describe('user_presets migration structure', () => {
  it('exists with a timestamped version ordered after the RLS baseline', async () => {
    const { version } = await presetsSql();

    expect(version).toMatch(/^\d+_user_presets\.sql$/);
    const discovered = await discoverMigrations(MIGRATIONS_DIR);
    const versions = discovered.map((m) => m.version);
    expect(versions.indexOf(version)).toBeGreaterThan(
      versions.findIndex((v) => v.endsWith('_rls_policies.sql')),
    );
  });

  it('defines the table owned by profiles with domain checks', async () => {
    const { sql } = await presetsSql();

    containsClause(sql, 'CREATE TABLE IF NOT EXISTS public.user_presets');
    containsClause(sql, 'user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE');
    containsClause(sql, 'CHECK (char_length(name) BETWEEN 1 AND 60)');
    containsClause(sql, "CHECK (mode IN ('natural', 'clarity', 'formal', 'concise'))");
    containsClause(sql, "CHECK (tone IN ('professional', 'casual', 'academic', 'direct'))");
    containsClause(sql, 'CHECK (clarity BETWEEN 0 AND 100)');
    containsClause(sql, 'CHECK (sentence_variety BETWEEN 0 AND 100)');
    containsClause(sql, 'CREATE INDEX IF NOT EXISTS idx_user_presets_user_created');
  });

  it('enables RLS without FORCE and isolates tenants by auth.uid()', async () => {
    const { sql } = await presetsSql();
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    containsClause(sql, 'ALTER TABLE public.user_presets ENABLE ROW LEVEL SECURITY');
    expect(normalized).not.toContain('FORCE ROW LEVEL SECURITY');
    containsClause(sql, 'USING (user_id = auth.uid())');
    containsClause(sql, 'WITH CHECK (user_id = auth.uid())');
    containsClause(sql, 'GRANT ALL ON public.user_presets TO service_role');
    containsClause(sql, 'REVOKE ALL ON public.user_presets FROM anon');
  });

  it('contains no secrets or credentials', async () => {
    const { sql } = await presetsSql();

    expect(sql.toLowerCase()).not.toContain('password');
    expect(sql.toLowerCase()).not.toContain('secret');
  });
});

describe('user_presets migration runner wiring', () => {
  it('applies the real file transactionally via runMigrations', async () => {
    const { version, sql } = await presetsSql();
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
