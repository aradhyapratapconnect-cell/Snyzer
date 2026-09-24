import type { WritingJobRequest, WritingJobResponse } from '@snyzer/shared';
import { ApiClientError, apiRequest } from './client.js';
import { getSupabaseClient } from '../lib/supabase.js';

/**
 * Writing API (SNZ-026 sync; SNZ-061 streaming).
 *
 * Typed wrappers over `POST /api/v1/writing/jobs` and
 * `POST /api/v1/writing/jobs/stream`. Request/response shapes come from
 * `@snyzer/shared` (`WritingJobRequestSchema` /
 * `WritingJobResponseSchema`); the Bearer token is attached centrally here
 * and in `apiRequest`, never in components.
 */
export const WRITING_JOBS_PATH = '/writing/jobs';

/** Absolute fetch path for the SSE endpoint (the hook uses `fetch` directly). */
export const WRITING_STREAM_PATH = '/api/v1/writing/jobs/stream';

/** Submits a draft for synchronous revision. */
export function createWritingJob(body: WritingJobRequest): Promise<WritingJobResponse> {
  return apiRequest<WritingJobResponse>(WRITING_JOBS_PATH, { method: 'POST', body });
}

/**
 * Opens the live revision stream.
 *
 * Resolves with the response byte stream when the backend accepts the job;
 * rejects with `ApiClientError` on any transport problem (unreachable,
 * non-OK status, empty body) so callers can fall back to `createWritingJob`.
 * Session lookup is best-effort: without a session the request goes out
 * unauthenticated and the backend answers 401, which is a fallback trigger
 * like any other transport failure.
 */
export async function openWritingStream(
  body: WritingJobRequest,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  let accessToken: string | undefined;
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    accessToken = data.session?.access_token ?? undefined;
  } catch {
    accessToken = undefined;
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken !== undefined && accessToken !== '') {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  let response: Response;
  try {
    response = await fetch(WRITING_STREAM_PATH, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
      status: 0,
    });
  }
  const stream = response.body;
  if (!response.ok || stream === null) {
    throw new ApiClientError({
      code: 'REQUEST_FAILED',
      message: `Request failed with status ${response.status}.`,
      status: response.status,
    });
  }
  return stream;
}
