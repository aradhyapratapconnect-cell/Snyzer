import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session, User } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../src/app/settings/page.js';
import { GettingStarted } from '../src/app/router.js';
import { Toaster } from '../src/components/ui/toaster.js';
import { useAuthStore } from '../src/stores/useAuthStore.js';
import { usePreferencesStore } from '../src/stores/usePreferencesStore.js';

/**
 * SNZ-034 component tests (SNZ-039 toast): settings content,
 * deletion-modal discipline, and the full delete → sign-out → toast flow.
 * Supabase and the API client are mocked; no network involved.
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
      <Toaster />
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<GettingStarted />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
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

  it('hydrates workspace defaults from the server on mount', async () => {
    apiRequestMock.mockImplementation(async (path: string) => {
      if (path === '/preferences') {
        return {
          preferences: {
            theme: 'dark',
            workspaceLayout: 'input_first',
            editorMode: 'rich',
            defaultTone: 'casual',
          },
        };
      }
      return {};
    });
    usePreferencesStore.setState({
      theme: 'system',
      workspaceLayout: 'side_by_side',
      editorMode: 'plain',
      defaultTone: 'professional',
      status: 'idle',
      error: null,
      loaded: false,
    });
    renderSettings();

    await waitFor(() => {
      expect(screen.getByLabelText('Default tone')).toHaveValue('casual');
    });
    expect(screen.getByLabelText('Editor')).toHaveValue('rich');
    expect(screen.getByLabelText('Layout')).toHaveValue('input_first');
    expect(usePreferencesStore.getState().loaded).toBe(true);
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
    // Mount hydration may issue GET /preferences; what matters here is that
    // dismissing never triggers the destructive call.
    expect(apiRequestMock).not.toHaveBeenCalledWith('/account', expect.anything());

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalledWith('/account', expect.anything());
  });

  it('deletes, signs out, toasts, and lands home', async () => {
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
    expect(
      await screen.findByRole('heading', { name: 'Improve your writing' }),
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
