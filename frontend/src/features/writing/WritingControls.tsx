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
        <span id="mode-label" className="text-sm font-medium text-slate-200">
          Improvement mode
        </span>
        <div role="group" aria-labelledby="mode-label" className="mt-1.5 flex flex-wrap gap-1.5">
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
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 active:scale-95',
                values.mode === option.value
                  ? 'border-teal-400/50 bg-teal-400/15 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                  : 'border-teal-500/20 bg-teal-950/30 text-slate-300 hover:border-teal-400/40 hover:text-teal-200',
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
          <span className="text-sm font-medium text-slate-200">Target clarity</span>
          <span className="font-code text-xs text-teal-300">{values.clarity}</span>
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
          <span className="text-sm font-medium text-slate-200">Sentence variety</span>
          <span className="font-code text-xs text-teal-300">{values.sentenceVariety}</span>
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
