import { useEffect, useState } from 'react';
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Label } from '../ui/label.js';
import { Spinner } from '../ui/spinner.js';
import { toast } from '../ui/toaster.js';
import { getSupabaseClient } from '../../lib/supabase.js';

/**
 * Display-name editor (account identity).
 *
 * Reads the name from the verified session's `user_metadata` and persists
 * changes with `supabase.auth.updateUser`, so the new name propagates to the
 * session (via `onAuthStateChange`) and every device. Failures surface
 * inline; the previous name is never cleared optimistically.
 */
export function DisplayNameEditor({
  displayName,
  effectiveName,
}: {
  /** Raw `display_name` metadata, or null when never set. */
  displayName: string | null;
  /** Name actually shown across the app (falls back to the email). */
  effectiveName: string;
}) {
  const [draft, setDraft] = useState(displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(displayName ?? '');
    setError(null);
  }, [displayName]);

  const trimmed = draft.trim();
  const unchanged = trimmed === (displayName ?? '').trim();

  const handleSave = async (): Promise<void> => {
    if (trimmed === '' || unchanged || saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await getSupabaseClient().auth.updateUser({
        data: { display_name: trimmed },
      });
      if (updateError !== null) {
        setError('Could not update your display name. Please try again.');
        return;
      }
      toast.success('Display name updated.');
    } catch {
      setError('Could not update your display name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 border-t border-teal-500/10 pt-4">
      <Label htmlFor="display-name-input">Display name</Label>
      <div className="mt-1 flex gap-2">
        <Input
          id="display-name-input"
          value={draft}
          maxLength={60}
          autoComplete="nickname"
          disabled={saving}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          className="bg-slate-950/60 text-slate-100"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={trimmed === '' || unchanged || saving}
          onClick={() => void handleSave()}
          className="shrink-0 self-center"
        >
          {saving && <Spinner />}
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {error !== null && (
        <div role="alert" className="mt-2 text-sm text-danger-light dark:text-danger-dark">
          {error}
        </div>
      )}
      <p className="mt-1 text-xs text-slate-400">Currently shown as {effectiveName}.</p>
    </div>
  );
}
