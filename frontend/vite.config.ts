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
  build: {
    // Vendor chunking (SNZ-059): the un-split bundle exceeded 1.1 MB, so each
    // route load paid for the editor, auth client, and UI kit up front.
    // Grouping disjoint third-party packages keeps the entry chunk small and
    // lets browsers cache slow-moving vendor code across deploys.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'framer-motion',
            'lucide-react',
            'sonner',
          ],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod', 'zustand'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // jsdom + Tiptap suites are CPU-heavy; unconstrained forks starve each
    // other on modest machines and produce timing flakes. Two workers plus a
    // generous timeout keeps the suite deterministic.
    pool: 'forks',
    poolOptions: { forks: { maxForks: 2 } },
    testTimeout: 15000,
  },
});
