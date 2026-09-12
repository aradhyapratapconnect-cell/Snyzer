import { useEffect } from 'react';
import type { EditorMode } from '@snyzer/shared';
import { MAX_INPUT_TEXT_LENGTH } from '@snyzer/shared';
import { EditorModeToggle } from '../components/editor/EditorModeToggle.js';
import { PlainEditor } from '../components/editor/PlainEditor.js';
import { RichEditor } from '../components/editor/RichEditor.js';
import { htmlToPlainText } from '../components/editor/html.js';
import { AnalysisPanel } from '../components/analysis/AnalysisPanel.js';
import { ImproveButton } from '../features/writing/ImproveButton.js';
import { ResultDisplay } from '../features/writing/ResultDisplay.js';
import { WorkspaceErrorOverlay } from '../features/writing/WorkspaceErrorOverlay.js';
import { WorkspaceLayout } from '../features/writing/WorkspaceLayout.js';
import { WritingControls } from '../features/writing/WritingControls.js';
import { usePreferencesStore } from '../stores/usePreferencesStore.js';
import { useWorkspaceStore } from '../stores/useWorkspaceStore.js';

/**
 * Writing workspace page (SNZ-013 placeholder → SNZ-046 composition).
 *
 * Composes the editor, mode toggle, controls, submit action, result display,
 * and analysis panel over the workspace store. Mode switches convert content
 * without loss (rich→plain strips to text) and persist the choice to
 * preferences.
 */
export function WorkspacePage() {
  const inputText = useWorkspaceStore((state) => state.inputText);
  const editorMode = useWorkspaceStore((state) => state.editorMode);
  const selectedMode = useWorkspaceStore((state) => state.selectedMode);
  const selectedTone = useWorkspaceStore((state) => state.selectedTone);
  const targets = useWorkspaceStore((state) => state.targets);
  const isProcessing = useWorkspaceStore((state) => state.isProcessing);
  const currentResult = useWorkspaceStore((state) => state.currentResult);
  const activeError = useWorkspaceStore((state) => state.activeError);
  const setInputText = useWorkspaceStore((state) => state.setInputText);
  const setEditorMode = useWorkspaceStore((state) => state.setEditorMode);
  const setControls = useWorkspaceStore((state) => state.setControls);
  const applyDefaultTone = useWorkspaceStore((state) => state.applyDefaultTone);
  const submitWritingJob = useWorkspaceStore((state) => state.submitWritingJob);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Workspace</h1>
        <EditorModeToggle mode={editorMode} onChange={handleModeChange} disabled={isProcessing} />
      </div>

      <WorkspaceLayout
        input={
          <div className="space-y-4">
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
                  targets: { clarity: controls.clarity, sentenceVariety: controls.sentenceVariety },
                })
              }
              disabled={isProcessing}
            />
            <ImproveButton
              disabled={!submittable}
              loading={isProcessing}
              onClick={() => void submitWritingJob()}
            />
            {activeError !== null && (
              <WorkspaceErrorOverlay
                error={activeError}
                onRetry={() => void submitWritingJob()}
                retrying={isProcessing}
              />
            )}
          </div>
        }
        result={
          <div className="space-y-6">
            <ResultDisplay />
            {currentResult !== null && <AnalysisPanel analysis={currentResult.analysis} />}
          </div>
        }
      />
    </div>
  );
}
