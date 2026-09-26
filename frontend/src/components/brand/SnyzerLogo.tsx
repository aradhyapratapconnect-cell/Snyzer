import { useState } from 'react';

/**
 * Snyzer brand mark (production).
 *
 * Renders the official logo asset (`frontend/public/snyzer-logo.jpg`,
 * served at `/snyzer-logo.jpg`) inside the glowing medallion frame. If the
 * asset ever fails to load, it falls back to the CSS "S" monogram so the
 * brand never renders broken.
 */
export function SnyzerLogo({
  size = 'md',
  showText = true,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  return (
    <span className={`inline-flex cursor-pointer items-center gap-3 select-none ${className}`}>
      <span className="group relative">
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-400 opacity-50 blur-[6px] transition duration-300 group-hover:opacity-80" />
        <span
          aria-hidden="true"
          className={`relative flex ${sizeClasses} items-center justify-center overflow-hidden rounded-full border border-teal-400/50 bg-[#04111d] shadow-[0_0_18px_rgba(45,212,191,0.35)] transition-transform duration-300 group-hover:scale-105`}
        >
          {imgError ? (
            <span className="font-display text-xl font-bold text-teal-300">S</span>
          ) : (
            <img
              src="/snyzer-logo.jpg"
              alt=""
              onError={() => {
                setImgError(true);
              }}
              className="h-full w-full rounded-full object-cover select-none"
              draggable={false}
            />
          )}
        </span>
      </span>
      {showText && (
        <span className="font-display text-2xl font-bold tracking-tight text-white">Snyzer</span>
      )}
    </span>
  );
}
