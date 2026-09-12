import { describe, expect, it } from 'vitest';
import { loadBackendEnv } from '../src/config/env.js';

/**
 * SNZ-004 unit tests: backend env validation against mock environments.
 * The real `process.env` is never touched.
 */
const valid = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/snyzer',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SECRET_KEY: 'service-role-key',
  OPENROUTER_API_KEY: 'or-key',
};

describe('loadBackendEnv', () => {
  it('parses a valid environment with defaults and numeric coercion', () => {
    const env = loadBackendEnv({ ...valid, MAX_TEXT_LENGTH: '5000' });

    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.MAX_TEXT_LENGTH).toBe(5000);
    expect(env.RATE_LIMIT_WINDOW_SECONDS).toBe(60);
    expect(env.RATE_LIMIT_MAX_REQUESTS).toBe(30);
    expect(env.DAILY_JOB_LIMIT).toBe(50);
    expect(env.OPENROUTER_APP_NAME).toBe('Snyzer');
  });

  it('parses a custom DAILY_JOB_LIMIT', () => {
    expect(loadBackendEnv({ ...valid, DAILY_JOB_LIMIT: '25' }).DAILY_JOB_LIMIT).toBe(25);
  });

  it('throws naming OPENROUTER_API_KEY when it is omitted', () => {
    // `undefined` models an absent env var for parsing purposes.
    expect(() => loadBackendEnv({ ...valid, OPENROUTER_API_KEY: undefined })).toThrowError(
      /OPENROUTER_API_KEY/,
    );
  });

  it('throws naming DATABASE_URL when it is omitted', () => {
    expect(() => loadBackendEnv({ ...valid, DATABASE_URL: undefined })).toThrowError(
      /DATABASE_URL/,
    );
  });

  it('throws naming SUPABASE_SECRET_KEY when it is empty', () => {
    expect(() => loadBackendEnv({ ...valid, SUPABASE_SECRET_KEY: '' })).toThrowError(
      /SUPABASE_SECRET_KEY/,
    );
  });

  it('rejects a malformed SUPABASE_URL', () => {
    expect(() => loadBackendEnv({ ...valid, SUPABASE_URL: 'not-a-url' })).toThrowError(
      /SUPABASE_URL/,
    );
  });

  it('rejects a non-numeric MAX_TEXT_LENGTH', () => {
    expect(() => loadBackendEnv({ ...valid, MAX_TEXT_LENGTH: 'lots' })).toThrowError(
      /MAX_TEXT_LENGTH/,
    );
  });

  it('rejects an out-of-range PORT', () => {
    expect(() => loadBackendEnv({ ...valid, PORT: '99999' })).toThrowError(/PORT/);
  });

  it('never includes secret values in error messages', () => {
    const secret = 'super-secret-value-12345';
    let message = '';
    try {
      loadBackendEnv({ ...valid, SUPABASE_SECRET_KEY: secret, OPENROUTER_API_KEY: '' });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('OPENROUTER_API_KEY');
    expect(message).not.toContain(secret);
  });
});
