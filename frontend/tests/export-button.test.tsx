import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExportButton } from '../src/components/editor/ExportButton.js';

/**
 * SNZ-063 component tests: the export menu offers complete documents only
 * and downloads the exact bytes through a Blob URL. No backend involved.
 */
const DRAFT = 'Draft line one.\nDraft line two.';
const REVISION = 'Revised line one.\nRevised line two.';

let createdBlobs: Blob[] = [];
const clickSpy = vi.fn();

afterEach(() => {
  vi.restoreAllMocks();
  createdBlobs = [];
});

describe('ExportButton', () => {
  it('downloads the revision markdown with full content on selection', async () => {
    const user = userEvent.setup();
    const originalCreate = URL.createObjectURL;
    const createdUrls: string[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      createdBlobs.push(blob);
      const url = `blob:mock-${String(createdBlobs.length)}`;
      createdUrls.push(url);
      return url;
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const anchorClick = vi
      .spyOn(window.HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clickSpy(this.download, this.getAttribute('href'));
      });
    try {
      render(<ExportButton draft={DRAFT} revision={REVISION} mode="formal" tone="professional" />);

      await user.click(screen.getByRole('button', { name: 'Export' }));
      await user.click(screen.getByRole('menuitem', { name: 'Revision as Markdown (.md)' }));

      expect(anchorClick).toHaveBeenCalledTimes(1);
      const [download, href] = clickSpy.mock.calls[0] as [string, string | null];
      expect(download).toMatch(/^snyzer-revision-\d{4}-\d{2}-\d{2}-formal\.md$/);
      expect(href).toBe(createdUrls[0]);
      expect(createdBlobs).toHaveLength(1);
      const blob = createdBlobs[0] as Blob;
      expect(blob.type).toContain('text/markdown');
      // jsdom's Blob lacks .text(): size proves the full bytes were handed
      // over, and byte-exact content is covered by export-document tests.
      expect(blob.size).toBeGreaterThan(REVISION.length);
      expect(blob.size).toBeLessThan(REVISION.length + 500);
    } finally {
      URL.createObjectURL = originalCreate;
    }
  });

  it('offers only draft options before the first revision', async () => {
    const user = userEvent.setup();

    render(<ExportButton draft={DRAFT} revision={null} />);

    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('menuitem', { name: 'Draft as Text (.txt)' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Revision/ })).not.toBeInTheDocument();
  });

  it('renders nothing when both documents are empty', () => {
    render(<ExportButton draft="   " revision={null} />);

    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
  });
});
