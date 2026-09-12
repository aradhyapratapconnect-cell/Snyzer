import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore.js';

/**
 * Header session control (SNZ-014).
 *
 * Signed-out visitors get a sign-in link; signed-in users get an account
 * menu (initial avatar button) with their email and a sign-out action that
 * clears the session, resets auth state, and returns to the sign-in page.
 * The menu closes on Escape, selection, or outside interaction, and focus
 * returns to the trigger on Escape.
 */
export function UserMenu() {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (menuRef.current !== null && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:underline dark:text-primary-dark"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user?.email?.charAt(0) ?? '?').toUpperCase();

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setOpen(false);
      navigate('/login');
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-primary-dark dark:text-ink-dark"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-line-light bg-surface-light p-2 shadow-lg dark:border-line-dark dark:bg-surface-dark"
        >
          <p className="truncate px-3 py-2 text-xs text-subink-light dark:text-subink-dark">
            {user?.email ?? 'Signed in'}
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-light hover:bg-muted-light disabled:opacity-50 dark:text-ink-dark dark:hover:bg-muted-dark"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
