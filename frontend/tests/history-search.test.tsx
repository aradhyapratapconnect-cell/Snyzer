import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HistoryPage } from '../src/app/history/page.js';

/**
 * History search/filter tests: page-scoped text search alone, combined with
 * the tone filter, and clearing. API client mocked; no network involved.
 */
const apiRequestMock = vi.fn();
vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

function job(id: string, preview: string, tone = 'professional', mode = 'clarity') {
  return {
    id,
    input_preview: preview,
    output_preview: `${preview} (revised)`,
    mode,
    tone,
    status: 'completed',
    created_at: '2026-09-10T10:00:00.000Z',
  };
}

const JOBS = [
  job('job-1', 'Quarterly revenue grew steadily', 'professional', 'formal'),
  job('job-2', 'A casual note about weekend plans', 'casual', 'natural'),
];

function renderHistory() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  );
}

describe('HistoryPage search', () => {
  it('filters cards by preview text', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({ jobs: JOBS, total: 2, limit: 20, offset: 0 });
    renderHistory();

    expect(await screen.findByText('Quarterly revenue grew steadily')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search this page'), 'weekend');

    expect(screen.queryByText('Quarterly revenue grew steadily')).not.toBeInTheDocument();
    expect(screen.getByText('A casual note about weekend plans')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 entries on this page.')).toBeInTheDocument();
  });

  it('matches mode and tone fields as well as previews', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({ jobs: JOBS, total: 2, limit: 20, offset: 0 });
    renderHistory();

    expect(await screen.findByText('Quarterly revenue grew steadily')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search this page'), 'formal');

    expect(screen.getByText('Quarterly revenue grew steadily')).toBeInTheDocument();
    expect(screen.queryByText('A casual note about weekend plans')).not.toBeInTheDocument();
  });

  it('combines search with the tone filter and clears both together', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockResolvedValue({ jobs: JOBS, total: 2, limit: 20, offset: 0 });
    renderHistory();

    expect(await screen.findByText('Quarterly revenue grew steadily')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search this page'), 'note');
    await user.click(screen.getByRole('button', { name: 'professional' }));

    expect(await screen.findByText('No entries match your filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }));

    expect(screen.getByText('Quarterly revenue grew steadily')).toBeInTheDocument();
    expect(screen.getByText('A casual note about weekend plans')).toBeInTheDocument();
    expect(screen.getByLabelText('Search this page')).toHaveValue('');
  });
});
