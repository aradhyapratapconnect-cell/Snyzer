import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { ApiErrorEnvelope } from './errorHandler.js';

/**
 * Backend authentication middleware (SNZ-012).
 *
 * Verifies the Supabase JWT from the `Authorization: Bearer <token>` header
 * against Supabase Auth and attaches the verified identity to `req.user`.
 * Anything missing, malformed, expired, forged, or unverifiable yields the
 * same generic 401 — never a hint about which check failed, and never
 * internal details. Async errors are contained here so they cannot escape
 * as 500s with stack traces.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Verified identity, present only after `requireAuth` succeeds. */
      user?: AuthContext;
    }
  }
}

export interface AuthContext {
  id: string;
  email?: string;
  role: string;
}

const UNAUTHORIZED: ApiErrorEnvelope = {
  error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
};

/** Extracts the token from `Authorization: Bearer <token>` (scheme case-insensitive). */
export function extractBearerToken(header: string | undefined): string | null {
  if (header === undefined) {
    return null;
  }
  const match = header.match(/^\s*Bearer\s+(.+?)\s*$/i);
  const token = match?.[1]?.trim();
  if (token === undefined || token === '') {
    return null;
  }
  return token;
}

function roleFromClaims(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): string {
  const candidates = [user.app_metadata?.['role'], user.user_metadata?.['role']];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate !== '') {
      return candidate;
    }
  }
  return 'FREE_USER';
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req.header('Authorization'));
    if (token === null) {
      res.status(401).json(UNAUTHORIZED);
      return;
    }
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error !== null || data.user === null) {
      res.status(401).json(UNAUTHORIZED);
      return;
    }
    const authUser: AuthContext = { id: data.user.id, role: roleFromClaims(data.user) };
    if (data.user.email !== undefined) {
      authUser.email = data.user.email;
    }
    req.user = authUser;
    next();
  } catch {
    res.status(401).json(UNAUTHORIZED);
  }
}
