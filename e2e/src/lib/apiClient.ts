import { getSupabaseClient } from './supabase.js';

/**
 * Unified Snyzer backend HTTP client (SNZ-020).
 *
 * All frontend data flows through here. Requests go only to our own backend
 * (`/api/v1/*`, same origin in production) — third-party URLs are rejected
 * before any network call. The Supabase session token is attached
 * automatically; backend error envelopes, non-JSON failures, network errors,
 * and cancellations all surface as typed `ApiClientError`s. Pass an
 * `AbortSignal` (e.g. from React's effect cleanup) to cancel in-flight
 * requests on unmount.
 */
export const API_BASE_PATH = '/api/v1';

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(options: { code: string; message: string; status: number; details?: unknown }) {
    super(options.message);
    this.name = 'ApiClientError';
    this.code = options.code;
    this.status = options.status;
    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}

/** Resource paths are relative to `/api/v1` (e.g. `/writing/jobs?limit=20`). */
function toBackendUrl(path: string): string {
  const [pathname] = path.split('?');
  if (
    pathname === undefined ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname.includes('..')
  ) {
    throw new ApiClientError({
      code: 'INVALID_API_PATH',
      message: `Refused non-backend API path: ${path}`,
      status: 0,
    });
  }
  return `${API_BASE_PATH}${path}`;
}

async function readErrorBody(response: Response): Promise<{
  code?: unknown;
  message?: unknown;
  details?: unknown;
}> {
  try {
    const parsed: unknown = await response.json();
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      const error = (parsed as { error: Record<string, unknown> }).error;
      if (typeof error === 'object' && error !== null) {
        return {
          code: error['code'],
          message: error['message'],
          details: error['details'],
        };
      }
    }
  } catch {
    // Non-JSON error body — fall through to the generic mapping below.
  }
  return {};
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = toBackendUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();
  if (session?.access_token !== undefined && session.access_token !== '') {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError({
        code: 'REQUEST_ABORTED',
        message: 'Request was cancelled.',
        status: 0,
      });
    }
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
      status: 0,
    });
  }

  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    if (text === '') {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  const errorBody = await readErrorBody(response);
  if (typeof errorBody.code === 'string' && typeof errorBody.message === 'string') {
    throw new ApiClientError({
      code: errorBody.code,
      message: errorBody.message,
      status: response.status,
      details: errorBody.details,
    });
  }
  throw new ApiClientError({
    code: 'REQUEST_FAILED',
    message: `Request failed with status ${response.status}.`,
    status: response.status,
  });
}
