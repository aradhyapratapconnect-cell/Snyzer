/**
 * Production build artifact verification (SNZ-059).
 *
 * Usage: `npm run verify:build` (after `npm run build`).
 *
 * Asserts the deployable surface is complete and clean:
 * - shared/backend compile outputs exist, including backend sourcemaps
 *   (production stack traces stay debuggable);
 * - no test files or test-framework imports leaked into backend `dist`
 *   (proof the production bundle needs zero devDependencies at runtime);
 * - the frontend bundle is chunk-split (no single giant entry) with hashed
 *   asset names for long-term caching.
 *
 * Exits non-zero listing every violation found.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function jsFiles(dir, collected = []) {
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
      await jsFiles(full, collected);
    } else if (entry.endsWith('.js')) {
      collected.push(full);
    }
  }
  return collected;
}

const backendDist = join(ROOT, 'backend', 'dist');
const frontendDist = join(ROOT, 'frontend', 'dist');
const sharedDist = join(ROOT, 'shared', 'dist');

// 1. Shared + backend entry points exist.
for (const file of ['index.js', 'server.js']) {
  if (!(await exists(join(backendDist, file)))) {
    fail(`backend/dist/${file} missing — run npm run build first.`);
  }
}
if (!(await exists(join(sharedDist, 'index.js')))) {
  fail('shared/dist/index.js missing — run npm run build first.');
}

// 2. Backend production sourcemaps ship alongside compiled output.
if (await exists(join(backendDist, 'server.js'))) {
  if (!(await exists(join(backendDist, 'server.js.map')))) {
    fail('backend/dist/server.js.map missing — sourcemaps must ship with production output.');
  }
}

// 3. No test files or test-framework imports in the backend production bundle.
const backendJs = await jsFiles(backendDist);
const leakedTests = backendJs.filter((file) => file.endsWith('.test.js'));
if (leakedTests.length > 0) {
  fail(`test files leaked into backend/dist: ${leakedTests.join(', ')}`);
}
for (const file of backendJs) {
  const content = await readFile(file, 'utf8');
  if (content.includes("from 'vitest'") || content.includes('from "vitest"')) {
    fail(`test-framework import leaked into production bundle: ${file}`);
  }
}
if (backendJs.length === 0) {
  fail('backend/dist contains no compiled JS — run npm run build first.');
}

// 4. Frontend dist: index.html plus a split, hashed asset set.
if (!(await exists(join(frontendDist, 'index.html')))) {
  fail('frontend/dist/index.html missing — run npm run build first.');
}
const assetDir = join(frontendDist, 'assets');
let assets = [];
try {
  assets = await readdir(assetDir);
} catch {
  fail('frontend/dist/assets missing — run npm run build first.');
}
const jsChunks = assets.filter((name) => name.endsWith('.js'));
if (assets.length > 0 && jsChunks.length < 2) {
  fail(
    `expected a chunk-split frontend bundle (>= 2 JS chunks), found: ${jsChunks.join(', ') || '(none)'}`,
  );
}
const unhashed = jsChunks.filter((name) => !/-[A-Za-z0-9_-]{6,}\.js$/.test(name));
if (unhashed.length > 0) {
  fail(`frontend chunks must carry content hashes for caching: ${unhashed.join(', ')}`);
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`[verify:build] FAIL ${message}`);
  }
  console.error(`[verify:build] ${failures.length} violation(s) found.`);
  process.exit(1);
} else {
  console.log(
    `[verify:build] OK backend(${backendJs.length} files, sourcemaps) frontend(${jsChunks.length} JS chunks)`,
  );
}
