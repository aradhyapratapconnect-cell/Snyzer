import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, isDarkTheme, ThemeProvider } from '../src/components/theme-provider.js';
import { ThemeToggle } from '../src/components/settings/ThemeToggle.js';
import { usePreferencesStore } from '../src/stores/usePreferencesStore.js';

/**
 * SNZ-033 tests: theme resolution, document class manipulation, OS
 * following, and the toggle's store sync. API calls are mocked; no network.
 */
const apiRequestMock = vi.fn();

vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function stubMatchMedia(matches: boolean) {
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('dark');
  usePreferencesStore.setState({
    theme: 'system',
    workspaceLayout: 'side_by_side',
    editorMode: 'plain',
    defaultTone: 'professional',
    status: 'idle',
    error: null,
  });
});

describe('isDarkTheme', () => {
  it('resolves explicit themes regardless of the OS', () => {
    expect(isDarkTheme('dark', false)).toBe(true);
    expect(isDarkTheme('light', true)).toBe(false);
  });

  it('follows the OS in system mode', () => {
    expect(isDarkTheme('system', true)).toBe(true);
    expect(isDarkTheme('system', false)).toBe(false);
  });
});

describe('applyTheme', () => {
  it('toggles the dark class and color scheme on the root element', () => {
    applyTheme('dark', false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');

    applyTheme('light', true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});

describe('ThemeProvider', () => {
  it('applies the store theme and follows OS switches in system mode', () => {
    const { listeners } = stubMatchMedia(false);
    render(
      <ThemeProvider>
        <p>child</p>
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      usePreferencesStore.setState({ theme: 'dark' });
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      usePreferencesStore.setState({ theme: 'system' });
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(listeners.size).toBe(1);
  });
});

describe('ThemeToggle', () => {
  it('reflects the store value and persists changes through it', async () => {
    const user = userEvent.setup();
    stubMatchMedia(false);
    apiRequestMock.mockResolvedValue({
      preferences: {
        theme: 'dark',
        workspaceLayout: 'side_by_side',
        editorMode: 'plain',
        defaultTone: 'professional',
      },
    });
    render(<ThemeToggle />);

    const select = screen.getByLabelText('Theme');
    expect(select).toHaveValue('system');

    await user.selectOptions(select, 'dark');
    expect(usePreferencesStore.getState().theme).toBe('dark');
    expect(apiRequestMock).toHaveBeenCalledWith('/preferences', {
      method: 'PATCH',
      body: { theme: 'dark' },
    });
  });
});
