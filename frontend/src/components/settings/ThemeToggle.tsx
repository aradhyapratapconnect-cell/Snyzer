import type { Theme } from '@snyzer/shared';
import { Label } from '../ui/label.js';
import { usePreferencesStore } from '../../stores/usePreferencesStore.js';

/**
 * Theme switcher (SNZ-033). A native select keeps Light/Dark/System choice
 * fully keyboard- and screen-reader-accessible with zero extra dependencies;
 * changes persist through the preferences store (optimistic + server sync).
 * Rendered on the settings page (SNZ-034).
 */
const THEME_OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function ThemeToggle() {
  const theme = usePreferencesStore((state) => state.theme);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);

  return (
    <div>
      <Label htmlFor="theme-select">Theme</Label>
      <select
        id="theme-select"
        value={theme}
        onChange={(event) => {
          void updatePreferences({ theme: event.target.value as Theme });
        }}
        className="mt-1 flex h-10 w-full rounded-lg border border-line-light bg-surface-light px-3 py-2 text-sm text-ink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-subink-light dark:text-subink-dark">
        System follows your operating system appearance.
      </p>
    </div>
  );
}
