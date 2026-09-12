import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vite + Vitest configuration (SNZ-003; dev API proxy SNZ-020). React plugin
 * for JSX/Fast Refresh; jsdom + Testing Library setup for component tests.
 *
 * The apiClient targets same-origin `/api/v1`. During local development the
 * dev server proxies that prefix to the backend so no frontend env vars or
 * CORS exceptions are needed (`BACKEND_URL` overrides the default when the
 * backend runs elsewhere). Production serves both from one origin.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env['BACKEND_URL'] ?? 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
