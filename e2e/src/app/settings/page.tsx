import { useState } from 'react';
import type { EditorMode, Tone, WorkspaceLayout } from '@snyzer/shared';
import { Settings as SettingsIcon, SlidersHorizontal, User } from 'lucide-react';
import { ThemeToggle } from '../../components/settings/ThemeToggle.js';
import { DeleteAccountModal } from '../../components/settings/DeleteAccountModal.js';
import { Button } from '../../components/ui/button.js';
import { Label } from '../../components/ui/label.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { usePreferencesStore } from '../../stores/usePreferencesStore.js';
import { cn } from '../../lib/utils.js';

/**
 * Settings page (SNZ-034). Account details come from the verified session;
 * appearance and workspace defaults persist through the preferences store to
 * the real `/api/v1/preferences` endpoint; the danger zone guards permanent
 * account deletion behind an explicit confirmation modal.
 */
function planTierOf(user: { app_metadata?: Record<string, unknown> } | null): string {
  const role = user?.app_metadata?.['role'];
  return typeof role === 'string' && role !== '' ? role : 'FREE_USER';
}

function displayNameOf(
  user: { email?: string; user_metadata?: Record<string, unknown> } | null,
): string {
  const name = user?.user_metadata?.['display_name'];
  if (typeof name === 'string' && name !== '') {
    return name;
  }
  return user?.email ?? '—';
}

const TONE_OPTIONS: Array<{ value: Tone; label: string }> = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' },
  { value: 'direct', label: 'Direct' },
];

const EDITOR_OPTIONS: Array<{ value: EditorMode; label: string }> = [
  { value: 'plain', label: 'Plain text' },
  { value: 'rich', label: 'Rich text' },
];

const LAYOUT_OPTIONS: Array<{ value: WorkspaceLayout; label: string }> = [
  { value: 'side_by_side', label: 'Side by side' },
  { value: 'input_first', label: 'Input first' },
];

const selectClass =
  'mt-1 flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [showDelete, setShowDelete] = useState(false);
  const defaultTone = usePreferencesStore((state) => state.defaultTone);
  const editorMode = usePreferencesStore((state) => state.editorMode);
  const workspaceLayout = usePreferencesStore((state) => state.workspaceLayout);
  const prefsStatus = usePreferencesStore((state) => state.status);
  const prefsError = usePreferencesStore((state) => state.error);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);
  const clearPrefsError = usePreferencesStore((state) => state.clearError);

  return (
    <div className="w-full">
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="font-code mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-2.5 py-1 text-xs text-teal-300">
          <SettingsIcon className="h-3.5 w-3.5" />
          <span>Preferences &amp; System</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-400 md:text-base">
          Your account, appearance, and workspace defaults.
          {prefsStatus === 'saving' && (
            <span className="font-code ml-2 text-xs text-teal-300" aria-live="polite">
              Saving…
            </span>
          )}
        </p>
      </div>

      {prefsError !== null && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-slate-200"
        >
          <span>{prefsError}</span>
          <Button type="button" variant="secondary" size="sm" onClick={clearPrefsError}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-12">
        {/* Section nav hint */}
        <aside className="md:col-span-4">
          <div className="rounded-2xl border border-teal-500/20 bg-[#04101b]/90 p-4 shadow-xl backdrop-blur-xl">
            <nav aria-label="Settings sections" className="space-y-1">
              {[
                {
                  href: '#settings-account',
                  icon: User,
                  title: 'User & Profile',
                  desc: 'Session identity & plan',
                },
                {
                  href: '#settings-workspace',
                  icon: SlidersHorizontal,
                  title: 'Workspace defaults',
                  desc: 'Tone, editor & layout',
                },
                {
                  href: '#settings-appearance',
                  icon: SettingsIcon,
                  title: 'Appearance',
                  desc: 'Light, dark, or system',
                },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-slate-200 transition-all hover:border-teal-500/30 hover:bg-teal-950/40 hover:text-white"
                >
                  <span className="rounded-lg bg-teal-400/10 p-1.5 text-teal-400">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold">{item.title}</span>
                    <span className="block text-[10px] text-slate-400">{item.desc}</span>
                  </span>
                </a>
              ))}
            </nav>
            <p className="font-code mt-4 border-t border-teal-500/10 px-3 pt-3 text-[11px] leading-relaxed text-teal-300/60">
              Changes save to your account automatically and apply on every device.
            </p>
          </div>
        </aside>

        <div className="space-y-6 md:col-span-8">
          <section
            id="settings-account"
            aria-label="Account"
            className="rounded-2xl border border-teal-500/20 bg-[#04101b]/90 p-6 shadow-xl backdrop-blur-xl sm:p-7"
          >
            <h2 className="text-lg font-bold text-white">Account</h2>
            <p className="mt-1 text-xs text-slate-400">
              Identity comes from your verified sign-in session.
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Email</dt>
                <dd className="font-code font-medium break-all text-slate-100">
                  {user?.email ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Display name</dt>
                <dd className="font-medium text-slate-100">{displayNameOf(user)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Plan</dt>
                <dd>
                  <span className="font-code rounded-lg border border-teal-500/30 bg-teal-950/60 px-2.5 py-1 text-xs text-teal-300">
                    {planTierOf(user)}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section
            id="settings-workspace"
            aria-label="Workspace defaults"
            className="rounded-2xl border border-teal-500/20 bg-[#04101b]/90 p-6 shadow-xl backdrop-blur-xl sm:p-7"
          >
            <h2 className="text-lg font-bold text-white">Workspace defaults</h2>
            <p className="mt-1 text-xs text-slate-400">
              Starting point for every new revision in the playground.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="default-tone-select">Default tone</Label>
                <select
                  id="default-tone-select"
                  value={defaultTone}
                  onChange={(event) => {
                    void updatePreferences({ defaultTone: event.target.value as Tone });
                  }}
                  className={cn(selectClass, 'capitalize')}
                >
                  {TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="editor-mode-select">Editor</Label>
                <select
                  id="editor-mode-select"
                  value={editorMode}
                  onChange={(event) => {
                    void updatePreferences({ editorMode: event.target.value as EditorMode });
                  }}
                  className={selectClass}
                >
                  {EDITOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="workspace-layout-select">Layout</Label>
                <select
                  id="workspace-layout-select"
                  value={workspaceLayout}
                  onChange={(event) => {
                    void updatePreferences({
                      workspaceLayout: event.target.value as WorkspaceLayout,
                    });
                  }}
                  className={selectClass}
                >
                  {LAYOUT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section
            id="settings-appearance"
            aria-label="Appearance"
            className="rounded-2xl border border-teal-500/20 bg-[#04101b]/90 p-6 shadow-xl backdrop-blur-xl sm:p-7"
          >
            <h2 className="text-lg font-bold text-white">Appearance</h2>
            <div className="mt-4 max-w-xs">
              <ThemeToggle />
            </div>
          </section>

          <section
            aria-label="Danger zone"
            className="rounded-2xl border border-red-500/30 bg-[#04101b]/90 p-6 shadow-xl backdrop-blur-xl sm:p-7"
          >
            <h2 className="text-lg font-bold text-red-300">Danger zone</h2>
            <p className="mt-2 text-sm text-slate-400">
              Permanently delete your account, preferences, writing history, and usage records.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-4"
              onClick={() => {
                setShowDelete(true);
              }}
            >
              Delete account
            </Button>
          </section>
        </div>
      </div>

      <DeleteAccountModal
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
        }}
      />
    </div>
  );
}
