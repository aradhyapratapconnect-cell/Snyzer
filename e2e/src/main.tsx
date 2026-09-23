import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router.js';
import { RootErrorBoundary } from './components/RootErrorBoundary.js';
import { ThemeProvider } from './components/theme-provider.js';
import { getFrontendEnv } from './lib/env.js';
import { useAuthStore } from './stores/useAuthStore.js';
import './styles/index.css';

/**
 * Frontend entrypoint (SNZ-003; env validation SNZ-004; auth SNZ-011; theme
 * SNZ-033). Validates public env before mounting so misconfiguration fails
 * fast instead of producing cryptic runtime errors, then starts the
 * persisted session check that feeds the auth store.
 */
getFrontendEnv();
void useAuthStore.getState().initialize();

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root not found');
}

createRoot(container).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
