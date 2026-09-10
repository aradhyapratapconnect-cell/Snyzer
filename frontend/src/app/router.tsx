import { createBrowserRouter } from 'react-router-dom';
import { App } from './App.js';

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
    </section>
  );
}

/**
 * Base router (SNZ-003). A single root route renders the application layout;
 * feature routes (workspace, history, settings) arrive in later tickets.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [{ index: true, element: <GettingStarted /> }],
  },
]);
