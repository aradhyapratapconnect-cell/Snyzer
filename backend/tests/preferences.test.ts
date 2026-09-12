import type { Pool } from 'pg';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { _setPoolForTests } from '../src/config/database.js';

/**
 * SNZ-031 integration tests: preferences GET auto-creation and PATCH
 * upserts with the real app, real auth middleware (mocked Supabase
 * verification), and a fake database pool. No network or live DB involved.
 */
const USER_ID = '22222222-2222-4222-8222-222222222222';

const getUserMock = vi.fn();
vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({ auth: { getUser: getUserMock } }),
}));

interface Statement {
  text: string;
  params?: unknown[];
}

const storedRow = {
  theme: 'dark',
  workspace_layout: 'input_first',
  editor_mode: 'rich',
  default_tone: 'casual',
};

const defaultRow = {
  theme: 'system',
  workspace_layout: 'side_by_side',
  editor_mode: 'plain',
  default_tone: 'professional',
};

function installFakeDb(initial: Record<string, string> | null) {
  let current = initial === null ? null : { ...initial };
  const statements: Statement[] = [];
  const pool = {
    query: vi.fn(async (text: string, params?: unknown[]) => {
      statements.push({ text, params });
      if (text.startsWith('SELECT')) {
        return { rows: current === null ? [] : [current] };
      }
      if (text.startsWith('INSERT INTO user_preferences')) {
        // Merge written columns over current-or-defaults, like the upsert.
        const merged: Record<string, string> = { ...(current ?? defaultRow) };
        const columns = text.match(/user_preferences \(([^)]+)\)/)?.[1]?.split(',') ?? [];
        const values = ((params ?? []) as unknown[]).slice(1) as string[];
        columns
          .map((column) => column.trim())
          .filter((column) => column !== 'user_id')
          .forEach((column, index) => {
            const value = values[index];
            if (value !== undefined) {
              merged[column] = value;
            }
          });
        current = merged;
        return { rows: [current] };
      }
      return { rows: [] };
    }),
    connect: vi.fn(async () => ({ query: vi.fn(), release: vi.fn() })),
  } as unknown as Pool;
  _setPoolForTests(pool);
  return { statements };
}

const app = createApp();

function authed(method: 'get' | 'patch', path: string) {
  return request(app)[method](path).set('Authorization', 'Bearer test-token');
}

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

describe('GET /api/v1/preferences', () => {
  it('returns the stored preferences in camelCase', async () => {
    installFakeDb(storedRow);

    const res = await authed('get', '/api/v1/preferences').expect(200);

    expect(res.body).toEqual({
      preferences: {
        theme: 'dark',
        workspaceLayout: 'input_first',
        editorMode: 'rich',
        defaultTone: 'casual',
      },
    });
  });

  it('auto-creates defaults for new users', async () => {
    const { statements } = installFakeDb(null);

    const res = await authed('get', '/api/v1/preferences').expect(200);

    expect(res.body).toEqual({
      preferences: {
        theme: 'system',
        workspaceLayout: 'side_by_side',
        editorMode: 'plain',
        defaultTone: 'professional',
      },
    });
    expect(statements.some((s) => s.text.includes('INSERT INTO user_preferences'))).toBe(true);
  });

  it('blocks unauthenticated reads', async () => {
    installFakeDb(storedRow);
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });

    await authed('get', '/api/v1/preferences').expect(401);
  });
});

describe('PATCH /api/v1/preferences', () => {
  it('upserts the supplied subset and returns the merged row', async () => {
    const { statements } = installFakeDb(storedRow);

    const res = await authed('patch', '/api/v1/preferences').send({ theme: 'light' }).expect(200);

    expect(res.body.preferences.theme).toBe('light');
    const upsert = statements.find((s) => s.text.includes('ON CONFLICT (user_id) DO UPDATE'));
    expect(upsert?.text).toContain('theme = $2');
    expect(upsert?.params).toEqual([USER_ID, 'light']);
  });

  it('rejects invalid enum values at the edge', async () => {
    installFakeDb(storedRow);

    const res = await authed('patch', '/api/v1/preferences').send({ theme: 'blue' }).expect(400);

    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('returns current preferences for an empty patch', async () => {
    installFakeDb(storedRow);

    const res = await authed('patch', '/api/v1/preferences').send({}).expect(200);

    expect(res.body.preferences.theme).toBe('dark');
  });
});
