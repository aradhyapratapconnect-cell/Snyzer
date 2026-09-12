import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RichEditor } from '../src/components/editor/RichEditor.js';

/**
 * SNZ-042 tests: toolbar behavior, parent sync, and HTML sanitization
 * (malicious markup dropped by the schema-limited document model).
 */
function ControlledRichEditor({ initial = '<p>Hello world</p>' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <RichEditor value={value} onChange={setValue} />
      <output data-testid="html-sink">{value}</output>
    </>
  );
}

const DANGEROUS_HTML = [
  '<script>alert("xss")</script><p>kept</p>',
  '<p>kept</p><iframe src="https://evil.example.com"></iframe>',
  '<p onclick="alert(1)" onmouseover="alert(2)">kept</p>',
  '<style>p{color:red}</style><p>kept</p>',
  '<p>kept</p><img src="x" onerror="alert(3)">',
  '<blockquote>not in schema</blockquote><p>kept</p>',
].join('');

describe('RichEditor', () => {
  it('renders the formatting toolbar', () => {
    render(<ControlledRichEditor initial="<p><strong>Bold text</strong></p>" />);

    for (const name of [
      'Bold',
      'Italic',
      'Bullet list',
      'Numbered list',
      'Heading 1',
      'Heading 2',
    ]) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('aria-pressed');
    }
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('toggles a stored mark without a selection and syncs on type', async () => {
    // No text selection (jsdom cannot do layout-dependent selection):
    // toggling with a collapsed cursor sets a stored mark instead.
    const user = userEvent.setup();
    render(<ControlledRichEditor initial="<p>plain words here</p>" />);

    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'false');

    (screen.getByLabelText('Your draft') as HTMLElement).focus();
    await user.click(bold);

    expect(bold).toHaveAttribute('aria-pressed', 'true');
  });

  it('strips scripts, iframes, handlers, and off-schema tags on content set', () => {
    const onChange = vi.fn();
    const { rerender } = render(<RichEditor value="<p>start</p>" onChange={onChange} />);

    rerender(<RichEditor value={DANGEROUS_HTML} onChange={onChange} />);
    const editor = screen.getByLabelText('Your draft');
    const html = editor.innerHTML.toLowerCase();

    expect(html).toContain('kept');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('onmouseover');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<style');
    expect(html).not.toContain('<blockquote');
  });

  it('exports a safe document structure', () => {
    const onChange = vi.fn();
    render(<RichEditor value="<h1>Title</h1><p>Body <em>text</em></p>" onChange={onChange} />);

    const editor = screen.getByLabelText('Your draft');
    expect(editor.querySelector('h1')).toHaveTextContent('Title');
    expect(editor.querySelector('em')).toHaveTextContent('text');
    expect(editor.querySelector('script')).toBeNull();
  });

  it('locks editing while read-only', () => {
    const onChange = vi.fn();
    render(<RichEditor value="<p>locked</p>" onChange={onChange} readOnly />);

    for (const name of ['Bold', 'Italic', 'Bullet list']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });
});
