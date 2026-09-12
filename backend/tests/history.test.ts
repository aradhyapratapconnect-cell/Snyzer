import type { Pool } from 'pg';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { _setPoolForTests } from '../src/config/database.js';

/**
 * SNZ-027 integration tests: `GET /api/v1/writing/jobs` with the real app,
 * real auth middleware (mocked Supabase verification), and a fake database
 * pool. Proves per-user filtering, pagination behavior, and the response
 * shape. True cross-user database isolation additionally requires a live
 * Supabase instance (RLS policies ship in SNZ-010 and are asserted there).
 */
const USER_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';

const getUserMock = vi.fn();
vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({ auth: { getUser: getUserMock } }),
}));

interface Statement {
  text: string;
  params?: unknown[];
}

const jobRows = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    input_preview: 'First draft',
    output_preview: 'First revision',
    mode: 'clarity',
    tone: 'professional',
    status: 'completed',
    created_at: '2026-09-10T10:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    input_preview: 'Second draft',
    output_preview: null,
    mode: 'formal',
    tone: 'direct',
    status: 'processing',
    created_at: '2026-09-09T10:00:00.000Z',
  },
];

function installFakeDb(rows: unknown[] = jobRows, total = '2') {
  const statements: Statement[] = [];
  const pool = {
    query: vi.fn(async (text: string, params?: unknown[]) => {
      statements.push({ text, params });
      if (text.includes('COUNT(*)')) {
        return { rows: [{ count: total }] };
      }
      return { rows };
    }),
    connect: vi.fn(async () => ({ query: vi.fn(), release: vi.fn() })),
  } as unknown as Pool;
  _setPoolForTests(pool);
  return { statements };
}

function verifyAs(userId: string) {
  getUserMock.mockResolvedValue({
    data: {
      user: { id: userId, email: 'ada@example.com', app_metadata: {}, user_metadata: {} },
    },
    error: null,
  });
}

const app = createApp();

function getJobs(query = '', token = 'Bearer test-token') {
  return request(app).get(`/api/v1/writing/jobs${query}`).set('Authorization', token);
}

beforeEach(() => {
  verifyAs(USER_ID);
});

afterEach(() => {
  _setPoolForTests(undefined);
  vi.restoreAllMocks();
});

describe('GET /api/v1/writing/jobs', () => {
  it('returns the owned jobs newest-first with previews and a total', async () => {
    installFakeDb();

    const res = await getJobs().expect(200);

    expect(res.body.total).toBe(2);
    expect(res.body.limit).toBe(20);
    expect(res.body.offset).toBe(0);
    expect(res.body.jobs).toHaveLength(2);
    expect(res.body.jobs[0]).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      input_preview: 'First draft',
      output_preview: 'First revision',
      mode: 'clarity',
      tone: 'professional',
      status: 'completed',
      created_at: '2026-09-10T10:00:00.000Z',
    });
    expect(res.body.jobs[0]).not.toHaveProperty('input_text');
    expect(res.body.jobs[0]).not.toHaveProperty('analysis');
  });

  it('filters strictly by the authenticated user in every query', async () => {
    const { statements } = installFakeDb();

    await getJobs().expect(200);

    const selects = statements.filter((s) => s.text.includes('FROM writing_jobs'));
    expect(selects.length).toBe(2);
    for (const select of selects) {
      expect(select.text).toContain('WHERE user_id = $1');
      expect(select.params?.[0]).toBe(USER_ID);
    }
  });

  it('binds a different user to their own rows, never another tenant', async () => {
    const { statements } = installFakeDb([], '0');
    verifyAs(OTHER_USER_ID);

    const res = await getJobs().expect(200);

    expect(res.body).toMatchObject({ jobs: [], total: 0 });
    for (const select of statements.filter((s) => s.text.includes('FROM writing_jobs'))) {
      expect(select.params?.[0]).toBe(OTHER_USER_ID);
      expect(select.params?.[0]).not.toBe(USER_ID);
    }
  });

  it('honors limit/offset and defaults them when absent', async () => {
    const { statements } = installFakeDb();

    await getJobs('?limit=5&offset=10').expect(200);

    const list = statements.find((s) => s.text.includes('ORDER BY created_at DESC'));
    expect(list?.params).toEqual([USER_ID, 5, 10]);

    statements.length = 0;
    await getJobs().expect(200);
    const defaulted = statements.find((s) => s.text.includes('ORDER BY created_at DESC'));
    expect(defaulted?.params).toEqual([USER_ID, 20, 0]);
  });

  it('rejects out-of-range pagination at the edge', async () => {
    installFakeDb();

    const tooMany = await getJobs('?limit=500').expect(400);
    expect(tooMany.body.error.code).toBe('INVALID_INPUT');
    expect(tooMany.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ location: 'query', path: 'limit' })]),
    );

    const badOffset = await getJobs('?offset=nope').expect(400);
    expect(badOffset.body.error.code).toBe('INVALID_INPUT');
  });

  it('orders newest-first for the composite history index', async () => {
    const { statements } = installFakeDb();

    await getJobs().expect(200);

    const list = statements.find((s) => s.text.includes('FROM writing_jobs'));
    expect(list?.text).toContain('ORDER BY created_at DESC');
  });

  it('blocks unauthenticated history reads', async () => {
    installFakeDb();
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });

    const res = await getJobs().expect(401);

    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  });
});
