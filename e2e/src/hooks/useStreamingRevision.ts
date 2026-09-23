import { useEffect, useRef } from 'react';
import type { WritingJobRequest } from '@snyzer/shared';
import { getSupabaseClient } from '../lib/supabase.js';
import type { WorkspaceError, WorkspaceResult } from '../stores/useWorkspaceStore.js';

/**
 * Streaming revision reader (SNZ-061).
 *
 * POSTs to `/api/v1/writing/jobs/stream` and parses the SSE event stream:
 * `token` deltas flow to `onToken` for progressive rendering, `done` carries
 * the validated persisted job to `onDone`, and `error` carries the standard
 * envelope to `onError`. Any transport-level failure (unreachable SSE
 * endpoint, non-OK status, truncated stream) falls back to the synchronous
 * endpoint via `fallback` — the workspace keeps working where SSE is
 * blocked, and existing behavior is preserved byte-for-byte there.
 */
const STREAM_PATH = '/api/v1/writing/jobs/stream';

interface StreamedJob {
  id: string;
  status: string;
  outputText: string;
  analysis: WorkspaceResult['analysis'];
}

function parseEventBlock(block: string): { event: string; data: unknown } | null {
  const eventMatch = /^event: (.+)$/m.exec(block);
  const dataMatch = /^data: (.+)$/m.exec(block);
  if (eventMatch === null || dataMatch === null) {
    return null;
  }
  try {
    return { event: eventMatch[1].trim(), data: JSON.parse(dataMatch[1]) as unknown };
  } catch {
    return null;
  }
}

function isStreamedJob(value: unknown): value is StreamedJob {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { outputText?: unknown }).outputText === 'string'
  );
}

function isFailure(value: unknown): value is WorkspaceError {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string' &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

export function useStreamingRevision(options: {
  onToken: (delta: string) => void;
  onDone: (job: WorkspaceResult) => void;
  onError: (failure: WorkspaceError) => void;
  fallback: () => Promise<void>;
}): { submit: (body: WritingJobRequest) => Promise<void> } {
  const callbacks = useRef(options);
  callbacks.current = options;
  const active = useRef(false);
  const aborter = useRef<AbortController | null>(null);

  useEffect(() => {
    const current = aborter.current;
    return () => {
      current?.abort();
    };
  }, []);

  return {
    submit: async (body: WritingJobRequest): Promise<void> => {
      if (active.current) {
        return;
      }
      active.current = true;
      try {
        // Session lookup is best-effort: without env or a session the stream
        // attempt simply goes out unauthenticated and the backend answers
        // 401, which routes to the synchronous fallback like any failure.
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
        const controller = new AbortController();
        aborter.current = controller;
        let response: Response;
        try {
          response = await fetch(STREAM_PATH, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } catch {
          await callbacks.current.fallback();
          return;
        }
        if (!response.ok || response.body === null) {
          await callbacks.current.fallback();
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completed = false;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() ?? '';
            for (const block of blocks) {
              const event = parseEventBlock(block);
              if (event === null) {
                continue;
              }
              if (event.event === 'token') {
                const text = (event.data as { text?: unknown }).text;
                if (typeof text === 'string' && text !== '') {
                  callbacks.current.onToken(text);
                }
              } else if (event.event === 'done') {
                const job = (event.data as { job?: unknown }).job;
                if (isStreamedJob(job)) {
                  completed = true;
                  callbacks.current.onDone({
                    outputText: job.outputText,
                    analysis: job.analysis,
                  });
                }
              } else if (event.event === 'error') {
                const failure = (event.data as { error?: unknown }).error;
                completed = true;
                callbacks.current.onError(
                  isFailure(failure)
                    ? failure
                    : {
                        code: 'REQUEST_FAILED',
                        message: 'Something went wrong. Please try again.',
                      },
                );
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        if (!completed) {
          // Truncated stream: the job may or may not have finished
          // server-side, so surface a retryable error rather than guessing.
          callbacks.current.onError({
            code: 'REQUEST_FAILED',
            message: 'The live update was interrupted. Please try again.',
          });
        }
      } finally {
        active.current = false;
        aborter.current = null;
      }
    },
  };
}
