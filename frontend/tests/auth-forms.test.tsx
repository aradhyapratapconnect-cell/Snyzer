import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/app/LoginPage.js';
import { RegisterPage } from '../src/app/RegisterPage.js';
import { WorkspacePage } from '../src/app/WorkspacePage.js';

/**
 * SNZ-013 component tests: auth form idle, validation, submit, error, and
 * keyboard states with a mocked Supabase client. No network involved.
 */
const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  resend: vi.fn(),
}));

vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({
    auth: {
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      resend: mocks.resend,
    },
  }),
}));

const okResponse = {
  data: {
    user: { id: 'user-1' },
    session: { access_token: 'token', user: { id: 'user-1' } },
  },
  error: null,
};

function renderAt(path: '/login' | '/register') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) {
  await user.type(screen.getByLabelText(/^email$/i), email);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.click(screen.getByRole('button', { name: /create account|sign in/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signUp.mockResolvedValue(okResponse);
  mocks.signInWithPassword.mockResolvedValue(okResponse);
  mocks.resend.mockResolvedValue({ data: {}, error: null });
});

describe('RegisterForm', () => {
  it('renders labeled fields with password hidden and an enabled submit', () => {
    renderAt('/register');

    expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  it('shows validation errors for empty and invalid input', async () => {
    const user = userEvent.setup();
    renderAt('/register');

    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it('toggles password visibility without losing content', async () => {
    const user = userEvent.setup();
    renderAt('/register');
    const password = screen.getByLabelText(/^password$/i);
    await user.type(password, 'secret123');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('secret123');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('creates the account and navigates to the workspace on success', async () => {
    const user = userEvent.setup();
    renderAt('/register');

    await fillAndSubmit(user, 'ada@example.com', 'password123');

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password123',
        options: { emailRedirectTo: window.location.origin },
      });
    });
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
  });

  it('shows a friendly message when the email is already registered', async () => {
    const user = userEvent.setup();
    mocks.signUp.mockResolvedValue({ data: {}, error: { message: 'User already registered' } });
    renderAt('/register');

    await fillAndSubmit(user, 'ada@example.com', 'password123');

    expect(
      await screen.findByText('An account with this email already exists. Try signing in instead.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('User already registered')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Workspace' })).not.toBeInTheDocument();
  });

  it('shows a confirmation notice instead of navigating when no session is issued', async () => {
    const user = userEvent.setup();
    mocks.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });
    renderAt('/register');

    await fillAndSubmit(user, 'ada@example.com', 'password123');

    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument();
    expect(screen.getByText(/ada@example.com/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Workspace' })).not.toBeInTheDocument();
  });

  it('resends the confirmation link from the inbox notice', async () => {
    const user = userEvent.setup();
    mocks.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });
    renderAt('/register');

    await fillAndSubmit(user, 'ada@example.com', 'password123');
    await user.click(await screen.findByRole('button', { name: 'Resend confirmation link' }));

    expect(mocks.resend).toHaveBeenCalledWith({ type: 'signup', email: 'ada@example.com' });
    expect(
      await screen.findByText('Confirmation link sent. Check your inbox.'),
    ).toBeInTheDocument();
  });

  it('reports resend failures without leaving the inbox notice', async () => {
    const user = userEvent.setup();
    mocks.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });
    mocks.resend.mockResolvedValue({ data: {}, error: { message: 'rate limited' } });
    renderAt('/register');

    await fillAndSubmit(user, 'ada@example.com', 'password123');
    await user.click(await screen.findByRole('button', { name: 'Resend confirmation link' }));

    expect(
      await screen.findByText('Could not resend the confirmation link. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument();
  });

  it('disables the submit button with a spinner while the request is in flight', async () => {
    const user = userEvent.setup();
    let resolveSignup!: (value: typeof okResponse) => void;
    mocks.signUp.mockReturnValue(
      new Promise((resolve) => {
        resolveSignup = resolve;
      }),
    );
    renderAt('/register');

    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('button', { name: 'Creating account…' })).toBeDisabled();
    resolveSignup(okResponse);
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
  });

  it('supports keyboard-only navigation across fields and submit', async () => {
    const user = userEvent.setup();
    renderAt('/register');

    await user.tab();
    expect(screen.getByLabelText(/^email$/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/^password$/i)).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Create account' })).toHaveFocus();
  });
});

describe('LoginForm', () => {
  it('signs in and navigates to the workspace on success', async () => {
    const user = userEvent.setup();
    renderAt('/login');

    await fillAndSubmit(user, 'ada@example.com', 'password123');

    await waitFor(() => {
      expect(mocks.signInWithPassword).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'password123',
      });
    });
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument();
  });

  it('shows a generic message for bad credentials without leaking details', async () => {
    const user = userEvent.setup();
    mocks.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    });
    renderAt('/login');

    await fillAndSubmit(user, 'ada@example.com', 'password123');

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(screen.queryByText('Invalid login credentials')).not.toBeInTheDocument();
  });

  it('shows the same generic message when the request itself fails', async () => {
    const user = userEvent.setup();
    mocks.signInWithPassword.mockRejectedValue(new Error('network down'));
    renderAt('/login');

    await fillAndSubmit(user, 'ada@example.com', 'password123');

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });
});
