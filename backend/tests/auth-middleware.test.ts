import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractBearerToken, requireAuth } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

/**
 * SNZ-012 unit tests (SNZ-018 envelope): `requireAuth` against a mocked
 * Supabase admin client, with forwarded errors serialized by the real global
 * error middleware. Covers valid, expired, forged, malformed, and missing
 * credentials plus verification-service failures. No network involved.
 */
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({ auth: { getUser: mocks.getUser } }),
}));

interface MockResponse {
  statusCode: number;
  body: unknown;
  status(code: number): MockResponse;
  json(payload: unknown): MockResponse;
}

function mockRequest(authorization?: string): Request {
  return {
    id: 'test-request-id',
    header: (name: string) => (name.toLowerCase() === 'authorization' ? authorization : undefined),
  } as unknown as Request;
}

function mockResponse(): MockResponse {
  return {
    statusCode: 0,
    body: null,
    status(code: number): MockResponse {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown): MockResponse {
      this.body = payload;
      return this;
    },
  };
}

/**
 * Runs `requireAuth` the way Express does: forwarded errors go through the
 * real global error middleware. Returns whether `next()` was reached
 * without an error (i.e. authentication succeeded).
 */
async function runRequireAuth(req: Request, res: MockResponse): Promise<boolean> {
  let succeeded = false;
  const next: NextFunction = (err?: unknown) => {
    if (err !== undefined) {
      errorHandler(err, req, res as unknown as Response, () => {});
    } else {
      succeeded = true;
    }
  };
  await requireAuth(req, res as unknown as Response, next);
  return succeeded;
}

function verifiedUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'ada@example.com',
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractBearerToken', () => {
  it.each([
    ['Bearer abc.def.ghi', 'abc.def.ghi'],
    ['bearer abc.def.ghi', 'abc.def.ghi'],
    ['BEARER abc.def.ghi', 'abc.def.ghi'],
    ['  Bearer abc.def.ghi  ', 'abc.def.ghi'],
  ])('accepts %j', (header, expected) => {
    expect(extractBearerToken(header)).toBe(expected);
  });

  it.each([[undefined], [''], ['Bearer'], ['Bearer   '], ['Token abc'], ['Basic dXNlcg==']])(
    'rejects %j',
    (header) => {
      expect(extractBearerToken(header as string | undefined)).toBeNull();
    },
  );
});

describe('requireAuth', () => {
  it('attaches req.user and calls next() for a valid token', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: verifiedUser() }, error: null });
    const req = mockRequest('Bearer valid.token.here');
    const res = mockResponse();

    const succeeded = await runRequireAuth(req, res);

    expect(mocks.getUser).toHaveBeenCalledWith('valid.token.here');
    expect(req.user).toEqual({ id: 'user-1', email: 'ada@example.com', role: 'FREE_USER' });
    expect(succeeded).toBe(true);
    expect(res.statusCode).toBe(0);
  });

  it('honors a role claim carried by the verified token', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: verifiedUser({ app_metadata: { role: 'ADMIN' } }) },
      error: null,
    });
    const req = mockRequest('Bearer valid.token.here');

    await runRequireAuth(req, mockResponse());

    expect(req.user?.role).toBe('ADMIN');
  });

  it('returns 401 without calling next() when the header is missing', async () => {
    const res = mockResponse();

    const succeeded = await runRequireAuth(mockRequest(undefined), res);

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(succeeded).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  });

  it('returns 401 for malformed authorization headers', async () => {
    for (const header of ['Token abc', 'Bearer', '']) {
      const res = mockResponse();
      const succeeded = await runRequireAuth(mockRequest(header), res);
      expect(succeeded).toBe(false);
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('returns 401 for expired or forged tokens rejected by Supabase', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid JWT: unable to parse or verify signature' },
    });
    const req = mockRequest('Bearer forged.token.here');
    const res = mockResponse();

    await runRequireAuth(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    expect(req.user).toBeUndefined();
  });

  it('returns generic 401 (never internals) when verification itself fails', async () => {
    mocks.getUser.mockRejectedValue(new Error('fetch failed to https://example.supabase.co'));
    const res = mockResponse();

    const succeeded = await runRequireAuth(mockRequest('Bearer valid.token.here'), res);

    expect(succeeded).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain('supabase.co');
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
  });
});
