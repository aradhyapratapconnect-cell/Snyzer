import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vite + Vitest configuration (SNZ-003). React plugin for JSX/Fast Refresh;
 * jsdom + Testing Library setup for component tests.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
