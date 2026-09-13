import type { Pool } from 'pg';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { _setPoolForTests } from '../src/config/database.js';

/**
 * SNZ-062 endpoint tests: preset list/create/delete through the real app and
 * auth middleware. Supabase verification and the database are mocked; no
 * network or live DB involved.
 */
const USER_ID = '22222222-2222-4222-8222-222222222222';
const PRESET_ID = '33333333-3333-4333-8333-333333333333';

const getUserMock = vi.fn();
vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({ auth: { getUser: getUserMock } }),
}));

interface Statement {
  text: string;
  params?: unknown[];
}

interface FakeDbOptions {
  count?: string;
  list?: unknown[];
  insert?: unknown;
  deleted?: unknown[];
}

function installFakeDb(options: FakeDbOptions = {}) {
  const statements: Statement[] = [];
  const runQuery = async (text: string, params?: unknown[]) => {
    statements.push({ text, params });
    if (text.includes('COUNT(*)')) {
      return { rows: [{ count: options.count ?? '0' }] };
    }
    if (text.startsWith('INSERT INTO user_presets')) {
      return {
        rows: [
          options.insert ?? {
            id: PRESET_ID,
            name: 'My Blog Tone',
            mode: 'natural',
            tone: 'casual',
            clarity: 70,
            sentence_variety: 60,
            created_at: '2026-09-13T00:00:00.000Z',
          },
        ],
      };
    }
    if (text.startsWith('SELECT id, name')) {
      return { rows: options.list ?? [] };
    }
    if (text.startsWith('DELETE FROM user_presets')) {
      return { rows: options.deleted ?? [{ id: PRESET_ID }] };
    }
    return { rows: [] };
  };
  const pool = {
    query: vi.fn(runQuery),
    connect: vi.fn(async () => ({ query: vi.fn(runQuery), release: vi.fn() })),
  } as unknown as Pool;
  _setPoolForTests(pool);
  return { statements };
}

const app = createApp();

beforeEach(() => {
  getUserMock.mockReset();
  getUserMock.mockResolvedValue({
    data: {
      user: { id: USER_ID, email: 'ada@example.com', app_metadata: {}, user_metadata: {} },
    },
    error: null,
  });
});

afterEach(() => {
  _setPoolForTests(undefined);
  vi.restoreAllMocks();
});

const auth = (req: request.Test) => req.set('Authorization', 'Bearer test-token');

describe('GET /api/v1/presets', () => {
  it('returns the owned presets newest-first in camelCase', async () => {
    installFakeDb({
      list: [
        {
          id: PRESET_ID,
          name: 'My Blog Tone',
          mode: 'natural',
          tone: 'casual',
          clarity: 70,
          sentence_variety: 60,
          created_at: '2026-09-13T00:00:00.000Z',
        },
      ],
    });

    const res = await auth(request(app).get('/api/v1/presets')).expect(200);

    expect(res.body).toEqual({
      presets: [
        {
          id: PRESET_ID,
          name: 'My Blog Tone',
          mode: 'natural',
          tone: 'casual',
          clarity: 70,
          sentenceVariety: 60,
          createdAt: '2026-09-13T00:00:00.000Z',
        },
      ],
    });
  });

  it('blocks unauthenticated reads', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: new Error('nope') });
    const { statements } = installFakeDb();

    await request(app).get('/api/v1/presets').expect(401);
    expect(statements).toHaveLength(0);
  });
});

describe('POST /api/v1/presets', () => {
  const validPreset = {
    name: 'My Blog Tone',
    mode: 'natural',
    tone: 'casual',
    clarity: 70,
    sentenceVariety: 60,
  };

  it('saves the snapshot and returns it with an id', async () => {
    const { statements } = installFakeDb({ count: '2' });

    const res = await auth(request(app).post('/api/v1/presets').send(validPreset)).expect(201);

    expect(res.body.preset).toMatchObject({ ...validPreset, id: PRESET_ID });
    const insert = statements.find((s) => s.text.startsWith('INSERT INTO user_presets'));
    expect(insert?.params?.[0]).toBe(USER_ID);
    expect(insert?.params?.slice(1)).toEqual(['My Blog Tone', 'natural', 'casual', 70, 60]);
  });

  it('refuses the sixth preset with a limit explanation', async () => {
    installFakeDb({ count: '5' });

    const res = await auth(request(app).post('/api/v1/presets').send(validPreset)).expect(400);

    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(res.body.error.message).toContain('5 presets');
  });

  it('rejects invalid control values before touching the database', async () => {
    const { statements } = installFakeDb();

    await auth(
      request(app)
        .post('/api/v1/presets')
        .send({ ...validPreset, clarity: 101 }),
    ).expect(400);
    expect(statements).toHaveLength(0);
  });
});

describe('DELETE /api/v1/presets/:id', () => {
  it('removes the owned preset and confirms', async () => {
    const { statements } = installFakeDb();

    const res = await auth(request(app).delete(`/api/v1/presets/${PRESET_ID}`)).expect(200);

    expect(res.body).toEqual({ deleted: true });
    const deleted = statements.find((s) => s.text.startsWith('DELETE FROM user_presets'));
    expect(deleted?.params).toEqual([PRESET_ID, USER_ID]);
  });

  it('returns 404 for missing or foreign-owned presets', async () => {
    installFakeDb({ deleted: [] });

    const res = await auth(request(app).delete(`/api/v1/presets/${PRESET_ID}`)).expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
