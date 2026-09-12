import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { WritingControlValues } from '../src/features/writing/WritingControls.js';
import { WritingControls } from '../src/features/writing/WritingControls.js';

/**
 * SNZ-044 tests: mode/tone/slider controls with a local-state parent.
 * (Radix Select open-state interaction needs a real browser — closed-state
 * rendering is asserted here, full selection flows land in Playwright.)
 */
const initialValues: WritingControlValues = {
  mode: 'natural',
  tone: 'professional',
  clarity: 70,
  sentenceVariety: 60,
};

function ControlledControls() {
  const [values, setValues] = useState(initialValues);
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

describe('WritingControls', () => {
  it('renders labelled mode, tone, and slider controls with defaults', () => {
    render(<ControlledControls />);

    expect(screen.getByRole('button', { name: 'Natural' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Formal' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Tone')).toHaveTextContent('Professional');
    expect(screen.getByRole('slider', { name: 'Target clarity' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Sentence variety' })).toBeInTheDocument();
  });

  it('switches modes by click and keyboard', async () => {
    const user = userEvent.setup();
    render(<ControlledControls />);

    await user.click(screen.getByRole('button', { name: 'Formal' }));
    expect(sinkValues().mode).toBe('formal');

    screen.getByRole('button', { name: 'Concise' }).focus();
    await user.keyboard('{Enter}');
    expect(sinkValues().mode).toBe('concise');
  });

  it('adjusts numeric targets with slider arrow keys', async () => {
    const user = userEvent.setup();
    render(<ControlledControls />);

    screen.getByRole('slider', { name: 'Target clarity' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(sinkValues().clarity).toBe(71);

    screen.getByRole('slider', { name: 'Sentence variety' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(sinkValues().sentenceVariety).toBe(59);
  });
});
