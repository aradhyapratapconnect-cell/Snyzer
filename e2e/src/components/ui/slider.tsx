import * as SliderPrimitive from '@radix-ui/react-slider';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Slider primitive (SNZ-044; shadcn-style). Keyboard-operable via arrow keys
 * with visible focus, labelled by the calling control.
 */
export const Slider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { thumbAriaLabel?: string }
>(({ className, thumbAriaLabel, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted-light dark:bg-muted-dark">
      <SliderPrimitive.Range className="absolute h-full bg-primary dark:bg-primary-dark" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label={thumbAriaLabel}
      className="block h-5 w-5 rounded-full border-2 border-primary bg-surface-light shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 dark:border-primary-dark dark:bg-surface-dark"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;
