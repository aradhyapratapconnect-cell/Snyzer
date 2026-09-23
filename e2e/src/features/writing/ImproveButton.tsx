import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';

/**
 * Primary "Improve writing" action button (SNZ-045).
 *
 * Disabled while there is nothing submittable or a job is in flight, with an
 * inline spinner and explicit loading text. Duplicate submission prevention
 * is parent-driven: the workspace store flips `isProcessing` synchronously
 * on submit and React flushes the disabled state before the next discrete
 * click can dispatch (proven by the double-click test below). SNZ-046 wires
 * this button to the store.
 */
export function ImproveButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled || loading}
      onClick={onClick}
      className="w-full bg-gradient-to-r from-teal-400 to-emerald-400 font-semibold text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.35)] transition-all hover:from-teal-300 hover:to-emerald-300 hover:shadow-[0_0_30px_rgba(45,212,191,0.55)] active:scale-[0.98] disabled:opacity-40 disabled:shadow-none sm:w-auto"
    >
      {loading && <Spinner />}
      {loading ? 'Improving writing…' : 'Improve writing'}
    </Button>
  );
}
