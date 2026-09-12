import { SHARED_PACKAGE_VERSION } from '@snyzer/shared';
import { AppLayout } from '../components/layout/AppLayout.js';

/**
 * Standard root layout container (SNZ-003; header session menu SNZ-014;
 * navigation shell SNZ-036). Owns the themed page canvas and footer;
 * `AppLayout` owns the header and routed content.
 */
export function App() {
  return (
    <div
      data-testid="root-layout"
      className="flex min-h-screen flex-col bg-canvas-light text-ink-light dark:bg-canvas-dark dark:text-ink-dark"
    >
      <AppLayout />
      <footer className="border-t border-line-light dark:border-line-dark">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs text-subink-light dark:text-subink-dark">
          <span>Snyzer writing workspace</span>
          <span>shared v{SHARED_PACKAGE_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}
