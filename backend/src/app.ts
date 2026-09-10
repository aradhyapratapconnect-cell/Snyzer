import express, { type Express } from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { healthRouter } from './routes/health.js';

/**
 * Backend Express application factory (SNZ-002).
 *
 * Returns a fresh app instance so integration tests can exercise routes via
 * supertest without binding a network port.
 */
export const JSON_BODY_LIMIT = '1mb';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(requestIdMiddleware);
  // 1mb comfortably fits large writing payloads (default max text is ~10k
  // chars); server-side text-length enforcement arrives in SNZ-004/SNZ-017.
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use('/api/v1', healthRouter);

  app.use(notFoundHandler);
  // Global error middleware must be registered last.
  app.use(errorHandler);

  return app;
}
