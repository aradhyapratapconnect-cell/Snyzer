import { createApp } from './app.js';
import { checkDatabaseConnection, closeDatabase, formatDatabaseError } from './config/database.js';
import { getBackendEnv } from './config/env.js';

/**
 * Backend process entrypoint (SNZ-002; env validation SNZ-004; database
 * lifecycle SNZ-005).
 *
 * Configuration comes from the validated environment. Missing or invalid
 * variables throw here, crashing startup before the server binds a port.
 * The database connection is attempted at startup: success is logged, and
 * failure is logged (sanitized) without preventing HTTP startup.
 */

const env = getBackendEnv();
const app = createApp();

checkDatabaseConnection()
  .then(({ latencyMs }) => {
    console.log(`[snyzer-backend] database connected (${latencyMs}ms)`);
  })
  .catch((error: unknown) => {
    console.error('[snyzer-backend] database connection failed', formatDatabaseError(error));
  });

const server = app.listen(env.PORT, () => {
  console.log(`[snyzer-backend] listening on port ${env.PORT} (env=${env.NODE_ENV})`);
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`[snyzer-backend] received ${signal}, closing HTTP server`);
  try {
    await closeDatabase();
  } catch (error: unknown) {
    console.error('[snyzer-backend] error closing database', formatDatabaseError(error));
  }
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
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
