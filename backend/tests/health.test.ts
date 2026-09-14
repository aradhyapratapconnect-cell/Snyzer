import type { Request, Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { REQUEST_ID_HEADER } from '../src/middleware/requestId.js';

/**
 * SNZ-002 integration tests: health probe, 404 envelope, payload limits,
 * and production error sanitization. The structured logger is mocked to keep
 * test output clean (redaction itself is covered in logger.test.ts).
 */
vi.mock('../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
}));

const app = createApp();

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok and an ISO timestamp', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  it('assigns a request ID echoed via response header', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);

    expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).toMatch(/.+/);
  });

  it('returns the standardized 404 envelope for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist').expect(404);

    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });
  });

  it('rejects malformed JSON with a 400 envelope', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"broken": json')
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_JSON');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('rejects oversized payloads with a 413 envelope', async () => {
    const oversized = 'x'.repeat(2 * 1024 * 1024);
    const res = await request(app).post('/api/v1/health').send({ data: oversized }).expect(413);

    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  }, 15000);
});

describe('errorHandler production sanitization', () => {
  interface MockResponse {
    statusCode: number;
    body: unknown;
    status(code: number): MockResponse;
    json(payload: unknown): MockResponse;
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

  function mockRequest(): Request {
    return { id: 'test-request-id', method: 'GET', path: '/api/v1/health' } as Request;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('hides internals and stack traces when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = mockResponse();
    const secretLeakingError = Object.assign(
      new Error('connect postgresql://user:secret-pw@db:5432/snyzer failed'),
      { status: 500 },
    );

    errorHandler(secretLeakingError, mockRequest(), res as unknown as Response, () => {});

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('secret-pw');
  });

  it('exposes the error message outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = mockResponse();

    errorHandler(
      Object.assign(new Error('boom'), { status: 500 }),
      mockRequest(),
      res as unknown as Response,
      () => {},
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'boom' } });
  });
});
