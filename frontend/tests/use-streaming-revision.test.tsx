import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStreamingRevision } from '../src/hooks/useStreamingRevision.js';

/**
 * SNZ-061 hook tests: SSE token assembly, done/error events, and sync
 * fallback on transport failure. Fetch and Supabase are mocked; no network.
 */
const getSessionMock = vi.fn();

vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({ auth: { getSession: getSessionMock } }),
}));

const fetchMock = vi.fn();

const BODY = {
  inputText: 'Clear writing wins.',
  mode: 'clarity',
  tone: 'professional',
  editorMode: 'plain',
  preferences: {},
} as const;

const ANALYSIS = {
  readability: 72,
  clarity: 80,
  repetition: 12,
  sentenceVariety: 68,
  vocabularyComplexity: 55,
  formality: 61,
};

function sseResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function event(name: string, data: unknown): string {
  return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

function callbacks() {
  return {
    onToken: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
    fallback: vi.fn(async () => {}),
  };
}

beforeEach(() => {
  getSessionMock.mockReset();
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useStreamingRevision', () => {
  it('assembles token deltas and delivers the done job', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      sseResponse(
        event('token', { text: 'Clear ' }) +
          event('token', { text: 'writing triumphs.' }) +
          event('done', {
            job: {
              id: 'j1',
              status: 'completed',
              outputText: 'Clear writing triumphs.',
              analysis: ANALYSIS,
            },
          }),
      ),
    );
    const hooks = callbacks();
    const { result } = renderHook(() => useStreamingRevision(hooks));

    await result.current.submit({ ...BODY });

    expect(hooks.onToken.mock.calls.map((call) => call[0]).join('')).toBe(
      'Clear writing triumphs.',
    );
    expect(hooks.onDone).toHaveBeenCalledWith({
      outputText: 'Clear writing triumphs.',
      analysis: ANALYSIS,
    });
    expect(hooks.onError).not.toHaveBeenCalled();
    expect(hooks.fallback).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/writing/jobs/stream',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('surfaces server error events without falling back', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      sseResponse(event('error', { error: { code: 'AI_TIMEOUT', message: 'Slow provider.' } })),
    );
    const hooks = callbacks();
    const { result } = renderHook(() => useStreamingRevision(hooks));

    await result.current.submit({ ...BODY });

    expect(hooks.onError).toHaveBeenCalledWith({ code: 'AI_TIMEOUT', message: 'Slow provider.' });
    expect(hooks.onDone).not.toHaveBeenCalled();
    expect(hooks.fallback).not.toHaveBeenCalled();
  });

  it('falls back to sync when the SSE connection fails', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const hooks = callbacks();
    const { result } = renderHook(() => useStreamingRevision(hooks));

    await result.current.submit({ ...BODY });

    expect(hooks.fallback).toHaveBeenCalledTimes(1);
    expect(hooks.onDone).not.toHaveBeenCalled();
    expect(hooks.onError).not.toHaveBeenCalled();
  });

  it('falls back on non-OK status and reports truncated streams', async () => {
    vi.stubGlobal('fetch', fetchMock);
    const hooks = callbacks();
    const { result } = renderHook(() => useStreamingRevision(hooks));

    fetchMock.mockResolvedValue(sseResponse('nope', 429));
    await result.current.submit({ ...BODY });
    expect(hooks.fallback).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValue(sseResponse(event('token', { text: 'half ' })));
    await result.current.submit({ ...BODY });
    expect(hooks.onToken).toHaveBeenCalledWith('half ');
    expect(hooks.onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'REQUEST_FAILED' }));
    expect(hooks.onDone).not.toHaveBeenCalled();
  });
});
