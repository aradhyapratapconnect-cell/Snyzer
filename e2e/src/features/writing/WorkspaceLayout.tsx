import type { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { usePreferencesStore } from '../../stores/usePreferencesStore.js';
import { cn } from '../../lib/utils.js';

/**
 * Writing workspace layout container (SNZ-037).
 *
 * `side_by_side` renders Original and Improved in equal desktop columns;
 * `input_first` stacks input/controls above results. Narrow viewports force
 * the stacked layout regardless of preference so nothing overflows
 * horizontally. Layout switches only swap container classes, so editor DOM
 * (and draft content) is never remounted or lost. Sections are labelled
 * regions for assistive technology.
 */
export function WorkspaceLayout({
  input,
  result,
  analysis,
}: {
  input: ReactNode;
  result: ReactNode;
  analysis?: ReactNode;
}) {
  const workspaceLayout = usePreferencesStore((state) => state.workspaceLayout);
  const isMobile = useIsMobile();
  const stacked = isMobile || workspaceLayout === 'input_first';

  return (
    <div
      data-testid="workspace-layout"
      data-layout={stacked ? 'input-first' : 'side-by-side'}
      className={cn(stacked ? 'flex flex-col gap-6' : 'grid gap-6 md:grid-cols-2')}
    >
      <section aria-label="Original text" className="min-w-0">
        {input}
      </section>
      <div className="flex min-w-0 flex-col gap-6">
        <section aria-label="Improved text">{result}</section>
        {analysis !== undefined && <section aria-label="Writing analysis">{analysis}</section>}
      </div>
    </div>
  );
}
