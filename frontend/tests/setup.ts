import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Vitest does not enable `globals`, so Testing Library's auto-cleanup never
// hooks in — unmount after every test to keep `screen` queries scoped to the
// current render.
afterEach(() => {
  cleanup();
});
