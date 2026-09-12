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
  window.HTMLElement.prototype.scrollIntoView ??= () => {};
}

// Vitest does not enable `globals`, so Testing Library's auto-cleanup never
// hooks in — unmount after every test to keep `screen` queries scoped to the
// current render.
afterEach(() => {
  cleanup();
});
