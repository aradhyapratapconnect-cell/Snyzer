import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthContext } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import {
  createApiLimiter,
  createAuthLimiter,
  createWritingJobsLimiter,
} from '../src/middleware/rateLimiter.js';

/**
 * SNZ-052 tests: burst traffic against the limiters proves 429 blocking
 * with the standardized envelope and Retry-After guidance, plus per-user
 * bucket isolation. No live dependencies involved.
 */
function userStub(req: Request, _res: Response, next: NextFunction): void {
  const id = req.header('x-test-user');
  if (id !== undefined) {
    (req as Request & { user?: AuthContext }).user = { id, role: 'FREE_USER' };
  }
  next();
}

function burstApp(limiterFactory: () => express.RequestHandler) {
  const app = express();
  app.use(express.json());
  app.use(userStub);
  app.post('/limited', limiterFactory(), (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createApiLimiter', () => {
  it('blocks bursts with the standardized 429 envelope and Retry-After', async () => {
    vi.stubEnv('RATE_LIMIT_WINDOW_SECONDS', '60');
    vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', '2');
    const app = burstApp(createApiLimiter);

    await request(app).post('/limited').expect(200);
    await request(app).post('/limited').expect(200);
    const blocked = await request(app).post('/limited').expect(429);

    expect(blocked.body).toEqual({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down and try again.',
      },
    });
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('isolates buckets per authenticated user', async () => {
    vi.stubEnv('RATE_LIMIT_WINDOW_SECONDS', '60');
    vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', '2');
    const app = burstApp(createApiLimiter);
    const as = (user: string) => request(app).post('/limited').set('x-test-user', user);

    await as('user-a').expect(200);
    await as('user-a').expect(200);
    await as('user-a').expect(429);
    // A different tenant still has a full budget.
    await as('user-b').expect(200);
  });
});

describe('createWritingJobsLimiter', () => {
  it('allows 20 creations per minute, then blocks with guidance', async () => {
    const app = burstApp(createWritingJobsLimiter);

    for (let i = 0; i < 20; i += 1) {
      await request(app).post('/limited').expect(200);
    }
    const blocked = await request(app).post('/limited').expect(429);

    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.body.error.message).toContain('wait a minute');
    expect(blocked.headers['retry-after']).toBeDefined();
  }, 30000);
});

describe('createAuthLimiter', () => {
  it('permits 10 attempts per 15 minutes per IP, then blocks', async () => {
    const app = burstApp(createAuthLimiter);

    for (let i = 0; i < 10; i += 1) {
      await request(app).post('/limited').expect(200);
    }
    const blocked = await request(app).post('/limited').expect(429);

    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  }, 30000);
});
