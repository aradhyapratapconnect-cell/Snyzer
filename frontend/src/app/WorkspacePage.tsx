import { useEffect, useRef } from 'react';
import type { EditorMode } from '@snyzer/shared';
import { MAX_INPUT_TEXT_LENGTH } from '@snyzer/shared';
import { FileText, Lock, Sparkles } from 'lucide-react';
import { EditorModeToggle } from '../components/editor/EditorModeToggle.js';
import { PlainEditor } from '../components/editor/PlainEditor.js';
import { RichEditor } from '../components/editor/RichEditor.js';
import { htmlToPlainText } from '../components/editor/html.js';
import { AnalysisPanel } from '../components/analysis/AnalysisPanel.js';
import { ImproveButton } from '../features/writing/ImproveButton.js';
import { PresetManager } from '../features/writing/PresetManager.js';
import { ResultDisplay } from '../features/writing/ResultDisplay.js';
import { WorkspaceErrorOverlay } from '../features/writing/WorkspaceErrorOverlay.js';
import { WorkspaceLayout } from '../features/writing/WorkspaceLayout.js';
import { WritingControls } from '../features/writing/WritingControls.js';
import { useStreamingRevision } from '../hooks/useStreamingRevision.js';
import { usePreferencesStore } from '../stores/usePreferencesStore.js';
import { useWorkspaceStore } from '../stores/useWorkspaceStore.js';
import { cn } from '../lib/utils.js';

/**
 * Writing playground page (SNZ-013 placeholder → SNZ-046 composition).
 *
 * Demo-reference presentation (two-panel revision console with a live status
 * pill and keyboard shortcut) over the real production engine: the editor,
 * controls, streaming submit action, result display, and analysis panel run
 * on the workspace store and the live `/api/v1/writing` endpoints.
 */
type EngineStatus = 'idle' | 'processing' | 'streaming' | 'completed' | 'failed';

function statusOf({
  isProcessing,
  streamingText,
  currentResult,
  activeError,
}: {
  isProcessing: boolean;
  streamingText: string | null;
  currentResult: unknown;
  activeError: unknown;
}): EngineStatus {
  if (isProcessing) {
    return streamingText !== null ? 'streaming' : 'processing';
  }
  if (activeError !== null) {
    return 'failed';
  }
  if (currentResult !== null) {
    return 'completed';
  }
  return 'idle';
}

const STATUS_STYLES: Record<EngineStatus, string> = {
  idle: 'border-slate-700 bg-slate-900/60 text-slate-300',
  processing: 'border-teal-500/40 bg-teal-950/60 text-teal-200',
  streaming:
    'border-teal-400/60 bg-teal-400/10 text-teal-200 shadow-[0_0_15px_rgba(45,212,191,0.25)]',
  completed: 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300',
  failed: 'border-red-500/40 bg-red-950/40 text-red-300',
};

const STATUS_LABELS: Record<EngineStatus, string> = {
  idle: 'Idle',
  processing: 'Processing',
  streaming: 'Streaming',
  completed: 'Completed',
  failed: 'Failed',
};

export function WorkspacePage() {
  const inputText = useWorkspaceStore((state) => state.inputText);
  const editorMode = useWorkspaceStore((state) => state.editorMode);
  const selectedMode = useWorkspaceStore((state) => state.selectedMode);
  const selectedTone = useWorkspaceStore((state) => state.selectedTone);
  const targets = useWorkspaceStore((state) => state.targets);
  const isProcessing = useWorkspaceStore((state) => state.isProcessing);
  const currentResult = useWorkspaceStore((state) => state.currentResult);
  const activeError = useWorkspaceStore((state) => state.activeError);
  const streamingText = useWorkspaceStore((state) => state.streamingText);
  const setInputText = useWorkspaceStore((state) => state.setInputText);
  const setEditorMode = useWorkspaceStore((state) => state.setEditorMode);
  const setControls = useWorkspaceStore((state) => state.setControls);
  const applyDefaultTone = useWorkspaceStore((state) => state.applyDefaultTone);
  const submitWritingJob = useWorkspaceStore((state) => state.submitWritingJob);
  const beginStream = useWorkspaceStore((state) => state.beginStream);
  const appendStreamText = useWorkspaceStore((state) => state.appendStreamText);
  const finishStream = useWorkspaceStore((state) => state.finishStream);
  const failStream = useWorkspaceStore((state) => state.failStream);
  const cancelStream = useWorkspaceStore((state) => state.cancelStream);
  const loadPreferences = usePreferencesStore((state) => state.loadPreferences);
  const persistEditorMode = usePreferencesStore((state) => state.updatePreferences);

  useEffect(() => {
    let live = true;
    void loadPreferences().then(() => {
      if (live) {
        applyDefaultTone();
      }
    });
    return () => {
      live = false;
    };
  }, [loadPreferences, applyDefaultTone]);

  const handleModeChange = (mode: EditorMode) => {
    if (mode === editorMode) {
      return;
    }
    if (mode === 'plain') {
      setInputText(htmlToPlainText(inputText));
    }
    setEditorMode(mode);
    void persistEditorMode({ editorMode: mode });
  };

  const submittable =
    inputText.trim() !== '' && inputText.length <= MAX_INPUT_TEXT_LENGTH && !isProcessing;

  // Live revisions first: the hook streams tokens progressively and drops to
  // the synchronous endpoint wherever SSE cannot connect.
  const streaming = useStreamingRevision({
    onToken: appendStreamText,
    onDone: finishStream,
    onError: failStream,
    fallback: () => {
      cancelStream();
      return submitWritingJob();
    },
  });

  const handleImprove = () => {
    if (!submittable) {
      return;
    }
    beginStream();
    void streaming.submit({
      inputText,
      mode: selectedMode,
      tone: selectedTone,
      editorMode,
      preferences: targets,
    });
  };

  // Demo-reference power shortcut: Ctrl/Cmd+Enter revises the draft.
  // A ref keeps the listener stable while always calling the latest handler.
  const improveRef = useRef(handleImprove);
  improveRef.current = handleImprove;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        improveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const status = statusOf({ isProcessing, streamingText, currentResult, activeError });

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-code mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-2.5 py-1 text-xs text-teal-300">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400"
            />
            <span>Writing Playground · Live</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-400 md:text-base">
            Draft on the left, revise on the right. Ctrl+Enter revises instantly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            role="status"
            aria-label={`Engine status: ${STATUS_LABELS[status]}`}
            className={cn(
              'font-code inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
              STATUS_STYLES[status],
              status === 'streaming' && 'animate-glow-pulse',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                status === 'idle' && 'bg-slate-500',
                status === 'processing' && 'animate-pulse bg-teal-400',
                status === 'streaming' && 'animate-ping bg-teal-300',
                status === 'completed' && 'bg-emerald-400',
                status === 'failed' && 'bg-red-400',
              )}
            />
            {STATUS_LABELS[status]}
          </span>
          <span
            title="Every revision preserves your draft's meaning and intent."
            className="font-code inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-950/40 px-3 py-1.5 text-xs font-semibold text-teal-200/90"
          >
            <Lock className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
            Intent lock · Always on
          </span>
          <EditorModeToggle mode={editorMode} onChange={handleModeChange} disabled={isProcessing} />
        </div>
      </div>

      <WorkspaceLayout
        input={
          <div className="rounded-2xl border border-teal-500/20 bg-[#04101b]/90 p-6 shadow-xl backdrop-blur-xl sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <FileText className="h-4 w-4 text-amber-400" />
                Original Draft
              </h2>
              <span className="font-code text-[11px] text-slate-500">
                {selectedMode} · {selectedTone}
              </span>
            </div>
            <div className="space-y-5">
              {editorMode === 'plain' ? (
                <PlainEditor value={inputText} onChange={setInputText} readOnly={isProcessing} />
              ) : (
                <RichEditor value={inputText} onChange={setInputText} readOnly={isProcessing} />
              )}
              <WritingControls
                values={{
                  mode: selectedMode,
                  tone: selectedTone,
                  clarity: targets.clarity,
                  sentenceVariety: targets.sentenceVariety,
                }}
                onChange={(controls) =>
                  setControls({
                    mode: controls.mode,
                    tone: controls.tone,
                    targets: {
                      clarity: controls.clarity,
                      sentenceVariety: controls.sentenceVariety,
                    },
                  })
                }
                disabled={isProcessing}
              />
              <PresetManager
                current={{
                  mode: selectedMode,
                  tone: selectedTone,
                  clarity: targets.clarity,
                  sentenceVariety: targets.sentenceVariety,
                }}
                onApply={(preset) =>
                  setControls({
                    mode: preset.mode,
                    tone: preset.tone,
                    targets: {
                      clarity: preset.clarity,
                      sentenceVariety: preset.sentenceVariety,
                    },
                  })
                }
              />
              <ImproveButton
                disabled={!submittable}
                loading={isProcessing}
                onClick={handleImprove}
              />
              {activeError !== null && (
                <WorkspaceErrorOverlay
                  error={activeError}
                  onRetry={() => void submitWritingJob()}
                  retrying={isProcessing}
                />
              )}
            </div>
          </div>
        }
        result={
          <div className="flex min-w-0 flex-col gap-6">
            <div className="rounded-2xl border border-teal-500/25 bg-[#061520]/90 p-6 shadow-xl backdrop-blur-xl sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  Snyzer Revision
                </h2>
                <span className="font-code text-[11px] text-teal-300/70">
                  {status === 'streaming' ? 'tokens arriving live' : 'backend-scored'}
                </span>
              </div>
              <ResultDisplay />
            </div>
            {currentResult !== null && (
              <div className="rounded-2xl border border-teal-500/20 bg-[#04101b]/90 p-6 shadow-xl backdrop-blur-xl sm:p-7">
                <AnalysisPanel analysis={currentResult.analysis} />
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}
