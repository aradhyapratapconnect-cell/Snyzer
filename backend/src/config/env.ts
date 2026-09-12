import { z } from 'zod';

/**
 * Backend environment validation (SNZ-004).
 *
 * Parses `process.env` with Zod and exports a typed config object. The
 * process must fail fast at startup when required secrets or settings are
 * missing — never boot with placeholder credentials. Secret *values* are
 * never included in error messages or logs.
 *
 * Variable list follows TECHNICAL_ARCHITECTURE section 8. No backend secret
 * may use a `VITE_` prefix (that would expose it to the client bundle).
 */

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().url().optional(),
);

export const backendEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required'),
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  OPENROUTER_SITE_URL: optionalUrl,
  OPENROUTER_APP_NAME: z.string().min(1).default('Snyzer'),
  MAX_TEXT_LENGTH: z.coerce.number().int().positive().default(10000),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
  DAILY_JOB_LIMIT: z.coerce.number().int().positive().default(50),
});

export type BackendEnv = z.infer<typeof backendEnvSchema>;

/** Formats validation issues as `KEY: reason` lines (never includes values). */
export function formatEnvError(error: z.ZodError): string {
  const lines = error.issues.map(
    (issue) => ` - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  return `Missing or invalid environment variables:\n${lines.join('\n')}`;
}

/**
 * Validates a `process.env`-shaped object. Accepts an explicit source so
 * tests can use mock environments without touching the real process env.
 * Throws on the first invalid configuration.
 */
export function loadBackendEnv(source: NodeJS.ProcessEnv = process.env): BackendEnv {
  const result = backendEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }
  return result.data;
}

let cached: BackendEnv | undefined;

/** Validated backend config, loaded once. Throws when the env is invalid. */
export function getBackendEnv(): BackendEnv {
  cached ??= loadBackendEnv();
  return cached;
}
