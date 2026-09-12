import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultDisplay } from '../src/features/writing/ResultDisplay.js';
import { useWorkspaceStore } from '../src/stores/useWorkspaceStore.js';

/**
 * SNZ-047 tests: result actions with a mocked clipboard. No network involved.
 */
const apiRequestMock = vi.fn();
vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const writeTextMock = vi.fn();

// jsdom's Clipboard internals are not reliably overridable through the
// prototype chain, so the whole `navigator` binding is stubbed instead
// (restored after every test). userAgent is preserved for libraries that
// sniff it.
function stubNavigatorClipboard() {
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (test)',
    clipboard: { writeText: writeTextMock },
  });
}

function setResult() {
  useWorkspaceStore.setState({
    inputText: 'original draft',
    currentResult: {
      outputText: 'exact revised string',
      analysis: {
        readability: 72,
        clarity: 80,
        repetition: 12,
        sentenceVariety: 68,
        vocabularyComplexity: 55,
        formality: 61,
      },
    },
    isProcessing: false,
    activeError: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
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
  writeTextMock.mockResolvedValue(undefined);
  apiRequestMock.mockResolvedValue({ job: { id: 'x', status: 'completed' } });
  stubNavigatorClipboard();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ResultDisplay', () => {
  it('shows an empty state before the first job', () => {
    render(<ResultDisplay />);

    expect(screen.getByText('Your improved text will appear here.')).toBeInTheDocument();
  });

  it('copies the exact revised string to the clipboard', async () => {
    setResult();
    render(<ResultDisplay />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('exact revised string');
    });
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('loads the revision back into the editor on Use as input', async () => {
    const user = userEvent.setup();
    setResult();
    render(<ResultDisplay />);

    await user.click(screen.getByRole('button', { name: 'Use as input' }));

    expect(useWorkspaceStore.getState().inputText).toBe('exact revised string');
  });

  it('reruns the job through the store on Rerun', async () => {
    const user = userEvent.setup();
    setResult();
    render(<ResultDisplay />);

    await user.click(screen.getByRole('button', { name: 'Rerun' }));

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/writing/jobs',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('falls back gracefully when the clipboard API fails', async () => {
    writeTextMock.mockRejectedValue(new Error('denied'));
    document.execCommand = vi.fn(() => false);
    setResult();
    render(<ResultDisplay />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
    expect(screen.queryByRole('button', { name: /copied/i })).not.toBeInTheDocument();
  });
});
