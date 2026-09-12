import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from './errorHandler.js';

/**
 * Request validation middleware factory (SNZ-017; SNZ-018 envelope).
 *
 * Validates `body`, `query`, and/or `params` against Zod schemas at the
 * network edge so malformed payloads never reach controllers. On success the
 * parsed value replaces the original — applying defaults and coercions while
 * stripping undeclared properties (Zod's default behavior). On failure an
 * `INVALID_INPUT` error is forwarded to the global error middleware, which
 * owns the response envelope; `details` carry only location/path/message
 * triples: no values, paths, or stack traces.
 */
export interface ValidationSchemas {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

interface ValidationIssue {
  location: 'body' | 'query' | 'params';
  path: string;
  message: string;
}

function toIssues(error: z.ZodError, location: ValidationIssue['location']): ValidationIssue[] {
  return error.issues.map((issue) => ({
    location,
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const details: ValidationIssue[] = [];

    if (schemas.body !== undefined) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        details.push(...toIssues(result.error, 'body'));
      } else {
        req.body = result.data;
      }
    }

    if (details.length === 0 && schemas.query !== undefined) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        details.push(...toIssues(result.error, 'query'));
      } else {
        // `req.query` is a getter-only accessor in Express 4 — shadow it on
        // the instance instead of assigning.
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    if (details.length === 0 && schemas.params !== undefined) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        details.push(...toIssues(result.error, 'params'));
      } else {
        req.params = result.data as Record<string, string>;
      }
    }

    if (details.length > 0) {
      next(new ValidationError('Validation error', details));
      return;
    }
    next();
  };
}
