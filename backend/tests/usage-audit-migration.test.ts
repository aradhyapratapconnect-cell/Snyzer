import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { discoverMigrations, runMigrations } from '../src/config/migrator.js';

/**
 * SNZ-009 tests: usage_events + audit_events migration structure and runner
 * wiring. Same strategy as SNZ-006/007/008: no live database exists in this
 * environment, so these tests assert the migration artifacts' required
 * columns, relationships, and indexes plus end-to-end runner wiring with the
 * real files against a fake pool.
 */
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

async function migrationSql(suffix: string): Promise<{ version: string; sql: string }> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(suffix));
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

describe('usage_events migration structure', () => {
  it('exists with a timestamped version ordered after writing_jobs', async () => {
    const { version } = await migrationSql('_usage_events.sql');

    expect(version).toMatch(/^\d+_usage_events\.sql$/);
    const versions = (await discoverMigrations(MIGRATIONS_DIR)).map((m) => m.version);
    expect(versions.indexOf(version)).toBeGreaterThan(
      versions.findIndex((v) => v.endsWith('_writing_jobs.sql')),
    );
  });

  it('defines accounting columns with relationships and defaults', async () => {
    const { sql } = await migrationSql('_usage_events.sql');

    containsClause(sql, 'CREATE TABLE IF NOT EXISTS public.usage_events');
    containsClause(sql, 'id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    containsClause(sql, 'user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE');
    containsClause(sql, 'job_id UUID REFERENCES public.writing_jobs (id) ON DELETE SET NULL');
    containsClause(sql, 'provider TEXT NOT NULL');
    containsClause(sql, 'model TEXT NOT NULL');
    containsClause(sql, 'input_tokens INTEGER NOT NULL DEFAULT 0');
    containsClause(sql, 'output_tokens INTEGER NOT NULL DEFAULT 0');
    containsClause(sql, 'total_tokens INTEGER NOT NULL DEFAULT 0');
    containsClause(sql, 'estimated_cost NUMERIC');
    containsClause(sql, 'status TEXT NOT NULL');
    containsClause(sql, 'created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
  });

  it('indexes per-user usage lookups', async () => {
    const { sql } = await migrationSql('_usage_events.sql');

    containsClause(
      sql,
      'CREATE INDEX IF NOT EXISTS idx_usage_events_user_created ON public.usage_events (user_id, created_at DESC)',
    );
  });
});

describe('audit_events migration structure', () => {
  it('exists with a timestamped version ordered after usage_events', async () => {
    const { version } = await migrationSql('_audit_events.sql');

    expect(version).toMatch(/^\d+_audit_events\.sql$/);
    const versions = (await discoverMigrations(MIGRATIONS_DIR)).map((m) => m.version);
    expect(versions.indexOf(version)).toBeGreaterThan(
      versions.findIndex((v) => v.endsWith('_usage_events.sql')),
    );
  });

  it('defines audit columns with queryable JSONB metadata', async () => {
    const { sql } = await migrationSql('_audit_events.sql');

    containsClause(sql, 'CREATE TABLE IF NOT EXISTS public.audit_events');
    containsClause(sql, 'id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    containsClause(sql, 'actor_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL');
    containsClause(sql, 'event_type TEXT NOT NULL');
    containsClause(sql, 'target_type TEXT');
    containsClause(sql, 'target_id UUID');
    containsClause(sql, "metadata JSONB NOT NULL DEFAULT '{}'::jsonb");
    containsClause(sql, 'created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
  });

  it('indexes per-actor audit lookups', async () => {
    const { sql } = await migrationSql('_audit_events.sql');

    containsClause(
      sql,
      'CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created ON public.audit_events (actor_user_id, created_at DESC)',
    );
  });

  it('forbids raw writing content in audit metadata by convention note', async () => {
    // Enforced at write time (SNZ-029); the migration documents the rule.
    const { sql } = await migrationSql('_audit_events.sql');

    expect(sql).toMatch(/never contain raw writing content/i);
  });
});

describe('usage/audit migration runner wiring', () => {
  it('applies both real files transactionally via runMigrations', async () => {
    const usage = await migrationSql('_usage_events.sql');
    const audit = await migrationSql('_audit_events.sql');
    const clientQueries: string[] = [];
    const client = {
      query: vi.fn(async (text: string) => {
        clientQueries.push(text);
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const pool = {
      query: vi.fn(async (text: string) => ({ rows: text.startsWith('SELECT version') ? [] : [] })),
      connect: vi.fn(async () => client),
    } as unknown as Pool;

    const result = await runMigrations(pool, MIGRATIONS_DIR);

    expect(result.applied).toEqual(expect.arrayContaining([usage.version, audit.version]));
    expect(clientQueries).toContain(usage.sql);
    expect(clientQueries).toContain(audit.sql);
    expect(clientQueries.filter((q) => q === 'COMMIT')).toHaveLength(result.applied.length);
  });
});
