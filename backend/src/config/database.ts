import { Pool, type Pool as PgPool, type QueryResultRow } from 'pg';
import { getBackendEnv } from './env.js';

/**
 * Database connection layer (SNZ-005).
 *
 * Uses `pg` connection pooling against Supabase PostgreSQL. The single
 * `DATABASE_URL` (validated env, never logged) works for both Supabase
 * endpoints: direct (5432) and pooled PgBouncer (6543). Driver choice
 * rationale: SNZ-006+ manage schema with plain SQL migrations (including
 * triggers on the managed `auth` schema and RLS policies), which an ORM
 * migration tool cannot author — so the backend uses SQL + `pg` directly.
 *
 * Query text and parameters are never written to logs (user writing must
 * stay out of operational output). Only short status messages and sanitized
 * error summaries are logged.
 */

const POOL_MAX_CLIENTS = 10;
const POOL_IDLE_TIMEOUT_MS = 30_000;
const POOL_CONNECTION_TIMEOUT_MS = 10_000;

let pool: PgPool | undefined;

function createPool(): PgPool {
  const env = getBackendEnv();
  return new Pool({
    connectionString: env.DATABASE_URL,
    max: POOL_MAX_CLIENTS,
    idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT_MS,
  });
}

/** Singleton pool, created lazily. Test hook `_setPoolForTests` can replace it. */
export function getPool(): PgPool {
  pool ??= createPool();
  return pool;
}

/** Test-only hook to inject or clear the singleton pool. */
export function _setPoolForTests(next: PgPool | undefined): void {
  pool = next;
}

/** Parameterized query helper. Never logs `text` or `params`. */
export async function queryDatabase<T extends QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as unknown[] | undefined);
  return result.rows;
}

/** Single-statement executor bound to a transaction client. */
export type TransactionQuery = <T extends QueryResultRow>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

/**
 * Runs `fn` inside one transaction on a dedicated client (SNZ-026):
 * multi-statement writes (job update + usage event) commit or roll back
 * together. The client is always released.
 */
export async function withTransaction<T>(fn: (query: TransactionQuery) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(async (text, params) => {
      const outcome = await client.query(text, params as unknown[] | undefined);
      return outcome.rows;
    });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Rollback failure must not mask the original error.
    }
    throw error;
  } finally {
    client.release();
  }
}

export interface DatabaseHealth {
  ok: boolean;
  latencyMs: number;
}

/**
 * Connection health check: runs `SELECT 1` and reports latency. Accepts an
 * explicit pool so tests can verify behavior without a live database.
 */
export async function checkDatabaseConnection(target: PgPool = getPool()): Promise<DatabaseHealth> {
  const started = Date.now();
  await target.query('SELECT 1');
  return { ok: true, latencyMs: Date.now() - started };
}

/** Graceful shutdown: drains and closes the singleton pool, if any. */
export async function closeDatabase(): Promise<void> {
  if (pool !== undefined) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}

/**
 * Redacts credentials from database error text. `pg` messages do not carry
 * the password, but malformed-URL errors can echo the connection string, so
 * `user:password@` segments are masked before anything reaches logs.
 */
export function formatDatabaseError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/:\/\/[^/\s@]+@/g, '://***@');
}
