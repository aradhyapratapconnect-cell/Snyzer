import type { Pool } from 'pg';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WritingJobResponseSchema } from '@snyzer/shared';
import { createApp } from '../src/app.js';
import { _setPoolForTests } from '../src/config/database.js';
import { MockAIProvider } from '../src/services/ai/mockProvider.js';
import { executeWritingJob } from '../src/services/writing/writingService.js';

/**
 * SNZ-026 integration tests: `POST /api/v1/writing/jobs` end to end with the
 * real app, real auth middleware (mocked Supabase verification), mocked AI
 * HTTP, and a fake database pool. No network or live database involved.
 */
const USER_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '11111111-1111-4111-8111-111111111111';

const getUserMock = vi.fn();
vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseAdmin: () => ({ auth: { getUser: getUserMock } }),
}));

const fetchMock = vi.fn();

interface Statement {
  text: string;
  params?: unknown[];
}

function makeFakePool(statements: Statement[]) {
  const client = {
    query: vi.fn(async (text: string, params?: unknown[]) => {
      statements.push({ text, params });
      return { rows: [] };
    }),
    release: vi.fn(),
  };
  const pool = {
    query: vi.fn(async (text: string, params?: unknown[]) => {
      statements.push({ text, params });
      if (text.includes('INSERT INTO writing_jobs')) {
        return { rows: [{ id: JOB_ID }] };
      }
      return { rows: [] };
    }),
    connect: vi.fn(async () => client),
  } as unknown as Pool;
  return { pool, client };
}

function installFakeDb() {
  const statements: Statement[] = [];
  const { pool, client } = makeFakePool(statements);
  _setPoolForTests(pool);
  return { statements, client };
}

/**
 * Fresh module registry + app for tests needing different env: `getBackendEnv`
 * caches per module instance, so per-test env variations require re-imports.
 * Mocks (fetch, Supabase) and global stubs persist across the reset.
 */
async function installIsolatedApp() {
  vi.resetModules();
  const db = await import('../src/config/database.js');
  const statements: Statement[] = [];
  const { pool } = makeFakePool(statements);
  db._setPoolForTests(pool);
  const { createApp: freshCreateApp } = await import('../src/app.js');
  return { app: freshCreateApp(), statements };
}

function aiSuccessPayload() {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            revisedText: 'Clear writing triumphs.',
            analysis: {
              readability: 72,
              clarity: 80,
              repetition: 12,
              sentenceVariety: 68,
              vocabularyComplexity: 55,
              formality: 61,
            },
          }),
        },
      },
    ],
    usage: { prompt_tokens: 120, completion_tokens: 60, total_tokens: 180 },
  };
}

function okResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const validBody = {
  inputText: 'Clear writing wins.',
  mode: 'clarity',
  tone: 'professional',
  editorMode: 'plain',
  preferences: { clarity: 70 },
};

const app = createApp();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(okResponse(aiSuccessPayload()));
  getUserMock.mockReset();
  getUserMock.mockResolvedValue({
    data: {
      user: { id: USER_ID, email: 'ada@example.com', app_metadata: {}, user_metadata: {} },
    },
    error: null,
  });
  vi.stubEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/snyzer');
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'service-role-key');
  vi.stubEnv('OPENROUTER_API_KEY', 'or-key');
});

afterEach(() => {
  _setPoolForTests(undefined);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function postJob(body: Record<string, unknown>) {
  return request(app)
    .post('/api/v1/writing/jobs')
    .set('Authorization', 'Bearer test-token')
    .send(body);
}

describe('POST /api/v1/writing/jobs', () => {
  it('completes the lifecycle and returns the contract envelope', async () => {
    const { statements } = installFakeDb();
    const started = Date.now();

    const res = await postJob(validBody).expect(201);

    expect(Date.now() - started).toBeLessThan(5000);
    expect(() => WritingJobResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.job).toMatchObject({
      id: JOB_ID,
      status: 'completed',
      outputText: 'Clear writing triumphs.',
    });

    const texts = statements.map((s) => s.text);
    expect(texts.some((t) => t.includes('INSERT INTO writing_jobs'))).toBe(true);
    const insert = statements.find((s) => s.text.includes('INSERT INTO writing_jobs'));
    expect(insert?.params?.[0]).toBe(USER_ID);
    expect(insert?.params?.[1]).toBe('Clear writing wins.');
    expect(JSON.parse(insert?.params?.[4] as string)).toEqual({
      editorMode: 'plain',
      preferences: { clarity: 70 },
    });

    const updateIndex = texts.findIndex((t) => t.includes("status = 'completed'"));
    const usageIndex = texts.findIndex((t) => t.includes('INSERT INTO usage_events'));
    const beginIndex = texts.findIndex((t) => t === 'BEGIN');
    const commitIndex = texts.findIndex((t) => t === 'COMMIT');
    expect(updateIndex).toBeGreaterThan(-1);
    expect(usageIndex).toBeGreaterThan(updateIndex);
    expect(beginIndex).toBeLessThan(updateIndex);
    expect(commitIndex).toBeGreaterThan(usageIndex);

    const usage = statements[usageIndex];
    expect(usage?.params).toEqual([
      USER_ID,
      JOB_ID,
      'openrouter',
      'openai/gpt-4o-mini',
      120,
      60,
      180,
    ]);
  });

  it('rejects over-limit text with 413 before calling the provider', async () => {
    vi.stubEnv('MAX_TEXT_LENGTH', '10');
    const { app: isolatedApp } = await installIsolatedApp();

    const res = await request(isolatedApp)
      .post('/api/v1/writing/jobs')
      .set('Authorization', 'Bearer test-token')
      .send({ ...validBody, inputText: 'x'.repeat(50) })
      .expect(413);

    expect(res.body).toEqual({
      error: { code: 'TEXT_TOO_LONG', message: 'Text exceeds supported maximum length.' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('halts invalid payloads with 400 before the controller', async () => {
    installFakeDb();

    const res = await postJob({ ...validBody, inputText: '   ' }).expect(400);

    expect(res.body.error.code).toBe('INVALID_INPUT');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks unauthenticated requests with the real auth middleware', async () => {
    installFakeDb();
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid JWT' },
    });

    const res = await postJob(validBody).expect(401);

    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks the job failed, logs usage, and surfaces provider outages', async () => {
    const { statements } = installFakeDb();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response('unavailable', { status: 503 }));

    const res = await postJob(validBody).expect(503);

    expect(res.body.error.code).toBe('AI_PROVIDER_UNAVAILABLE');
    const texts = statements.map((s) => s.text);
    expect(texts.some((t) => t.includes("status = 'failed'"))).toBe(true);
    const failedUpdate = statements.find((s) => s.text.includes("status = 'failed'"));
    expect(failedUpdate?.params?.[0]).toBe('AI_PROVIDER_UNAVAILABLE');
    expect(texts.some((t) => t.includes('INSERT INTO usage_events'))).toBe(true);
  }, 15000);
});

describe('executeWritingJob with MockAIProvider', () => {
  it('runs the lifecycle without network using the mock provider', async () => {
    installFakeDb();

    const job = await executeWritingJob(
      {
        userId: USER_ID,
        job: { ...validBody, mode: 'clarity', tone: 'professional', editorMode: 'plain' },
      },
      { provider: new MockAIProvider(), maxTextLength: 10_000 },
    );

    expect(job).toMatchObject({
      id: JOB_ID,
      status: 'completed',
      outputText: 'Clear writing wins.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
