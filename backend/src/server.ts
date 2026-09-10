import { createApp } from './app.js';
import { getBackendEnv } from './config/env.js';

/**
 * Backend process entrypoint (SNZ-002; env validation SNZ-004).
 *
 * Configuration comes from the validated environment. Missing or invalid
 * variables throw here, crashing startup before the server binds a port.
 */

const env = getBackendEnv();
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[snyzer-backend] listening on port ${env.PORT} (env=${env.NODE_ENV})`);
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
