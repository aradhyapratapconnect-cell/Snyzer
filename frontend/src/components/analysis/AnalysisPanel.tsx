import type { Analysis } from '@snyzer/shared';
import { MetricBar } from './MetricBar.js';

/**
 * Writing-quality analysis panel (SNZ-048).
 *
 * Renders the six backend metrics with qualitative bands and plain-language
 * tooltip explanations (`title`). Bands describe ranges, never false
 * precision — and the panel never mentions AI detectors, evasion, or human
 * probability scores, per the product principles.
 */
type MetricKey = keyof Analysis;

const METRICS: Array<{
  key: MetricKey;
  label: string;
  explanation: string;
  inverted?: boolean;
}> = [
  {
    key: 'readability',
    label: 'Readability',
    explanation: 'How easy the text is to read: sentence length, word choice, and flow.',
  },
  {
    key: 'clarity',
    label: 'Clarity',
    explanation: 'How directly the text conveys its point without ambiguity.',
  },
  {
    key: 'repetition',
    label: 'Repetition',
    explanation: 'How much wording repeats. Lower is better.',
    inverted: true,
  },
  {
    key: 'sentenceVariety',
    label: 'Sentence variety',
    explanation: 'How much sentence length and structure vary across the text.',
  },
  {
    key: 'vocabularyComplexity',
    label: 'Vocabulary complexity',
    explanation: 'How advanced the word choice is. Higher is not always better.',
  },
  {
    key: 'formality',
    label: 'Formality',
    explanation: 'How formal the register reads, from casual to ceremonial.',
  },
];

export function scoreBand(value: number, inverted = false): string {
  const effective = inverted ? 100 - value : value;
  if (effective >= 80) {
    return inverted ? 'Minimal — excellent' : 'Excellent';
  }
  if (effective >= 60) {
    return 'Good';
  }
  if (effective >= 40) {
    return 'Developing';
  }
  return 'Needs work';
}

export function AnalysisPanel({ analysis }: { analysis: Analysis }) {
  return (
    <section aria-label="Writing analysis" className="space-y-4">
      <h2 className="text-base font-semibold">Writing analysis</h2>
      <dl className="space-y-3">
        {METRICS.map((metric) => {
          const value = analysis[metric.key];
          return (
            <div key={metric.key}>
              <div className="flex items-baseline justify-between gap-2">
                <dt
                  className="cursor-help text-sm font-medium underline decoration-dotted underline-offset-2"
                  title={metric.explanation}
                >
                  {metric.label}
                </dt>
                <dd className="text-xs text-subink-light dark:text-subink-dark">
                  {Math.round(value)} — {scoreBand(value, metric.inverted)}
                </dd>
              </div>
              <div className="mt-1">
                <MetricBar value={value} inverted={metric.inverted} />
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
