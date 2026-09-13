import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration (SNZ-057).
 *
 * Specs live in `e2e/` and run headless Chromium against the frontend dev
 * server. All backend (`/api/*`) and Supabase traffic is intercepted per-test
 * via `page.route`, so the suite needs no live database, Supabase project, or
 * OpenRouter key — dummy `VITE_*` values satisfy the frontend env gate. The
 * dev server (not preview) keeps runs fast; the production bundle is covered
 * separately by the SNZ-059 build verification script.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -w @snyzer/frontend -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 90_000,
    env: {
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'dummy-publishable-key',
    },
  },
});
