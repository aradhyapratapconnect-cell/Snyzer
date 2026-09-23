import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button.js';
import { exportDocument, type ExportFormat } from '../../lib/exportDocument.js';

/**
 * Document export dropdown (SNZ-063).
 *
 * Offers the current draft and/or revised result as Markdown or Plain Text,
 * downloaded entirely client-side (Blob URL, no backend round-trip, no
 * navigation). Options with empty text are omitted, so the menu only ever
 * offers complete documents. Follows the hand-rolled `UserMenu` pattern:
 * Escape/outside-click close, focus returns to the trigger.
 */
export function ExportButton({
  draft,
  revision,
  mode,
  tone,
}: {
  draft: string | null | undefined;
  revision: string | null | undefined;
  mode?: string;
  tone?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const options: Array<{
    key: string;
    label: string;
    run: () => void;
  }> = [];
  const draftText = draft ?? '';
  const revisionText = revision ?? '';
  if (draftText.trim() !== '') {
    const draftOptions: Array<{ format: ExportFormat; label: string }> = [
      { format: 'md', label: 'Draft as Markdown (.md)' },
      { format: 'txt', label: 'Draft as Text (.txt)' },
    ];
    for (const option of draftOptions) {
      const format = option.format;
      options.push({
        key: `draft-${format}`,
        label: option.label,
        run: () => {
          exportDocument({ kind: 'draft', text: draftText, mode, tone }, format);
        },
      });
    }
  }
  if (revisionText.trim() !== '') {
    const revisionOptions: Array<{ format: ExportFormat; label: string }> = [
      { format: 'md', label: 'Revision as Markdown (.md)' },
      { format: 'txt', label: 'Revision as Text (.txt)' },
    ];
    for (const option of revisionOptions) {
      const format = option.format;
      options.push({
        key: `revision-${format}`,
        label: option.label,
        run: () => {
          exportDocument({ kind: 'revision', text: revisionText, mode, tone }, format);
        },
      });
    }
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((previous) => !previous);
        }}
      >
        Export
      </Button>
      {open && (
        <div
          role="menu"
          aria-label="Export document"
          className="absolute left-0 z-10 mt-2 w-56 rounded-xl border border-line-light bg-surface-light p-2 shadow-lg dark:border-line-dark dark:bg-surface-dark"
        >
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="menuitem"
              onClick={() => {
                option.run();
                setOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-light hover:bg-muted-light dark:text-ink-dark dark:hover:bg-muted-dark"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
