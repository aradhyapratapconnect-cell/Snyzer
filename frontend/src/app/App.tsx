import { Outlet } from 'react-router-dom';
import { SHARED_PACKAGE_VERSION } from '@snyzer/shared';
import { UserMenu } from '../features/auth/UserMenu.js';

/**
 * Standard root layout container (SNZ-003; header session menu SNZ-014).
 * Renders the application chrome (header, content outlet, footer) on the
 * themed canvas. Workspace, history, and settings routes arrive in later
 * tickets.
 */
export function App() {
  return (
    <div
      data-testid="root-layout"
      className="flex min-h-screen flex-col bg-canvas-light text-ink-light dark:bg-canvas-dark dark:text-ink-dark"
    >
      <header className="border-b border-line-light dark:border-line-dark">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Snyzer</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-subink-light sm:inline dark:text-subink-dark">
              AI-assisted writing
            </span>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-line-light dark:border-line-dark">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs text-subink-light dark:text-subink-dark">
          <span>Snyzer writing workspace</span>
          <span>shared v{SHARED_PACKAGE_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}
