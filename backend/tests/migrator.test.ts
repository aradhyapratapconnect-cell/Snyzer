import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  discoverMigrations,
  ensureMigrationsTable,
  getAppliedVersions,
  runMigrations,
} from '../src/config/migrator.js';

/**
 * SNZ-005 unit tests: migration discovery, ordering, transactional apply,
 * skip-applied, and rollback — all against fake pools and temp dirs.
 */
interface RecordedQuery {
  text: string;
  params?: unknown[];
}

function fakePool(appliedVersions: string[] = [], failOnSql?: RegExp) {
  const poolQueries: RecordedQuery[] = [];
  const clientQueries: RecordedQuery[] = [];
  const client = {
    query: vi.fn(async (text: string, params?: unknown[]) => {
      clientQueries.push({ text, params });
      if (failOnSql !== undefined && failOnSql.test(text)) {
        throw new Error('migration SQL failed');
      }
      return { rows: [] };
    }),
    release: vi.fn(),
  };
  const pool = {
    query: vi.fn(async (text: string, params?: unknown[]) => {
      poolQueries.push({ text, params });
      if (text.startsWith('SELECT version')) {
        return { rows: appliedVersions.map((version) => ({ version })) };
      }
      return { rows: [] };
    }),
    connect: vi.fn(async () => client),
  } as unknown as Pool;
  return { pool, poolQueries, clientQueries, client };
}

async function tempMigrationsDir(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'snyzer-migrations-'));
  for (const [name, sql] of Object.entries(files)) {
    await writeFile(join(dir, name), sql);
  }
  return dir;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('discoverMigrations', () => {
  it('loads .sql files in sorted order and ignores other files', async () => {
    const dir = await tempMigrationsDir({
      '20260910000002_second.sql': 'SELECT 2;',
      'notes.txt': 'not a migration',
      '20260910000001_first.sql': 'SELECT 1;',
    });
    try {
      const migrations = await discoverMigrations(dir);

      expect(migrations.map((m) => m.version)).toEqual([
        '20260910000001_first.sql',
        '20260910000002_second.sql',
      ]);
      expect(migrations[0]?.sql).toBe('SELECT 1;');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('runMigrations', () => {
  it('ensures the tracking table, applies pending migrations transactionally, in order', async () => {
    const dir = await tempMigrationsDir({
      '20260910000001_first.sql': 'CREATE TABLE t1 (id INT);',
      '20260910000002_second.sql': 'CREATE TABLE t2 (id INT);',
    });
    const { pool, poolQueries, clientQueries, client } = fakePool();
    try {
      const result = await runMigrations(pool, dir);

      expect(result).toEqual({
        applied: ['20260910000001_first.sql', '20260910000002_second.sql'],
        skipped: [],
      });
      expect(
        poolQueries.some((q) => q.text.includes('CREATE TABLE IF NOT EXISTS schema_migrations')),
      ).toBe(true);
      const statements = clientQueries.map((q) => q.text);
      expect(statements).toEqual([
        'BEGIN',
        'CREATE TABLE t1 (id INT);',
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        'COMMIT',
        'BEGIN',
        'CREATE TABLE t2 (id INT);',
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        'COMMIT',
      ]);
      expect(client.release).toHaveBeenCalledTimes(2);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('skips already-applied versions without touching a transaction', async () => {
    const dir = await tempMigrationsDir({ '20260910000001_first.sql': 'SELECT 1;' });
    const { pool, client } = fakePool(['20260910000001_first.sql']);
    try {
      const result = await runMigrations(pool, dir);

      expect(result).toEqual({ applied: [], skipped: ['20260910000001_first.sql'] });
      expect(client.query).not.toHaveBeenCalledWith('BEGIN');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('rolls back and propagates when a migration fails', async () => {
    const dir = await tempMigrationsDir({ '20260910000001_broken.sql': 'BROKEN SQL' });
    const { pool, clientQueries } = fakePool([], /BROKEN SQL/);
    try {
      await expect(runMigrations(pool, dir)).rejects.toThrow('migration SQL failed');

      const statements = clientQueries.map((q) => q.text);
      expect(statements).toContain('ROLLBACK');
      expect(statements).not.toContain('COMMIT');
      expect(statements.filter((s) => s.startsWith('INSERT INTO schema_migrations'))).toHaveLength(
        0,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('getAppliedVersions', () => {
  it('returns the tracked version set', async () => {
    const { pool } = fakePool(['a.sql', 'b.sql']);

    await expect(getAppliedVersions(pool)).resolves.toEqual(new Set(['a.sql', 'b.sql']));
  });
});

describe('ensureMigrationsTable', () => {
  it('issues an idempotent create-table statement', async () => {
    const { pool, poolQueries } = fakePool();

    await ensureMigrationsTable(pool);

    expect(poolQueries).toHaveLength(1);
    expect(poolQueries[0]?.text).toContain('CREATE TABLE IF NOT EXISTS schema_migrations');
  });
});
