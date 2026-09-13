import type { Pool } from 'pg';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { _setPoolForTests } from '../src/config/database.js';
import { OpenRouterProvider } from '../src/services/ai/OpenRouterProvider.js';
import { extractDisplayablePrefix } from '../src/services/ai/streamingParser.js';

/**
 * SNZ-061 tests: incremental JSON-text extraction, provider SSE streaming
 * against mocked fetch, and the `/writing/jobs/stream` endpoint through the
 * real app (mocked auth + fake pool). No live network or database involved.
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

function installFakeDb() {
  const statements: Statement[] = [];
  const runQuery = async (text: string, params?: unknown[]) => {
    statements.push({ text, params });
    if (text.includes('INSERT INTO writing_jobs')) {
      return { rows: [{ id: JOB_ID }] };
    }
    if (text.includes('COUNT(*)')) {
      return { rows: [{ count: '0' }] };
    }
    return { rows: [] };
  };
  const client = { query: vi.fn(runQuery), release: vi.fn() };
  const pool = {
    query: vi.fn(runQuery),
    connect: vi.fn(async () => client),
  } as unknown as Pool;
  _setPoolForTests(pool);
  return { statements };
}

const FULL_JSON = JSON.stringify({
  revisedText: 'Clear writing triumphs.\nSecond line with "quotes".',
  analysis: {
    readability: 72,
    clarity: 80,
    repetition: 12,
    sentenceVariety: 68,
    vocabularyComplexity: 55,
    formality: 61,
  },
});

/** Splits content into awkward chunks (mid-key, mid-escape, mid-unicode). */
function chunkedSseBody(content: string): string {
  const cuts = [5, 9, 14, 15, 22, 30, 45, 60, content.length];
  let body = '';
  let start = 0;
  for (const cut of cuts) {
    const piece = content.slice(start, cut);
    body += `data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`;
    start = cut;
  }
  body += `data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } })}\n\n`;
  body += 'data: [DONE]\n\n';
  return body;
}

function sseResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

interface SseEvent {
  event: string;
  data: unknown;
}

function parseSseEvents(raw: string): SseEvent[] {
  return raw
    .split('\n\n')
    .filter((block) => block.includes('data:'))
    .map((block) => {
      const event = (/^event: (.+)$/m.exec(block)?.[1] ?? '').trim();
      const data = JSON.parse((/^data: (.+)$/m.exec(block)?.[1] ?? 'null') as string) as unknown;
      return { event, data };
    });
}

const app = createApp();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
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
  _setPoolForTests(undefined);
});

afterEach(() => {
  _setPoolForTests(undefined);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('extractDisplayablePrefix', () => {
  it('exposes progressive prefixes of the revision text', () => {
    expect(extractDisplayablePrefix('{"revisedText": "Clear')).toBe('Clear');
    expect(extractDisplayablePrefix('{"revisedText": "Clear writing')).toBe('Clear writing');
    expect(extractDisplayablePrefix(FULL_JSON)).toBe(
      'Clear writing triumphs.\nSecond line with "quotes".',
    );
  });

  it('decodes escapes only once fully arrived', () => {
    expect(extractDisplayablePrefix('{"revisedText": "a\\n')).toBe('a\n');
    // Trailing lone backslash: hold back until the escape completes.
    expect(extractDisplayablePrefix('{"revisedText": "a\\')).toBe('a');
    expect(extractDisplayablePrefix('{"revisedText": "caf\\u00e')).toBe('caf');
    expect(extractDisplayablePrefix('{"revisedText": "caf\\u00e9 x"}')).toBe('café x');
  });

  it('returns empty when the key or value has not started', () => {
    expect(extractDisplayablePrefix('{"rev')).toBe('');
    expect(extractDisplayablePrefix('{"revisedText": ')).toBe('');
    expect(extractDisplayablePrefix('not json at all')).toBe('');
  });
});

describe('OpenRouterProvider.streamWritingRevision', () => {
  it('yields clean text deltas and a validated summary', async () => {
    fetchMock.mockResolvedValue(sseResponse(chunkedSseBody(FULL_JSON)));
    const provider = new OpenRouterProvider({ apiKey: 'test-key' });

    const tokens: string[] = [];
    const summary = await (async () => {
      const stream = provider.streamWritingRevision({
        inputText: 'Clear writing wins.',
        mode: 'clarity',
        tone: 'professional',
        editorMode: 'plain',
      });
      for (;;) {
        const next = await stream.next();
        if (next.done === true) {
          return next.value;
        }
        tokens.push(next.value.text);
      }
    })();

    // Deltas assemble to the exact revision text — never raw JSON.
    expect(tokens.join('')).toBe('Clear writing triumphs.\nSecond line with "quotes".');
    expect(tokens.join('')).not.toContain('revisedText');
    expect(summary.content).toBe(FULL_JSON);
    expect(summary.usage).toEqual({ inputTokens: 10, outputTokens: 20, totalTokens: 30 });
    expect(summary.model).toBe('openai/gpt-4o-mini');
    // Streams with the JSON contract enforced.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = (fetchMock.mock.calls[0]?.[1] as { body?: unknown })?.body;
    expect(body).toContain('"stream":true');
  });

  it('maps provider outages without retrying the stream', async () => {
    fetchMock.mockResolvedValue(new Response('busy', { status: 503 }));

    const provider = new OpenRouterProvider({ apiKey: 'test-key' });
    const stream = provider.streamWritingRevision({
      inputText: 'hi there',
      mode: 'clarity',
      tone: 'professional',
      editorMode: 'plain',
    });

    await expect(stream.next()).rejects.toMatchObject({ code: 'AI_PROVIDER_UNAVAILABLE' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/v1/writing/jobs/stream', () => {
  const validBody = {
    inputText: 'Clear writing wins.',
    mode: 'clarity',
    tone: 'professional',
    editorMode: 'plain',
    preferences: { clarity: 70 },
  };
  const auth = (req: request.Test) => req.set('Authorization', 'Bearer test-token');

  it('streams tokens then a persisted done job', async () => {
    installFakeDb();
    fetchMock.mockResolvedValue(sseResponse(chunkedSseBody(FULL_JSON)));

    const res = await auth(request(app).post('/api/v1/writing/jobs/stream').send(validBody));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    const events = parseSseEvents(res.text);
    const tokenEvents = events.filter((event) => event.event === 'token');
    expect(tokenEvents.length).toBeGreaterThan(1);
    const assembled = tokenEvents.map((event) => (event.data as { text: string }).text).join('');
    expect(assembled).toBe('Clear writing triumphs.\nSecond line with "quotes".');

    const done = events.find((event) => event.event === 'done');
    expect(done?.data).toEqual({
      job: {
        id: JOB_ID,
        status: 'completed',
        outputText: 'Clear writing triumphs.\nSecond line with "quotes".',
        analysis: {
          readability: 72,
          clarity: 80,
          repetition: 12,
          sentenceVariety: 68,
          vocabularyComplexity: 55,
          formality: 61,
        },
      },
    });
    expect(events.some((event) => event.event === 'error')).toBe(false);
  });

  it('emits an error event and marks the job failed on provider outage', async () => {
    const { statements } = installFakeDb();
    fetchMock.mockResolvedValue(new Response('busy', { status: 503 }));

    const res = await auth(request(app).post('/api/v1/writing/jobs/stream').send(validBody));

    expect(res.status).toBe(200);
    const events = parseSseEvents(res.text);
    const errorEvent = events.find((event) => event.event === 'error');
    expect(errorEvent?.data).toEqual({
      error: {
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: 'AI provider is unavailable. Please try again later.',
      },
    });
    expect(events.some((event) => event.event === 'done')).toBe(false);
    expect(
      statements.some(
        (statement) =>
          statement.text.includes("SET status = 'failed'") &&
          statement.params?.[0] === 'AI_PROVIDER_UNAVAILABLE',
      ),
    ).toBe(true);
  });

  it('rejects anonymous callers before the stream starts', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: new Error('nope') });

    const res = await request(app).post('/api/v1/writing/jobs/stream').send(validBody);

    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps validation failures as JSON, not SSE', async () => {
    installFakeDb();

    const res = await auth(
      request(app)
        .post('/api/v1/writing/jobs/stream')
        .send({ ...validBody, inputText: '' }),
    );

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('application/json');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
