import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedPanel } from '../src/components/ui/AnimatedPanel.js';
import { useReducedMotion } from '../src/hooks/useReducedMotion.js';

/**
 * SNZ-038 tests: reduced-motion detection and the animation gate. Media
 * queries are stubbed (OS settings belong to Playwright, SNZ-058).
 */
function stubReducedMotion(matches: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches,
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.delete(listener);
    }),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );
  return { listeners };
}

function stubLiveReducedMotion(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const media = {
    get matches() {
      return matches;
    },
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );
  return {
    setMatches(value: boolean) {
      matches = value;
      act(() => {
        for (const listener of listeners) {
          listener();
        }
      });
    },
  };
}

function Probe() {
  const reduced = useReducedMotion();
  return <p>{reduced ? 'reduced' : 'full'}</p>;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('useReducedMotion', () => {
  it('reflects the OS preference', () => {
    stubReducedMotion(false);
    render(<Probe />);
    expect(screen.getByText('full')).toBeInTheDocument();
  });

  it('reports reduced motion when the OS requests it', () => {
    stubReducedMotion(true);
    render(<Probe />);
    expect(screen.getByText('reduced')).toBeInTheDocument();
  });

  it('follows live OS changes', () => {
    const control = stubLiveReducedMotion(false);
    render(<Probe />);
    expect(screen.getByText('full')).toBeInTheDocument();

    control.setMatches(true);
    expect(screen.getByText('reduced')).toBeInTheDocument();
  });
});

describe('AnimatedPanel', () => {
  it('renders children without animation when reduced motion is on', () => {
    stubReducedMotion(true);
    render(
      <AnimatedPanel className="panel">
        <p>panel body</p>
      </AnimatedPanel>,
    );

    const body = screen.getByText('panel body').parentElement as HTMLElement;
    expect(body).toHaveAttribute('data-motion', 'off');
    expect(body.className).toContain('panel');
    expect(body.style.transform).toBe('');
    expect(body.style.opacity).toBe('');
  });

  it('renders an animated container otherwise', () => {
    stubReducedMotion(false);
    render(
      <AnimatedPanel>
        <p>moving body</p>
      </AnimatedPanel>,
    );

    expect(screen.getByText('moving body').parentElement).toHaveAttribute('data-motion', 'on');
  });
});
