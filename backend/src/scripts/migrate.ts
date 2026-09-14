import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDatabase, formatDatabaseError, getPool } from '../config/database.js';
import { getBackendEnv } from '../config/env.js';
import { runMigrations } from '../config/migrator.js';
import { logger } from '../utils/logger.js';

/**
 * `npm run db:migrate -w @snyzer/backend` entrypoint (SNZ-005).
 *
 * Loads validated env (crashes when `DATABASE_URL` is missing), applies
 * pending SQL migrations from `backend/migrations/`, then exits. Only
 * version file names and counts are logged — never migration contents.
 */
async function main(): Promise<void> {
  getBackendEnv();
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations');
  const pool = getPool();
  try {
    const { applied, skipped } = await runMigrations(pool, migrationsDir);
    logger.info({ applied: applied.length, skipped: skipped.length }, 'Migrations complete');
    for (const version of applied) {
      logger.info({ version }, 'Applied migration');
    }
  } catch (error) {
    logger.error({ error: formatDatabaseError(error) }, 'Migration failed');
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

void main();
