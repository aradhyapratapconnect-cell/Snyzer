import type { Analysis } from '@snyzer/shared';
import { apiRequest } from './client.js';

/**
 * History API (SNZ-050 list; SNZ-051 detail/delete).
 *
 * Typed wrappers over the writing-job history endpoints. All rows are
 * per-user server-side; the API never returns another user's jobs.
 */
export interface HistoryJobSummary {
  id: string;
  input_preview: string;
  output_preview: string | null;
  mode: string;
  tone: string;
  status: string;
  created_at: string;
}

export interface HistoryListResponse {
  jobs: HistoryJobSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface HistoryJobDetail {
  id: string;
  input_text: string;
  output_text: string | null;
  mode: string;
  tone: string;
  analysis: Analysis | null;
  status: string;
  created_at: string;
}

/** Lists a page of past jobs (200-character previews). */
export function listWritingJobs(limit: number, offset: number): Promise<HistoryListResponse> {
  return apiRequest<HistoryListResponse>(`/writing/jobs?limit=${limit}&offset=${offset}`);
}

/** Fetches one full job (untruncated texts + metrics). */
export function getWritingJob(jobId: string): Promise<{ job: HistoryJobDetail }> {
  return apiRequest<{ job: HistoryJobDetail }>(`/writing/jobs/${jobId}`);
}

/** Deletes one job owned by the caller. */
export function deleteWritingJob(jobId: string): Promise<{ deleted: boolean; id: string }> {
  return apiRequest(`/writing/jobs/${jobId}`, { method: 'DELETE' });
}
