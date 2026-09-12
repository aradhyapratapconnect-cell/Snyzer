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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{formatJobDate(job.created_at)}</CardTitle>
          <Badge variant={job.status === 'completed' ? 'success' : 'secondary'}>{job.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-subink-light dark:text-subink-dark">
          {job.input_preview}
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <Badge variant="outline">{job.mode}</Badge>
            <Badge variant="outline">{job.tone}</Badge>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(job.id);
            }}
            className="rounded-lg px-2 py-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-primary-dark"
          >
            View details
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
