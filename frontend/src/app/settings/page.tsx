import { useState } from 'react';
import { ThemeToggle } from '../../components/settings/ThemeToggle.js';
import { DeleteAccountModal } from '../../components/settings/DeleteAccountModal.js';
import { Button } from '../../components/ui/button.js';
import { useAuthStore } from '../../stores/useAuthStore.js';

/**
 * Settings page (SNZ-034). Account details come from the verified session;
 * appearance persists through the preferences store; the danger zone guards
 * permanent account deletion behind an explicit confirmation modal.
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

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section
        aria-label="Account"
        className="rounded-xl border border-line-light bg-surface-light p-6 dark:border-line-dark dark:bg-surface-dark"
      >
        <h2 className="text-lg font-semibold">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-subink-light dark:text-subink-dark">Email</dt>
            <dd className="font-medium">{user?.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-subink-light dark:text-subink-dark">Display name</dt>
            <dd className="font-medium">{displayNameOf(user)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-subink-light dark:text-subink-dark">Plan</dt>
            <dd className="font-medium">{planTierOf(user)}</dd>
          </div>
        </dl>
      </section>

      <section
        aria-label="Appearance"
        className="rounded-xl border border-line-light bg-surface-light p-6 dark:border-line-dark dark:bg-surface-dark"
      >
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="mt-4 max-w-xs">
          <ThemeToggle />
        </div>
      </section>

      <section
        aria-label="Danger zone"
        className="rounded-xl border border-danger-light/40 bg-surface-light p-6 dark:border-danger-dark/40 dark:bg-surface-dark"
      >
        <h2 className="text-lg font-semibold text-danger-light dark:text-danger-dark">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-subink-light dark:text-subink-dark">
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

      <DeleteAccountModal
        open={showDelete}
        onClose={() => {
          setShowDelete(false);
        }}
      />
    </div>
  );
}
