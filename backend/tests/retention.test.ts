import type { Pool, QueryResultRow } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { _setPoolForTests, type TransactionQuery } from '../src/config/database.js';
import {
  DEFAULT_RETENTION_FAILED_JOB_DAYS,
  purgeFailedJobs,
  purgeUserAccount,
  runRetentionCleanup,
} from '../src/services/privacy/dataRetentionService.js';

/**
 * SNZ-055 tests: retention purges and account purges. Query-level checks run
 * against a stub function; pool-level paths use a recording fake pool. No
 * live database involved.
 */
interface Statement {
  text: string;
  params?: unknown[];
}

function stubQuery(rows: QueryResultRow[] = []): TransactionQuery {
  return (async <T extends QueryResultRow>(): Promise<T[]> => rows as T[]) as TransactionQuery;
}

function installFakePool(rows: QueryResultRow[] = []) {
  const statements: Statement[] = [];
  const runQuery = async (text: string, params?: unknown[]) => {
    statements.push({ text, params });
    return { rows };
  };
  const pool = {
    query: vi.fn(runQuery),
    connect: vi.fn(async () => ({ query: vi.fn(runQuery), release: vi.fn() })),
  } as unknown as Pool;
  _setPoolForTests(pool);
  return { statements };
}

afterEach(() => {
  _setPoolForTests(undefined);
  vi.restoreAllMocks();
});

describe('purgeFailedJobs', () => {
  it('deletes only failed jobs past the retention window', async () => {
    const statements: Statement[] = [];
    const query = (async <T extends QueryResultRow>(
      text: string,
      params?: unknown[],
    ): Promise<T[]> => {
      statements.push({ text, params });
      return [{ id: 'old-failed' }, { id: 'older-failed' }] as unknown as T[];
    }) as TransactionQuery;

    const purged = await purgeFailedJobs(30, query);

    expect(purged).toBe(2);
    expect(statements).toHaveLength(1);
    expect(statements[0]?.text).toContain("status = 'failed'");
    expect(statements[0]?.text).toContain('created_at <');
    expect(statements[0]?.params).toEqual([30]);
  });

  it('reports zero when nothing is expired', async () => {
    await expect(purgeFailedJobs(30, stubQuery([]))).resolves.toBe(0);
  });

  it('defaults to a 30-day retention window', () => {
    expect(DEFAULT_RETENTION_FAILED_JOB_DAYS).toBe(30);
  });
});

describe('purgeUserAccount', () => {
  it('removes the profile and audits the purge without writing content', async () => {
    const { statements } = installFakePool();

    await purgeUserAccount('user-1');

    const texts = statements.map((s) => s.text);
    const profileDelete = statements.find((s) => s.text.includes('DELETE FROM profiles'));
    expect(profileDelete?.params).toEqual(['user-1']);
    const audit = statements.find((s) => s.text.includes('INSERT INTO audit_events'));
    expect(audit?.params?.[1]).toBe('user-1');
    expect(audit?.text).toContain("'ACCOUNT_DELETED'");
    expect(JSON.stringify(statements)).not.toContain('draft text');
    expect(texts[0]).toBe('BEGIN');
    expect(texts[texts.length - 1]).toBe('COMMIT');
  });
});

describe('runRetentionCleanup', () => {
  it('summarizes the retention run', async () => {
    installFakePool([{ id: 'a' }]);

    await expect(runRetentionCleanup(7)).resolves.toEqual({ purgedFailedJobs: 1 });
  });
});
