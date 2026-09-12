import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Analysis } from '@snyzer/shared';
import { AnalysisPanel, scoreBand } from '../src/components/analysis/AnalysisPanel.js';

/**
 * SNZ-048 tests: metric rendering, qualitative bands, explanations, and the
 * detector-language ban. No network involved.
 */
const analysis: Analysis = {
  readability: 72,
  clarity: 80,
  repetition: 12,
  sentenceVariety: 68,
  vocabularyComplexity: 55,
  formality: 61,
};

describe('AnalysisPanel', () => {
  it('displays all six metrics with scores and bands', () => {
    render(<AnalysisPanel analysis={analysis} />);

    expect(screen.getByRole('heading', { name: 'Writing analysis' })).toBeInTheDocument();
    for (const label of [
      'Readability',
      'Clarity',
      'Repetition',
      'Sentence variety',
      'Vocabulary complexity',
      'Formality',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('72 — Good')).toBeInTheDocument();
    expect(screen.getByText('80 — Excellent')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Writing analysis' })).toBeInTheDocument();
  });

  it('explains each metric through tooltips', () => {
    render(<AnalysisPanel analysis={analysis} />);

    expect(screen.getByText('Readability')).toHaveAttribute(
      'title',
      expect.stringContaining('easy'),
    );
    expect(screen.getByText('Repetition')).toHaveAttribute(
      'title',
      expect.stringContaining('Lower'),
    );
  });

  it('maps bands without false precision, inverting repetition', () => {
    expect(scoreBand(85)).toBe('Excellent');
    expect(scoreBand(65)).toBe('Good');
    expect(scoreBand(45)).toBe('Developing');
    expect(scoreBand(10)).toBe('Needs work');
    expect(scoreBand(12, true)).toBe('Minimal — excellent');
  });

  it('exposes progressbar semantics for assistive technology', () => {
    render(<AnalysisPanel analysis={analysis} />);

    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(6);
    const clarity = within(screen.getByRole('region', { name: 'Writing analysis' })).getAllByRole(
      'progressbar',
    )[1];
    expect(clarity).toHaveAttribute('aria-valuenow', '80');
  });

  it('never mentions detectors, evasion, or human scores', () => {
    const { container } = render(<AnalysisPanel analysis={analysis} />);
    const text = (container.textContent ?? '').toLowerCase();

    for (const banned of ['detect', 'evad', 'bypass', 'human', 'undetectable', 'ai score']) {
      expect(text).not.toContain(banned);
    }
  });
});
