import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/button.js';
import { ExportButton } from '../../components/editor/ExportButton.js';
import { htmlToPlainText } from '../../components/editor/html.js';
import { toast } from '../../components/ui/toaster.js';
import { diffWords } from '../../lib/wordDiff.js';
import { cn } from '../../lib/utils.js';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore.js';

/**
 * Revision result display (SNZ-047; streaming preview SNZ-061).
 *
 * Shows the latest AI revision with Copy (clipboard + toast), Use as input
 * (loads the revision back into the editor for iteration), and Rerun
 * (dispatches a fresh job). Empty state before the first run; clipboard
 * failures fall back to a manual-copy prompt instead of failing silently.
 *
 * The Diff view aligns the original draft against the revision with a
 * client-side word diff (insertions highlighted, deletions struck through);
 * Clean shows the revision exactly as produced. Rich-text drafts are
 * stripped to plain text before diffing so markup never shows as changes.
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
  const inputText = useWorkspaceStore((state) => state.inputText);
  const editorMode = useWorkspaceStore((state) => state.editorMode);
  const selectedMode = useWorkspaceStore((state) => state.selectedMode);
  const selectedTone = useWorkspaceStore((state) => state.selectedTone);
  const setInputText = useWorkspaceStore((state) => state.setInputText);
  const submitWritingJob = useWorkspaceStore((state) => state.submitWritingJob);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'clean' | 'diff'>('clean');
  const diffSegments = useMemo(() => {
    if (currentResult === null) {
      return null;
    }
    const before = editorMode === 'rich' ? htmlToPlainText(inputText) : inputText;
    return diffWords(before, currentResult.outputText);
  }, [currentResult, editorMode, inputText]);

  if (streamingText !== null) {
    return (
      <div className="space-y-3" aria-live="polite" aria-label="Generating revision">
        <p className="font-code text-xs font-semibold tracking-wide text-teal-300 uppercase">
          Generating…
        </p>
        <div className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-slate-100">
          {streamingText === '' ? (
            <span className="text-slate-400">
              The first words are on their way.
              <span
                aria-hidden="true"
                className="animate-cursor ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-teal-300"
              />
            </span>
          ) : (
            <>
              {streamingText}
              <span
                aria-hidden="true"
                className="animate-cursor ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-teal-300"
              />
            </>
          )}
        </div>
        <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-teal-950">
          <div className="animate-laser h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
        </div>
      </div>
    );
  }

  if (currentResult === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Your improved text will appear here.</p>
        <ExportButton draft={inputText} revision={null} mode={selectedMode} tone={selectedTone} />
      </div>
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
      <div className="flex items-center justify-between gap-2">
        <span id="revision-view-label" className="text-xs font-medium text-slate-400">
          Revision view
        </span>
        <div
          role="group"
          aria-labelledby="revision-view-label"
          className="inline-flex rounded-full border border-teal-500/25 bg-teal-950/40 p-1"
        >
          {(['diff', 'clean'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => {
                setView(option);
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400',
                view === option
                  ? 'bg-teal-400/20 text-teal-200'
                  : 'text-slate-400 hover:text-teal-200',
              )}
            >
              {option === 'diff' ? 'Diff' : 'Clean'}
            </button>
          ))}
        </div>
      </div>
      {view === 'diff' && diffSegments !== null ? (
        <div
          aria-label="Revision changes"
          className="font-editorial text-[15px] leading-relaxed whitespace-pre-wrap text-slate-100"
        >
          {diffSegments.map((segment, index) =>
            segment.type === 'equal' ? (
              <span key={index}>{segment.text}</span>
            ) : segment.type === 'insert' ? (
              <ins key={index} className="rounded-sm bg-teal-500/15 text-teal-100 no-underline">
                {segment.text}
              </ins>
            ) : (
              <del key={index} className="rounded-sm bg-red-500/10 text-red-300/80">
                {segment.text}
              </del>
            ),
          )}
        </div>
      ) : (
        <div className="font-editorial text-[15px] leading-relaxed whitespace-pre-wrap text-slate-100">
          {currentResult.outputText}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => void handleCopy()}>
          {copied ? 'Copied ✓' : 'Copy'}
        </Button>
        <ExportButton
          draft={inputText}
          revision={currentResult.outputText}
          mode={selectedMode}
          tone={selectedTone}
        />
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
