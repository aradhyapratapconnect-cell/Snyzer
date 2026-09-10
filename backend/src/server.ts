import { createApp } from './app.js';

/**
 * Backend process entrypoint (SNZ-002).
 *
 * Binds `PORT` (default 5000). Typed environment validation arrives in
 * SNZ-004; until then, invalid values fall back to the default.
 */

const DEFAULT_PORT = 5000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

function resolvePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_PORT;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < MIN_PORT || parsed > MAX_PORT) {
    return DEFAULT_PORT;
  }
  return parsed;
}

const port = resolvePort(process.env.PORT);
const app = createApp();

const server = app.listen(port, () => {
  console.log(
    `[snyzer-backend] listening on port ${port} (env=${process.env.NODE_ENV ?? 'development'})`,
  );
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`[snyzer-backend] received ${signal}, closing HTTP server`);
  server.close((err) => {
    if (err !== undefined) {
      console.error('[snyzer-backend] error during shutdown', err);
      process.exitCode = 1;
      return;
    }
    process.exitCode = 0;
  });
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});
