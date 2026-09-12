import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Centered auth card shell shared by the login and registration forms. */
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
    <div className="mx-auto w-full max-w-md rounded-xl border border-line-light bg-surface-light p-6 dark:border-line-dark dark:bg-surface-dark">
      <h1 className="text-xl font-semibold text-ink-light dark:text-ink-dark">{title}</h1>
      <p className="mt-1 text-sm text-subink-light dark:text-subink-dark">{subtitle}</p>
      <div className="mt-6">{children}</div>
      <div className="mt-6 border-t border-line-light pt-4 text-center text-sm text-subink-light dark:border-line-dark dark:text-subink-dark">
        {footer}
      </div>
    </div>
  );
}

/** Inline link styled for auth card footers. */
export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-primary hover:underline dark:text-primary-dark">
      {children}
    </Link>
  );
}
