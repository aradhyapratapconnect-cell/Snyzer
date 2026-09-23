import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Skeleton loading placeholder (SNZ-035; shadcn-style). Purely visual —
 * async regions pair it with screen-reader status text at the call site.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-muted-light dark:bg-muted-dark', className)}
      {...props}
    />
  );
}
