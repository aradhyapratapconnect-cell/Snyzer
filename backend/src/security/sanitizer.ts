/**
 * Input sanitization (SNZ-054).
 *
 * User writing is plain-text DATA, never markup: it travels as JSON, is
 * stored as TEXT, and React escapes it on render — so tags and event
 * handlers are inert by construction and must be PRESERVED exactly (stripping
 * `<script>` would destroy legitimate content about code). What this module
 * removes is narrower and safety-critical:
 *
 * - NUL bytes: PostgreSQL rejects them in TEXT columns, so any write
 *   containing one would fail — they carry no writing meaning.
 * - C0 control characters and DEL (except tab, LF, CR, which structure real
 *   text): invisible, unrenderable, classic smuggling vectors.
 *
 * `escapeHtml` covers the rare case of interpolating a string into HTML
 * outside React/controlled frameworks. Prefer framework rendering always.
 */
/**
 * Kept verbatim: tab, LF, CR (0x09/0x0A/0x0D) structure real text, and
 * everything printable from 0x20 up except DEL (0x7F) is legitimate
 * content. Dropped: NUL, other C0 controls, and DEL.
 */
function isKeptCharacter(code: number): boolean {
  if (code === 0x09 || code === 0x0a || code === 0x0d) {
    return true;
  }
  return code >= 0x20 && code !== 0x7f;
}

export function sanitizePlainText(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  let output = '';
  for (const char of input) {
    if (isKeptCharacter(char.codePointAt(0) ?? 0)) {
      output += char;
    }
  }
  return output;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}
