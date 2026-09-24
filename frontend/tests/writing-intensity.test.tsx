import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { WritingControlValues } from '../src/features/writing/WritingControls.js';
import { WritingControls } from '../src/features/writing/WritingControls.js';
import { intensityOf } from '../src/features/writing/intensity.js';

/**
 * Intensity tests: bundle mapping over the real style targets. No network.
 */
function ControlledControls() {
  const [values, setValues] = useState<WritingControlValues>({
    mode: 'natural',
    tone: 'professional',
    clarity: 70,
    sentenceVariety: 60,
  });
  return (
    <>
      <WritingControls values={values} onChange={setValues} />
      <output data-testid="values-sink">{JSON.stringify(values)}</output>
    </>
  );
}

function sinkValues(): WritingControlValues {
  return JSON.parse(screen.getByTestId('values-sink').textContent ?? '{}') as WritingControlValues;
}

describe('intensityOf', () => {
  it('recognizes the three bundles and custom combinations', () => {
    expect(intensityOf(40, 40)).toBe('mild');
    expect(intensityOf(70, 60)).toBe('balanced');
    expect(intensityOf(90, 85)).toBe('expressive');
    expect(intensityOf(71, 60)).toBe('custom');
    expect(intensityOf(70, 61)).toBe('custom');
  });
});

describe('WritingControls intensity', () => {
  it('reflects the matching bundle as pressed', () => {
    render(<ControlledControls />);

    expect(screen.getByRole('button', { name: 'Balanced' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Mild' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies a bundle to both targets in one click', async () => {
    const user = userEvent.setup();
    render(<ControlledControls />);

    await user.click(screen.getByRole('button', { name: 'Expressive' }));

    expect(sinkValues().clarity).toBe(90);
    expect(sinkValues().sentenceVariety).toBe(85);
    expect(screen.getByRole('button', { name: 'Expressive' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('reports custom after a manual slider tweak', async () => {
    const user = userEvent.setup();
    render(<ControlledControls />);

    screen.getByRole('slider', { name: 'Target clarity' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(sinkValues().clarity).toBe(71);
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Balanced' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
