import cors, { type CorsOptions } from 'cors';

/**
 * CORS policy (SNZ-053).
 *
 * Origins come from `CORS_ALLOWED_ORIGINS` (comma-separated, exact match —
 * never `*` in production). Requests without an `Origin` header
 * (same-origin navigation, curl, non-browser clients) pass through; unknown
 * origins get no `Access-Control-Allow-Origin` header, so browsers block
 * them. Only the methods and headers the API needs are exposed. Reads plain
 * env with an empty (deny-by-default) fallback so the app factory stays
 * constructible without a full environment.
 */
export function allowedOrigins(): string[] {
  const raw = process.env['CORS_ALLOWED_ORIGINS'] ?? '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
}

export function buildCorsOptions(): CorsOptions {
  const allowed = allowedOrigins();
  return {
    origin: (origin, callback) => {
      if (origin === undefined || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  };
}

export function corsMiddleware() {
  return cors(buildCorsOptions());
}
