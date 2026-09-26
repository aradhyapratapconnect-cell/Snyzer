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
        className="inline-flex items-center justify-center rounded-full bg-teal-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.35)] transition-all hover:scale-105 hover:bg-teal-300 active:scale-95"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user?.email?.charAt(0) ?? '?').toUpperCase();
  const displayName =
    typeof user?.user_metadata?.['display_name'] === 'string' &&
    user.user_metadata['display_name'] !== ''
      ? (user.user_metadata['display_name'] as string)
      : (user?.email?.split('@')[0] ?? 'Account');

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
        className="flex items-center gap-2.5 rounded-full border border-teal-500/30 bg-teal-950/40 px-3 py-1.5 text-teal-200 transition-all hover:border-teal-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1.5px]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#04111c] text-xs font-bold text-teal-300">
            {initial}
          </span>
        </span>
        <span className="max-w-[110px] truncate text-xs font-semibold tracking-tight">
          {displayName}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-3 w-72 rounded-2xl border border-teal-500/30 bg-[#04101b] p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(45,212,191,0.15)] backdrop-blur-2xl"
        >
          <div className="border-b border-teal-500/10 px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 p-[2px]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#051422] text-sm font-bold text-teal-300">
                  {initial}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="font-code truncate text-xs text-slate-400">
                  {user?.email ?? 'Signed in'}
                </p>
              </div>
            </div>
          </div>
          <Link
            to="/workspace"
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
            className="mt-1 block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/60 hover:text-white"
          >
            Writing Playground
          </Link>
          <Link
            to="/history"
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
            className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/60 hover:text-white"
          >
            Revision History
          </Link>
          <Link
            to="/settings"
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
            className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/60 hover:text-white"
          >
            Settings
          </Link>
          <div className="mt-1 border-t border-teal-500/10 px-1.5 pt-1.5">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-400 transition-colors hover:bg-red-950/30 hover:text-red-300 disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
