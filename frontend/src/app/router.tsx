import { createBrowserRouter, Link, useLocation } from 'react-router-dom';
import { App } from './App.js';
import { ForgotPasswordPage } from './ForgotPasswordPage.js';
import { LoginPage } from './LoginPage.js';
import { RegisterPage } from './RegisterPage.js';
import { ResetPasswordPage } from './ResetPasswordPage.js';
import { SettingsPage } from './settings/page.js';
import { WorkspacePage } from './WorkspacePage.js';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.js';

/**
 * Placeholder index content until the workspace feature route arrives.
 * Exported so component tests can mount the same route structure. Also
 * surfaces one-shot notices (e.g. post-deletion confirmation) carried in
 * navigation state until the toast system arrives (SNZ-039).
 */
export function GettingStarted() {
  const location = useLocation();
  const notice =
    typeof location.state === 'object' && location.state !== null && 'notice' in location.state
      ? String((location.state as { notice: unknown }).notice)
      : null;
  return (
    <section aria-label="Getting started">
      {notice !== null && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
        >
          {notice}
        </div>
      )}
      <h1 className="text-2xl font-semibold">Improve your writing</h1>
      <p className="mt-2 text-sm text-subink-light dark:text-subink-dark">
        Sign in and open the workspace to revise text while preserving your meaning and intent. The
        full editor arrives in an upcoming ticket.
      </p>
      <p className="mt-4 text-sm">
        <Link
          to="/login"
          className="font-medium text-primary hover:underline dark:text-primary-dark"
        >
          Sign in
        </Link>{' '}
        <span className="text-subink-light dark:text-subink-dark">or</span>{' '}
        <Link
          to="/register"
          className="font-medium text-primary hover:underline dark:text-primary-dark"
        >
          create an account
        </Link>
        .
      </p>
    </section>
  );
}

/**
 * Base router (SNZ-003; auth + workspace routes SNZ-013; recovery SNZ-014;
 * guards SNZ-015; settings SNZ-034). History routes arrive in later tickets.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <GettingStarted /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      {
        path: 'workspace',
        element: (
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
