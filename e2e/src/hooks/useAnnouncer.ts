import { create } from 'zustand';

/**
 * Screen-reader announcer (SNZ-040).
 *
 * Async workflows (job start/completion/failure in Epic 9+) publish status
 * text here; `A11yAnnouncer` renders it into polite/assertive live regions.
 * Visual state must never be color-only — every meaningful transition gets a
 * text announcement through this hook. Re-announcing an identical message
 * bumps a counter so screen readers re-speak repeats.
 */
export type AnnouncePriority = 'polite' | 'assertive';

interface AnnouncerState {
  politeMessage: string;
  assertiveMessage: string;
  sequence: number;
  announce: (message: string, priority?: AnnouncePriority) => void;
  clear: () => void;
}

export const useAnnouncerStore = create<AnnouncerState>()((set) => ({
  politeMessage: '',
  assertiveMessage: '',
  sequence: 0,
  announce: (message: string, priority: AnnouncePriority = 'polite') => {
    if (priority === 'assertive') {
      set((state) => ({ assertiveMessage: message, sequence: state.sequence + 1 }));
    } else {
      set((state) => ({ politeMessage: message, sequence: state.sequence + 1 }));
    }
  },
  clear: () => {
    set({ politeMessage: '', assertiveMessage: '' });
  },
}));

/** Publish a screen-reader announcement (`polite` unless urgent). */
export function useAnnouncer(): (message: string, priority?: AnnouncePriority) => void {
  return useAnnouncerStore((state) => state.announce);
}
