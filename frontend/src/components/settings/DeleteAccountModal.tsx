import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Label } from '../ui/label.js';
import { Spinner } from '../ui/spinner.js';
import { toast } from '../ui/toaster.js';
import { apiRequest } from '../../lib/apiClient.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

/**
 * Account-deletion confirmation modal (SNZ-034; success toast SNZ-039).
 *
 * Destructive action guarded by typing `DELETE`. Closes on Escape, Cancel,
 * or success; focuses the confirmation input on open and returns focus to
 * the trigger on close. On success it purges the session, confirms via
 * toast, and redirects home.
 */
const CONFIRMATION_TEXT = 'DELETE';

export function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    triggerRef.current = document.activeElement as HTMLElement | null;
    setConfirmation('');
    setError(null);
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const confirmed = confirmation === CONFIRMATION_TEXT;

  const handleDelete = async (): Promise<void> => {
    if (!confirmed || deleting) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await apiRequest('/account', { method: 'DELETE' });
      await signOut();
      onClose();
      toast.success('Your account and all of its data have been permanently deleted.');
      navigate('/');
    } catch {
      setError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-md rounded-xl border border-line-light bg-surface-light p-6 dark:border-line-dark dark:bg-surface-dark"
      >
        <h2
          id="delete-account-title"
          className="text-lg font-semibold text-ink-light dark:text-ink-dark"
        >
          Delete your account?
        </h2>
        <p className="mt-2 text-sm text-subink-light dark:text-subink-dark">
          This permanently removes your profile, preferences, writing history, and usage records.
          This cannot be undone.
        </p>
        <div className="mt-4">
          <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
          <Input
            id="delete-confirm"
            ref={inputRef}
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
            }}
            autoComplete="off"
            placeholder="DELETE"
            disabled={deleting}
            className="mt-1"
          />
        </div>
        {error !== null && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
          >
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!confirmed || deleting}
            onClick={() => void handleDelete()}
          >
            {deleting && <Spinner />}
            {deleting ? 'Deleting…' : 'Delete everything'}
          </Button>
        </div>
      </div>
    </div>
  );
}
