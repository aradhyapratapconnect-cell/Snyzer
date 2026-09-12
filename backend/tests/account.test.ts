import type { Pool } from 'pg';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { _setPoolForTests } from '../src/config/database.js';

/**
 * SNZ-034 backend tests: `DELETE /api/v1/account` purges auth + profile
 * data through the real app and auth middleware. Supabase admin and the
 * database are mocked; no network or live DB involved.
 */
const USER_ID = '22222222-2222-4222-8222-222222222222';

const getUserMock = vi.fn();
const adminDeleteUserMock = vi.fn();
vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({
    auth: { getUser: getUserMock, admin: { deleteUser: adminDeleteUserMock } },
  }),
}));

interface Statement {
  text: string;
  params?: unknown[];
}

function installFakeDb() {
  const statements: Statement[] = [];
  const runQuery = async (text: string, params?: unknown[]) => {
    statements.push({ text, params });
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
  adminDeleteUserMock.mockReset();
  adminDeleteUserMock.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
});

afterEach(() => {
  _setPoolForTests(undefined);
  vi.restoreAllMocks();
});

describe('DELETE /api/v1/account', () => {
  it('removes the auth user then the profile row, and confirms', async () => {
    const { statements } = installFakeDb();
    const order: string[] = [];
    adminDeleteUserMock.mockImplementation(async () => {
      order.push('auth');
      return { data: { user: { id: USER_ID } }, error: null };
    });

    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(res.body).toEqual({ deleted: true });
    expect(adminDeleteUserMock).toHaveBeenCalledWith(USER_ID);
    const profileDelete = statements.find((s) => s.text.includes('DELETE FROM profiles'));
    expect(profileDelete?.params).toEqual([USER_ID]);
    expect(order).toEqual(['auth']);
  });

  it('blocks unauthenticated deletion without touching data', async () => {
    const { statements } = installFakeDb();
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });

    await request(app).delete('/api/v1/account').set('Authorization', 'Bearer bad').expect(401);

    expect(adminDeleteUserMock).not.toHaveBeenCalled();
    expect(statements).toHaveLength(0);
  });

  it('fails safely when auth-user removal fails, deleting nothing locally', async () => {
    const { statements } = installFakeDb();
    adminDeleteUserMock.mockResolvedValue({ data: {}, error: { message: 'admin outage' } });

    const res = await request(app)
      .delete('/api/v1/account')
      .set('Authorization', 'Bearer test-token')
      .expect(503);

    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(statements.some((s) => s.text.includes('DELETE FROM profiles'))).toBe(false);
  });
});
