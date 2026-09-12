import { ipKeyGenerator, rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';

/**
 * HTTP rate limiting (SNZ-052, express-rate-limit, in-memory store).
 *
 * Buckets key on the authenticated user ID with IP fallback, so one tenant
 * cannot consume another's budget. All rejections use the Snyzer 429
 * envelope plus a `Retry-After` hint. Limits are intentionally modest for
 * V1; a distributed store (Redis) replaces MemoryStore only if horizontal
 * scaling demands it.
 *
 * Tuning reads plain `process.env` with safe fallbacks rather than the
 * validated env object: these are non-secret knobs, and the limiter must
 * construct without crashing test harnesses that boot the app without a
 * full environment (server startup still enforces validated secrets).
 */
function tuningEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function rejectionBody(message: string): unknown {
  return {
    error: { code: 'RATE_LIMITED', message },
  };
}

function retryAfterSeconds(req: Request, fallbackSeconds: number): number {
  // express-rate-limit v8 does not expose `rateLimit` on the Express
  // Request type — read it structurally instead.
  const resetTime = (req as { rateLimit?: { resetTime?: unknown } }).rateLimit?.resetTime;
  if (!(resetTime instanceof Date)) {
    return fallbackSeconds;
  }
  return Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
}

/**
 * General API guard from configured env (`RATE_LIMIT_*`). Wired on
 * protected resource prefixes — never on `/health`, which monitoring must
 * always reach.
 */
export function createApiLimiter(): RateLimitRequestHandler {
  const windowSeconds = tuningEnv('RATE_LIMIT_WINDOW_SECONDS', 60);
  const maxRequests = tuningEnv('RATE_LIMIT_MAX_REQUESTS', 30);
  return rateLimit({
    windowMs: windowSeconds * 1000,
    limit: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? 'unknown'),
    handler: (req, res, _next, options) => {
      res.set('Retry-After', String(retryAfterSeconds(req, windowSeconds)));
      res
        .status(options.statusCode)
        .json(rejectionBody('Too many requests. Please slow down and try again.'));
    },
  });
}

/** Strict guard for the writing endpoint: 20 creations/minute per caller. */
export function createWritingJobsLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? 'unknown'),
    handler: (req, res, _next, options) => {
      res.set('Retry-After', String(retryAfterSeconds(req, 60)));
      res
        .status(options.statusCode)
        .json(rejectionBody('Too many writing requests. Please wait a minute and try again.'));
    },
  });
}

/**
 * Brute-force guard for credential endpoints (10/15min per IP). Supabase
 * owns our login today so nothing mounts this yet — it activates the moment
 * a backend credential route exists. Deliberately IP-keyed: it must run
 * before authentication, where no user ID exists.
 */
export function createAuthLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      res.set('Retry-After', '900');
      res
        .status(options.statusCode)
        .json(rejectionBody('Too many attempts. Please try again later.'));
    },
  });
}
