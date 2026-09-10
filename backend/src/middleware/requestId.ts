import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Assigns a request ID to every incoming request (SNZ-002).
 *
 * The ID is echoed back via the `X-Request-ID` response header so clients and
 * server logs can correlate diagnostics. A caller-supplied ID is accepted;
 * otherwise a UUID is generated.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlation ID assigned by {@link requestIdMiddleware}. */
      id: string;
    }
  }
}

export const REQUEST_ID_HEADER = 'X-Request-ID';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const id = incoming !== undefined && incoming.trim() !== '' ? incoming : randomUUID();
  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
