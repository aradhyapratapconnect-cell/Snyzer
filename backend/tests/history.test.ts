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

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const UNKNOWN_JOB_ID = '55555555-5555-4555-8555-555555555555';

const fullJobRow = {
  id: JOB_ID,
  input_text: 'The complete original draft text, untruncated.',
  output_text: 'The complete revised text, untruncated.',
  mode: 'clarity',
  tone: 'professional',
  settings: { editorMode: 'plain', preferences: { clarity: 70 } },
  analysis: {
    readability: 72,
    clarity: 80,
    repetition: 12,
    sentenceVariety: 68,
    vocabularyComplexity: 55,
    formality: 61,
  },
  model: 'openai/gpt-4o-mini',
  input_tokens: 120,
  output_tokens: 60,
  total_tokens: 180,
  processing_ms: 1500,
  status: 'completed',
  error_code: null,
  created_at: '2026-09-10T10:00:00.000Z',
  completed_at: '2026-09-10T10:00:02.000Z',
};

/** Fake DB that enforces the ownership predicate like the real query does. */
function installDetailFakeDb() {
  const statements: Statement[] = [];
  const pool = {
    query: vi.fn(async (text: string, params?: unknown[]) => {
      statements.push({ text, params });
      if (text.includes('WHERE id = $1')) {
        const [id, userId] = params as [string, string];
        if (id === JOB_ID && userId === USER_ID) {
          return { rows: [fullJobRow] };
        }
        return { rows: [] };
      }
      return { rows: [] };
    }),
    connect: vi.fn(async () => ({ query: vi.fn(), release: vi.fn() })),
  } as unknown as Pool;
  _setPoolForTests(pool);
  return { statements };
}

describe('GET /api/v1/writing/jobs/:id', () => {
  it('returns the full owned job with untruncated text and metrics', async () => {
    installDetailFakeDb();

    const res = await request(app)
      .get(`/api/v1/writing/jobs/${JOB_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body.job).toMatchObject({
      id: JOB_ID,
      input_text: 'The complete original draft text, untruncated.',
      output_text: 'The complete revised text, untruncated.',
      status: 'completed',
      model: 'openai/gpt-4o-mini',
      input_tokens: 120,
    });
    expect(res.body.job.analysis).toMatchObject({ readability: 72, formality: 61 });
    expect(res.body.job.settings).toEqual({ editorMode: 'plain', preferences: { clarity: 70 } });
  });

  it('binds both id and owner in a single predicate', async () => {
    const { statements } = installDetailFakeDb();

    await request(app)
      .get(`/api/v1/writing/jobs/${JOB_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    const lookup = statements.find((s) => s.text.includes('WHERE id = $1'));
    expect(lookup?.text).toContain('AND user_id = $2');
    expect(lookup?.params).toEqual([JOB_ID, USER_ID]);
  });

  it('returns 404 (never 403) for foreign-owned and missing jobs alike', async () => {
    installDetailFakeDb();
    verifyAs(OTHER_USER_ID);

    const foreign = await request(app)
      .get(`/api/v1/writing/jobs/${JOB_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);
    expect(foreign.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });

    verifyAs(USER_ID);
    const missing = await request(app)
      .get(`/api/v1/writing/jobs/${UNKNOWN_JOB_ID}`)
      .set('Authorization', 'Bearer test-token')
      .expect(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects malformed UUIDs with 400 and no stack traces', async () => {
    installDetailFakeDb();

    const res = await request(app)
      .get('/api/v1/writing/jobs/not-a-uuid')
      .set('Authorization', 'Bearer test-token')
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ location: 'params', path: 'id' })]),
    );
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });
});
