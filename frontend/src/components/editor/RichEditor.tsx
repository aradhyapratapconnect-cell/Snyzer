import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { Label } from '../ui/label.js';
import { cn } from '../../lib/utils.js';

/**
 * Controlled rich-text editor (SNZ-042, Tiptap).
 *
 * The schema admits exactly the supported formatting — bold, italic, bullet
 * and numbered lists, two heading levels — so pasted or inserted markup
 * outside the schema (scripts, iframes, event handlers, styles) is dropped
 * by ProseMirror's parser instead of rendered. Content syncs with the parent
 * through HTML strings (`value`/`onChange`); external value changes (mode
 * switches, "use as input") replace the document.
 */
const EDITOR_EXTENSIONS = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
    heading: { levels: [1, 2] },
  }),
];

export function RichEditor({
  id = 'rich-editor',
  label = 'Your draft',
  value,
  onChange,
  readOnly = false,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}) {
  const editor = useEditor(
    {
      extensions: EDITOR_EXTENSIONS,
      content: value,
      editable: !readOnly,
      editorProps: {
        attributes: {
          id,
          'aria-label': label,
          class:
            'min-h-48 max-h-96 overflow-y-auto rounded-lg border border-line-light bg-surface-light px-3 py-2 text-sm leading-relaxed text-ink-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark',
        },
      },
      onUpdate: ({ editor: current }) => {
        onChange(current.getHTML());
      },
    },
    [],
  );

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (editor !== null && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  useEffect(() => () => editor?.destroy(), [editor]);

  if (editor === null) {
    return null;
  }

  const toggleButton =
    'rounded-md px-2 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50';
  const activeButton = 'bg-muted-light dark:bg-muted-dark';

  return (
    <div>
      <Label id={`${id}-toolbar-label`}>Formatting</Label>
      <div
        role="toolbar"
        aria-labelledby={`${id}-toolbar-label`}
        className="mt-1 flex flex-wrap items-center gap-1 rounded-lg border border-line-light bg-muted-light/50 p-1 dark:border-line-dark dark:bg-muted-dark/30"
      >
        <button
          type="button"
          aria-label="Bold"
          aria-pressed={editor.isActive('bold')}
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(toggleButton, editor.isActive('bold') && activeButton)}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-label="Italic"
          aria-pressed={editor.isActive('italic')}
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(toggleButton, editor.isActive('italic') && activeButton)}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          aria-label="Bullet list"
          aria-pressed={editor.isActive('bulletList')}
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(toggleButton, editor.isActive('bulletList') && activeButton)}
        >
          • List
        </button>
        <button
          type="button"
          aria-label="Numbered list"
          aria-pressed={editor.isActive('orderedList')}
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(toggleButton, editor.isActive('orderedList') && activeButton)}
        >
          1. List
        </button>
        <button
          type="button"
          aria-label="Heading 1"
          aria-pressed={editor.isActive('heading', { level: 1 })}
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(toggleButton, editor.isActive('heading', { level: 1 }) && activeButton)}
        >
          H1
        </button>
        <button
          type="button"
          aria-label="Heading 2"
          aria-pressed={editor.isActive('heading', { level: 2 })}
          disabled={readOnly}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(toggleButton, editor.isActive('heading', { level: 2 }) && activeButton)}
        >
          H2
        </button>
      </div>
      <div className="mt-1">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
