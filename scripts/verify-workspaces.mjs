/**
 * Workspace integration check (SNZ-001 foundation, extended per ticket).
 *
 * Verifies:
 * - npm workspaces are declared at the root
 * - each workspace has package.json + tsconfig.json with strict mode
 * - root + workspace build/typecheck/lint scripts exist
 * - shared imports resolve in backend + frontend sources
 * - frontend entry, Tailwind config, and index.html exist (SNZ-003)
 * - build outputs exist (run `npm run build` first)
 * - .gitignore covers node_modules, dist/build outputs, and .env files
 *
 * Run: `npm test` (node scripts/verify-workspaces.mjs)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function check(label, condition, hint = '') {
  if (condition) {
    console.log(`ok - ${label}`);
  } else {
    console.error(`FAIL - ${label}${hint ? ` (${hint})` : ''}`);
    failures.push(label);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// 1. Root workspaces
const rootPkg = readJson(join(rootDir, 'package.json'));
check(
  'root declares npm workspaces for shared/backend/frontend',
  Array.isArray(rootPkg.workspaces) &&
    ['shared', 'backend', 'frontend'].every((w) => rootPkg.workspaces.includes(w)),
);
check('root has build script', typeof rootPkg.scripts?.build === 'string');
check('root has typecheck script', typeof rootPkg.scripts?.typecheck === 'string');
check('root has lint script', typeof rootPkg.scripts?.lint === 'string');

// 2. Workspaces
for (const workspace of ['shared', 'backend', 'frontend']) {
  const pkgPath = join(rootDir, workspace, 'package.json');
  const tsconfigPath = join(rootDir, workspace, 'tsconfig.json');
  check(`${workspace}/package.json exists`, existsSync(pkgPath));
  check(`${workspace}/tsconfig.json exists`, existsSync(tsconfigPath));
  if (existsSync(pkgPath)) {
    const pkg = readJson(pkgPath);
    check(`${workspace} has build script`, typeof pkg.scripts?.build === 'string');
    check(`${workspace} has typecheck script`, typeof pkg.scripts?.typecheck === 'string');
  }
  if (existsSync(tsconfigPath)) {
    const tsconfig = readJson(tsconfigPath);
    const baseStrict =
      tsconfig.compilerOptions?.strict === true ||
      readJson(join(rootDir, 'tsconfig.base.json')).compilerOptions?.strict === true;
    check(`${workspace} uses TypeScript strict mode`, baseStrict === true);
  }
}

// 3. Path aliases (@/ for frontend + backend)
for (const workspace of ['backend', 'frontend']) {
  const tsconfig = readJson(join(rootDir, workspace, 'tsconfig.json'));
  const paths = tsconfig.compilerOptions?.paths ?? {};
  check(`${workspace} defines @/* path alias`, typeof paths['@/*'] !== 'undefined');
}

// 4. Shared imports in frontend + backend sources
function dirContains(root, needle) {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
      if (dirContains(full, needle)) {
        return true;
      }
    } else if (stat.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry)) {
      if (readFileSync(full, 'utf8').includes(needle)) {
        return true;
      }
    }
  }
  return false;
}

const backendSrc = readFileSync(join(rootDir, 'backend', 'src', 'index.ts'), 'utf8');
check('backend imports @snyzer/shared', backendSrc.includes('@snyzer/shared'));
check(
  'frontend imports @snyzer/shared',
  dirContains(join(rootDir, 'frontend', 'src'), '@snyzer/shared'),
);

// 4b. Frontend entry + styling setup (SNZ-003)
check(
  'frontend entry src/main.tsx exists',
  existsSync(join(rootDir, 'frontend', 'src', 'main.tsx')),
);
check(
  'frontend tailwind config exists',
  existsSync(join(rootDir, 'frontend', 'tailwind.config.ts')),
);
check('frontend index.html exists', existsSync(join(rootDir, 'frontend', 'index.html')));

// 5. Build outputs (requires `npm run build` first)
check(
  'shared dist/index.js exists',
  existsSync(join(rootDir, 'shared', 'dist', 'index.js')),
  'run npm run build',
);
check(
  'shared dist/index.d.ts exists',
  existsSync(join(rootDir, 'shared', 'dist', 'index.d.ts')),
  'run npm run build',
);
check(
  'backend dist/index.js exists',
  existsSync(join(rootDir, 'backend', 'dist', 'index.js')),
  'run npm run build',
);
check(
  'frontend dist/index.html exists (vite build)',
  existsSync(join(rootDir, 'frontend', 'dist', 'index.html')),
  'run npm run build',
);

// 6. Runtime import of built shared package
try {
  const shared = await import('../shared/dist/index.js');
  check(
    'built @snyzer/shared exports SHARED_PACKAGE_VERSION',
    typeof shared.SHARED_PACKAGE_VERSION === 'string',
  );
  check(
    'built @snyzer/shared exports isNonEmptyString',
    typeof shared.isNonEmptyString === 'function',
  );
} catch (error) {
  check('built @snyzer/shared is importable', false, String(error));
}

// 7. .gitignore coverage
const gitignore = readFileSync(join(rootDir, '.gitignore'), 'utf8');
check('.gitignore covers node_modules', gitignore.includes('node_modules'));
check('.gitignore covers build outputs', gitignore.includes('dist'));
check('.gitignore covers .env files', gitignore.includes('.env'));

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll workspace checks passed.');
}
