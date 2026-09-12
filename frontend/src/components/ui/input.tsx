import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Text input primitive (SNZ-013; shadcn-style). Visible labels come from
 * `Label`; invalid state is signaled via `aria-invalid` plus a described-by
 * error message rendered by the form.
 */
export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-line-light bg-surface-light px-3 py-2 text-sm text-ink-light placeholder:text-subink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:placeholder:text-subink-dark',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
