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
      className="w-full sm:w-auto"
    >
      {loading && <Spinner />}
      {loading ? 'Improving writing…' : 'Improve writing'}
    </Button>
  );
}
