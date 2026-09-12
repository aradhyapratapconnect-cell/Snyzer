import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { escapeHtml, sanitizePlainText } from '../src/security/sanitizer.js';

/**
 * SNZ-054 tests: markup preserved exactly as inert text, control bytes
 * stripped, HTML escaping, and JSON content-type enforcement. No live
 * dependencies involved.
 */
describe('sanitizePlainText', () => {
  it('preserves markup verbatim as harmless text', () => {
    const vectors = [
      "<script>alert('xss')</script>",
      '<img src="x" onerror="alert(1)">',
      '<svg/onload=alert(1)>',
      '\'"/><svg/onload=alert(document.domain)>',
      '<iframe src="https://evil.example.com"></iframe>',
      '<a href="javascript:alert(1)">click</a>',
      '<div style="x:expression(alert(1))">x</div>',
    ];
    for (const vector of vectors) {
      expect(sanitizePlainText(vector)).toBe(vector);
    }
  });

  it('strips NUL bytes, C0 controls, and DEL', () => {
    const C = String.fromCharCode;
    expect(sanitizePlainText(`a${C(0)}b`)).toBe('ab');
    expect(sanitizePlainText(`x${C(1)}y${C(2)}z`)).toBe('xyz');
    expect(sanitizePlainText(`bell${C(7)}here`)).toBe('bellhere');
    expect(sanitizePlainText(`del${C(127)}here`)).toBe('delhere');
    expect(sanitizePlainText(`${C(11)}${C(12)}separator`)).toBe('separator');
    expect(sanitizePlainText(`esc${C(27)}[0m`)).toBe('esc[0m');
  });

  it('keeps tab, LF, CR, printable text, and Unicode prose', () => {
    expect(sanitizePlainText('col1\tcol2\nline2\rline3')).toBe('col1\tcol2\nline2\rline3');
    expect(sanitizePlainText('Héllo — wörld ✓ emoji 🎉')).toBe('Héllo — wörld ✓ emoji 🎉');
    expect(sanitizePlainText('')).toBe('');
  });

  it('rejects non-string input safely', () => {
    expect(sanitizePlainText(undefined)).toBe('');
    expect(sanitizePlainText(null)).toBe('');
    expect(sanitizePlainText(42)).toBe('');
    expect(sanitizePlainText({ text: 'hi' })).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml('<a href="x">&\'y\'</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;y&#39;&lt;/a&gt;',
    );
    expect(escapeHtml('plain text 123')).toBe('plain text 123');
  });
});

describe('JSON content-type enforcement', () => {
  it('serves API responses as application/json with charset', async () => {
    const res = await request(createApp()).get('/api/v1/health').expect(200);

    expect(res.headers['content-type']).toMatch(/application\/json.*charset=utf-8/);
  });
});
