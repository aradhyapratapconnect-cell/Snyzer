import { createBrowserRouter, Link } from 'react-router-dom';
import { App } from './App.js';
import { ForgotPasswordPage } from './ForgotPasswordPage.js';
import { HistoryPage } from './history/page.js';
import { LoginPage } from './LoginPage.js';
import { RegisterPage } from './RegisterPage.js';
import { ResetPasswordPage } from './ResetPasswordPage.js';
import { SettingsPage } from './settings/page.js';
import { WorkspacePage } from './WorkspacePage.js';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.js';

/**
 * Placeholder index content until the workspace feature route arrives.
 * Exported so component tests can mount the same route structure.
 */
export function GettingStarted() {
  return (
    <section aria-label="Getting started">
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
 * guards SNZ-015; settings SNZ-034; history SNZ-050).
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
      {
        path: 'history',
        element: (
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
