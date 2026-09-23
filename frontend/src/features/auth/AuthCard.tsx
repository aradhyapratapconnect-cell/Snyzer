import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { SnyzerLogo } from '../../components/brand/SnyzerLogo.js';

/**
 * Centered auth shell shared by the login, registration, and recovery forms.
 *
 * Demo-reference presentation (brand panel + form panel) over the real
 * Supabase Auth flows. The brand checklist states real product facts only;
 * no OAuth buttons render because no provider is configured.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-4xl overflow-hidden rounded-3xl border border-teal-500/20 bg-surface-light shadow-2xl lg:grid-cols-12 dark:bg-surface-dark">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#000411] via-[#091e3a] to-[#002416] p-8 lg:col-span-5 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div className="relative">
          <SnyzerLogo size="sm" />
          <p className="font-code mt-3 inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/60 px-2.5 py-1 text-[11px] text-teal-300">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Secured by Supabase Auth
          </p>
        </div>
        <div className="relative">
          <p className="font-display text-3xl leading-tight font-bold text-white">
            Clearer prose,{' '}
            <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">
              same intent.
            </span>
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Email confirmation on signup
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Private per-user writing history
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              Live streaming revisions
            </li>
          </ul>
        </div>
      </div>
      <div className="p-6 sm:p-8 lg:col-span-7">
        <h1 className="text-xl font-semibold text-ink-light dark:text-ink-dark">{title}</h1>
        <p className="mt-1 text-sm text-subink-light dark:text-subink-dark">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 border-t border-line-light pt-4 text-center text-sm text-subink-light dark:border-line-dark dark:text-subink-dark">
          {footer}
        </div>
      </div>
    </div>
  );
}

/** Inline link styled for auth card footers. */
export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="font-medium text-teal-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:text-teal-300"
    >
      {children}
    </Link>
  );
}
