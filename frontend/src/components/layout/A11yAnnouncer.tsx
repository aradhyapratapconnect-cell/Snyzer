import { useAnnouncerStore } from '../../hooks/useAnnouncer.js';

/**
 * Live-region container (SNZ-040). Mounted once at the app root; visually
 * hidden but announced. Polite for completions, assertive for errors.
 */
export function A11yAnnouncer() {
  const politeMessage = useAnnouncerStore((state) => state.politeMessage);
  const assertiveMessage = useAnnouncerStore((state) => state.assertiveMessage);

  return (
    <>
      <div aria-live="polite" role="status" className="sr-only">
        {politeMessage}
      </div>
      <div aria-live="assertive" role="alert" className="sr-only">
        {assertiveMessage}
      </div>
    </>
  );
}
