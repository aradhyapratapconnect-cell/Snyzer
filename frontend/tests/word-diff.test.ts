import { describe, expect, it } from 'vitest';
import { diffWords, type DiffSegment } from '../src/lib/wordDiff.js';

/**
 * Word-diff unit tests: alignment, merging, whitespace, reconstruction, and
 * the oversized fallback. No network involved.
 */
function applySegments(segments: DiffSegment[], side: 'before' | 'after'): string {
  return segments
    .filter((segment) =>
      side === 'before' ? segment.type !== 'insert' : segment.type !== 'delete',
    )
    .map((segment) => segment.text)
    .join('');
}

describe('diffWords', () => {
  it('returns no segments for two empty texts', () => {
    expect(diffWords('', '')).toEqual([]);
  });

  it('returns a single equal segment for identical texts', () => {
    expect(diffWords('Clear writing wins.', 'Clear writing wins.')).toEqual([
      { type: 'equal', text: 'Clear writing wins.' },
    ]);
  });

  it('marks a wholly new text as one insertion', () => {
    expect(diffWords('', 'Brand new.')).toEqual([{ type: 'insert', text: 'Brand new.' }]);
  });

  it('marks a wholly removed text as one deletion', () => {
    expect(diffWords('Gone now.', '')).toEqual([{ type: 'delete', text: 'Gone now.' }]);
  });

  it('aligns a single-word substitution between equal runs', () => {
    expect(diffWords('The quick brown fox.', 'The quick red fox.')).toEqual([
      { type: 'equal', text: 'The quick ' },
      { type: 'delete', text: 'brown' },
      { type: 'insert', text: 'red' },
      { type: 'equal', text: ' fox.' },
    ]);
  });

  it('groups multi-word edits into compact runs', () => {
    const segments = diffWords('a b c d', 'a X Y d');
    const textOf = (type: DiffSegment['type']) =>
      segments
        .filter((segment) => segment.type === type)
        .map((segment) => segment.text)
        .join('');
    expect(textOf('delete')).toBe('bc');
    expect(textOf('insert')).toBe('XY');
    expect(applySegments(segments, 'before')).toBe('a b c d');
    expect(applySegments(segments, 'after')).toBe('a X Y d');
  });

  it('keeps punctuation attached to its word token', () => {
    expect(diffWords('First line.\nSecond line.', 'First line.\nSecond line!')).toEqual([
      { type: 'equal', text: 'First line.\nSecond ' },
      { type: 'delete', text: 'line.' },
      { type: 'insert', text: 'line!' },
    ]);
  });

  it('reconstructs both sides from segments on realistic prose', () => {
    const before = 'In labs, the model drafts quickly. Reviewers then polish every claim by hand.';
    const after =
      'In the lab, the model drafts quickly. Editors polish each claim carefully by hand.';
    const segments = diffWords(before, after);
    expect(applySegments(segments, 'before')).toBe(before);
    expect(applySegments(segments, 'after')).toBe(after);
    expect(segments.some((segment) => segment.type !== 'equal')).toBe(true);
  });

  it('falls back to whole-block replacement for oversized inputs', () => {
    const before = `${'word '.repeat(3000)}end`;
    const after = `${'term '.repeat(3000)}end`;
    expect(diffWords(before, after)).toEqual([
      { type: 'delete', text: before },
      { type: 'insert', text: after },
    ]);
  });

  it('degrades gracefully on malformed payloads instead of throwing', () => {
    const missing = undefined as unknown as string;
    expect(diffWords('Some draft.', missing)).toEqual([{ type: 'delete', text: 'Some draft.' }]);
    expect(diffWords(missing, missing)).toEqual([]);
  });
});
