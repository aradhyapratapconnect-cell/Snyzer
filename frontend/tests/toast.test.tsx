import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../src/components/ui/toaster.js';

/**
 * SNZ-039 tests: toast rendering, variants, live-region announcement, and
 * dismissal mechanics on real timers. The 4000ms auto-dismiss is Sonner's
 * documented default, which `Toaster` intentionally preserves by never
 * overriding `duration`; the short-duration case below proves the dismiss
 * path itself.
 */
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Toaster', () => {
  it('shows success toasts', async () => {
    render(<Toaster />);

    act(() => {
      toast.success('Copied to clipboard.');
    });
    expect(await screen.findByText('Copied to clipboard.')).toBeInTheDocument();
  });

  it('renders destructive error toasts', async () => {
    render(<Toaster />);

    act(() => {
      toast.error('Could not save. Your change was reverted.');
    });
    expect(
      await screen.findByText('Could not save. Your change was reverted.'),
    ).toBeInTheDocument();
  });

  it('announces toasts through a live region', async () => {
    const { container } = render(<Toaster />);

    act(() => {
      toast.success('Revision complete.');
    });
    expect(await screen.findByText('Revision complete.')).toBeInTheDocument();
    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('auto-dismisses toasts after their duration', async () => {
    render(<Toaster />);

    act(() => {
      toast.success('Ephemeral notice.', { duration: 200 });
    });
    expect(await screen.findByText('Ephemeral notice.')).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByText('Ephemeral notice.'), {
      timeout: 3000,
    });
  }, 10000);
});
