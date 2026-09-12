import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session, User } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../src/app/settings/page.js';
import { GettingStarted } from '../src/app/router.js';
import { useAuthStore } from '../src/stores/useAuthStore.js';

/**
 * SNZ-034 component tests: settings content, deletion-modal discipline, and
 * the full delete → sign-out → home-notice flow. Supabase and the API
 * client are mocked; no network involved.
 */
const apiRequestMock = vi.fn();
vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const signOutMock = vi.fn();
vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({ auth: { signOut: signOutMock } }),
}));

function signedInState() {
  const user = {
    id: 'user-1',
    email: 'ada@example.com',
    app_metadata: { role: 'FREE_USER' },
    user_metadata: { display_name: 'Ada' },
  } as unknown as User;
  const session = { access_token: 'token', user } as Session;
  return { isInitialized: true, isAuthenticated: true, user, session };
}

function renderSettings(path = '/settings') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<GettingStarted />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiRequestMock.mockResolvedValue({});
  signOutMock.mockResolvedValue({ error: null });
  useAuthStore.setState({
    ...signedInState(),
    signOut: async () => {
      await signOutMock();
      useAuthStore.setState({ isAuthenticated: false, user: null, session: null });
    },
  });
});

describe('SettingsPage', () => {
  it('shows account details, plan tier, and the theme switcher', () => {
    renderSettings();

    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('FREE_USER')).toBeInTheDocument();
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
  });
});

describe('DeleteAccountModal', () => {
  async function openModal(user: ReturnType<typeof userEvent.setup>) {
    renderSettings();
    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  }

  it('keeps deletion disabled until DELETE is typed exactly', async () => {
    const user = userEvent.setup();
    await openModal(user);
    const confirm = screen.getByRole('button', { name: 'Delete everything' });

    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText(/type delete to confirm/i), 'delete');
    expect(confirm).toBeDisabled();
    await user.clear(screen.getByLabelText(/type delete to confirm/i));
    await user.type(screen.getByLabelText(/type delete to confirm/i), 'DELETE');
    expect(confirm).toBeEnabled();
  });

  it('closes on Escape and Cancel without deleting', async () => {
    const user = userEvent.setup();
    await openModal(user);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('deletes, signs out, and lands home with a notice', async () => {
    const user = userEvent.setup();
    await openModal(user);

    await user.type(screen.getByLabelText(/type delete to confirm/i), 'DELETE');
    await user.click(screen.getByRole('button', { name: 'Delete everything' }));

    expect(apiRequestMock).toHaveBeenCalledWith('/account', { method: 'DELETE' });
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(
      await screen.findByText('Your account and all of its data have been permanently deleted.'),
    ).toBeInTheDocument();
  });

  it('reports backend failures without closing', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockRejectedValue(new Error('service down'));
    await openModal(user);

    await user.type(screen.getByLabelText(/type delete to confirm/i), 'DELETE');
    await user.click(screen.getByRole('button', { name: 'Delete everything' }));

    expect(
      await screen.findByText('Could not delete your account. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
