import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Core user-flow E2E suite (SNZ-058).
 *
 * Covers the three critical journeys headlessly against the dev server with
 * all transport mocked at the network layer — no live Supabase, database, or
 * OpenRouter needed:
 *
 * - Supabase Auth (the auth-v1 signup endpoint) returns a synthetic GoTrue session, so
 *   the real client persists it and the real route guards engage.
 * - The backend (`/api/v1/*`) is a small stateful in-test double (preferences
 *   persist across reloads; created jobs appear in history; deletes remove).
 *
 * Deviation from the ticket: Flow 3 specifies an "Input-first" layout switch,
 * but the app exposes no layout-switch control (layout follows the stored
 * preference/viewport only), so Flow 3 proves theme persistence across reload
 * plus draft preservation on network failure instead.
 */

const SUPABASE_HOST = 'https://example.supabase.co';
const DRAFT = 'The quick brown fox jumps over the lazy dog near the riverbank.';
const REVISED = 'The quick brown fox leaps over the lazy dog by the riverbank.';

const ANALYSIS = {
  readability: 82,
  clarity: 88,
  repetition: 12,
  sentenceVariety: 74,
  vocabularyComplexity: 61,
  formality: 79,
};

interface MockJob {
  id: string;
  inputText: string;
  outputText: string;
}

interface MockState {
  prefs: Record<string, unknown>;
  jobs: MockJob[];
  lastPostBody: Record<string, unknown> | null;
  lastPatchBody: Record<string, unknown> | null;
  failNextPost: boolean;
}

function newState(): MockState {
  return {
    prefs: {
      theme: 'system',
      workspaceLayout: 'side_by_side',
      editorMode: 'plain',
      defaultTone: 'professional',
    },
    jobs: [],
    lastPostBody: null,
    lastPatchBody: null,
    failNextPost: false,
  };
}

function signupPayload() {
  return {
    access_token: 'e2e-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'e2e-refresh-token',
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@example.com',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

/** Installs the Supabase + backend doubles and returns the shared mock state. */
async function installMocks(page: Page, state: MockState): Promise<void> {
  // Glob tolerates GoTrue query params (e.g. `?redirect_to=` from signup
  // options, `?grant_type=` on the token endpoint); the doubles answer any
  // auth call with a synthetic session.
  await page.route(`${SUPABASE_HOST}/auth/v1/signup*`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(signupPayload()),
    });
  });

  await page.route(`${SUPABASE_HOST}/auth/v1/token*`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(signupPayload()),
    });
  });

  await page.route('**/api/v1/**', async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/, '');

    if (method === 'GET' && path === '/preferences') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ preferences: state.prefs }),
      });
      return;
    }
    if (method === 'GET' && path === '/presets') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ presets: [] }),
      });
      return;
    }
    if (method === 'PATCH' && path === '/preferences') {
      state.lastPatchBody = request.postDataJSON() as Record<string, unknown>;
      state.prefs = { ...state.prefs, ...state.lastPatchBody };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ preferences: state.prefs }),
      });
      return;
    }
    if (method === 'POST' && path === '/writing/jobs') {
      if (state.failNextPost) {
        state.failNextPost = false;
        await route.abort('failed');
        return;
      }
      state.lastPostBody = request.postDataJSON() as Record<string, unknown>;
      const job: MockJob = {
        id: '22222222-2222-4222-8222-222222222222',
        inputText: String(state.lastPostBody['inputText'] ?? ''),
        outputText: REVISED,
      };
      state.jobs.unshift(job);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          job: { id: job.id, status: 'completed', outputText: job.outputText, analysis: ANALYSIS },
        }),
      });
      return;
    }
    if (method === 'GET' && path === '/writing/jobs') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobs: state.jobs.map((job) => ({
            id: job.id,
            input_preview: job.inputText.slice(0, 120),
            output_preview: job.outputText.slice(0, 120),
            mode: 'formal',
            tone: 'professional',
            status: 'completed',
            created_at: new Date().toISOString(),
          })),
          total: state.jobs.length,
          limit: 20,
          offset: 0,
        }),
      });
      return;
    }
    const detailMatch = /^\/writing\/jobs\/([0-9a-f-]+)$/.exec(path);
    if (detailMatch !== null) {
      const job = state.jobs.find((candidate) => candidate.id === detailMatch[1]);
      if (method === 'GET') {
        if (job === undefined) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found.' } }),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            job: {
              id: job.id,
              input_text: job.inputText,
              output_text: job.outputText,
              mode: 'formal',
              tone: 'professional',
              analysis: ANALYSIS,
              status: 'completed',
              created_at: new Date().toISOString(),
            },
          }),
        });
        return;
      }
      if (method === 'DELETE') {
        state.jobs = state.jobs.filter((candidate) => candidate.id !== detailMatch[1]);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ deleted: true }),
        });
        return;
      }
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Not found.' } }),
    });
  });
}

/** Registers through the real form (Supabase transport mocked) and lands in the workspace. */
async function registerAndEnterWorkspace(page: Page): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Email').fill('e2e@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('correct-horse-12');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByRole('heading', { name: 'Workspace' })).toBeVisible();
}

async function primaryNav(page: Page, name: string): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name, exact: true })
    .click();
}

test.describe('core user flows', () => {
  test('Flow 1: sign up, improve in Formal mode, inspect revision and metrics', async ({
    page,
  }) => {
    const state = newState();
    await installMocks(page, state);
    await registerAndEnterWorkspace(page);

    await page.getByLabel('Your draft').fill(DRAFT);
    await page.getByRole('button', { name: 'Formal', exact: true }).click();
    await page.getByRole('button', { name: 'Improve writing' }).click();

    await expect(page.getByText(REVISED)).toBeVisible();
    await expect(page.getByText('Readability')).toBeVisible();
    expect(state.lastPostBody).toMatchObject({ inputText: DRAFT, mode: 'formal' });
  });

  test('Flow 2: copy result, verify history entry, delete it', async ({ page, context }) => {
    const state = newState();
    await installMocks(page, state);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await registerAndEnterWorkspace(page);

    await page.getByLabel('Your draft').fill(DRAFT);
    await page.getByRole('button', { name: 'Improve writing' }).click();
    await expect(page.getByText(REVISED)).toBeVisible();

    await page.getByRole('button', { name: 'Copy', exact: true }).click();
    await expect(page.getByRole('button', { name: /Copied/ })).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'History', exact: true })
      .click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByText(DRAFT.slice(0, 30))).toBeVisible();

    await page.getByRole('button', { name: 'View details' }).click();
    await expect(page.getByRole('dialog')).toContainText('Writing details');
    await page.getByRole('button', { name: 'Delete from History' }).click();

    await expect(page.getByText('No writing history yet')).toBeVisible();
    expect(state.jobs).toHaveLength(0);
  });

  test('Flow 3: theme persists across reload; draft survives a network failure', async ({
    page,
  }) => {
    const state = newState();
    await installMocks(page, state);
    await registerAndEnterWorkspace(page);

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Settings', exact: true })
      .click();
    await expect(page).toHaveURL(/\/settings$/);
    await page.getByLabel('Theme').selectOption('dark');
    await expect.poll(async () => state.lastPatchBody).toMatchObject({ theme: 'dark' });
    await expect(page.locator('html.dark')).toBeAttached();

    await page.reload();
    await page.getByRole('link', { name: 'Workspace', exact: true }).click();
    await expect(page.locator('html.dark')).toBeAttached();

    await page.getByLabel('Your draft').fill(DRAFT);
    state.failNextPost = true;
    await page.getByRole('button', { name: 'Improve writing' }).click();
    await expect(page.getByRole('alert').first()).toContainText('Your text was preserved');
    await expect(page.getByLabel('Your draft')).toHaveValue(DRAFT);

    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText(REVISED)).toBeVisible();
  });

  test('Flow 4: sign out, sign back in, server preferences persist', async ({ page }) => {
    const state = newState();
    await installMocks(page, state);
    await registerAndEnterWorkspace(page);

    await primaryNav(page, 'Settings');
    await expect(page).toHaveURL(/\/settings$/);
    await page.getByLabel('Theme').selectOption('dark');
    await expect.poll(async () => state.lastPatchBody).toMatchObject({ theme: 'dark' });

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill('e2e@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('correct-horse-12');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole('heading', { name: 'Workspace' })).toBeVisible();

    await primaryNav(page, 'Settings');
    await expect(page.getByLabel('Theme')).toHaveValue('dark');
    await expect(page.locator('html.dark')).toBeAttached();
  });
});
