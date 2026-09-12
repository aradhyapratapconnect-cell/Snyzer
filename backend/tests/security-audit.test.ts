import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  checkBundleSecrets,
  checkErrorSanitization,
  checkProtectedRoutes,
  checkRlsEnabled,
} from '../src/security/audit.js';

/**
 * SNZ-056 tests: bundle secret scanning (temp dirs with planted secrets),
 * error sanitization, anonymous-route rejection via a stub requester, and
 * RLS-check skip behavior. The structured logger is mocked to keep output
 * clean. No live dependencies involved.
 */
vi.mock('../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn() },
}));
describe('checkBundleSecrets', () => {
  it('passes clean bundles and reports the scanned count', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'snyzer-audit-clean-'));
    try {
      await writeFile(join(dir, 'app.js'), 'console.log("hello");');
      await writeFile(join(dir, 'styles.css'), '.a{color:red}');
      await writeFile(join(dir, 'notes.txt'), 'SUPABASE_SECRET_KEY in a non-asset file');

      const finding = await checkBundleSecrets(dir, ['live-secret-value']);

      expect(finding.status).toBe('pass');
      expect(finding.detail).toContain('2 asset(s)');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('fails on key names and live values without echoing values', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'snyzer-audit-dirty-'));
    try {
      await writeFile(join(dir, 'bundle.js'), 'const k="SUPABASE_SECRET_KEY";');
      await writeFile(join(dir, 'chunk.js'), 'const live="live-secret-abc123";');

      const finding = await checkBundleSecrets(dir, ['live-secret-abc123']);

      expect(finding.status).toBe('fail');
      expect(finding.detail).toContain('SUPABASE_SECRET_KEY');
      expect(finding.detail).not.toContain('live-secret-abc123');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('skips when no built assets exist yet', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'snyzer-audit-empty-'));

    const finding = await checkBundleSecrets(join(dir, 'missing'));

    expect(finding.status).toBe('skip');
  });
});

describe('checkErrorSanitization', () => {
  it('confirms production errors hide internals', async () => {
    const finding = await checkErrorSanitization();

    expect(finding.status).toBe('pass');
  });
});

describe('checkProtectedRoutes', () => {
  it('passes when every protected route returns 401', async () => {
    const finding = await checkProtectedRoutes(async () => ({ status: 401, body: {} }));

    expect(finding.status).toBe('pass');
    expect(finding.detail).toContain('7 protected routes');
  });

  it('fails naming the leaking routes', async () => {
    const finding = await checkProtectedRoutes(async (_method, path) => ({
      status: path === '/api/v1/preferences' ? 200 : 401,
      body: {},
    }));

    expect(finding.status).toBe('fail');
    expect(finding.detail).toContain('GET /api/v1/preferences -> 200');
  });
});

describe('checkRlsEnabled', () => {
  it('skips without a database connection string', async () => {
    const finding = await checkRlsEnabled('');

    expect(finding.status).toBe('skip');
  });

  it('skips (rather than fails) on unreachable databases', async () => {
    const finding = await checkRlsEnabled('postgresql://user:pw@127.0.0.1:59999/snyzer');

    expect(finding.status).toBe('skip');
  });
});
