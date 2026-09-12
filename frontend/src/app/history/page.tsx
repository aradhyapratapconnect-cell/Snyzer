import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HistoryCard, type HistoryJobSummary } from '../../components/history/HistoryCard.js';
import { HistoryDetailModal } from '../../components/history/HistoryDetailModal.js';
import { Button } from '../../components/ui/button.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { apiRequest } from '../../lib/apiClient.js';

/**
 * Writing history page (SNZ-050 list; SNZ-051 detail dialog).
 *
 * Paginated past jobs with loading skeletons, an empty state, and a detail
 * dialog per card. Deletions update the list in place (filter + count
 * decrement) without a refetch.
 */
const PAGE_SIZE = 20;

interface HistoryResponse {
  jobs: HistoryJobSummary[];
  total: number;
  limit: number;
  offset: number;
}

export function HistoryPage() {
  const [jobs, setJobs] = useState<HistoryJobSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async (nextOffset: number) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await apiRequest<HistoryResponse>(
        `/writing/jobs?limit=${PAGE_SIZE}&offset=${nextOffset}`,
      );
      setJobs(response.jobs);
      setTotal(response.total);
      setOffset(nextOffset);
      setStatus('ready');
    } catch (requestError) {
      setStatus('error');
      setError(
        requestError instanceof Error ? requestError.message : 'Could not load your history.',
      );
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Writing history</h1>

      {status === 'loading' && (
        <div role="status" aria-label="Loading history" className="space-y-4">
          <span className="sr-only">Loading your writing history…</span>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="rounded-xl border border-line-light bg-surface-light p-6 text-center dark:border-line-dark dark:bg-surface-dark"
        >
          <p className="text-sm text-ink-light dark:text-ink-dark">
            {error ?? 'Could not load your history.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => void load(offset)}
          >
            Try again
          </Button>
        </div>
      )}

      {status === 'ready' && jobs.length === 0 && (
        <div className="rounded-xl border border-line-light bg-surface-light p-8 text-center dark:border-line-dark dark:bg-surface-dark">
          <h2 className="text-lg font-semibold">No writing history yet</h2>
          <p className="mt-2 text-sm text-subink-light dark:text-subink-dark">
            Improve your first draft and it will show up here.
          </p>
          <Button type="button" className="mt-4" asChild>
            <Link to="/workspace">Start Writing</Link>
          </Button>
        </div>
      )}

      {status === 'ready' && jobs.length > 0 && (
        <>
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job.id}>
                <HistoryCard
                  job={job}
                  onSelect={(id) => {
                    setSelectedId(id);
                  }}
                />
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={offset === 0}
              onClick={() => void load(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
            <span className="text-xs text-subink-light dark:text-subink-dark" aria-live="polite">
              Page {page} of {pageCount} · {total} {total === 1 ? 'job' : 'jobs'}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => void load(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <HistoryDetailModal
        jobId={selectedId}
        onClose={() => {
          setSelectedId(null);
        }}
        onDeleted={(id) => {
          setJobs((previous) => previous.filter((job) => job.id !== id));
          setTotal((previous) => Math.max(0, previous - 1));
        }}
      />
    </div>
  );
}
