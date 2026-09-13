import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspacePage } from '../src/app/WorkspacePage.js';
import { usePreferencesStore } from '../src/stores/usePreferencesStore.js';
import { useWorkspaceStore } from '../src/stores/useWorkspaceStore.js';

/**
 * SNZ-046 page tests: the composed workspace loop — editing, mode
 * conversion with persistence, submission, result preview, and error
 * preservation. API and preferences sync are mocked; no network involved.
 */
const apiRequestMock = vi.fn();

vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const defaultPreferences = {
  theme: 'system',
  workspaceLayout: 'side_by_side',
  editorMode: 'plain',
  defaultTone: 'professional',
} as const;

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

beforeEach(() => {
  vi.clearAllMocks();
  apiRequestMock.mockImplementation(async (path: string, options?: { method?: string }) => {
    if (path === '/preferences') {
      return { preferences: { ...defaultPreferences } };
    }
    if (path === '/writing/jobs') {
      expect(options?.method).toBe('POST');
      return jobResponse;
    }
    throw new Error(`unexpected API call: ${path}`);
  });
  usePreferencesStore.setState({
    ...defaultPreferences,
    status: 'idle',
    error: null,
  });
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
});

describe('WorkspacePage', () => {
  it('renders the editor, controls, and submit action', () => {
    render(<WorkspacePage />);

    expect(screen.getByLabelText('Your draft')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Improve writing' })).toBeDisabled();
    expect(screen.getByText('Your improved text will appear here.')).toBeInTheDocument();
  });

  it('converts content across modes and persists the choice', async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.type(screen.getByLabelText('Your draft'), 'hello rich world');
    await user.click(screen.getByRole('button', { name: 'Rich Text' }));

    expect(screen.getByRole('toolbar')).toBeInTheDocument();
    expect(screen.getByLabelText('Your draft')).toHaveTextContent('hello rich world');
    expect(useWorkspaceStore.getState().editorMode).toBe('rich');

    await user.click(screen.getByRole('button', { name: 'Plain Text' }));
    expect(screen.getByLabelText('Your draft')).toHaveValue('hello rich world');
  });

  it('submits the draft and previews the revision', async () => {
    const user = userEvent.setup();
    render(<WorkspacePage />);

    await user.type(screen.getByLabelText('Your draft'), 'Clear writing wins.');
    await user.click(screen.getByRole('button', { name: 'Improve writing' }));

    expect(await screen.findByText('Clear writing triumphs.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves the draft and explains failures', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockImplementation(async (path: string) => {
      if (path === '/preferences') {
        return { preferences: { ...defaultPreferences } };
      }
      throw new Error('provider down');
    });
    render(<WorkspacePage />);

    await user.type(screen.getByLabelText('Your draft'), 'Keep this draft.');
    await user.click(screen.getByRole('button', { name: 'Improve writing' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Your draft')).toHaveValue('Keep this draft.');
  });

  it('streams the revision progressively when SSE connects', async () => {
    const user = userEvent.setup();
    // Manually-pumped stream: proves the progressive preview renders before
    // the validated job lands.
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Promise.resolve(
          new Response(body, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          }),
        ),
      ),
    );
    try {
      render(<WorkspacePage />);

      await user.type(screen.getByLabelText('Your draft'), 'Clear writing wins.');
      await user.click(screen.getByRole('button', { name: 'Improve writing' }));

      expect(await screen.findByText('Generating…')).toBeInTheDocument();
      controller.enqueue(encoder.encode('event: token\ndata: {"text":"Partial-"}\n\n'));
      expect(await screen.findByText('Partial-')).toBeInTheDocument();
      controller.enqueue(
        encoder.encode(`event: done\ndata: ${JSON.stringify({ job: jobResponse.job })}\n\n`),
      );
      controller.close();
      expect(await screen.findByText('Clear writing triumphs.')).toBeInTheDocument();
      // The synchronous endpoint stays untouched on the streaming path.
      expect(
        apiRequestMock.mock.calls.some(
          ([path, options]) => path === '/writing/jobs' && options?.method === 'POST',
        ),
      ).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
