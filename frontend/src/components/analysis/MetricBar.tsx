import { cn } from '../../lib/utils.js';

/**
 * Metric progress bar (SNZ-048). Visual indicator plus numeric value; the
 * qualitative band wording lives in `AnalysisPanel`.
 */
export function MetricBar({ value, inverted = false }: { value: number; inverted?: boolean }) {
  const effective = inverted ? 100 - value : value;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className="h-2 w-full overflow-hidden rounded-full bg-muted-light dark:bg-muted-dark"
    >
      <div
        className={cn(
          'h-full rounded-full',
          effective >= 70
            ? 'bg-success-light dark:bg-success-dark'
            : 'bg-primary dark:bg-primary-dark',
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
