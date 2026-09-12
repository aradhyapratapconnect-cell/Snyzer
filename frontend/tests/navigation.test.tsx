import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session, User } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../src/components/layout/Header.js';
import { useAuthStore } from '../src/stores/useAuthStore.js';

/**
 * SNZ-036 navigation tests: desktop links with active indication, account
 * menu integration, and the mobile drawer — all with a mocked session. No
 * network involved. (Viewport-width enforcement is CSS-driven and covered
 * by viewport tests in SNZ-037 / Playwright in SNZ-058.)
 */
vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({ auth: { signOut: vi.fn(async () => ({ error: null })) } }),
}));

function signedInState() {
  const user = { id: 'user-1', email: 'ada@example.com' } as unknown as User;
  const session = { access_token: 'token', user } as Session;
  return { isInitialized: true, isAuthenticated: true, user, session };
}

function renderHeader(path = '/workspace') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<Header />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({
    isInitialized: true,
    isAuthenticated: false,
    user: null,
    session: null,
  });
});

describe('Header navigation', () => {
  it('renders brand and all three section links', () => {
    renderHeader();

    expect(screen.getByText('Snyzer')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const label of ['Workspace', 'History', 'Settings']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('indicates the active route without relying on color alone', () => {
    renderHeader('/settings');

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const settings = within(nav).getByRole('link', { name: 'Settings' });
    expect(settings).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Workspace' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('hosts the account menu for signed-in users', async () => {
    const user = userEvent.setup();
    useAuthStore.setState(signedInState());
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('opens the mobile drawer with navigation links', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const dialog = await screen.findByRole('dialog');
    for (const label of ['Workspace', 'History', 'Settings']) {
      expect(within(dialog).getByRole('link', { name: label })).toBeInTheDocument();
    }

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
