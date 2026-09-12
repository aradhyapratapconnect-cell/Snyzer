import { useEffect, useState } from 'react';

/**
 * Reduced-motion detection (SNZ-038). Tracks the OS
 * `prefers-reduced-motion: reduce` preference live so animations can opt out
 * the moment the user changes the setting.
 */
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => {
      setReduced(media.matches);
    };
    onChange();
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  }, [query]);

  return reduced;
}
