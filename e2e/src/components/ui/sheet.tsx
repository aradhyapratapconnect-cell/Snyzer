import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Sheet drawer primitive (SNZ-036; shadcn-style). Powers the mobile
 * navigation overlay; sides configurable, Escape + overlay dismissal free
 * via Radix Dialog.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'left' | 'right';
  }
>(({ side = 'right', className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-20 bg-black/50" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-20 flex h-full w-72 flex-col gap-4 border-line-light bg-surface-light p-6 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-line-dark dark:bg-surface-dark',
        side === 'left' ? 'left-0 top-0 border-r' : 'right-0 top-0 border-l',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

export const SheetTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-ink-light dark:text-ink-dark', className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;
