import type { Pool } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  _setPoolForTests,
  checkDatabaseConnection,
  closeDatabase,
  formatDatabaseError,
  queryDatabase,
} from '../src/config/database.js';

/**
 * SNZ-005 unit tests: pool lifecycle, health check, and error sanitization
 * using fake pools. No live database is required.
 */
function fakePool(overrides: Record<string, unknown> = {}): Pool {
  return {
    query: vi.fn(async () => ({ rows: [{ '?column?': 1 }] })),
    connect: vi.fn(async () => ({ query: vi.fn(async () => ({ rows: [] })), release: vi.fn() })),
    end: vi.fn(async () => {}),
    ...overrides,
  } as unknown as Pool;
}

afterEach(() => {
  _setPoolForTests(undefined);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('formatDatabaseError', () => {
  it('redacts userinfo credentials from connection strings', () => {
    const message = formatDatabaseError(
      new Error('connect postgresql://user:s3cr3t-pw@db.example.com:5432/snyzer failed'),
    );

    expect(message).not.toContain('s3cr3t-pw');
    expect(message).not.toContain('user:s3cr3t-pw');
    expect(message).toContain('db.example.com');
  });

  it('passes through messages without credentials unchanged', () => {
    expect(formatDatabaseError(new Error('connection timeout'))).toBe('connection timeout');
  });
});

describe('checkDatabaseConnection', () => {
  it('returns ok with measured latency on SELECT 1 success', async () => {
    const health = await checkDatabaseConnection(fakePool());

    expect(health.ok).toBe(true);
    expect(typeof health.latencyMs).toBe('number');
  });

  it('rejects when the database is unreachable', async () => {
    const pool = fakePool({
      query: vi.fn(async () => {
        throw new Error('connect ECONNREFUSED');
      }),
    });

    await expect(checkDatabaseConnection(pool)).rejects.toThrow('ECONNREFUSED');
  });
});

describe('queryDatabase', () => {
  it('delegates to the pool and returns rows', async () => {
    const pool = fakePool({ query: vi.fn(async () => ({ rows: [{ id: 1 }] })) });
    _setPoolForTests(pool);

    await expect(queryDatabase('SELECT $1::int AS id', [1])).resolves.toEqual([{ id: 1 }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT $1::int AS id', [1]);
  });
});

describe('pool lifecycle', () => {
  // NB: `getBackendEnv()` caches per module instance, so these tests reset
  // the module registry and import fresh copies.
  it('reads credentials exclusively from validated env', async () => {
    vi.resetModules();
    vi.stubEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/snyzer');
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'service-role-key');
    vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
    const fresh = await import('../src/config/database.js');

    expect(fresh.getPool()).toBeDefined();
    await fresh.closeDatabase();
  });

  it('refuses to create a pool when DATABASE_URL is missing', async () => {
    vi.resetModules();
    vi.stubEnv('DATABASE_URL', '');
    const fresh = await import('../src/config/database.js');

    expect(() => fresh.getPool()).toThrowError(/DATABASE_URL/);
  });

  it('closeDatabase ends the singleton pool once, then no-ops', async () => {
    const end = vi.fn(async () => {});
    _setPoolForTests(fakePool({ end }));

    await closeDatabase();
    expect(end).toHaveBeenCalledTimes(1);
    await closeDatabase();
    expect(end).toHaveBeenCalledTimes(1);
  });
});
