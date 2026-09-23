import { ArrowRight, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Catch-all not-found page.
 *
 * Rendered for unknown routes inside the app shell. Offers a way back to
 * safety without exposing any backend or routing internals.
 */
export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center py-16 text-center">
      <div className="font-code mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-3 py-1 text-xs text-teal-300">
        <Compass className="h-3.5 w-3.5" aria-hidden="true" />
        <span>404 · Nothing here</span>
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 md:text-base">
        The page you asked for does not exist or was moved. Your drafts and history are unaffected.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/workspace"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-7 py-3 text-base font-semibold text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.35)] transition-all hover:scale-105 active:scale-95"
        >
          <span>Back to Workspace</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full border border-teal-400/25 bg-teal-950/20 px-7 py-3 text-base font-medium text-white backdrop-blur transition-all hover:border-teal-400/50 hover:text-teal-300"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
