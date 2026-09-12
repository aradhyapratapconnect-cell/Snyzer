import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Button primitive (SNZ-013; shadcn-style foundation SNZ-035 extends this
 * folder). Variants use Snyzer tokens with visible focus and disabled states.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary-hover dark:bg-primary-dark dark:hover:bg-primary-darkHover dark:text-ink-dark',
        secondary:
          'border border-line-light bg-surface-light hover:bg-muted-light dark:border-line-dark dark:bg-surface-dark dark:hover:bg-muted-dark',
        ghost: 'hover:bg-muted-light dark:hover:bg-muted-dark',
        destructive:
          'bg-danger-light text-white hover:brightness-95 dark:bg-danger-dark dark:text-ink-dark',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';
