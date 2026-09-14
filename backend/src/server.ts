import { createApp } from './app.js';
import { checkDatabaseConnection, closeDatabase, formatDatabaseError } from './config/database.js';
import { getBackendEnv } from './config/env.js';
import { logger } from './utils/logger.js';

/**
 * Backend process entrypoint (SNZ-002; env validation SNZ-004; database
 * lifecycle SNZ-005; structured logging SNZ-019).
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
    logger.info({ latencyMs }, 'Database connected');
  })
  .catch((error: unknown) => {
    logger.error({ error: formatDatabaseError(error) }, 'Database connection failed');
  });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Backend listening');
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info({ signal }, 'Closing HTTP server');
  try {
    await closeDatabase();
  } catch (error: unknown) {
    logger.error({ error: formatDatabaseError(error) }, 'Error closing database');
  }
  server.close((err) => {
    if (err !== undefined) {
      logger.error({ err }, 'Error during shutdown');
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
