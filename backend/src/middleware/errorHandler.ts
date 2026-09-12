import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Standardized error handling (SNZ-002 foundation, SNZ-018 hierarchy).
 *
 * Every API error response uses the Snyzer envelope from FRONTEND_SPECIFICATION
 * section 17: `{ "error": { "code", "message", "details?" } }`. Controllers
 * and middleware signal failures with `AppError` subclasses and let this
 * serializer produce the envelope, so clients see one uniform shape.
 * Production 5xx responses never leak messages, stacks, or internals;
 * diagnostics (including request IDs) go to the structured logger only
 * (SNZ-019).
 */

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const GENERIC_SERVER_MESSAGE = 'An unexpected error occurred. Please try again later.';

/** Base class for operational (expected) failures with a fixed HTTP mapping. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(options: { status: number; code: string; message: string; details?: unknown }) {
    super(options.message);
    this.name = this.constructor.name;
    this.status = options.status;
    this.code = options.code;
    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details?: unknown) {
    super({ status: 400, code: 'INVALID_INPUT', message, details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super({ status: 401, code: 'UNAUTHORIZED', message });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied.') {
    super({ status: 403, code: 'FORBIDDEN', message });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super({ status: 404, code: 'NOT_FOUND', message });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Request payload is too large.') {
    super({ status: 413, code: 'PAYLOAD_TOO_LARGE', message });
  }
}

/** Contract-literal 413 for over-limit writing input (FRONTEND_SPEC §17). */
export class TextTooLongError extends AppError {
  constructor(message = 'Text exceeds supported maximum length.') {
    super({ status: 413, code: 'TEXT_TOO_LONG', message });
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please try again later.', details?: unknown) {
    super({ status: 429, code: 'RATE_LIMITED', message, details });
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Bad gateway.') {
    super({ status: 502, code: 'BAD_GATEWAY', message });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable. Please try again later.') {
    super({ status: 503, code: 'SERVICE_UNAVAILABLE', message });
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 413:
      return 'PAYLOAD_TOO_LARGE';
    case 429:
      return 'RATE_LIMITED';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
  }
}

function resolveStatus(err: unknown): number {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599) {
      return status;
    }
  }
  return 500;
}

/** Catches requests that match no route. Must be registered after all routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiErrorEnvelope = {
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  };
  res.status(404).json(body);
}

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ApiErrorEnvelope =
    details === undefined ? { error: { code, message } } : { error: { code, message, details } };
  res.status(status).json(body);
}

/** Structured server-side failure log: request ID, route, and full error. */
function logFailure(req: Request, err: unknown): void {
  logger.error(
    { requestId: req.id ?? 'unknown', method: req.method, path: req.path, err },
    'Request failed',
  );
}

/** Global error middleware. Must be registered last (four-argument signature). */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Body-parser failures carry `type` instead of `status`.
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const type = (err as { type: unknown }).type;
    if (type === 'entity.too.large') {
      sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the supported size limit.');
      return;
    }
    if (type === 'entity.parse.failed') {
      sendError(res, 400, 'INVALID_JSON', 'Request body is not valid JSON.');
      return;
    }
  }

  if (err instanceof AppError) {
    if (err.status >= 500) {
      // Internal diagnostics only — never sent to the client.
      logFailure(req, err);
    }
    const isProduction = process.env.NODE_ENV === 'production';
    const message = err.status >= 500 && isProduction ? GENERIC_SERVER_MESSAGE : err.message;
    sendError(res, err.status, err.code, message, err.details);
    return;
  }

  const status = resolveStatus(err);
  const isProduction = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    // Internal diagnostics only — never sent to the client.
    logFailure(req, err);
  }

  const rawMessage = err instanceof Error && err.message !== '' ? err.message : undefined;
  const message =
    status >= 500 && isProduction ? GENERIC_SERVER_MESSAGE : (rawMessage ?? GENERIC_SERVER_MESSAGE);
  sendError(res, status, statusToCode(status), message);
}

/**
 * Wraps async route handlers so rejected promises reach the global error
 * middleware instead of hanging the request or crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
}
