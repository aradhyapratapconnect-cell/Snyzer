/**
 * Workspace placeholder (SNZ-013).
 *
 * Exists so successful authentication has a redirect target today. Epic 9
 * (SNZ-041+) replaces this content with the real editor, controls, results,
 * and analysis panels; the `/workspace` route itself stays.
 */
export function WorkspacePage() {
  return (
    <section aria-label="Workspace">
      <h1 className="text-2xl font-semibold">Workspace</h1>
      <p className="mt-2 text-sm text-subink-light dark:text-subink-dark">
        You are signed in. The writing editor, controls, and results arrive with the workspace
        tickets.
      </p>
    </section>
  );
}
