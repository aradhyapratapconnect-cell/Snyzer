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
      className="inline-flex rounded-full border border-teal-500/25 bg-teal-950/40 p-1"
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
            'rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50',
            mode === option.value
              ? 'bg-teal-400/20 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.25)]'
              : 'text-slate-400 hover:text-teal-200',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
