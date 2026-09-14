import pino, { type LoggerOptions } from 'pino';

/**
 * Structured operational logger (SNZ-019).
 *
 * JSON lines to stdout with timestamp, level, message, and (via
 * `requestLogger`) request IDs. Key-based redaction guarantees user writing
 * (`inputText`/`outputText`), tokens, passwords, and credentials never reach
 * operational output — even nested inside objects or headers. Note the
 * redactor masks values of matching keys, not substrings inside free-text
 * messages: callers must still pass pre-sanitized strings (see
 * `formatDatabaseError`) when an error message itself could carry secrets.
 *
 * Level: `LOG_LEVEL` (debug/info/warn/error), defaulting to `debug` outside
 * production and `info` in production. Always JSON — including development —
 * to keep one code path and zero extra dependencies.
 */
const REDACT_PATHS = [
  'inputText',
  '*.inputText',
  'outputText',
  '*.outputText',
  'headers.authorization',
  '*.headers.authorization',
  'password',
  '*.password',
  'token',
  '*.token',
  'accessToken',
  '*.accessToken',
  'refreshToken',
  '*.refreshToken',
  'apiKey',
  '*.apiKey',
  'api_key',
  '*.api_key',
  'secret',
  '*.secret',
  'OPENROUTER_API_KEY',
  'SUPABASE_SECRET_KEY',
  'DATABASE_URL',
  'connectionString',
  '*.connectionString',
];

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

function resolveLevel(): (typeof LOG_LEVELS)[number] {
  const raw = process.env['LOG_LEVEL']?.toLowerCase();
  if (raw !== undefined && (LOG_LEVELS as readonly string[]).includes(raw)) {
    return raw as (typeof LOG_LEVELS)[number];
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/** Pure options builder so tests can attach the same config to a sink. */
export function buildLoggerOptions(): LoggerOptions {
  return {
    level: resolveLevel(),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
  };
}

export const logger = pino(buildLoggerOptions());

/** Request-scoped child carrying the correlation ID on every entry. */
export function requestLogger(requestId: string, base: pino.Logger = logger) {
  return base.child({ requestId });
}
