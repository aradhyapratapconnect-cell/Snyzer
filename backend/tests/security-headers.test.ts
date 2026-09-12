import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { allowedOrigins } from '../src/security/cors.js';

/**
 * SNZ-053 tests: security headers on every response, strict CORS whitelist
 * behavior, and preflight handling. No live dependencies involved.
 */
const ALLOWED = 'https://app.example.com';
const DENIED = 'https://evil.example.com';

function appWithOrigins(value: string | undefined) {
  if (value === undefined) {
    delete process.env['CORS_ALLOWED_ORIGINS'];
  } else {
    process.env['CORS_ALLOWED_ORIGINS'] = value;
  }
  return createApp();
}

afterEach(() => {
  delete process.env['CORS_ALLOWED_ORIGINS'];
  vi.restoreAllMocks();
});

describe('security headers', () => {
  it('emits hardening headers and hides the framework signature', async () => {
    const res = await request(appWithOrigins('')).get('/api/v1/health').expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['strict-transport-security']).toMatch(/max-age/);
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('CORS whitelist', () => {
  it('parses the configured origins strictly', () => {
    process.env['CORS_ALLOWED_ORIGINS'] = 'https://a.example.com, https://b.example.com ,,';

    expect(allowedOrigins()).toEqual(['https://a.example.com', 'https://b.example.com']);
  });

  it('echoes whitelisted origins and withholds unlisted ones', async () => {
    const app = appWithOrigins(ALLOWED);

    const allowed = await request(app).get('/api/v1/health').set('Origin', ALLOWED).expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED);

    const denied = await request(app).get('/api/v1/health').set('Origin', DENIED).expect(200);
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('never emits a wildcard origin and answers preflight narrowly', async () => {
    const app = appWithOrigins(`${ALLOWED},https://other.example.com`);

    const preflight = await request(app)
      .options('/api/v1/writing/jobs')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    const allowOrigin = preflight.headers['access-control-allow-origin'] as string | undefined;
    expect(allowOrigin).toBe(ALLOWED);
    expect(allowOrigin).not.toBe('*');
    expect(preflight.headers['access-control-allow-methods'] as string).toContain('POST');
  });

  it('denies cross-origin by default when unconfigured', async () => {
    const app = appWithOrigins(undefined);

    const res = await request(app).get('/api/v1/health').set('Origin', DENIED).expect(200);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
