import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HistoryPage } from '../src/app/history/page.js';

/**
 * SNZ-050 tests: history loading, populated, paginated, empty, and error
 * states — with a mocked API client. No network involved.
 */
const apiRequestMock = vi.fn();
vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function job(id: string, preview: string) {
  return {
    id,
    input_preview: preview,
    output_preview: `${preview} (revised)`,
    mode: 'clarity',
    tone: 'professional',
    status: 'completed',
    created_at: '2026-09-10T10:00:00.000Z',
  };
}

function renderHistory() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  );
}

describe('HistoryPage', () => {
  it('shows skeleton loaders while fetching', () => {
    apiRequestMock.mockReturnValue(new Promise(() => {}));
    renderHistory();

    expect(screen.getByRole('status', { name: 'Loading history' })).toBeInTheDocument();
  });

  it('lists jobs with previews, badges, and pagination state', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockImplementation(async (path: string) => {
      if (path.includes('offset=20')) {
        return { jobs: [job('job-3', 'Third draft')], total: 21, limit: 20, offset: 20 };
      }
      return {
        jobs: [job('job-1', 'First draft'), job('job-2', 'Second draft')],
        total: 21,
        limit: 20,
        offset: 0,
      };
    });
    renderHistory();

    expect(await screen.findByText('First draft')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2 · 21 jobs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Third draft')).toBeInTheDocument();
    expect(apiRequestMock).toHaveBeenLastCalledWith('/writing/jobs?limit=20&offset=20');
    expect(screen.getByText('Page 2 of 2 · 21 jobs')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('First draft')).toBeInTheDocument();
  });

  it('renders the empty state with a call to action', async () => {
    apiRequestMock.mockResolvedValue({ jobs: [], total: 0, limit: 20, offset: 0 });
    renderHistory();

    expect(await screen.findByText('No writing history yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Writing' })).toHaveAttribute(
      'href',
      '/workspace',
    );
  });

  it('shows a retryable error state on failure', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockRejectedValueOnce(new Error('offline'));
    apiRequestMock.mockResolvedValue({ jobs: [], total: 0, limit: 20, offset: 0 });
    renderHistory();

    expect(await screen.findByRole('alert')).toHaveTextContent('offline');

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No writing history yet')).toBeInTheDocument();
  });
});
