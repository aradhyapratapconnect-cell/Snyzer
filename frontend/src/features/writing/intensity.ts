import type { StyleTargets } from '../../stores/useWorkspaceStore.js';

/**
 * Revision intensity presets.
 *
 * The backend has no intensity field — intensity is an honest shortcut over
 * the real style targets: picking one sets clarity and sentence variety to
 * the bundled values (visible on the sliders, sent with the next request).
 * Any manual slider tweak leaves the bundle and reports `custom`.
 */
export type Intensity = 'mild' | 'balanced' | 'expressive';

export const INTENSITIES: Array<{ value: Intensity; label: string; detail: string }> = [
  {
    value: 'mild',
    label: 'Mild',
    detail: 'Sets clarity 40 and sentence variety 40 for a light touch.',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    detail: 'Sets clarity 70 and sentence variety 60, the default revision.',
  },
  {
    value: 'expressive',
    label: 'Expressive',
    detail: 'Sets clarity 90 and sentence variety 85 for a stronger rewrite.',
  },
];

export const INTENSITY_TARGETS: Record<Intensity, StyleTargets> = {
  mild: { clarity: 40, sentenceVariety: 40 },
  balanced: { clarity: 70, sentenceVariety: 60 },
  expressive: { clarity: 90, sentenceVariety: 85 },
};

export function intensityOf(clarity: number, sentenceVariety: number): Intensity | 'custom' {
  for (const { value } of INTENSITIES) {
    const targets = INTENSITY_TARGETS[value];
    if (targets.clarity === clarity && targets.sentenceVariety === sentenceVariety) {
      return value;
    }
  }
  return 'custom';
}
