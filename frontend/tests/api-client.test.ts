import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, apiRequest } from '../src/lib/apiClient.js';

/**
 * SNZ-020 unit tests: auth header injection, backend-only paths, success
 * parsing, and error normalization — with mocked fetch and session. No
 * network involved.
 */
const fetchMock = vi.fn();

vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: 'test-access-token' } },
        error: null,
      })),
    },
  }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('attaches the session Bearer token and targets the backend prefix', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    const result = await apiRequest<{ ok: boolean }>('/writing/jobs');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ];
    expect(url).toBe('/api/v1/writing/jobs');
    expect(init.headers['Authorization']).toBe('Bearer test-access-token');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('serializes POST bodies as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiRequest('/writing/jobs', { method: 'POST', body: { inputText: 'hi' } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ inputText: 'hi' }));
  });

  it('refuses third-party and escaping paths without touching fetch', async () => {
    for (const path of [
      'https://evil.example.com/api',
      '//evil.example.com/x',
      '/../secret',
      'relative/path',
    ]) {
      await expect(apiRequest(path)).rejects.toMatchObject({ code: 'INVALID_API_PATH' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns undefined for empty and 204 responses', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }));
    await expect(apiRequest('/writing/jobs')).resolves.toBeUndefined();

    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiRequest('/writing/jobs')).resolves.toBeUndefined();
  });

  it('preserves backend error envelopes with status and details', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'TEXT_TOO_LONG', message: 'Too long.', details: [{ path: 'x' }] } },
        413,
      ),
    );

    const failure = await apiRequest('/writing/jobs').catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ApiClientError);
    expect(failure).toMatchObject({
      code: 'TEXT_TOO_LONG',
      message: 'Too long.',
      status: 413,
      details: [{ path: 'x' }],
    });
  });

  it('normalizes non-JSON failures into typed errors', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>gateway exploded</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const failure = await apiRequest('/writing/jobs').catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ApiClientError);
    expect(failure).toMatchObject({ code: 'REQUEST_FAILED', status: 502 });
  });

  it('maps network failures and cancellations distinctly', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    await expect(apiRequest('/writing/jobs')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });

    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'));
    await expect(
      apiRequest('/writing/jobs', { signal: AbortSignal.abort() }),
    ).rejects.toMatchObject({ code: 'REQUEST_ABORTED' });
  });

  it('forwards the abort signal for unmount cancellation', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const controller = new AbortController();

    await apiRequest('/writing/jobs', { signal: controller.signal });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });
});
