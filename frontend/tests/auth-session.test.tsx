import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session, User } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordForm } from '../src/features/auth/ResetPasswordForm.js';
import { UpdatePasswordForm } from '../src/features/auth/UpdatePasswordForm.js';
import { UserMenu } from '../src/features/auth/UserMenu.js';
import { initialAuthState, useAuthStore } from '../src/stores/useAuthStore.js';

/**
 * SNZ-014 tests: sign-out cleanup, password-reset request/update flows, and
 * the header session menu — all with a mocked Supabase client. No network.
 */
const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({
    auth: {
      signOut: mocks.signOut,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      updateUser: mocks.updateUser,
    },
  }),
}));

const signedOut = { ...initialAuthState };

function signedInState() {
  const user = { id: 'user-1', email: 'ada@example.com' } as User;
  const session = { access_token: 'token', user } as Session;
  return { isInitialized: true, isAuthenticated: true, user, session };
}

function renderWithRouter(path: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={element} />
        <Route path="/login" element={<p>Sign in page marker</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signOut.mockResolvedValue({ error: null });
  useAuthStore.setState({ ...signedOut, signOut: useAuthStore.getState().signOut });
});

describe('signOut', () => {
  it('revokes the session and clears local auth state', async () => {
    useAuthStore.setState({ ...signedInState(), signOut: useAuthStore.getState().signOut });

    await useAuthStore.getState().signOut();
    const state = useAuthStore.getState();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('clears local state even when the server call fails', async () => {
    mocks.signOut.mockRejectedValue(new Error('network down'));
    useAuthStore.setState({ ...signedInState(), signOut: useAuthStore.getState().signOut });

    await useAuthStore.getState().signOut();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('ResetPasswordForm', () => {
  it('validates the email before submitting', async () => {
    const user = userEvent.setup();
    renderWithRouter('/forgot-password', <ResetPasswordForm />);

    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(mocks.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('sends the reset link and shows a confirmation', async () => {
    const user = userEvent.setup();
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    renderWithRouter('/forgot-password', <ResetPasswordForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
        'ada@example.com',
        expect.objectContaining({ redirectTo: expect.stringMatching(/\/reset-password$/) }),
      );
    });
    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument();
  });

  it('shows a friendly error when sending fails', async () => {
    const user = userEvent.setup();
    mocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { message: 'boom' } });
    renderWithRouter('/forgot-password', <ResetPasswordForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(
      await screen.findByText('Could not send the reset link. Please try again.'),
    ).toBeInTheDocument();
  });
});

describe('UpdatePasswordForm', () => {
  it('validates the new password length', async () => {
    const user = userEvent.setup();
    renderWithRouter('/reset-password', <UpdatePasswordForm />);

    await user.type(screen.getByLabelText(/new password/i), 'short');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('updates the password and shows a success state', async () => {
    const user = userEvent.setup();
    mocks.updateUser.mockResolvedValue({ data: {}, error: null });
    renderWithRouter('/reset-password', <UpdatePasswordForm />);

    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
    });
    expect(await screen.findByRole('heading', { name: 'Password updated' })).toBeInTheDocument();
  });

  it('explains expired links with a recovery path', async () => {
    const user = userEvent.setup();
    mocks.updateUser.mockResolvedValue({ data: {}, error: { message: 'Auth session missing!' } });
    renderWithRouter('/reset-password', <UpdatePasswordForm />);

    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      await screen.findByText(
        'This reset link is invalid or has expired. Request a new one and try again.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new one' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });
});

describe('UserMenu', () => {
  it('shows a sign-in link when signed out', () => {
    renderWithRouter('/', <UserMenu />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Account menu' })).not.toBeInTheDocument();
  });

  it('signs out, clears state, and redirects to login', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ ...signedInState(), signOut: useAuthStore.getState().signOut });
    renderWithRouter('/', <UserMenu />);

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(await screen.findByText('Sign in page marker')).toBeInTheDocument();
  });

  it('closes the menu on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ ...signedInState(), signOut: useAuthStore.getState().signOut });
    renderWithRouter('/', <UserMenu />);

    await user.click(screen.getByRole('button', { name: 'Account menu' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account menu' })).toHaveFocus();
  });
});
