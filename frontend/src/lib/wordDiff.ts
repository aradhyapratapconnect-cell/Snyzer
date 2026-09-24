/**
 * Word-level text diff (client-side, dependency-free).
 *
 * Compares the original draft against the produced revision token by token
 * (words and whitespace runs) using a longest-common-subsequence alignment,
 * and emits merged `equal` / `insert` / `delete` segments for the Diff view.
 * Everything shown is computed from the two real texts — nothing is
 * invented. Inputs beyond the DP budget fall back to whole-block
 * replacement segments rather than guessing.
 */
export type DiffSegmentType = 'equal' | 'insert' | 'delete';

export interface DiffSegment {
  type: DiffSegmentType;
  text: string;
}

/** Tokenizer: words and whitespace runs stay separate tokens. */
function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

/** Upper bound on DP cells (~32 MiB with Uint32Array); beyond it, chunk. */
const MAX_DP_CELLS = 8_000_000;

function lcsDiff(before: string[], after: string[]): DiffSegment[] {
  const n = before.length;
  const m = after.length;
  const widths = m + 1;
  const table = new Uint32Array((n + 1) * widths);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const cell = i * widths + j;
      table[cell] =
        before[i] === after[j]
          ? table[cell + widths + 1] + 1
          : Math.max(table[cell + widths], table[cell + 1]);
    }
  }
  const raw: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      raw.push({ type: 'equal', text: before[i] as string });
      i++;
      j++;
    } else if (table[(i + 1) * widths + j] >= table[i * widths + (j + 1)]) {
      raw.push({ type: 'delete', text: before[i] as string });
      i++;
    } else {
      raw.push({ type: 'insert', text: after[j] as string });
      j++;
    }
  }
  while (i < n) {
    raw.push({ type: 'delete', text: before[i] as string });
    i++;
  }
  while (j < m) {
    raw.push({ type: 'insert', text: after[j] as string });
    j++;
  }
  // Merge adjacent same-type runs so rendering stays compact.
  const merged: DiffSegment[] = [];
  for (const segment of raw) {
    const last = merged[merged.length - 1];
    if (last !== undefined && last.type === segment.type) {
      last.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

export function diffWords(before: string, after: string): DiffSegment[] {
  // Defensive coercion: the contract guarantees strings, but a malformed
  // payload must degrade to whole-block segments, never throw during render.
  const safeBefore = before ?? '';
  const safeAfter = after ?? '';
  if (safeBefore === safeAfter) {
    return safeBefore === '' ? [] : [{ type: 'equal', text: safeBefore }];
  }
  if (safeBefore === '') {
    return [{ type: 'insert', text: safeAfter }];
  }
  if (safeAfter === '') {
    return [{ type: 'delete', text: safeBefore }];
  }
  const beforeTokens = tokenize(safeBefore);
  const afterTokens = tokenize(safeAfter);
  if (beforeTokens.length * afterTokens.length > MAX_DP_CELLS) {
    return [
      { type: 'delete', text: safeBefore },
      { type: 'insert', text: safeAfter },
    ];
  }
  return lcsDiff(beforeTokens, afterTokens);
}
