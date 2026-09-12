import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { cn } from '../../lib/utils.js';

/**
 * Animated panel wrapper (SNZ-038).
 *
 * Panels and result cards fade/slide in on mount — subtle opacity and
 * vertical shift only. When the OS requests reduced motion, or while the
 * preference cannot be determined, it renders a plain container with zero
 * animation. Never use this (or any motion) for typing or per-character
 * effects inside active editors.
 */
export function AnimatedPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div data-motion="off" className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      data-motion="on"
      className={cn(className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
