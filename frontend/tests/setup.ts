import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Enables React's `act` environment for state updates outside render.
(globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;

// jsdom lacks pointer-capture APIs that Radix primitives call during
// pointer interaction. Stub them so open/close behavior is testable.
if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
  window.HTMLElement.prototype.hasPointerCapture ??= () => false;
  window.HTMLElement.prototype.setPointerCapture ??= () => {};
  window.HTMLElement.prototype.releasePointerCapture ??= () => {};
  window.HTMLElement.prototype.scrollIntoView ??= () => void 0;
}

// jsdom lacks layout APIs that ProseMirror calls on selection changes.
// Zero-size stubs keep the editor testable; real geometry belongs to
// Playwright (SNZ-058).
if (typeof window !== 'undefined' && typeof window.Element !== 'undefined') {
  const emptyRects = (): DOMRectList => [] as unknown as DOMRectList;
  const zeroRect = (): DOMRect =>
    ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }) as DOMRect;
  window.Element.prototype.getClientRects ??= emptyRects;
  window.Element.prototype.getBoundingClientRect ??= zeroRect;
  if (typeof window.Range !== 'undefined') {
    window.Range.prototype.getClientRects ??= emptyRects;
    window.Range.prototype.getBoundingClientRect ??= zeroRect;
  }
}

// jsdom lacks ResizeObserver, which Radix measurement hooks require.
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Vitest does not enable `globals`, so Testing Library's auto-cleanup never
// hooks in — unmount after every test to keep `screen` queries scoped to the
// current render.
afterEach(() => {
  cleanup();
});
