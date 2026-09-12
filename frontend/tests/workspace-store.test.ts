import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnnouncerStore } from '../src/hooks/useAnnouncer.js';
import { useWorkspaceStore } from '../src/stores/useWorkspaceStore.js';

/**
 * SNZ-046 tests: workspace state transitions, submission lifecycle, guards,
 * error preservation, and screen-reader announcements — with a mocked API
 * client. No network involved.
 */
const mocks = vi.hoisted(() => {
  class ApiClientError extends Error {
    code: string;
    status: number;
    details?: unknown;
    constructor(options: { code: string; message: string; status: number; details?: unknown }) {
      super(options.message);
      this.name = 'ApiClientError';
      this.code = options.code;
      this.status = options.status;
      if (options.details !== undefined) {
        this.details = options.details;
      }
    }
  }
  return { ApiClientError, apiRequest: vi.fn() };
});

vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: mocks.ApiClientError,
  apiRequest: (...args: unknown[]) => mocks.apiRequest(...args),
}));

const apiRequestMock = mocks.apiRequest;
const ApiClientError = mocks.ApiClientError;

const jobResponse = {
  job: {
    id: '11111111-1111-4111-8111-111111111111',
    status: 'completed',
    outputText: 'Clear writing triumphs.',
    analysis: {
      readability: 72,
      clarity: 80,
      repetition: 12,
      sentenceVariety: 68,
      vocabularyComplexity: 55,
      formality: 61,
    },
  },
};

function resetWorkspace() {
  useWorkspaceStore.setState({
    inputText: '',
    editorMode: 'plain',
    selectedMode: 'natural',
    selectedTone: 'professional',
    targets: { clarity: 70, sentenceVariety: 60 },
    isProcessing: false,
    currentResult: null,
    activeError: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWorkspace();
  useAnnouncerStore.setState({ politeMessage: '', assertiveMessage: '', sequence: 0 });
  apiRequestMock.mockResolvedValue(jobResponse);
});

describe('useWorkspaceStore', () => {
  it('starts empty and idle with sensible control defaults', () => {
    const state = useWorkspaceStore.getState();

    expect(state.inputText).toBe('');
    expect(state.selectedMode).toBe('natural');
    expect(state.targets).toEqual({ clarity: 70, sentenceVariety: 60 });
    expect(state.isProcessing).toBe(false);
    expect(state.currentResult).toBeNull();
    expect(state.activeError).toBeNull();
  });

  it('submits the contract payload and stores the result', async () => {
    useWorkspaceStore.setState({ inputText: 'Clear writing wins.' });

    await useWorkspaceStore.getState().submitWritingJob();
    const state = useWorkspaceStore.getState();

    expect(apiRequestMock).toHaveBeenCalledWith('/writing/jobs', {
      method: 'POST',
      body: {
        inputText: 'Clear writing wins.',
        mode: 'natural',
        tone: 'professional',
        editorMode: 'plain',
        preferences: { clarity: 70, sentenceVariety: 60 },
      },
    });
    expect(state.currentResult?.outputText).toBe('Clear writing triumphs.');
    expect(state.currentResult?.analysis.clarity).toBe(80);
    expect(state.isProcessing).toBe(false);
    expect(state.activeError).toBeNull();
    expect(useAnnouncerStore.getState().politeMessage).toContain('Revision complete');
  });

  it('preserves the draft and reports failures without crashing', async () => {
    apiRequestMock.mockRejectedValue(
      new ApiClientError({
        code: 'AI_PROVIDER_UNAVAILABLE',
        message: 'Provider down.',
        status: 503,
      }),
    );
    useWorkspaceStore.setState({ inputText: 'Keep this draft.' });

    await useWorkspaceStore.getState().submitWritingJob();
    const state = useWorkspaceStore.getState();

    expect(state.inputText).toBe('Keep this draft.');
    expect(state.currentResult).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.activeError).toEqual({
      code: 'AI_PROVIDER_UNAVAILABLE',
      message: 'Provider down.',
    });
    expect(useAnnouncerStore.getState().assertiveMessage).toContain('preserved');
  });

  it('refuses empty, blank, and over-limit input without calling the API', async () => {
    for (const inputText of ['', '   ']) {
      useWorkspaceStore.setState({ inputText });
      await useWorkspaceStore.getState().submitWritingJob();
    }
    expect(apiRequestMock).not.toHaveBeenCalled();

    useWorkspaceStore.setState({ inputText: 'x'.repeat(10_001) });
    await useWorkspaceStore.getState().submitWritingJob();
    expect(apiRequestMock).not.toHaveBeenCalled();
    expect(useWorkspaceStore.getState().activeError?.code).toBe('TEXT_TOO_LONG');
  });

  it('ignores submissions while a job is already processing', async () => {
    useWorkspaceStore.setState({ inputText: 'Busy draft.', isProcessing: true });

    await useWorkspaceStore.getState().submitWritingJob();

    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('resets workspace content and clears errors', async () => {
    useWorkspaceStore.setState({ inputText: 'Draft.', activeError: { code: 'X', message: 'Y' } });

    useWorkspaceStore.getState().clearError();
    expect(useWorkspaceStore.getState().activeError).toBeNull();

    useWorkspaceStore.setState({ inputText: 'Draft again.' });
    useWorkspaceStore.getState().resetWorkspace();
    const state = useWorkspaceStore.getState();
    expect(state.inputText).toBe('');
    expect(state.currentResult).toBeNull();
    expect(state.isProcessing).toBe(false);
  });
});
