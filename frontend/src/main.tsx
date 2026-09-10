import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router.js';
import { RootErrorBoundary } from './components/RootErrorBoundary.js';
import { getFrontendEnv } from './lib/env.js';
import './styles/index.css';

/**
 * Frontend entrypoint (SNZ-003; env validation SNZ-004). Validates public
 * env before mounting so misconfiguration fails fast instead of producing
 * cryptic runtime errors.
 */
getFrontendEnv();

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root not found');
}

createRoot(container).render(
  <StrictMode>
    <RootErrorBoundary>
      <RouterProvider router={router} />
    </RootErrorBoundary>
  </StrictMode>,
);
