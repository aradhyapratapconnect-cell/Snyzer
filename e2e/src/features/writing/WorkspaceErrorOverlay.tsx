import { Button } from '../../components/ui/button.js';

/**
 * Workspace error overlay (SNZ-049).
 *
 * Explains what happened, confirms the draft was preserved, and offers a
 * single-click retry for recoverable failures (provider timeouts/outages,
 * network loss, rate limits with guidance). Terminal problems (over-limit
 * or invalid input, authentication) show what to fix instead of a retry
 * that could never succeed.
 */
export interface WorkspaceFailure {
  code: string;
  message: string;
}

const RECOVERABLE_CODES = new Set([
  'AI_PROVIDER_UNAVAILABLE',
  'AI_TIMEOUT',
  'AI_MALFORMED_RESPONSE',
  'SERVICE_UNAVAILABLE',
  'BAD_GATEWAY',
  'INTERNAL_ERROR',
  'NETWORK_ERROR',
  'REQUEST_FAILED',
  'RATE_LIMITED',
]);

export function isRecoverableError(code: string): boolean {
  return RECOVERABLE_CODES.has(code);
}

function guidanceFor(code: string): string | null {
  switch (code) {
    case 'TEXT_TOO_LONG':
    case 'PAYLOAD_TOO_LARGE':
      return 'Shorten your text below the supported limit, then try again.';
    case 'INVALID_INPUT':
      return 'Check your text and settings, then try again.';
    case 'UNAUTHORIZED':
      return 'Your session may have expired. Sign in again, then retry.';
    case 'RATE_LIMITED':
      return 'Slow down for a bit — wait a minute before retrying.';
    default:
      return null;
  }
}

export function WorkspaceErrorOverlay({
  error,
  onRetry,
  retrying,
}: {
  error: WorkspaceFailure;
  onRetry: () => void;
  retrying: boolean;
}) {
  const recoverable = isRecoverableError(error.code);
  const guidance = guidanceFor(error.code);

  return (
    <div
      role="alert"
      className="rounded-xl border border-danger-light/40 bg-surface-light p-4 dark:border-danger-dark/40 dark:bg-surface-dark"
    >
      <h2 className="text-sm font-semibold text-ink-light dark:text-ink-dark">
        {recoverable ? 'Something went wrong' : 'Cannot complete this request'}
      </h2>
      <p className="mt-1 text-sm text-subink-light dark:text-subink-dark">{error.message}</p>
      <p className="mt-1 text-sm text-subink-light dark:text-subink-dark">
        Your text was preserved and nothing was lost.
        {guidance !== null ? ` ${guidance}` : ''}
      </p>
      {recoverable && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={retrying}
          onClick={onRetry}
          className="mt-3"
        >
          {retrying ? 'Retrying…' : 'Retry'}
        </Button>
      )}
    </div>
  );
}
