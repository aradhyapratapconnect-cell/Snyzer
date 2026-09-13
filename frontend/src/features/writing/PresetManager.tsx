import { useEffect, useState } from 'react';
import type { Preset } from '@snyzer/shared';
import { MAX_PRESETS_PER_USER } from '@snyzer/shared';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { ApiClientError, apiRequest } from '../../lib/apiClient.js';
import type { WritingControlValues } from './WritingControls.js';

/**
 * Style preset manager (SNZ-062).
 *
 * Saves the current workspace controls under a name, applies a saved preset
 * to the controls in one click, and deletes presets. The list hydrates from
 * the backend on mount so presets persist across logins; the parent owns the
 * live control state and receives applied values through `onApply`.
 */
interface PresetsResponse {
  presets: Preset[];
}

interface PresetResponse {
  preset: Preset;
}

function friendlyError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function PresetManager({
  current,
  onApply,
}: {
  current: WritingControlValues;
  onApply: (values: WritingControlValues) => void;
}) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void apiRequest<PresetsResponse>('/presets')
      .then((response) => {
        if (live) {
          setPresets(response.presets);
          setStatus('ready');
        }
      })
      .catch((requestError: unknown) => {
        if (live) {
          setError(friendlyError(requestError));
          setStatus('ready');
        }
      });
    return () => {
      live = false;
    };
  }, []);

  const full = presets.length >= MAX_PRESETS_PER_USER;

  const handleSave = async (): Promise<void> => {
    if (name.trim() === '' || saving || full) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await apiRequest<PresetResponse>('/presets', {
        method: 'POST',
        body: { name: name.trim(), ...current },
      });
      setPresets((previous) => [response.preset, ...previous]);
      setName('');
    } catch (requestError) {
      setError(friendlyError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setError(null);
    try {
      await apiRequest(`/presets/${id}`, { method: 'DELETE' });
      setPresets((previous) => previous.filter((preset) => preset.id !== id));
    } catch (requestError) {
      setError(friendlyError(requestError));
    }
  };

  return (
    <section aria-label="Style presets" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-light dark:text-ink-dark">Style presets</h2>
        <span className="text-xs text-subink-light dark:text-subink-dark" aria-live="polite">
          {presets.length} of {MAX_PRESETS_PER_USER} saved
        </span>
      </div>

      {status === 'loading' && (
        <p className="text-sm text-subink-light dark:text-subink-dark">Loading presets…</p>
      )}

      {status === 'ready' && presets.length === 0 && (
        <p className="text-sm text-subink-light dark:text-subink-dark">
          Save your current style to reuse it in one click.
        </p>
      )}

      {presets.length > 0 && (
        <ul className="space-y-2">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-line-light px-3 py-2 dark:border-line-dark"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{preset.name}</p>
                <p className="text-xs text-subink-light dark:text-subink-dark">
                  {preset.mode} · {preset.tone}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onApply({
                      mode: preset.mode,
                      tone: preset.tone,
                      clarity: preset.clarity,
                      sentenceVariety: preset.sentenceVariety,
                    });
                  }}
                >
                  Apply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete ${preset.name}`}
                  onClick={() => void handleDelete(preset.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor="preset-name" className="sr-only">
            Preset name
          </Label>
          <Input
            id="preset-name"
            value={name}
            maxLength={60}
            placeholder="Name this style, e.g. My Blog Tone"
            disabled={saving || full}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={name.trim() === '' || saving || full}
          onClick={() => void handleSave()}
        >
          {saving ? 'Saving…' : 'Save style'}
        </Button>
      </div>
      {full && (
        <p className="text-xs text-subink-light dark:text-subink-dark">
          Preset limit reached — delete one to save another.
        </p>
      )}

      {error !== null && (
        <div
          role="alert"
          className="rounded-lg border border-line-light bg-muted-light p-3 text-sm dark:border-line-dark dark:bg-muted-dark"
        >
          {error}
        </div>
      )}
    </section>
  );
}
