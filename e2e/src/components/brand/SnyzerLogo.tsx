/**
 * Snyzer brand mark (production).
 *
 * Recreates the demo reference's circular glowing medallion with pure CSS —
 * no image asset — so the production bundle stays self-contained. The glyph
 * is a Bodoni "S" over a teal→emerald gradient aura.
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
  const sizeClasses =
    size === 'sm'
      ? 'h-8 w-8 text-base'
      : size === 'lg'
        ? 'h-12 w-12 text-2xl'
        : 'h-10 w-10 text-xl';

  return (
    <span className={`inline-flex cursor-pointer items-center gap-3 select-none ${className}`}>
      <span className="group relative">
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-400 opacity-50 blur-[6px] transition duration-300 group-hover:opacity-80" />
        <span
          aria-hidden="true"
          className={`font-display relative flex ${sizeClasses} items-center justify-center overflow-hidden rounded-full border border-teal-400/50 bg-[#04111d] font-bold text-teal-300 shadow-[0_0_18px_rgba(45,212,191,0.35)] transition-transform duration-300 group-hover:scale-105`}
        >
          S
        </span>
      </span>
      {showText && (
        <span className="font-display text-2xl font-bold tracking-tight text-white">Snyzer</span>
      )}
    </span>
  );
}
