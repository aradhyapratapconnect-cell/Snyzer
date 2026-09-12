import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Badge primitive (SNZ-035; shadcn-style). Never the sole carrier of state —
 * badges pair with adjacent text per the accessibility spec.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white dark:bg-primary-dark dark:text-ink-dark',
        secondary:
          'border-transparent bg-muted-light text-ink-light dark:bg-muted-dark dark:text-ink-dark',
        outline: 'border-line-light text-ink-light dark:border-line-dark dark:text-ink-dark',
        success:
          'border-transparent bg-success-light text-white dark:bg-success-dark dark:text-ink-dark',
        destructive:
          'border-transparent bg-danger-light text-white dark:bg-danger-dark dark:text-ink-dark',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
