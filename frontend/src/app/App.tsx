import { Footer } from '../components/layout/Footer.js';
import { AppLayout } from '../components/layout/AppLayout.js';
import { A11yAnnouncer } from '../components/layout/A11yAnnouncer.js';
import { Toaster } from '../components/ui/toaster.js';

/**
 * Standard root layout container (SNZ-003; header session menu SNZ-014;
 * navigation shell SNZ-036; toast provider SNZ-039; live regions SNZ-040).
 * Owns the themed page canvas and footer; `AppLayout` owns the header and
 * routed content.
 */
export function App() {
  return (
    <div
      data-testid="root-layout"
      className="flex min-h-screen flex-col bg-canvas-light text-ink-light dark:bg-canvas-dark dark:text-ink-dark"
    >
      <AppLayout />
      <Footer />
      <Toaster />
      <A11yAnnouncer />
    </div>
  );
}
