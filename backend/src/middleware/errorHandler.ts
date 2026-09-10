import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal standardized error handling for SNZ-002.
 *
 * Every error response uses the Snyzer envelope from FRONTEND_SPECIFICATION
 * section 17: `{ "error": { "code", "message" } }`. Production 5xx responses
 * never leak stack traces or internal details; diagnostics stay in
 * server-side logs only.
 *
 * SNZ-018 will extend this file with the full `AppError` hierarchy.
 * SNZ-019 will replace `console.error` with the structured logger.
 */

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
  };
}

const GENERIC_SERVER_MESSAGE = 'An unexpected error occurred. Please try again later.';

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

/** Global error middleware. Must be registered last (four-argument signature). */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  // Body-parser failures carry `type` instead of `status`.
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const type = (err as { type: unknown }).type;
    if (type === 'entity.too.large') {
      const body: ApiErrorEnvelope = {
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds the supported size limit.',
        },
      };
      res.status(413).json(body);
      return;
    }
    if (type === 'entity.parse.failed') {
      const body: ApiErrorEnvelope = {
        error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' },
      };
      res.status(400).json(body);
      return;
    }
  }

  const status = resolveStatus(err);
  const isProduction = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    // Internal diagnostics only — never sent to the client.
    console.error(`[${req.id ?? 'unknown'}] ${req.method} ${req.path} failed`, err);
  }

  const rawMessage = err instanceof Error && err.message !== '' ? err.message : undefined;
  const message =
    status >= 500 && isProduction ? GENERIC_SERVER_MESSAGE : (rawMessage ?? GENERIC_SERVER_MESSAGE);
  const body: ApiErrorEnvelope = { error: { code: statusToCode(status), message } };
  res.status(status).json(body);
}
