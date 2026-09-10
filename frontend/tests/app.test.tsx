import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SHARED_PACKAGE_VERSION } from '@snyzer/shared';
import { App } from '../src/app/App.js';
import { GettingStarted } from '../src/app/router.js';
import { RootErrorBoundary } from '../src/components/RootErrorBoundary.js';
import { SNYZER_COLORS } from '../src/styles/tokens.js';

/**
 * SNZ-003 component tests: root layout mount, error boundary fallback, and
 * design-token hex values from FRONTEND_SPECIFICATION section 2.
 */

function renderAtRoot() {
  const router = createMemoryRouter([
    { path: '/', element: <App />, children: [{ index: true, element: <GettingStarted /> }] },
  ]);
  return render(<RouterProvider router={router} />);
}

describe('root layout container', () => {
  it('mounts the themed canvas with header, content, and footer', () => {
    const { getByTestId } = renderAtRoot();

    const layout = getByTestId('root-layout');
    expect(layout.className).toContain('bg-canvas-light');
    expect(layout.className).toContain('dark:bg-canvas-dark');

    expect(screen.getByText('Snyzer')).toBeInTheDocument();
    expect(screen.getByText('Improve your writing')).toBeInTheDocument();
    expect(screen.getByText(`shared v${SHARED_PACKAGE_VERSION}`)).toBeInTheDocument();
  });
});

describe('root error boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function Bomb(): never {
    throw new Error('render explosion');
  }

  it('catches render exceptions and shows a recoverable fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <RootErrorBoundary>
        <Bomb />
      </RootErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('design tokens', () => {
  it('matches the specified light/dark hex colors', () => {
    expect(SNYZER_COLORS.canvas).toEqual({ light: '#F8FAFC', dark: '#0B1120' });
    expect(SNYZER_COLORS.surface).toEqual({ light: '#FFFFFF', dark: '#111827' });
    expect(SNYZER_COLORS.muted).toEqual({ light: '#F1F5F9', dark: '#1F2937' });
    expect(SNYZER_COLORS.ink).toEqual({ light: '#0F172A', dark: '#F8FAFC' });
    expect(SNYZER_COLORS.subink).toEqual({ light: '#475569', dark: '#CBD5E1' });
    expect(SNYZER_COLORS.line).toEqual({ light: '#E2E8F0', dark: '#334155' });
    expect(SNYZER_COLORS.primary.light).toBe('#2563EB');
    expect(SNYZER_COLORS.primary.lightHover).toBe('#1D4ED8');
    expect(SNYZER_COLORS.primary.dark).toBe('#60A5FA');
    expect(SNYZER_COLORS.primary.darkHover).toBe('#93C5FD');
    expect(SNYZER_COLORS.success).toEqual({ light: '#16A34A', dark: '#4ADE80' });
    expect(SNYZER_COLORS.warning).toEqual({ light: '#D97706', dark: '#FBBF24' });
    expect(SNYZER_COLORS.danger).toEqual({ light: '#DC2626', dark: '#F87171' });
  });
});
