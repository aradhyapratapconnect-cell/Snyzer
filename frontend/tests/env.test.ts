import { describe, expect, it } from 'vitest';
import { frontendEnvSchema, loadFrontendEnv } from '../src/lib/env.js';

/**
 * SNZ-004 unit tests: frontend env validation against mock environments.
 */
const valid = {
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
};

describe('loadFrontendEnv', () => {
  it('parses a valid public environment', () => {
    expect(loadFrontendEnv(valid)).toEqual(valid);
  });

  it('throws naming VITE_SUPABASE_URL when it is missing', () => {
    // `undefined` models an absent env var for parsing purposes.
    expect(() => loadFrontendEnv({ ...valid, VITE_SUPABASE_URL: undefined })).toThrowError(
      /VITE_SUPABASE_URL/,
    );
  });

  it('throws naming VITE_SUPABASE_PUBLISHABLE_KEY when it is empty', () => {
    expect(() => loadFrontendEnv({ ...valid, VITE_SUPABASE_PUBLISHABLE_KEY: '' })).toThrowError(
      /VITE_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it('rejects a malformed VITE_SUPABASE_URL', () => {
    expect(() => loadFrontendEnv({ ...valid, VITE_SUPABASE_URL: 'not-a-url' })).toThrowError(
      /VITE_SUPABASE_URL/,
    );
  });

  it('validates only public keys — backend secrets are never part of the schema', () => {
    expect(Object.keys(frontendEnvSchema.shape).sort()).toEqual([
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_SUPABASE_URL',
    ]);

    const parsed = loadFrontendEnv({
      ...valid,
      SUPABASE_SECRET_KEY: 'must-be-stripped',
      OPENROUTER_API_KEY: 'must-be-stripped',
    });
    expect(parsed).toEqual(valid);
    expect('SUPABASE_SECRET_KEY' in parsed).toBe(false);
    expect('OPENROUTER_API_KEY' in parsed).toBe(false);
  });
});
