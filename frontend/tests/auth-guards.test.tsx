import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session, User } from '@supabase/supabase-js';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/app/LoginPage.js';
import { RegisterPage } from '../src/app/RegisterPage.js';
import { ProtectedRoute, resolvePostAuthRedirect } from '../src/features/auth/ProtectedRoute.js';
import { useAuthStore } from '../src/stores/useAuthStore.js';

/**
 * SNZ-015 tests: guard states, login redirect-back, and open-redirect
 * protection. Supabase is mocked; routing is real (MemoryRouter).
 */
const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('../src/lib/supabase.js', () => ({
  getSupabaseClient: () => ({
    auth: { signUp: mocks.signUp, signInWithPassword: mocks.signInWithPassword },
  }),
}));

const okResponse = { data: { user: { id: 'user-1' }, session: null }, error: null };

function signedInState() {
  const user = { id: 'user-1', email: 'ada@example.com' } as User;
  const session = { access_token: 'token', user } as Session;
  return { isInitialized: true, isAuthenticated: true, user, session };
}

function signedOutState(initialized: boolean) {
  return { isInitialized: initialized, isAuthenticated: false, user: null, session: null };
}

function LocationProbe() {
  const location = useLocation();
  return <p>{`at:${location.pathname}`}</p>;
}

function renderWorkspaceAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <p>Workspace secret content</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signUp.mockResolvedValue(okResponse);
  mocks.signInWithPassword.mockResolvedValue(okResponse);
  useAuthStore.setState(signedOutState(false));
});

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    useAuthStore.setState(signedInState());
    renderWorkspaceAt('/workspace');

    expect(screen.getByText('Workspace secret content')).toBeInTheDocument();
  });

  it('shows a loading state while the session check is in flight', () => {
    useAuthStore.setState(signedOutState(false));
    renderWorkspaceAt('/workspace');

    expect(screen.getByRole('status', { name: 'Checking your session' })).toBeInTheDocument();
    expect(screen.queryByText('Workspace secret content')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visits to login without rendering children', () => {
    useAuthStore.setState(signedOutState(true));
    renderWorkspaceAt('/workspace');

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.queryByText('Workspace secret content')).not.toBeInTheDocument();
  });
});

describe('post-login redirect', () => {
  it('returns to the originally requested route after sign-in', async () => {
    const user = userEvent.setup();
    useAuthStore.setState(signedOutState(true));
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/workspace' } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/workspace"
            element={
              <>
                <LocationProbe />
                <p>Workspace secret content</p>
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Workspace secret content')).toBeInTheDocument();
    expect(await screen.findByText('at:/workspace')).toBeInTheDocument();
  });

  it('returns to the originally requested route after registration', async () => {
    const user = userEvent.setup();
    useAuthStore.setState(signedOutState(true));
    render(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { from: '/workspace' } }]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/workspace" element={<p>Workspace secret content</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/^email$/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Workspace secret content')).toBeInTheDocument();
  });
});

describe('resolvePostAuthRedirect', () => {
  it('falls back to the workspace for missing, foreign, or crafted targets', () => {
    expect(resolvePostAuthRedirect(undefined)).toBe('/workspace');
    expect(resolvePostAuthRedirect(null)).toBe('/workspace');
    expect(resolvePostAuthRedirect({})).toBe('/workspace');
    expect(resolvePostAuthRedirect({ from: 'https://evil.example.com' })).toBe('/workspace');
    expect(resolvePostAuthRedirect({ from: '' })).toBe('/workspace');
    expect(resolvePostAuthRedirect({ from: '/workspace' })).toBe('/workspace');
  });

  it('honors same-origin deep links preserved by the guard', () => {
    expect(resolvePostAuthRedirect({ from: '/history?limit=20' })).toBe('/history?limit=20');
  });
});
