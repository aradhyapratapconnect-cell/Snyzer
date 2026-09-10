/**
 * Removes per-workspace `dist` output folders and stale `*.tsbuildinfo` files
 * (cross-platform, no extra deps).
 *
 * The `*.tsbuildinfo` removal matters: `shared` uses `"composite": true`, so
 * TypeScript writes `tsconfig.tsbuildinfo` next to its tsconfig. Deleting
 * `dist` without deleting the buildinfo leaves a stale up-to-date marker and
 * a later `tsc -p` may skip emit, breaking clean rebuilds.
 */
import { rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const workspace of ['shared', 'backend', 'frontend']) {
  const dist = join(rootDir, workspace, 'dist');
  await rm(dist, { recursive: true, force: true });
  console.log(`cleaned ${workspace}/dist`);
  const buildinfo = join(rootDir, workspace, 'tsconfig.tsbuildinfo');
  await rm(buildinfo, { force: true });
  console.log(`cleaned ${workspace}/tsconfig.tsbuildinfo`);
}
