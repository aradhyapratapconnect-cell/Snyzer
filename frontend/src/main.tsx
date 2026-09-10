import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router.js';
import { RootErrorBoundary } from './components/RootErrorBoundary.js';
import './styles/index.css';

/**
 * Frontend entrypoint (SNZ-003). Mounts the router inside the root error
 * boundary. Replaces the SNZ-001 `main.ts` skeleton.
 */
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
