/**
 * HTML-to-text conversion (SNZ-043).
 *
 * Used when switching Rich → Plain: parses markup in an inert document,
 * drops non-text elements (scripts, styles, frames) whose bodies would
 * otherwise leak into `textContent`, then reads text back out. Parsing never
 * executes scripts (DOMParser documents don't run them), and handlers and
 * styles never survive as text — only genuine text nodes do.
 */
export function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, iframe, noscript, object, embed').forEach((element) => {
    element.remove();
  });
  return doc.body.textContent ?? '';
}
