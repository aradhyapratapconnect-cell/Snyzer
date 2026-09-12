import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { EditorMode } from '@snyzer/shared';
import { describe, expect, it, vi } from 'vitest';
import { htmlToPlainText } from '../src/components/editor/html.js';
import { EditorModeToggle } from '../src/components/editor/EditorModeToggle.js';

/** SNZ-043 tests: conversion utility and the mode switcher control. */
describe('htmlToPlainText', () => {
  it('extracts text while dropping tags, handlers, and scripts', () => {
    expect(htmlToPlainText('<h1>Title</h1><p>Body <strong>text</strong></p>')).toContain('Title');
    expect(htmlToPlainText('<p>kept</p><script>alert(1)</script>')).toBe('kept');
    expect(htmlToPlainText('<p onclick="alert(1)">kept</p>')).toBe('kept');
    expect(htmlToPlainText('<p>kept</p><iframe src="https://evil.example.com"></iframe>')).toBe(
      'kept',
    );
    expect(htmlToPlainText('')).toBe('');
    expect(htmlToPlainText('plain already')).toBe('plain already');
  });
});

function ControlledToggle({ initial = 'plain' as EditorMode }) {
  const [mode, setMode] = useState<EditorMode>(initial);
  return (
    <>
      <EditorModeToggle mode={mode} onChange={setMode} />
      <output data-testid="mode-sink">{mode}</output>
    </>
  );
}

describe('EditorModeToggle', () => {
  it('renders both modes with the active one pressed', () => {
    render(<ControlledToggle />);

    expect(screen.getByRole('button', { name: 'Plain Text' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Rich Text' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reports mode changes by click and keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EditorModeToggle mode="plain" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Rich Text' }));
    expect(onChange).toHaveBeenCalledWith('rich');

    screen.getByRole('button', { name: 'Plain Text' }).focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('plain');
  });

  it('switches content without loss in a container', async () => {
    const user = userEvent.setup();
    render(<ControlledToggle initial="rich" />);

    await user.click(screen.getByRole('button', { name: 'Plain Text' }));
    expect(screen.getByTestId('mode-sink')).toHaveTextContent('plain');
  });

  it('disables both tabs when disabled', () => {
    render(<EditorModeToggle mode="plain" onChange={() => {}} disabled />);

    expect(screen.getByRole('button', { name: 'Plain Text' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rich Text' })).toBeDisabled();
  });
});
