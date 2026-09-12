import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ImproveButton } from '../src/features/writing/ImproveButton.js';

/** SNZ-045 tests: disable states, loading UI, and double-click prevention. */
describe('ImproveButton', () => {
  it('renders enabled with the default label', () => {
    render(<ImproveButton disabled={false} loading={false} onClick={() => {}} />);

    const button = screen.getByRole('button', { name: 'Improve writing' });
    expect(button).toBeEnabled();
  });

  it('disables when there is nothing submittable', () => {
    render(<ImproveButton disabled loading={false} onClick={() => {}} />);

    expect(screen.getByRole('button', { name: 'Improve writing' })).toBeDisabled();
  });

  it('shows a spinner and loading text while processing', () => {
    render(<ImproveButton disabled={false} loading onClick={() => {}} />);

    const button = screen.getByRole('button', { name: 'Improving writing…' });
    expect(button).toBeDisabled();
  });

  it('dispatches exactly one submission on rapid double click', async () => {
    // Mirrors the production wiring: the first submit flips loading
    // synchronously (like the store's isProcessing), and React flushes the
    // disabled state before the second discrete click dispatches.
    function SubmittingParent({ onSubmit }: { onSubmit: () => void }) {
      const [loading, setLoading] = useState(false);
      return (
        <ImproveButton
          disabled={false}
          loading={loading}
          onClick={() => {
            onSubmit();
            setLoading(true);
          }}
        />
      );
    }
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SubmittingParent onSubmit={onSubmit} />);

    await user.dblClick(screen.getByRole('button', { name: 'Improve writing' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Improving writing…' })).toBeDisabled();
  });

  it('ignores clicks while disabled or loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<ImproveButton disabled loading={false} onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Improve writing' }));

    rerender(<ImproveButton disabled={false} loading onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: 'Improving writing…' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
