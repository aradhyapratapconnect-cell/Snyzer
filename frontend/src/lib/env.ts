import { z } from 'zod';

/**
 * Frontend environment validation (SNZ-004).
 *
 * Only `VITE_`-prefixed public variables may appear here — backend secrets
 * (Supabase secret key, OpenRouter key, database URL) must never be
 * validated, imported, or referenced by client code. `getFrontendEnv()` is
 * lazy so importing this module never throws; the app entrypoint calls it
 * once at startup to fail fast.
 */
export const frontendEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY is required'),
});

export type FrontendEnv = z.infer<typeof frontendEnvSchema>;

/** Formats validation issues as `KEY: reason` lines (never includes values). */
export function formatFrontendEnvError(error: z.ZodError): string {
  const lines = error.issues.map(
    (issue) => ` - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  return `Missing or invalid frontend environment variables:\n${lines.join('\n')}`;
}

/**
 * Validates an `import.meta.env`-shaped object. Accepts an explicit source
 * so tests can use mock environments.
 */
export function loadFrontendEnv(source: Record<string, unknown> = import.meta.env): FrontendEnv {
  const result = frontendEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(formatFrontendEnvError(result.error));
  }
  return result.data;
}

let cached: FrontendEnv | undefined;

/** Validated frontend config, loaded once. Throws when the env is invalid. */
export function getFrontendEnv(): FrontendEnv {
  cached ??= loadFrontendEnv();
  return cached;
}
