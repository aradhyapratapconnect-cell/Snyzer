import { test, expect } from '@playwright/test';

/**
 * E2E smoke spec (SNZ-057). Proves the Playwright runner boots the app and
 * drives a real page headlessly. Full user journeys live in
 * `e2e/core-flow.spec.ts` (SNZ-058).
 */
test('landing page renders the getting-started content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Improve your writing' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Getting started' }).getByRole('link', { name: 'Sign in' }),
  ).toBeVisible();
});
