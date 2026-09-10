import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool, PoolClient } from 'pg';

/**
 * Plain-SQL migration runner (SNZ-005).
 *
 * Migration files live in `backend/migrations/` named
 * `<version>_<description>.sql` (e.g. `20260910000000_profiles.sql`) and run
 * in lexicographic order — which is chronological when versions are
 * timestamps. Each pending migration runs inside its own transaction and is
 * recorded in `schema_migrations`, so reruns only apply new files.
 * Individual migration files arrive in SNZ-006+.
 */

export interface MigrationFile {
  /** File name, used as the stable applied-version key. */
  version: string;
  sql: string;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

/** Lists `.sql` files in a directory, sorted, with contents loaded. */
export async function discoverMigrations(migrationsDir: string): Promise<MigrationFile[]> {
  const entries = await readdir(migrationsDir);
  const files = entries.filter((entry) => entry.endsWith('.sql')).sort();
  return Promise.all(
    files.map(async (version) => ({
      version,
      sql: await readFile(join(migrationsDir, version), 'utf8'),
    })),
  );
}

export async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
  );
}

export async function getAppliedVersions(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<{ version: string }>('SELECT version FROM schema_migrations');
  return new Set(result.rows.map((row) => row.version));
}

async function applyMigration(pool: Pool, migration: MigrationFile): Promise<void> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration.sql);
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [migration.version]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** Applies pending migrations in order; returns applied vs skipped versions. */
export async function runMigrations(pool: Pool, migrationsDir: string): Promise<MigrationResult> {
  await ensureMigrationsTable(pool);
  const appliedVersions = await getAppliedVersions(pool);
  const result: MigrationResult = { applied: [], skipped: [] };
  for (const migration of await discoverMigrations(migrationsDir)) {
    if (appliedVersions.has(migration.version)) {
      result.skipped.push(migration.version);
      continue;
    }
    await applyMigration(pool, migration);
    result.applied.push(migration.version);
  }
  return result;
}
