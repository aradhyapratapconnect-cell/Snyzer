import { Badge } from '../ui/badge.js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';

/**
 * History item card (SNZ-050). Summary view of one past job: date, mode and
 * tone badges, status, and a truncated preview. Selection opens the detail
 * dialog (SNZ-051).
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

export function formatJobDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function HistoryCard({
  job,
  onSelect,
}: {
  job: HistoryJobSummary;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="border-slate-800 bg-[#061520]/80 shadow-xl backdrop-blur-xl transition-all hover:border-teal-500/40">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
            />
            <CardTitle className="text-base font-bold tracking-tight text-white">
              {formatJobDate(job.created_at)}
            </CardTitle>
          </div>
          <Badge variant={job.status === 'completed' ? 'success' : 'secondary'}>{job.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="font-code mb-1.5 text-[11px] tracking-wide text-amber-400/80 uppercase">
              Original
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-300">
              {job.input_preview}
            </p>
          </div>
          <div>
            <p className="font-code mb-1.5 text-[11px] tracking-wide text-teal-300/80 uppercase">
              Revised
            </p>
            <p className="font-editorial line-clamp-3 text-sm leading-relaxed text-slate-100">
              {job.output_preview ?? 'No output was produced.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-4">
          <div className="flex gap-1.5">
            <Badge variant="outline">{job.mode}</Badge>
            <Badge variant="outline">{job.tone}</Badge>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(job.id);
            }}
            className="rounded-lg px-2 py-1 text-sm font-medium text-teal-300 hover:text-teal-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            View details
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
