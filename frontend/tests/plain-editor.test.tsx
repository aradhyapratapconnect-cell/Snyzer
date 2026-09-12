import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PlainEditor } from '../src/components/editor/PlainEditor.js';
import { countCharacters, countWords } from '../src/components/editor/textStats.js';

/** SNZ-041 tests: counting utilities and the plain editor component. */
describe('textStats', () => {
  it.each([
    ['', 0],
    ['   ', 0],
    ['hello', 1],
    ['hello world', 2],
    ['  hello   world\nnewline\ttab  ', 4],
    ['emoji 🎉 counts as one', 5],
  ])('counts words in %j', (text, expected) => {
    expect(countWords(text)).toBe(expected);
  });

  it('counts raw characters', () => {
    expect(countCharacters('')).toBe(0);
    expect(countCharacters('abc')).toBe(3);
  });
});

function ControlledEditor(props: Partial<Parameters<typeof PlainEditor>[0]> = {}) {
  const [value, setValue] = useState('');
  return <PlainEditor value={value} onChange={setValue} {...props} />;
}

describe('PlainEditor', () => {
  it('updates counts instantly while typing', async () => {
    const user = userEvent.setup();
    render(<ControlledEditor />);

    await user.type(screen.getByLabelText('Your draft'), 'hello brave world');

    expect(screen.getByText(/3 words · 17\/10000 characters/)).toBeInTheDocument();
  });

  it('warns near the limit and errors over it', async () => {
    const user = userEvent.setup();
    render(<ControlledEditor maxLength={10} />);

    await user.type(screen.getByLabelText('Your draft'), '123456789');
    expect(screen.getByText(/approaching the limit/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Your draft'), '01');
    expect(screen.getByText(/over the limit/)).toBeInTheDocument();
    expect(screen.getByLabelText('Your draft')).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears content and counters, and locks while read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<PlainEditor value="some text" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith('');

    rerender(<PlainEditor value="some text" onChange={onChange} readOnly />);
    expect(screen.getByLabelText('Your draft')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });
});
