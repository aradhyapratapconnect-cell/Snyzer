/**
 * Plain-text statistics (SNZ-041). Pure functions over the exact user
 * string — counting never mutates content.
 */

/** Word count: whitespace-separated tokens; blank input counts zero. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

/** Character count: raw UTF-16 length (matches `maxlength` semantics). */
export function countCharacters(text: string): number {
  return text.length;
}
