import { useEffect, type ReactNode } from 'react';
import type { Theme } from '@snyzer/shared';
import { usePreferencesStore } from '../stores/usePreferencesStore.js';

/**
 * Theme provider (SNZ-033).
 *
 * Mirrors the preferences-store theme onto `<html>`: `light` removes the
 * `dark` class, `dark` adds it, and `system` follows the OS media query
 * live. `applyTheme` is exported pure for tests; the component subscribes
 * to store changes and OS switches.
 */
export function isDarkTheme(theme: Theme, systemPrefersDark: boolean): boolean {
  if (theme === 'dark') {
    return true;
  }
  if (theme === 'light') {
    return false;
  }
  return systemPrefersDark;
}

/** Applies the resolved theme to the document root. */
export function applyTheme(theme: Theme, systemPrefersDark: boolean): void {
  const dark = isDarkTheme(theme, systemPrefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = usePreferencesStore((state) => state.theme);

  useEffect(() => {
    const sync = () => {
      applyTheme(theme, systemPrefersDark());
    };
    sync();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
    };
  }, [theme]);

  return <>{children}</>;
}
