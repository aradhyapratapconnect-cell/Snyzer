import type { Analysis, EditorMode, Tone, WritingJobResponse, WritingMode } from '@snyzer/shared';
import { MAX_INPUT_TEXT_LENGTH } from '@snyzer/shared';
import { create } from 'zustand';
import { ApiClientError, apiRequest } from '../lib/apiClient.js';
import { useAnnouncerStore } from '../hooks/useAnnouncer.js';
import { usePreferencesStore } from './usePreferencesStore.js';

/**
 * Workspace transient state (SNZ-046).
 *
 * Holds the draft, controls, in-flight job, latest result, and error for the
 * writing workspace. Server history stays server-side; this store never
 * duplicates it. `submitWritingJob` guards invalid input, preserves the
 * draft on every failure path, and announces lifecycle transitions for
 * screen readers (SNZ-040). Preference persistence for editor mode lives
 * with the mode toggle container, not here.
 */
export interface WorkspaceResult {
  outputText: string;
  analysis: Analysis;
}

export interface WorkspaceError {
  code: string;
  message: string;
}

export interface StyleTargets {
  clarity: number;
  sentenceVariety: number;
}

export const DEFAULT_STYLE_TARGETS: StyleTargets = {
  clarity: 70,
  sentenceVariety: 60,
};

interface WorkspaceState {
  inputText: string;
  editorMode: EditorMode;
  selectedMode: WritingMode;
  selectedTone: Tone;
  targets: StyleTargets;
  isProcessing: boolean;
  currentResult: WorkspaceResult | null;
  activeError: WorkspaceError | null;
  setInputText: (inputText: string) => void;
  setEditorMode: (editorMode: EditorMode) => void;
  setControls: (controls: {
    mode?: WritingMode;
    tone?: Tone;
    targets?: Partial<StyleTargets>;
  }) => void;
  applyDefaultTone: () => void;
  submitWritingJob: () => Promise<void>;
  resetWorkspace: () => void;
  clearError: () => void;
}

function errorOf(error: unknown): WorkspaceError {
  if (error instanceof ApiClientError) {
    return { code: error.code, message: error.message };
  }
  return { code: 'REQUEST_FAILED', message: 'Something went wrong. Please try again.' };
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  inputText: '',
  editorMode: 'plain',
  selectedMode: 'natural',
  selectedTone: usePreferencesStore.getState().defaultTone,
  targets: { ...DEFAULT_STYLE_TARGETS },
  isProcessing: false,
  currentResult: null,
  activeError: null,
  setInputText: (inputText: string) => {
    set({ inputText });
  },
  setEditorMode: (editorMode: EditorMode) => {
    set({ editorMode });
  },
  setControls: (controls) => {
    set({
      ...(controls.mode !== undefined ? { selectedMode: controls.mode } : {}),
      ...(controls.tone !== undefined ? { selectedTone: controls.tone } : {}),
      ...(controls.targets !== undefined
        ? { targets: { ...get().targets, ...controls.targets } }
        : {}),
    });
  },
  applyDefaultTone: () => {
    set({ selectedTone: usePreferencesStore.getState().defaultTone });
  },
  submitWritingJob: async () => {
    const state = get();
    if (state.isProcessing) {
      return;
    }
    if (state.inputText.trim() === '') {
      return;
    }
    if (state.inputText.length > MAX_INPUT_TEXT_LENGTH) {
      set({
        activeError: {
          code: 'TEXT_TOO_LONG',
          message: 'Your text is longer than the supported limit.',
        },
      });
      return;
    }
    set({ isProcessing: true, activeError: null });
    useAnnouncerStore.getState().announce('Improving text, please wait.');
    try {
      const response = await apiRequest<WritingJobResponse>('/writing/jobs', {
        method: 'POST',
        body: {
          inputText: state.inputText,
          mode: state.selectedMode,
          tone: state.selectedTone,
          editorMode: state.editorMode,
          preferences: state.targets,
        },
      });
      set({
        currentResult: {
          outputText: response.job.outputText,
          analysis: response.job.analysis,
        },
        isProcessing: false,
      });
      useAnnouncerStore.getState().announce('Revision complete. Results updated.');
    } catch (error) {
      // The draft is deliberately untouched: inputText is never cleared here.
      set({ activeError: errorOf(error), isProcessing: false });
      useAnnouncerStore
        .getState()
        .announce('Revision failed. Your text was preserved.', 'assertive');
    }
  },
  resetWorkspace: () => {
    set({ inputText: '', currentResult: null, activeError: null, isProcessing: false });
  },
  clearError: () => {
    set({ activeError: null });
  },
}));
