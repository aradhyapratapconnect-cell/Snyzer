import type { Config } from 'tailwindcss';
import { SNYZER_COLORS, SNYZER_FONT_STACK } from './src/styles/tokens.js';

/**
 * Tailwind configuration with the exact Snyzer color tokens (SNZ-003).
 * Hex values live in `src/styles/tokens.ts`; this file only maps them to
 * utility names. Dark theme uses the `class` strategy (`.dark` on `<html>`).
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: { light: SNYZER_COLORS.canvas.light, dark: SNYZER_COLORS.canvas.dark },
        surface: { light: SNYZER_COLORS.surface.light, dark: SNYZER_COLORS.surface.dark },
        muted: { light: SNYZER_COLORS.muted.light, dark: SNYZER_COLORS.muted.dark },
        ink: { light: SNYZER_COLORS.ink.light, dark: SNYZER_COLORS.ink.dark },
        subink: { light: SNYZER_COLORS.subink.light, dark: SNYZER_COLORS.subink.dark },
        line: { light: SNYZER_COLORS.line.light, dark: SNYZER_COLORS.line.dark },
        primary: {
          DEFAULT: SNYZER_COLORS.primary.light,
          hover: SNYZER_COLORS.primary.lightHover,
          dark: SNYZER_COLORS.primary.dark,
          darkHover: SNYZER_COLORS.primary.darkHover,
        },
        success: { light: SNYZER_COLORS.success.light, dark: SNYZER_COLORS.success.dark },
        warning: { light: SNYZER_COLORS.warning.light, dark: SNYZER_COLORS.warning.dark },
        danger: { light: SNYZER_COLORS.danger.light, dark: SNYZER_COLORS.danger.dark },
      },
      fontFamily: {
        sans: SNYZER_FONT_STACK.split(', '),
      },
    },
  },
  plugins: [],
};

export default config;
