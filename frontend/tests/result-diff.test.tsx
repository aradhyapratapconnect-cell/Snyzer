import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultDisplay } from '../src/features/writing/ResultDisplay.js';
import { useWorkspaceStore } from '../src/stores/useWorkspaceStore.js';

/**
 * Diff-view tests: clean default, computed insertion/deletion marks, and
 * switching back. Clipboard is stubbed; no network involved.
 */
vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: vi.fn(),
}));

function stubNavigatorClipboard() {
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (test)',
    clipboard: { writeText: vi.fn(async () => {}) },
  });
}

function setResult() {
  useWorkspaceStore.setState({
    inputText: 'The quick brown fox.',
    editorMode: 'plain',
    currentResult: {
      outputText: 'The quick red fox.',
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
  stubNavigatorClipboard();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ResultDisplay diff view', () => {
  it('shows the clean revision by default', () => {
    setResult();
    render(<ResultDisplay />);

    expect(screen.getByRole('button', { name: 'Clean' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('The quick red fox.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Revision changes')).not.toBeInTheDocument();
  });

  it('highlights real insertions and deletions in diff mode', async () => {
    const user = userEvent.setup();
    setResult();
    render(<ResultDisplay />);

    await user.click(screen.getByRole('button', { name: 'Diff' }));

    const changes = screen.getByLabelText('Revision changes');
    expect(changes).toBeInTheDocument();
    expect(changes.querySelector('del')?.textContent).toBe('brown');
    expect(changes.querySelector('ins')?.textContent).toBe('red');
    expect(screen.getByRole('button', { name: 'Diff' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('returns to the clean revision on toggle', async () => {
    const user = userEvent.setup();
    setResult();
    render(<ResultDisplay />);

    await user.click(screen.getByRole('button', { name: 'Diff' }));
    expect(screen.getByLabelText('Revision changes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clean' }));
    expect(screen.queryByLabelText('Revision changes')).not.toBeInTheDocument();
    expect(screen.getByText('The quick red fox.')).toBeInTheDocument();
  });
});
