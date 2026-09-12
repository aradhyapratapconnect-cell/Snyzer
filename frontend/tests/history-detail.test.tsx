import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryDetailModal } from '../src/components/history/HistoryDetailModal.js';
import { useWorkspaceStore } from '../src/stores/useWorkspaceStore.js';

/**
 * SNZ-051 tests: detail loading, metrics, workspace reload, deletion, and
 * dialog dismissal — with mocked API and navigation. No network involved.
 */
const apiRequestMock = vi.fn();
vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const fullJob = {
  id: 'job-1',
  input_text: 'The complete original draft text.',
  output_text: 'The complete revised text.',
  mode: 'clarity',
  tone: 'professional',
  analysis: {
    readability: 72,
    clarity: 80,
    repetition: 12,
    sentenceVariety: 68,
    vocabularyComplexity: 55,
    formality: 61,
  },
  status: 'completed',
  created_at: '2026-09-10T10:00:00.000Z',
};

function renderModal(jobId: string | null = 'job-1', onDeleted: (id: string) => void = () => {}) {
  return render(
    <MemoryRouter initialEntries={['/history']}>
      <HistoryDetailModal jobId={jobId} onClose={() => {}} onDeleted={onDeleted} />
      <Routes>
        <Route path="/history" element={<p>History marker</p>} />
        <Route path="/workspace" element={<p>Workspace marker</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiRequestMock.mockImplementation(async (path: string, options?: { method?: string }) => {
    if (options?.method === 'DELETE') {
      return {};
    }
    return { job: fullJob };
  });
  useWorkspaceStore.setState({ inputText: '' });
});

describe('HistoryDetailModal', () => {
  it('loads and displays full texts plus metrics', async () => {
    renderModal();

    expect(await screen.findByText('The complete original draft text.')).toBeInTheDocument();
    expect(screen.getByText('The complete revised text.')).toBeInTheDocument();
    expect(screen.getByText('Writing analysis')).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenCalledWith('/writing/jobs/job-1');
  });

  it('loads the revision into the workspace and navigates there', async () => {
    const user = userEvent.setup();
    renderModal();

    await screen.findByText('The complete revised text.');
    await user.click(screen.getByRole('button', { name: 'Load into Workspace' }));

    expect(useWorkspaceStore.getState().inputText).toBe('The complete revised text.');
    expect(await screen.findByText('Workspace marker')).toBeInTheDocument();
  });

  it('deletes via the API, notifies the parent, and confirms', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/history']}>
        <HistoryDetailModal jobId="job-1" onClose={onClose} onDeleted={onDeleted} />
        <Routes>
          <Route path="/history" element={<p>History marker</p>} />
          <Route path="/workspace" element={<p>Workspace marker</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText('The complete revised text.');
    await user.click(screen.getByRole('button', { name: 'Delete from History' }));

    expect(apiRequestMock).toHaveBeenCalledWith('/writing/jobs/job-1', { method: 'DELETE' });
    expect(onDeleted).toHaveBeenCalledWith('job-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape without side effects', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/history']}>
        <HistoryDetailModal jobId="job-1" onClose={onClose} onDeleted={() => {}} />
        <Routes>
          <Route path="/history" element={<p>History marker</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText('The complete revised text.');
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
    expect(apiRequestMock).not.toHaveBeenCalledWith('/writing/jobs/job-1', { method: 'DELETE' });
  });

  it('renders nothing actionable without a selected job', () => {
    renderModal(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});
