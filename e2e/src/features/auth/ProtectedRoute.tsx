import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { Spinner } from '../../components/ui/spinner.js';

/**
 * Route guard (SNZ-015). Renders children only for authenticated users.
 *
 * While the session check is in flight it shows an accessible loading state
 * (never a premature redirect); unauthenticated visits redirect to `/login`
 * with the attempted URL preserved in `state.from` so a successful sign-in
 * returns the user where they were headed.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isInitialized, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div
        role="status"
        aria-label="Checking your session"
        className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-subink-light dark:text-subink-dark"
      >
        <Spinner />
        <span>Checking your session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

/**
 * Post-auth redirect target. Honors the guard-provided `from` path only when
 * it is a same-origin absolute path; anything else falls back to the
 * workspace (open-redirect guard).
 */
export function resolvePostAuthRedirect(state: unknown): string {
  const from =
    typeof state === 'object' && state !== null && 'from' in state
      ? (state as { from?: unknown }).from
      : undefined;
  if (typeof from === 'string' && from.startsWith('/')) {
    return from;
  }
  return '/workspace';
}
