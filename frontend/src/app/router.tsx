import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AboutPage } from './AboutPage.js';
import { App } from './App.js';
import { ForgotPasswordPage } from './ForgotPasswordPage.js';
import { HistoryPage } from './history/page.js';
import { HomePage } from './HomePage.js';
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
  return <HomePage />;
}

/**
 * Base router (SNZ-003; auth + workspace routes SNZ-013; recovery SNZ-014;
 * guards SNZ-015; settings SNZ-034; history SNZ-050).
 *
 * `/playground` is an alias of the canonical `/workspace` route so the
 * product surface can use the demo-reference "Playground" name.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <GettingStarted /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'playground', element: <Navigate to="/workspace" replace /> },
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
