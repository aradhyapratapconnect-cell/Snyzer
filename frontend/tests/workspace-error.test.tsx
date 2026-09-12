import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  isRecoverableError,
  WorkspaceErrorOverlay,
} from '../src/features/writing/WorkspaceErrorOverlay.js';

/**
 * SNZ-049 tests: recoverable vs terminal error rendering, retry dispatch,
 * rate-limit guidance, and draft preservation messaging. No network involved.
 */
describe('WorkspaceErrorOverlay', () => {
  it('offers single-click retry for recoverable failures', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <WorkspaceErrorOverlay
        error={{ code: 'AI_TIMEOUT', message: 'The provider timed out.' }}
        onRetry={onRetry}
        retrying={false}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('The provider timed out.');
    expect(screen.getByText(/your text was preserved/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables retry while a retry is in flight', () => {
    render(
      <WorkspaceErrorOverlay
        error={{ code: 'NETWORK_ERROR', message: 'Offline.' }}
        onRetry={() => {}}
        retrying
      />,
    );

    expect(screen.getByRole('button', { name: 'Retrying…' })).toBeDisabled();
  });

  it('withholds retry for terminal problems and explains the fix', () => {
    render(
      <WorkspaceErrorOverlay
        error={{ code: 'TEXT_TOO_LONG', message: 'Too long.' }}
        onRetry={() => {}}
        retrying={false}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Shorten your text');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('guides rate-limited users to wait before retrying', () => {
    render(
      <WorkspaceErrorOverlay
        error={{ code: 'RATE_LIMITED', message: 'Slow down.' }}
        onRetry={() => {}}
        retrying={false}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/wait a minute/i);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('classifies error codes into recoverable and terminal', () => {
    for (const code of [
      'AI_PROVIDER_UNAVAILABLE',
      'AI_TIMEOUT',
      'SERVICE_UNAVAILABLE',
      'NETWORK_ERROR',
      'RATE_LIMITED',
    ]) {
      expect(isRecoverableError(code)).toBe(true);
    }
    for (const code of ['TEXT_TOO_LONG', 'INVALID_INPUT', 'UNAUTHORIZED', 'PAYLOAD_TOO_LARGE']) {
      expect(isRecoverableError(code)).toBe(false);
    }
  });
});
