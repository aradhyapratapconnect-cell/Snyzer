import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { A11yAnnouncer } from '../src/components/layout/A11yAnnouncer.js';
import { useAnnouncer, useAnnouncerStore } from '../src/hooks/useAnnouncer.js';

/**
 * SNZ-040 tests: polite/assertive announcements reach correctly-attributed
 * live regions. No network involved.
 */
function renderAnnouncer() {
  return render(<A11yAnnouncer />);
}

function announce(message: string, priority?: 'polite' | 'assertive') {
  act(() => {
    useAnnouncerStore.getState().announce(message, priority);
  });
}

function ProbeButton() {
  const announceMessage = useAnnouncer();
  return (
    <button
      type="button"
      onClick={() => {
        announceMessage('Improving text, please wait.');
      }}
    >
      Start job
    </button>
  );
}

beforeEach(() => {
  useAnnouncerStore.setState({ politeMessage: '', assertiveMessage: '', sequence: 0 });
});

describe('A11yAnnouncer', () => {
  it('exposes polite and assertive live regions', () => {
    const { container } = renderAnnouncer();

    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(container.querySelector('[aria-live="assertive"]')).not.toBeNull();
  });

  it('announces job progress politely', () => {
    renderAnnouncer();

    announce('Improving text, please wait.');

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Improving text, please wait.');
  });

  it('announces completion politely and errors assertively', () => {
    renderAnnouncer();

    announce('Revision complete. Results updated.');
    expect(screen.getByRole('status')).toHaveTextContent('Revision complete. Results updated.');

    announce('Revision failed. Your text was preserved.', 'assertive');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveTextContent('Revision failed. Your text was preserved.');
  });

  it('drives announcements through the hook from components', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ProbeButton />
        <A11yAnnouncer />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Start job' }));

    expect(screen.getByRole('status')).toHaveTextContent('Improving text, please wait.');
  });
});
