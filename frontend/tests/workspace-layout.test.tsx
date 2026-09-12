import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceLayout } from '../src/features/writing/WorkspaceLayout.js';
import { usePreferencesStore } from '../src/stores/usePreferencesStore.js';

/**
 * SNZ-037 layout tests: preference-driven arrangement, mobile stacking
 * override, and content preservation across switches. Viewport matching is
 * stubbed (real pixels belong to Playwright, SNZ-058).
 */
function stubViewport(matchesMobile: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: matchesMobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function setLayout(layout: 'side_by_side' | 'input_first') {
  act(() => {
    usePreferencesStore.setState({ workspaceLayout: layout });
  });
}

function renderLayout() {
  return render(
    <WorkspaceLayout
      input={<textarea aria-label="Draft input" defaultValue="draft text" />}
      result={<div>improved text</div>}
      analysis={<div>analysis panel</div>}
    />,
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
  usePreferencesStore.setState({ workspaceLayout: 'side_by_side' });
});

describe('WorkspaceLayout', () => {
  it('renders side-by-side columns for the preference on desktop', () => {
    stubViewport(false);
    setLayout('side_by_side');
    renderLayout();

    const layout = screen.getByTestId('workspace-layout');
    expect(layout).toHaveAttribute('data-layout', 'side-by-side');
    expect(layout.className).toContain('md:grid-cols-2');
    expect(screen.getByRole('region', { name: 'Original text' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Improved text' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Writing analysis' })).toBeInTheDocument();
  });

  it('stacks input-first when preferred', () => {
    stubViewport(false);
    setLayout('input_first');
    renderLayout();

    const layout = screen.getByTestId('workspace-layout');
    expect(layout).toHaveAttribute('data-layout', 'input-first');
    expect(layout.className).toContain('flex-col');
  });

  it('forces stacking on narrow viewports regardless of preference', () => {
    stubViewport(true);
    setLayout('side_by_side');
    renderLayout();

    expect(screen.getByTestId('workspace-layout')).toHaveAttribute('data-layout', 'input-first');
  });

  it('preserves draft content across layout switches', () => {
    stubViewport(false);
    setLayout('side_by_side');
    renderLayout();
    const input = screen.getByLabelText('Draft input') as HTMLTextAreaElement;
    expect(input.value).toBe('draft text');

    setLayout('input_first');

    expect(screen.getByLabelText('Draft input')).toBe(input);
    expect((screen.getByLabelText('Draft input') as HTMLTextAreaElement).value).toBe('draft text');
    expect(screen.getByTestId('workspace-layout')).toHaveAttribute('data-layout', 'input-first');
  });
});
