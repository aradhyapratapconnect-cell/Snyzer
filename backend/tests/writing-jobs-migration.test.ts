import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { discoverMigrations, runMigrations } from '../src/config/migrator.js';

/**
 * SNZ-008 tests: writing_jobs migration structure and runner wiring.
 *
 * Same strategy as SNZ-006/007: no live database exists in this
 * environment, so these tests assert the migration artifact's required
 * columns, constraints, and indexes plus end-to-end runner wiring with the
 * real file against a fake pool. Live execution against Supabase is verified
 * when the project database is provisioned.
 */
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

async function jobsSql(): Promise<{ version: string; sql: string }> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('_writing_jobs.sql'));
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

describe('writing_jobs migration structure', () => {
  it('exists with a timestamped version ordered after user_preferences', async () => {
    const { version } = await jobsSql();

    expect(version).toMatch(/^\d+_writing_jobs\.sql$/);
    const discovered = await discoverMigrations(MIGRATIONS_DIR);
    const versions = discovered.map((m) => m.version);
    expect(versions.indexOf(version)).toBeGreaterThan(
      versions.findIndex((v) => v.endsWith('_user_preferences.sql')),
    );
  });

  it('defines ownership, text, settings, and token columns', async () => {
    const { sql } = await jobsSql();

    containsClause(sql, 'CREATE TABLE IF NOT EXISTS public.writing_jobs');
    containsClause(sql, 'id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    containsClause(sql, 'user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE');
    containsClause(sql, 'input_text TEXT NOT NULL');
    containsClause(sql, 'output_text TEXT');
    containsClause(sql, 'mode TEXT NOT NULL');
    containsClause(sql, 'tone TEXT NOT NULL');
    containsClause(sql, "settings JSONB NOT NULL DEFAULT '{}'::jsonb");
    containsClause(sql, 'analysis JSONB');
    containsClause(sql, 'model TEXT');
    containsClause(sql, 'input_tokens INTEGER');
    containsClause(sql, 'output_tokens INTEGER');
    containsClause(sql, 'total_tokens INTEGER');
    containsClause(sql, 'processing_ms INTEGER');
    containsClause(sql, 'error_code TEXT');
    containsClause(sql, 'created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
    containsClause(sql, 'completed_at TIMESTAMPTZ');
  });

  it('constrains status to the job lifecycle values', async () => {
    const { sql } = await jobsSql();

    containsClause(sql, "status TEXT NOT NULL DEFAULT 'queued'");
    containsClause(sql, "CHECK (status IN ('queued', 'processing', 'completed', 'failed'))");
  });

  it('indexes user history lookups newest-first', async () => {
    const { sql } = await jobsSql();

    containsClause(
      sql,
      'CREATE INDEX IF NOT EXISTS idx_writing_jobs_user_created ON public.writing_jobs (user_id, created_at DESC)',
    );
  });

  it('contains no secrets or credentials', async () => {
    const { sql } = await jobsSql();

    expect(sql.toLowerCase()).not.toContain('password');
    expect(sql.toLowerCase()).not.toContain('secret');
  });
});

describe('writing_jobs migration runner wiring', () => {
  it('applies the real file transactionally via runMigrations', async () => {
    const { version, sql } = await jobsSql();
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
