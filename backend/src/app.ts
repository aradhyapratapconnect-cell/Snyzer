import express, { type Express } from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiLimiter } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { corsMiddleware } from './security/cors.js';
import { securityHeaders } from './security/headers.js';
import { healthRouter } from './routes/health.js';
import { accountRouter } from './routes/account.js';
import { preferencesRouter } from './routes/preferences.js';
import { presetsRouter } from './routes/presets.js';
import { writingRouter } from './routes/writing.js';

/**
 * Backend Express application factory (SNZ-002; rate limiting SNZ-052;
 * headers + CORS SNZ-053).
 *
 * Returns a fresh app instance so integration tests can exercise routes via
 * supertest without binding a network port.
 */
export const JSON_BODY_LIMIT = '1mb';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Behind a single managed edge/proxy hop (Vercel, or any Node host fronted by
  // one), trust exactly that hop so `req.ip` is the real client address. IP is
  // only the fallback rate-limit key (user ID wins once authenticated), but an
  // untrusted proxy would collapse every caller onto the platform's address.
  // Local runs and supertest send no `X-Forwarded-For`, so nothing changes there.
  app.set('trust proxy', 1);
  app.use(securityHeaders());
  app.use(requestIdMiddleware);
  app.use(corsMiddleware());
  // 1mb comfortably fits large writing payloads (default max text is ~10k
  // chars); server-side text-length enforcement arrives in SNZ-004/SNZ-017.
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use('/api/v1', healthRouter);

  // General abuse guard on protected resources (health stays unthrottled
  // for monitoring). Endpoint-specific limiters live on their routes.
  const apiLimiter = createApiLimiter();
  app.use('/api/v1/writing', apiLimiter);
  app.use('/api/v1/preferences', apiLimiter);
  app.use('/api/v1/presets', apiLimiter);
  app.use('/api/v1/account', apiLimiter);

  app.use('/api/v1', writingRouter);
  app.use('/api/v1', preferencesRouter);
  app.use('/api/v1', presetsRouter);
  app.use('/api/v1', accountRouter);

  app.use(notFoundHandler);
  // Global error middleware must be registered last.
  app.use(errorHandler);

  return app;
}
