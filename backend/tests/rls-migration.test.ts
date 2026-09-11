import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { discoverMigrations, runMigrations } from '../src/config/migrator.js';

/**
 * SNZ-010 tests: RLS migration structure and runner wiring.
 *
 * Same strategy as SNZ-006..009: no live database (and no second Supabase
 * JWT context) exists in this environment, so these tests assert the
 * migration artifact's required RLS clauses plus end-to-end runner wiring
 * with the real file against a fake pool. Live cross-user isolation tests
 * run against Supabase when the project database is provisioned.
 */
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

async function rlsSql(): Promise<{ version: string; sql: string }> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('_rls_policies.sql'));
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

function absentClause(sql: string, clause: string): void {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toUpperCase();
  expect(normalize(sql).includes(normalize(clause))).toBe(false);
}

describe('rls migration structure', () => {
  it('exists with a timestamped version ordered last', async () => {
    const { version } = await rlsSql();

    expect(version).toMatch(/^\d+_rls_policies\.sql$/);
    const discovered = await discoverMigrations(MIGRATIONS_DIR);
    const versions = discovered.map((m) => m.version);
    expect(versions[versions.length - 1]).toBe(version);
  });

  it('explicitly enables RLS on every core table (never FORCE)', async () => {
    const { sql } = await rlsSql();

    for (const table of ['profiles', 'user_preferences', 'writing_jobs', 'usage_events']) {
      containsClause(sql, `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
    // FORCE would subject the owner backend connection to auth.uid() policies
    // (NULL on direct connections) and break the backend — it must not appear.
    absentClause(sql, 'FORCE ROW LEVEL SECURITY');
  });

  it('isolates rows by strict auth.uid() equality on all CRUD policies', async () => {
    const { sql } = await rlsSql();

    for (const table of ['profiles', 'user_preferences', 'writing_jobs']) {
      for (const op of ['select', 'insert', 'update', 'delete']) {
        containsClause(sql, `CREATE POLICY ${table}_${op}_own ON public.${table}`);
      }
    }
    containsClause(sql, 'USING (id = auth.uid())');
    containsClause(sql, 'USING (user_id = auth.uid())');
    containsClause(sql, 'WITH CHECK (user_id = auth.uid())');
  });

  it('denies client-side role escalation on profiles', async () => {
    const { sql } = await rlsSql();

    containsClause(sql, "WITH CHECK (id = auth.uid() AND role = 'FREE_USER')");
    containsClause(
      sql,
      'GRANT UPDATE (display_name, updated_at) ON public.profiles TO authenticated',
    );
  });

  it('denies client writes to token, cost, and model columns on writing_jobs', async () => {
    const { sql } = await rlsSql();
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();
    const start = normalized.indexOf('GRANT UPDATE (INPUT_TEXT');
    expect(start).toBeGreaterThan(-1);
    const statement = normalized.slice(start, normalized.indexOf(';', start));

    expect(statement).toContain('ON PUBLIC.WRITING_JOBS TO AUTHENTICATED');
    for (const privileged of [
      'INPUT_TOKENS',
      'OUTPUT_TOKENS',
      'TOTAL_TOKENS',
      'ESTIMATED_COST',
      'MODEL',
    ]) {
      expect(statement).not.toContain(privileged);
    }
  });

  it('keeps usage_events read-own-only with no JWT write policies', async () => {
    const { sql } = await rlsSql();

    containsClause(sql, 'CREATE POLICY usage_events_select_own ON public.usage_events');
    absentClause(sql, 'usage_events_insert_own');
    absentClause(sql, 'usage_events_update_own');
    absentClause(sql, 'usage_events_delete_own');
    containsClause(sql, 'GRANT SELECT ON public.usage_events TO authenticated');
  });

  it('denies all JWT access to audit_events and schema_migrations', async () => {
    const { sql } = await rlsSql();

    containsClause(sql, 'ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY');
    containsClause(sql, 'ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY');
    containsClause(sql, 'REVOKE ALL ON public.audit_events FROM authenticated');
  });

  it('keeps service_role fully privileged and anon fully denied', async () => {
    const { sql } = await rlsSql();

    for (const table of [
      'profiles',
      'user_preferences',
      'writing_jobs',
      'usage_events',
      'audit_events',
    ]) {
      containsClause(sql, `GRANT ALL ON public.${table} TO service_role`);
      containsClause(sql, `REVOKE ALL ON public.${table} FROM anon`);
    }
  });
});

describe('rls migration runner wiring', () => {
  it('applies the real file transactionally via runMigrations', async () => {
    const { version, sql } = await rlsSql();
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

    expect(result.applied).toContain(version);
    expect(clientQueries[0]).toBe('BEGIN');
    expect(clientQueries).toContain(sql);
    expect(clientQueries[clientQueries.length - 1]).toBe('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
});
