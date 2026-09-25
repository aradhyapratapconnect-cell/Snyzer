import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, FileText, Search } from 'lucide-react';
import { HistoryCard, type HistoryJobSummary } from '../../components/history/HistoryCard.js';
import { HistoryDetailModal } from '../../components/history/HistoryDetailModal.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { listWritingJobs } from '../../api/history.js';
import { cn } from '../../lib/utils.js';

/**
 * Writing history page (SNZ-050 list; SNZ-051 detail dialog).
 *
 * Demo-reference presentation (telemetry header, tone filter pills,
 * dual-preview cards) over the real server-side history: paginated past jobs
 * with loading skeletons, an empty state, and a detail dialog per card.
 * Deletions update the list in place (filter + count decrement) without a
 * refetch. The tone filter and text search apply client-side to the loaded
 * page — the list endpoint offers pagination only, so both are honestly
 * labelled as page-scoped.
 */
const PAGE_SIZE = 20;

const TONE_FILTERS = ['all', 'professional', 'casual', 'academic', 'direct'] as const;

export function HistoryPage() {
  const [jobs, setJobs] = useState<HistoryJobSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toneFilter, setToneFilter] = useState<(typeof TONE_FILTERS)[number]>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async (nextOffset: number) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await listWritingJobs(PAGE_SIZE, nextOffset);
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

  const visibleJobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (toneFilter !== 'all' && job.tone !== toneFilter) {
        return false;
      }
      if (needle === '') {
        return true;
      }
      const haystacks = [job.input_preview, job.output_preview ?? '', job.mode, job.tone];
      return haystacks.some((haystack) => haystack.toLowerCase().includes(needle));
    });
  }, [jobs, toneFilter, query]);

  const filtering = toneFilter !== 'all' || query.trim() !== '';

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-code mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-2.5 py-1 text-xs text-teal-300">
            <Clock className="h-3.5 w-3.5" />
            <span>Session Log</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            Writing history
          </h1>
          <p className="mt-1 text-sm text-slate-400 md:text-base">
            Browse previous revisions, inspect quality metrics, and reload drafts into the editor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <label htmlFor="history-search" className="sr-only">
              Search this page
            </label>
            <Input
              id="history-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search this page…"
              className="w-52 bg-slate-900/90 pl-9 text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div
            role="group"
            aria-label="Filter by tone"
            className="flex items-center rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs"
          >
            {TONE_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={toneFilter === filter}
                onClick={() => {
                  setToneFilter(filter);
                }}
                className={cn(
                  'rounded-lg px-3 py-1 capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400',
                  toneFilter === filter
                    ? 'border border-teal-500/30 bg-teal-500/20 font-semibold text-teal-300'
                    : 'text-slate-400 hover:text-white',
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            asChild
            className="bg-teal-400 font-bold text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.3)] hover:bg-teal-300"
          >
            <Link to="/workspace">
              <span>Open Playground</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {status === 'loading' && (
        <div role="status" aria-label="Loading history" className="space-y-4">
          <span className="sr-only">Loading your writing history…</span>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-36 w-full border border-teal-500/10 bg-[#061520]" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-[#061520]/80 p-6 text-center backdrop-blur-xl"
        >
          <p className="text-sm text-slate-200">{error ?? 'Could not load your history.'}</p>
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
        <div className="rounded-3xl border border-slate-800 bg-[#07131e]/50 p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-950/40 text-teal-400">
            <FileText className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-white">No writing history yet</h2>
          <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-slate-400">
            Improve your first draft and it will show up here.
          </p>
          <Button
            type="button"
            asChild
            className="rounded-full bg-teal-400 font-semibold text-slate-950 hover:bg-teal-300"
          >
            <Link to="/workspace">Start Writing</Link>
          </Button>
        </div>
      )}

      {status === 'ready' && jobs.length > 0 && visibleJobs.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-[#07131e]/50 p-12 text-center">
          <h2 className="text-lg font-bold text-white">No entries match your filters</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Try a different search or tone — filters apply to this page only.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery('');
              setToneFilter('all');
            }}
          >
            Clear search and filters
          </Button>
        </div>
      )}

      {status === 'ready' && visibleJobs.length > 0 && (
        <>
          {filtering && (
            <p className="mb-4 text-xs text-slate-400" aria-live="polite">
              Showing {visibleJobs.length} of {jobs.length} entries on this page.
            </p>
          )}
          <ul className="space-y-6">
            {visibleJobs.map((job) => (
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
          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={offset === 0}
              onClick={() => void load(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-400" aria-live="polite">
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
