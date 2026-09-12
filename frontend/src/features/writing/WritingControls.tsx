import type { Tone, WritingMode } from '@snyzer/shared';
import { Label } from '../../components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { Slider } from '../../components/ui/slider.js';
import { cn } from '../../lib/utils.js';

/**
 * Writing controls panel (SNZ-044).
 *
 * Presentational toolbar: improvement mode, target tone, and numeric style
 * targets. Values flow in, changes flow out — the workspace store (SNZ-046)
 * owns state. Selectors are labelled, keyboard-operable controls.
 */
export interface WritingControlValues {
  mode: WritingMode;
  tone: Tone;
  clarity: number;
  sentenceVariety: number;
}

const MODES: Array<{ value: WritingMode; label: string }> = [
  { value: 'natural', label: 'Natural' },
  { value: 'clarity', label: 'Clarity' },
  { value: 'formal', label: 'Formal' },
  { value: 'concise', label: 'Concise' },
];

const TONES: Array<{ value: Tone; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' },
  { value: 'direct', label: 'Direct' },
];

export function WritingControls({
  values,
  onChange,
  disabled = false,
}: {
  values: WritingControlValues;
  onChange: (values: WritingControlValues) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <span id="mode-label" className="text-sm font-medium text-ink-light dark:text-ink-dark">
          Improvement mode
        </span>
        <div role="group" aria-labelledby="mode-label" className="mt-1 flex flex-wrap gap-1">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={values.mode === option.value}
              disabled={disabled}
              onClick={() => {
                onChange({ ...values, mode: option.value });
              }}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50',
                values.mode === option.value
                  ? 'border-primary bg-primary/10 text-ink-light dark:border-primary-dark dark:text-ink-dark'
                  : 'border-line-light text-subink-light hover:text-ink-light dark:border-line-dark dark:text-subink-dark dark:hover:text-ink-dark',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="tone-select">Tone</Label>
        <Select
          value={values.tone}
          disabled={disabled}
          onValueChange={(tone) => {
            onChange({ ...values, tone: tone as Tone });
          }}
        >
          <SelectTrigger id="tone-select" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TONES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-light dark:text-ink-dark">
            Target clarity
          </span>
          <span className="text-xs text-subink-light dark:text-subink-dark">{values.clarity}</span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[values.clarity]}
          disabled={disabled}
          thumbAriaLabel="Target clarity"
          onValueChange={([clarity]) => {
            if (clarity !== undefined) {
              onChange({ ...values, clarity });
            }
          }}
          className="mt-2"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-light dark:text-ink-dark">
            Sentence variety
          </span>
          <span className="text-xs text-subink-light dark:text-subink-dark">
            {values.sentenceVariety}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[values.sentenceVariety]}
          disabled={disabled}
          thumbAriaLabel="Sentence variety"
          onValueChange={([variety]) => {
            if (variety !== undefined) {
              onChange({ ...values, sentenceVariety: variety });
            }
          }}
          className="mt-2"
        />
      </div>
    </div>
  );
}
