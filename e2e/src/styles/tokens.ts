/**
 * Snyzer design tokens (SNZ-003).
 *
 * Single source of truth for the color system in FRONTEND_SPECIFICATION
 * section 2. `tailwind.config.ts` maps these values to Tailwind utilities;
 * tests assert the exact hex values here.
 */
export const SNYZER_COLORS = {
  canvas: { light: '#F8FAFC', dark: '#0B1120' },
  surface: { light: '#FFFFFF', dark: '#111827' },
  muted: { light: '#F1F5F9', dark: '#1F2937' },
  ink: { light: '#0F172A', dark: '#F8FAFC' },
  subink: { light: '#475569', dark: '#CBD5E1' },
  line: { light: '#E2E8F0', dark: '#334155' },
  primary: { light: '#2563EB', lightHover: '#1D4ED8', dark: '#60A5FA', darkHover: '#93C5FD' },
  success: { light: '#16A34A', dark: '#4ADE80' },
  warning: { light: '#D97706', dark: '#FBBF24' },
  danger: { light: '#DC2626', dark: '#F87171' },
} as const;

export type SnyzerColorName = keyof typeof SNYZER_COLORS;

/** Inter with a system sans-serif fallback stack (no webfont download). */
export const SNYZER_FONT_STACK = [
  'Inter',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  "'Segoe UI'",
  'Roboto',
  "'Helvetica Neue'",
  'Arial',
  'sans-serif',
].join(', ');
