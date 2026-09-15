import express, { type NextFunction, type Request, type Response } from 'express';
import { createApp } from '../backend/src/app.js';

/**
 * Vercel Function entrypoint for the single-project deployment (SNZ-065).
 *
 * One Vercel project serves both halves of Snyzer:
 *   - the static React/Vite bundle (`frontend/dist`, project output directory),
 *   - this function, which is the *existing* Express app from `@snyzer/backend`
 *     (`createApp()`), reached through the `/api/*` rewrite in `vercel.json`.
 *
 * Nothing about the backend changes: `backend/src/server.ts` still boots the
 * same app as a long-lived process for Node hosts, and this file only adapts
 * the runtime around it for Vercel.
 *
 * Why the wrapper app: the project rewrite into this function (`/api/:path*`
 * -> `/api/index`) collapses the request path onto the function path and hands
 * the captured remainder over as the `path` query parameter (Vercel turns
 * matched rewrite segments into query parameters). The Express router mounts
 * everything under `/api/v1`, so the original path has to be restored before
 * the app sees the request. The wrapper runs that restoration first, then
 * delegates to the untouched app, so routing, auth, validation, rate limiting,
 * error envelopes and SSE streaming behave exactly as they do locally. When the
 * platform preserves the path instead (no capture present), it is a no-op.
 */
const API_PREFIX = '/api';
const CAPTURED_PATH_PARAM = 'path';

/** Splits a raw request URL into its pathname and search (search keeps `?`). */
function splitUrl(url: string): { pathname: string; search: string } {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) {
    return { pathname: url, search: '' };
  }
  return { pathname: url.slice(0, queryStart), search: url.slice(queryStart) };
}

/**
 * Rebuilds `/api/<captured>` from the rewrite marker and drops the marker from
 * the query string. Requests that carry no marker are forwarded untouched.
 */
function restoreApiPath(req: Request, _res: Response, next: NextFunction): void {
  const { search } = splitUrl(req.url);
  const params = new URLSearchParams(search);
  const captured = params.get(CAPTURED_PATH_PARAM);
  if (captured === null) {
    next();
    return;
  }

  params.delete(CAPTURED_PATH_PARAM);
  const suffix = captured.replace(/^\/+/, '');
  const pathname = suffix === '' ? API_PREFIX : `${API_PREFIX}/${suffix}`;
  const query = params.toString();
  req.url = query === '' ? pathname : `${pathname}?${query}`;
  next();
}

const app = express();
app.disable('x-powered-by');
app.use(restoreApiPath);
app.use(createApp());

export default app;
