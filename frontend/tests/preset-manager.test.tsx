import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PresetManager } from '../src/features/writing/PresetManager.js';
import type { WritingControlValues } from '../src/features/writing/WritingControls.js';

/**
 * SNZ-062 component tests: saving, applying, and deleting style presets with
 * a mocked apiClient. No network involved.
 */
const apiRequestMock = vi.fn();

vi.mock('../src/lib/apiClient.js', () => ({
  ApiClientError: class ApiClientError extends Error {},
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

const BLOG_PRESET = {
  id: '33333333-3333-4333-8333-333333333333',
  name: 'My Blog Tone',
  mode: 'natural',
  tone: 'casual',
  clarity: 70,
  sentenceVariety: 60,
  createdAt: '2026-09-13T00:00:00.000Z',
};

const CURRENT: WritingControlValues = {
  mode: 'formal',
  tone: 'professional',
  clarity: 80,
  sentenceVariety: 75,
};

beforeEach(() => {
  vi.clearAllMocks();
  apiRequestMock.mockImplementation(async (path: string, options?: { method?: string }) => {
    if (path === '/presets' && (options?.method === undefined || options.method === 'GET')) {
      return { presets: [BLOG_PRESET] };
    }
    if (path === `/presets/${BLOG_PRESET.id}` && options?.method === 'DELETE') {
      return { deleted: true };
    }
    throw new Error(`unexpected API call: ${path}`);
  });
});

function renderManager(onApply: (values: WritingControlValues) => void = vi.fn()) {
  const applied = onApply;
  render(<PresetManager current={{ ...CURRENT }} onApply={applied} />);
  return { applied };
}

describe('PresetManager', () => {
  it('lists saved presets with their summaries and counts', async () => {
    renderManager();

    expect(await screen.findByText('My Blog Tone')).toBeInTheDocument();
    expect(screen.getByText('natural · casual')).toBeInTheDocument();
    expect(screen.getByText('1 of 5 saved')).toBeInTheDocument();
  });

  it('applies a preset to the workspace controls in one click', async () => {
    const user = userEvent.setup();
    const applied = vi.fn();
    renderManager(applied);

    await user.click(await screen.findByRole('button', { name: 'Apply' }));

    expect(applied).toHaveBeenCalledWith({
      mode: 'natural',
      tone: 'casual',
      clarity: 70,
      sentenceVariety: 60,
    });
  });

  it('saves the current controls under a name and clears the input', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockImplementation(async (path: string, options?: { method?: string }) => {
      if (path === '/presets' && options?.method !== 'POST') {
        return { presets: [] };
      }
      if (path === '/presets' && options?.method === 'POST') {
        return { preset: { ...BLOG_PRESET, id: '44444444-4444-4444-8444-444444444444' } };
      }
      throw new Error(`unexpected API call: ${path}`);
    });
    renderManager();

    expect(await screen.findByText('0 of 5 saved')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Preset name'), 'My Blog Tone');
    await user.click(screen.getByRole('button', { name: 'Save style' }));

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/presets',
      expect.objectContaining({
        method: 'POST',
        body: { name: 'My Blog Tone', ...CURRENT },
      }),
    );
    expect(await screen.findByText('1 of 5 saved')).toBeInTheDocument();
    expect(screen.getByLabelText('Preset name')).toHaveValue('');
  });

  it('deletes a preset and removes it from the list', async () => {
    const user = userEvent.setup();
    renderManager();

    await user.click(await screen.findByRole('button', { name: 'Delete My Blog Tone' }));

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/presets/33333333-3333-4333-8333-333333333333',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(await screen.findByText('0 of 5 saved')).toBeInTheDocument();
    expect(screen.queryByText('My Blog Tone')).not.toBeInTheDocument();
  });

  it('explains failures without losing the list', async () => {
    const user = userEvent.setup();
    apiRequestMock.mockImplementation(async (path: string) => {
      if (path === '/presets') {
        return { presets: [BLOG_PRESET] };
      }
      throw new Error('gone');
    });
    renderManager();

    await user.click(await screen.findByRole('button', { name: 'Delete My Blog Tone' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByText('My Blog Tone')).toBeInTheDocument();
  });
});
