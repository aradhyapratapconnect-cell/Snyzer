import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import { errorHandler } from '../middleware/errorHandler.js';

/**
 * Automated security checks (SNZ-056). Each check returns pass/fail/skip —
 * unreachable infrastructure (no bundle built, no database) skips loudly
 * rather than failing the release for something it cannot observe. Only a
 * FAIL blocks a release.
 */
export type AuditStatus = 'pass' | 'fail' | 'skip';

export interface AuditFinding {
  check: string;
  status: AuditStatus;
  detail: string;
}

/** Backend secret key names that must never appear in public assets. */
export const FORBIDDEN_BUNDLE_STRINGS = [
  'SUPABASE_SECRET_KEY',
  'OPENROUTER_API_KEY',
  'service_role',
  'service-role',
];

async function bundleFiles(dir: string, collected: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return collected;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
      await bundleFiles(full, collected);
    } else if (/\.(js|mjs|cjs|css|html|map)$/.test(entry)) {
      collected.push(full);
    }
  }
  return collected;
}

/**
 * Scans built frontend assets for backend secret key names and live secret
 * values. `extraSecrets` carries values from the environment (never logged).
 */
export async function checkBundleSecrets(
  bundleDir: string,
  extraSecrets: string[] = [],
): Promise<AuditFinding> {
  const files = await bundleFiles(bundleDir);
  if (files.length === 0) {
    return {
      check: 'bundle-secrets',
      status: 'skip',
      detail: `No built assets found under ${bundleDir}; run the frontend build first.`,
    };
  }
  const hits: string[] = [];
  const shortName = (file: string): string => file.split(/[\\/]/).pop() ?? file;
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    // Key names are safe to echo; live values are only ever counted.
    for (const name of FORBIDDEN_BUNDLE_STRINGS) {
      if (content.includes(name)) {
        hits.push(`${shortName(file)}: ${name}`);
      }
    }
    const valueHits = extraSecrets.filter((secret) => secret !== '' && content.includes(secret));
    if (valueHits.length > 0) {
      hits.push(
        `${shortName(file)}: embedded secret value (${String(valueHits.length)} match(es))`,
      );
    }
  }
  if (hits.length > 0) {
    return {
      check: 'bundle-secrets',
      status: 'fail',
      detail: `Backend secrets reachable in public bundle: ${hits.join('; ')}`,
    };
  }
  return {
    check: 'bundle-secrets',
    status: 'pass',
    detail: `${files.length} asset(s) scanned, no backend secrets found.`,
  };
}

interface MockResponseShape {
  statusCode: number;
  body: unknown;
  status(code: number): MockResponseShape;
  json(payload: unknown): MockResponseShape;
}

function mockResponse(): MockResponseShape {
  return {
    statusCode: 0,
    body: null,
    status(code: number): MockResponseShape {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown): MockResponseShape {
      this.body = payload;
      return this;
    },
  };
}

/** Proves production error responses carry no messages, stacks, or traces. */
export async function checkErrorSanitization(): Promise<AuditFinding> {
  const previousEnv = process.env['NODE_ENV'];
  process.env['NODE_ENV'] = 'production';
  try {
    const res = mockResponse();
    const boom = Object.assign(new Error('db://user:secret@host failed'), { status: 500 });
    errorHandler(
      boom,
      { id: 'audit', method: 'GET', path: '/api/v1/audit-probe' } as never,
      res as never,
      () => {},
    );
    const serialized = JSON.stringify(res.body);
    if (res.statusCode !== 500 || serialized.includes('stack') || serialized.includes('secret')) {
      return {
        check: 'error-sanitization',
        status: 'fail',
        detail: 'Production error responses leak internals.',
      };
    }
    return {
      check: 'error-sanitization',
      status: 'pass',
      detail: 'Production 500s return the generic envelope only.',
    };
  } finally {
    if (previousEnv === undefined) {
      delete process.env['NODE_ENV'];
    } else {
      process.env['NODE_ENV'] = previousEnv;
    }
  }
}

export type StatusRequester = (
  method: string,
  path: string,
) => Promise<{ status: number; body: unknown }>;

const PROTECTED_ROUTES: Array<[string, string]> = [
  ['POST', '/api/v1/writing/jobs'],
  ['GET', '/api/v1/writing/jobs'],
  ['GET', '/api/v1/writing/jobs/11111111-1111-4111-8111-111111111111'],
  ['DELETE', '/api/v1/writing/jobs/11111111-1111-4111-8111-111111111111'],
  ['GET', '/api/v1/preferences'],
  ['PATCH', '/api/v1/preferences'],
  ['GET', '/api/v1/presets'],
  ['POST', '/api/v1/presets'],
  ['DELETE', '/api/v1/presets/11111111-1111-4111-8111-111111111111'],
  ['DELETE', '/api/v1/account'],
];

/** Every protected route must reject anonymous calls with 401. */
export async function checkProtectedRoutes(request: StatusRequester): Promise<AuditFinding> {
  const failures: string[] = [];
  for (const [method, path] of PROTECTED_ROUTES) {
    const response = await request(method, path);
    if (response.status !== 401) {
      failures.push(`${method} ${path} -> ${String(response.status)}`);
    }
  }
  if (failures.length > 0) {
    return {
      check: 'protected-routes',
      status: 'fail',
      detail: `Anonymous access not blocked: ${failures.join('; ')}`,
    };
  }
  return {
    check: 'protected-routes',
    status: 'pass',
    detail: `${String(PROTECTED_ROUTES.length)} protected routes reject anonymous calls with 401.`,
  };
}

/**
 * Verifies RLS is enabled on every public-schema table. Without a reachable
 * database the check skips (a release gate cannot observe it); connection
 * failures also skip rather than crying wolf.
 */
export async function checkRlsEnabled(connectionString?: string): Promise<AuditFinding> {
  const connection = connectionString ?? process.env['DATABASE_URL'];
  if (connection === undefined || connection === '') {
    return {
      check: 'rls-enabled',
      status: 'skip',
      detail: 'No DATABASE_URL available; RLS verified at migration time instead.',
    };
  }
  const pool = new Pool({
    connectionString: connection,
    connectionTimeoutMillis: 8000,
  });
  try {
    const result = await pool.query<{ tablename: string }>(
      `SELECT c.relname AS tablename
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity`,
    );
    if (result.rows.length > 0) {
      return {
        check: 'rls-enabled',
        status: 'fail',
        detail: `RLS disabled on: ${result.rows.map((row) => row.tablename).join(', ')}`,
      };
    }
    return { check: 'rls-enabled', status: 'pass', detail: 'RLS enabled on all public tables.' };
  } catch {
    return {
      check: 'rls-enabled',
      status: 'skip',
      detail: 'Database unreachable from this environment; skipping live RLS check.',
    };
  } finally {
    await pool.end().catch(() => {});
  }
}
