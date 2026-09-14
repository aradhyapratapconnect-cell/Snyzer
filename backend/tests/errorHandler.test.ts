import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AppError,
  asyncHandler,
  BadGatewayError,
  errorHandler,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  RateLimitError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from '../src/middleware/errorHandler.js';

/**
 * SNZ-018 unit tests (SNZ-019 logging): error class instantiation/mapping
 * plus middleware serialization (uniform envelope, production sanitization,
 * internal request-ID logging, async safety). The structured logger is
 * mocked; its redaction behavior is covered in logger.test.ts.
 */
const loggerMocks = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('../src/utils/logger.js', () => ({
  logger: {
    info: loggerMocks.info,
    warn: loggerMocks.warn,
    error: loggerMocks.error,
    debug: loggerMocks.debug,
    child: vi.fn(),
  },
}));
interface MockResponse {
  statusCode: number;
  body: unknown;
  status(code: number): MockResponse;
  json(payload: unknown): MockResponse;
}

function mockRequest(): Request {
  return { id: 'req-123', method: 'GET', path: '/api/v1/test' } as unknown as Request;
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

const noopNext: NextFunction = () => {};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('AppError hierarchy', () => {
  it('maps each subclass to its status, code, and default message', () => {
    const cases: Array<[AppError, number, string]> = [
      [new ValidationError(), 400, 'INVALID_INPUT'],
      [new UnauthorizedError(), 401, 'UNAUTHORIZED'],
      [new ForbiddenError(), 403, 'FORBIDDEN'],
      [new NotFoundError(), 404, 'NOT_FOUND'],
      [new PayloadTooLargeError(), 413, 'PAYLOAD_TOO_LARGE'],
      [new RateLimitError(), 429, 'RATE_LIMITED'],
      [new BadGatewayError(), 502, 'BAD_GATEWAY'],
      [new ServiceUnavailableError(), 503, 'SERVICE_UNAVAILABLE'],
    ];
    for (const [error, status, code] of cases) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
      expect(typeof error.message).toBe('string');
    }
  });

  it('carries custom messages and details', () => {
    const error = new ValidationError('Validation error', [{ path: 'inputText' }]);

    expect(error.message).toBe('Validation error');
    expect(error.details).toEqual([{ path: 'inputText' }]);
    expect(new RateLimitError().details).toBeUndefined();
  });
});

describe('errorHandler serialization', () => {
  it('serializes AppErrors to the uniform envelope including details', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = mockResponse();

    errorHandler(
      new ValidationError('Validation error', [{ location: 'body', path: 'x' }]),
      mockRequest(),
      res as unknown as Response,
      noopNext,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'INVALID_INPUT',
        message: 'Validation error',
        details: [{ location: 'body', path: 'x' }],
      },
    });
  });

  it('omits the details key when no details were provided', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = mockResponse();

    errorHandler(new NotFoundError(), mockRequest(), res as unknown as Response, noopNext);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
    });
  });

  it('hides 500 messages and stacks in production while logging request IDs', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = mockResponse();
    const boom = new Error('postgres://user:secret@localhost/db exploded');

    errorHandler(boom, mockRequest(), res as unknown as Response, noopNext);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('stack');
    expect(loggerMocks.error).toHaveBeenCalledTimes(1);
    expect(loggerMocks.error.mock.calls[0]?.[0]).toMatchObject({ requestId: 'req-123' });
  });

  it('passes non-operational status codes through with mapped codes', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const res = mockResponse();

    errorHandler(
      Object.assign(new Error('Too many attempts'), { status: 429 }),
      mockRequest(),
      res as unknown as Response,
      noopNext,
    );

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({
      error: { code: 'RATE_LIMITED', message: 'Too many attempts' },
    });
  });
});

describe('asyncHandler', () => {
  it('forwards async rejections to next() instead of hanging', async () => {
    const failure = new Error('async boom');
    const next = vi.fn();
    const wrapped = asyncHandler(async () => {
      throw failure;
    });

    wrapped(mockRequest(), mockResponse() as unknown as Response, next);
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(failure);
    });
  });

  it('lets successful handlers run without touching next()', async () => {
    const next = vi.fn();
    const res = mockResponse();
    const wrapped = asyncHandler(async (_req, resInner) => {
      (resInner as unknown as MockResponse).status(200).json({ ok: true });
    });

    wrapped(mockRequest(), res as unknown as Response, next);
    await vi.waitFor(() => {
      expect(res.statusCode).toBe(200);
    });
    expect(next).not.toHaveBeenCalled();
    expect(res.body).toEqual({ ok: true });
  });
});
