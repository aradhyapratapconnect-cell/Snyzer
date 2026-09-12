import { z } from 'zod';
import { EditorModeSchema, ToneSchema } from './writing.js';

/**
 * User-preference contracts (SNZ-016). Value sets match the database CHECK
 * constraints (SNZ-007 migration); `defaultTone` reuses the shared tone enum
 * so API, database, and UI can never disagree on spelling.
 */
export const ThemeSchema = z.enum(['light', 'dark', 'system']);
export type Theme = z.infer<typeof ThemeSchema>;

export const WorkspaceLayoutSchema = z.enum(['side_by_side', 'input_first']);
export type WorkspaceLayout = z.infer<typeof WorkspaceLayoutSchema>;

export const UserPreferencesSchema = z.object({
  theme: ThemeSchema,
  workspaceLayout: WorkspaceLayoutSchema,
  editorMode: EditorModeSchema,
  defaultTone: ToneSchema,
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/** PATCH payload: any subset of preference fields. */
export const UserPreferencesUpdateSchema = UserPreferencesSchema.partial();
export type UserPreferencesUpdate = z.infer<typeof UserPreferencesUpdateSchema>;
