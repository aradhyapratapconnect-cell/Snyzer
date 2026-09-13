import type { NextFunction, Request, Response } from 'express';
import type { WritingJobRequest } from '@snyzer/shared';
import { getBackendEnv } from '../config/env.js';
import { AppError, UnauthorizedError } from '../middleware/errorHandler.js';
import { executeWritingJob, executeWritingJobStream } from '../services/writing/writingService.js';

/**
 * Writing-job endpoints (SNZ-026; quota SNZ-030).
 *
 * `POST /api/v1/writing/jobs` runs the full revision lifecycle for the
 * authenticated user: the route stack (`requireAuth` → `validate` →
 * handler) guarantees identity and a parsed `WritingJobRequest` body before
 * this handler runs. Length and quota enforcement use the configured server
 * values, checked before the AI provider is ever contacted.
 */
export async function createWritingJob(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    const env = getBackendEnv();
    const job = await executeWritingJob(
      { userId: req.user.id, job: req.body as WritingJobRequest },
      { maxTextLength: env.MAX_TEXT_LENGTH, maxDailyJobs: env.DAILY_JOB_LIMIT },
    );
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
}

function sendSseEvent(res: Response, event: string, data: unknown): void {
  // Writes after a client disconnect throw — the stream is already over, so
  // they are swallowed rather than escalated.
  if (res.writableEnded || res.destroyed) {
    return;
  }
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Client went away mid-stream; nothing left to do.
  }
}

/**
 * Streaming revision endpoint (SNZ-061).
 *
 * `POST /api/v1/writing/jobs/stream` runs the same lifecycle as creation but
 * delivers Server-Sent Events: `token` (displayable text deltas), `done`
 * (the persisted §17 job), and `error` (the standard envelope). Quota and
 * validation failures happen before the stream starts, so they keep the
 * normal JSON error shape via `next(error)`; anything after headers flush
 * becomes an `error` event (AppError codes/messages are user-safe by design,
 * unknown failures map to the generic envelope).
 */
export async function createWritingJobStream(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    const env = getBackendEnv();
    const input = { userId: req.user.id, job: req.body as WritingJobRequest };

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    try {
      const job = await executeWritingJobStream(
        input,
        { maxTextLength: env.MAX_TEXT_LENGTH, maxDailyJobs: env.DAILY_JOB_LIMIT },
        (text) => {
          sendSseEvent(res, 'token', { text });
        },
      );
      sendSseEvent(res, 'done', { job });
    } catch (error) {
      const envelope =
        error instanceof AppError
          ? { code: error.code, message: error.message }
          : {
              code: 'INTERNAL_ERROR',
              message: 'An unexpected error occurred. Please try again later.',
            };
      sendSseEvent(res, 'error', { error: envelope });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  } catch (error) {
    // Headers already flushed: the global error middleware cannot answer, so
    // just terminate the stream.
    if (res.headersSent || res.writableEnded) {
      try {
        res.end();
      } catch {
        // Client went away mid-stream; nothing left to do.
      }
      return;
    }
    next(error);
  }
}
