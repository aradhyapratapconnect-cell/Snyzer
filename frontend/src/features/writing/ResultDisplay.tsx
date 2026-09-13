import { useState } from 'react';
import { Button } from '../../components/ui/button.js';
import { toast } from '../../components/ui/toaster.js';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore.js';

/**
 * Revision result display (SNZ-047; streaming preview SNZ-061).
 *
 * Shows the latest AI revision with Copy (clipboard + toast), Use as input
 * (loads the revision back into the editor for iteration), and Rerun
 * (dispatches a fresh job). Empty state before the first run; clipboard
 * failures fall back to a manual-copy prompt instead of failing silently.
 *
 * While a stream is open (`streamingText`), a live preview renders the
 * tokens so far with a polite live region — the validated result replaces it
 * on completion.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API unavailable (permissions, insecure context): legacy path.
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function ResultDisplay() {
  const currentResult = useWorkspaceStore((state) => state.currentResult);
  const streamingText = useWorkspaceStore((state) => state.streamingText);
  const isProcessing = useWorkspaceStore((state) => state.isProcessing);
  const setInputText = useWorkspaceStore((state) => state.setInputText);
  const submitWritingJob = useWorkspaceStore((state) => state.submitWritingJob);
  const [copied, setCopied] = useState(false);

  if (streamingText !== null) {
    return (
      <div className="space-y-3" aria-live="polite" aria-label="Generating revision">
        <p className="text-xs font-medium tracking-wide text-subink-light uppercase dark:text-subink-dark">
          Generating…
        </p>
        <div className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap">
          {streamingText === '' ? (
            <span className="text-subink-light dark:text-subink-dark">
              The first words are on their way.
            </span>
          ) : (
            streamingText
          )}
        </div>
      </div>
    );
  }

  if (currentResult === null) {
    return (
      <p className="text-sm text-subink-light dark:text-subink-dark">
        Your improved text will appear here.
      </p>
    );
  }

  const handleCopy = async (): Promise<void> => {
    const ok = await writeToClipboard(currentResult.outputText);
    if (ok) {
      setCopied(true);
      toast.success('Copied to clipboard.');
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } else {
      toast.error('Copy failed. Select the text manually to copy it.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{currentResult.outputText}</div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => void handleCopy()}>
          {copied ? 'Copied ✓' : 'Copy'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setInputText(currentResult.outputText);
          }}
        >
          Use as input
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isProcessing}
          onClick={() => void submitWritingJob()}
        >
          Rerun
        </Button>
      </div>
    </div>
  );
}
