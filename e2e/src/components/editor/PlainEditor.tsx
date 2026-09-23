import { useEffect, useRef } from 'react';
import { MAX_INPUT_TEXT_LENGTH } from '@snyzer/shared';
import { Button } from '../ui/button.js';
import { Label } from '../ui/label.js';
import { countCharacters, countWords } from './textStats.js';
import { cn } from '../../lib/utils.js';

/**
 * Plain textarea editor (SNZ-041).
 *
 * Auto-growing textarea with live word/character counts, a near-limit
 * warning (90%+), an over-limit error state, a clear action, and a
 * read-only mode used while a job is processing. Empty or whitespace-only
 * input is a valid editor state — submission gating lives with the action
 * button and store, not here.
 */
export const NEAR_LIMIT_RATIO = 0.9;

export function PlainEditor({
  id = 'plain-editor',
  value,
  onChange,
  readOnly = false,
  maxLength = MAX_INPUT_TEXT_LENGTH,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  maxLength?: number;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const chars = countCharacters(value);
  const words = countWords(value);
  const overLimit = chars > maxLength;
  const nearLimit = !overLimit && chars >= maxLength * NEAR_LIMIT_RATIO;

  useEffect(() => {
    const area = areaRef.current;
    if (area !== null) {
      area.style.height = 'auto';
      area.style.height = `${area.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div>
      <Label htmlFor={id}>Your draft</Label>
      <textarea
        ref={areaRef}
        id={id}
        value={value}
        placeholder="Paste or type your draft text here..."
        readOnly={readOnly}
        disabled={readOnly}
        rows={8}
        aria-invalid={overLimit}
        aria-describedby={`${id}-counts`}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="mt-1 block max-h-96 w-full resize-none overflow-y-auto rounded-lg border border-line-light bg-surface-light px-3 py-2 text-sm leading-relaxed text-ink-light placeholder:text-subink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark dark:placeholder:text-subink-dark"
      />
      <div
        id={`${id}-counts`}
        className="mt-1 flex items-center justify-between text-xs"
        aria-live="polite"
      >
        <span
          className={cn(
            overLimit
              ? 'font-medium text-danger-light dark:text-danger-dark'
              : nearLimit
                ? 'font-medium text-warning-light dark:text-warning-dark'
                : 'text-subink-light dark:text-subink-dark',
          )}
        >
          {words} {words === 1 ? 'word' : 'words'} · {chars}/{maxLength} characters
          {overLimit ? ' — over the limit' : nearLimit ? ' — approaching the limit' : ''}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={readOnly || value === ''}
          onClick={() => {
            onChange('');
            areaRef.current?.focus();
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
