import { describe, expect, it } from 'vitest';
import {
  buildExportContent,
  buildExportFilename,
  exportMimeType,
} from '../src/lib/exportDocument.js';

/**
 * SNZ-063 unit tests: filename shaping, content builders, and MIME types.
 * Pure functions — no DOM or network involved.
 */
describe('buildExportFilename', () => {
  it('builds dated, mode-qualified names per kind and format', () => {
    const date = new Date('2026-09-13T10:00:00.000Z');
    expect(buildExportFilename({ kind: 'revision', text: 'x', mode: 'formal', date }, 'md')).toBe(
      'snyzer-revision-2026-09-13-formal.md',
    );
    expect(buildExportFilename({ kind: 'draft', text: 'x', date }, 'txt')).toBe(
      'snyzer-draft-2026-09-13.txt',
    );
  });

  it('never embeds user text in the filename', () => {
    const hostile = '<script>alert(1)</script> ../../secrets';
    const filename = buildExportFilename(
      { kind: 'draft', text: hostile, date: new Date('2026-09-13T00:00:00.000Z') },
      'md',
    );

    expect(filename).toBe('snyzer-draft-2026-09-13.md');
    expect(filename).not.toContain('script');
  });
});

describe('buildExportContent', () => {
  const text = 'First line.\nSecond line with "quotes" and unicode café.';

  it('returns plain text verbatim for .txt', () => {
    expect(buildExportContent({ kind: 'draft', text }, 'txt')).toBe(text);
    expect(buildExportContent({ kind: 'revision', text, mode: 'formal' }, 'txt')).toBe(text);
  });

  it('wraps markdown with a header but keeps the full document text', () => {
    const content = buildExportContent(
      {
        kind: 'revision',
        text,
        mode: 'formal',
        tone: 'professional',
        date: new Date('2026-09-13T00:00:00.000Z'),
      },
      'md',
    );

    expect(content).toContain('# Snyzer Revision');
    expect(content).toContain('2026-09-13');
    expect(content).toContain('formal');
    expect(content).toContain(text);
    // The complete document survives — nothing truncated.
    expect(content.indexOf(text)).toBeGreaterThan(0);
    expect(content.endsWith(`${text}\n`)).toBe(true);
  });
});

describe('exportMimeType', () => {
  it('labels markdown and plain text distinctly', () => {
    expect(exportMimeType('md')).toContain('text/markdown');
    expect(exportMimeType('txt')).toContain('text/plain');
  });
});
