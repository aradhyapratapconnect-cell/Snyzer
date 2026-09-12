import { z } from 'zod';
import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { WritingJobRequestSchema } from '@snyzer/shared';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { validate } from '../src/middleware/validate.js';

/**
 * SNZ-017 integration tests (SNZ-018 envelope): the validation middleware
 * against real Express routes and the real shared writing schema, with
 * failures serialized by the real global error middleware. Malformed
 * payloads must halt with 400 before the controller; valid ones arrive
 * parsed and stripped.
 */
const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

function testApp() {
  const app = express();
  app.use(express.json());
  app.post('/jobs', validate({ body: WritingJobRequestSchema }), (req: Request, res: Response) => {
    res.status(200).json({ received: req.body });
  });
  app.get('/jobs', validate({ query: paginationSchema }), (req: Request, res: Response) => {
    res.status(200).json({ received: req.query });
  });
  app.get(
    '/jobs/:id',
    validate({ params: z.object({ id: z.string().uuid() }) }),
    (req: Request, res: Response) => {
      res.status(200).json({ received: req.params });
    },
  );
  app.use(errorHandler);
  return app;
}

const app = testApp();

describe('validate({ body })', () => {
  const validBody = {
    inputText: 'Clear writing wins.',
    mode: 'clarity',
    tone: 'professional',
    editorMode: 'plain',
    preferences: { clarity: 70 },
  };

  it('passes valid payloads with defaults applied and unknown props stripped', async () => {
    const res = await request(app)
      .post('/jobs')
      .send({ ...validBody, injected: 'drop me', preferences: undefined })
      .expect(200);

    expect(res.body.received).toMatchObject({
      inputText: 'Clear writing wins.',
      mode: 'clarity',
      preferences: {},
    });
    expect(res.body.received).not.toHaveProperty('injected');
  });

  it('halts empty and whitespace-only input with a 400 envelope', async () => {
    for (const inputText of ['', '   ']) {
      const res = await request(app)
        .post('/jobs')
        .send({ ...validBody, inputText })
        .expect(400);

      expect(res.body.error.code).toBe('INVALID_INPUT');
      expect(res.body.error.message).toBe('Validation error');
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ location: 'body', path: 'inputText' })]),
      );
    }
  });

  it('halts oversize input and unknown enums without leaking values', async () => {
    const oversize = await request(app)
      .post('/jobs')
      .send({ ...validBody, inputText: 'x'.repeat(10_001) })
      .expect(400);
    expect(oversize.body.error.code).toBe('INVALID_INPUT');
    expect(JSON.stringify(oversize.body)).not.toContain('x'.repeat(100));

    const badEnum = await request(app)
      .post('/jobs')
      .send({ ...validBody, mode: 'nope' })
      .expect(400);
    expect(badEnum.body.error.details.some((d: { path: string }) => d.path === 'mode')).toBe(true);
  });

  it('halts missing bodies before the controller', async () => {
    const res = await request(app).post('/jobs').send({}).expect(400);

    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });
});

describe('validate({ query })', () => {
  it('coerces valid query params and applies defaults', async () => {
    const res = await request(app).get('/jobs?limit=5').expect(200);

    expect(res.body.received).toEqual({ limit: 5, offset: 0 });
  });

  it('halts out-of-range query params with location-tagged details', async () => {
    const res = await request(app).get('/jobs?limit=500').expect(400);

    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ location: 'query', path: 'limit' })]),
    );
  });
});

describe('validate({ params })', () => {
  it('passes valid UUID params', async () => {
    const res = await request(app).get('/jobs/11111111-1111-4111-8111-111111111111').expect(200);

    expect(res.body.received).toEqual({ id: '11111111-1111-4111-8111-111111111111' });
  });

  it('halts malformed UUID params', async () => {
    const res = await request(app).get('/jobs/not-a-uuid').expect(400);

    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ location: 'params', path: 'id' })]),
    );
  });
});
