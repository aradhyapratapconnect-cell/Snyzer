import { Toaster as SonnerToaster, toast } from 'sonner';
import { isDarkTheme } from '../theme-provider.js';
import { usePreferencesStore } from '../../stores/usePreferencesStore.js';

/**
 * Global toast provider (SNZ-039, Sonner-based).
 *
 * Mounted once at the app root. Default auto-dismiss is 4000ms; destructive
 * toasts stay until dismissed. Sonner announces through screen-reader live
 * regions. The theme follows the preferences store (resolving `system`
 * against the OS) so toasts stay legible in both modes.
 */
export function Toaster() {
  const theme = usePreferencesStore((state) => state.theme);
  const dark =
    typeof window === 'undefined'
      ? false
      : isDarkTheme(theme, window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <SonnerToaster
      position="bottom-right"
      theme={dark ? 'dark' : 'light'}
      toastOptions={{
        classNames: {
          toast:
            'border-line-light bg-surface-light text-ink-light dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark',
        },
      }}
    />
  );
}

export { toast };
