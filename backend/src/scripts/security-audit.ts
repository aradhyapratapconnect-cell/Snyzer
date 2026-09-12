import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app.js';
import {
  checkBundleSecrets,
  checkErrorSanitization,
  checkProtectedRoutes,
  checkRlsEnabled,
  type AuditFinding,
} from '../security/audit.js';

/**
 * Security audit runner (SNZ-056; ticket path `backend/scripts/` maps to
 * this file under `src/scripts/` so it compiles, typechecks, and lints with
 * the rest of the backend).
 *
 * Usage: `npm run security:audit -w @snyzer/backend` (after `npm run build`
 * so `frontend/dist` exists). Exits 0 unless a check FAILS; skips never
 * block a release but are printed loudly.
 */
async function main(): Promise<void> {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const findings: AuditFinding[] = [];

  findings.push(
    await checkBundleSecrets(join(repoRoot, 'frontend', 'dist'), [
      process.env['SUPABASE_SECRET_KEY'] ?? '',
      process.env['OPENROUTER_API_KEY'] ?? '',
      process.env['DATABASE_URL'] ?? '',
    ]),
  );
  findings.push(await checkErrorSanitization());

  const app = createApp();
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => {
    server.on('listening', () => resolve());
  });
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;
  try {
    findings.push(
      await checkProtectedRoutes(async (method, path) => {
        const response = await fetch(`http://127.0.0.1:${String(port)}${path}`, { method });
        return { status: response.status, body: await response.json().catch(() => null) };
      }),
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => {
        if (error !== undefined) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  findings.push(await checkRlsEnabled());

  let failed = 0;
  for (const finding of findings) {
    const marker = finding.check.padEnd(22, ' ');
    console.log(`[${finding.status.toUpperCase()}] ${marker} ${finding.detail}`);
    if (finding.status === 'fail') {
      failed += 1;
    }
  }
  if (failed > 0) {
    console.error(`Security audit failed with ${String(failed)} failing check(s).`);
    process.exitCode = 1;
  } else {
    console.log('Security audit passed.');
  }
}

void main();
