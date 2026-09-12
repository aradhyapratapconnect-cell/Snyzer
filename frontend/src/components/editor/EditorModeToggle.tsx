import type { EditorMode } from '@snyzer/shared';
import { cn } from '../../lib/utils.js';

/**
 * Editor mode switcher (SNZ-043).
 *
 * Plain Text / Rich Text tabs with pressed-state semantics. Content
 * conversion and preference persistence are the container's job (it owns the
 * editor values); this control only reports the requested mode.
 */
const MODES: Array<{ value: EditorMode; label: string }> = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'rich', label: 'Rich Text' },
];

export function EditorModeToggle({
  mode,
  onChange,
  disabled = false,
}: {
  mode: EditorMode;
  onChange: (mode: EditorMode) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Editor mode"
      className="inline-flex rounded-lg border border-line-light bg-muted-light/50 p-1 dark:border-line-dark dark:bg-muted-dark/30"
    >
      {MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          disabled={disabled}
          onClick={() => {
            onChange(option.value);
          }}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
            mode === option.value
              ? 'bg-surface-light text-ink-light shadow-sm dark:bg-surface-dark dark:text-ink-dark'
              : 'text-subink-light hover:text-ink-light dark:text-subink-dark dark:hover:text-ink-dark',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
