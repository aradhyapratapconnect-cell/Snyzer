/**
 * Client-side document export (SNZ-063).
 *
 * Everything runs in the browser: content builders produce the exact file
 * bytes, filenames are slugified from trusted parts only (kind, ISO date,
 * mode enum — never raw user text), and the download fires through a Blob
 * object URL with no backend round-trip or page navigation.
 */
export type ExportKind = 'draft' | 'revision';
export type ExportFormat = 'md' | 'txt';

export interface ExportDocument {
  kind: ExportKind;
  /** Full untruncated document text. */
  text: string;
  /** Style mode for revision filenames (a trusted enum value). */
  mode?: string;
  /** Revision quality context rendered into Markdown headers. */
  tone?: string;
  /** Defaults to today; injectable for tests. */
  date?: Date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `snyzer-revision-2026-09-13-formal.md` style names. Never embeds user text. */
export function buildExportFilename(document: ExportDocument, format: ExportFormat): string {
  const date = isoDate(document.date ?? new Date());
  const parts = ['snyzer', document.kind, date];
  if (document.mode !== undefined && document.mode !== '') {
    parts.push(slugify(document.mode));
  }
  return `${parts.join('-')}.${format}`;
}

const MIME: Record<ExportFormat, string> = {
  md: 'text/markdown;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
};

export function exportMimeType(format: ExportFormat): string {
  return MIME[format];
}

/**
 * File bytes for the download. Plain text is the document verbatim;
 * Markdown wraps it with a small metadata header so the file stays a valid
 * readable document outside the app. The document text itself is never
 * truncated or altered.
 */
export function buildExportContent(document: ExportDocument, format: ExportFormat): string {
  if (format === 'txt') {
    return document.text;
  }
  const title = document.kind === 'revision' ? 'Snyzer Revision' : 'Snyzer Draft';
  const context = [
    `Date: ${isoDate(document.date ?? new Date())}`,
    document.mode !== undefined && document.mode !== '' ? `Mode: ${document.mode}` : null,
    document.tone !== undefined && document.tone !== '' ? `Tone: ${document.tone}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join(' · ');
  return `# ${title}\n\n_${context}_\n\n${document.text}\n`;
}

/**
 * Triggers the browser download for already-built bytes. Returns the object
 * URL so callers/tests can observe it; revocation is scheduled, not blocking.
 */
export function downloadExportFile(options: {
  filename: string;
  content: string;
  mimeType: string;
}): string {
  const url = URL.createObjectURL(new Blob([options.content], { type: options.mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = options.filename;
  // Firefox requires the anchor to be in the DOM for the click to download.
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  return url;
}

/** One call from UI handlers: builds bytes + filename and starts the download. */
export function exportDocument(document: ExportDocument, format: ExportFormat): string {
  return downloadExportFile({
    filename: buildExportFilename(document, format),
    content: buildExportContent(document, format),
    mimeType: exportMimeType(format),
  });
}
