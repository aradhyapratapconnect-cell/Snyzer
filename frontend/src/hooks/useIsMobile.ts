import { useEffect, useState } from 'react';

/**
 * Narrow-viewport detection (SNZ-037). Matches the mobile breakpoint below
 * which the workspace forces the stacked layout to prevent horizontal
 * overflow. Listens live so rotations and resizes rearrange instantly.
 */
export const MOBILE_MAX_WIDTH = 767;

export function useIsMobile(breakpoint: number = MOBILE_MAX_WIDTH): boolean {
  const query = `(max-width: ${breakpoint}px)`;
  const canMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
  const [isMobile, setIsMobile] = useState(() =>
    canMatchMedia ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (!canMatchMedia) {
      return;
    }
    const media = window.matchMedia(query);
    const onChange = () => {
      setIsMobile(media.matches);
    };
    onChange();
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  }, [query, canMatchMedia]);

  return isMobile;
}
