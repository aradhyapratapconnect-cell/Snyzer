import type { NextFunction, Request, Response } from 'express';
import { UserPreferencesUpdateSchema, type UserPreferences } from '@snyzer/shared';
import { queryDatabase } from '../config/database.js';
import { NotFoundError, UnauthorizedError } from '../middleware/errorHandler.js';

/**
 * User-preference endpoints (SNZ-031).
 *
 * `GET /api/v1/preferences` returns the row, auto-creating defaults for new
 * users. `PATCH /api/v1/preferences` upserts the supplied subset (unknown
 * fields are stripped by route validation; `updated_at` refreshes). The API
 * speaks camelCase; storage is snake_case. Only the four user-controlled
 * columns are ever written — there is no path to privileged fields here.
 */
interface PreferencesRow {
  theme: string;
  workspace_layout: string;
  editor_mode: string;
  default_tone: string;
}

const COLUMN_MAP = {
  theme: 'theme',
  workspaceLayout: 'workspace_layout',
  editorMode: 'editor_mode',
  defaultTone: 'default_tone',
} as const;

type PreferenceKey = keyof typeof COLUMN_MAP;

function toResponse(row: PreferencesRow): UserPreferences {
  return UserPreferencesUpdateSchema.parse({
    theme: row.theme,
    workspaceLayout: row.workspace_layout,
    editorMode: row.editor_mode,
    defaultTone: row.default_tone,
  }) as UserPreferences;
}

async function getOrCreatePreferences(userId: string): Promise<UserPreferences> {
  const existing = await queryDatabase<PreferencesRow>(
    'SELECT theme, workspace_layout, editor_mode, default_tone FROM user_preferences WHERE user_id = $1',
    [userId],
  );
  if (existing[0] !== undefined) {
    return toResponse(existing[0]);
  }
  const created = await queryDatabase<PreferencesRow>(
    `INSERT INTO user_preferences (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING theme, workspace_layout, editor_mode, default_tone`,
    [userId],
  );
  if (created[0] !== undefined) {
    return toResponse(created[0]);
  }
  // Lost a creation race: the row exists now.
  const raced = await queryDatabase<PreferencesRow>(
    'SELECT theme, workspace_layout, editor_mode, default_tone FROM user_preferences WHERE user_id = $1',
    [userId],
  );
  if (raced[0] === undefined) {
    throw new NotFoundError('Preferences could not be created.');
  }
  return toResponse(raced[0]);
}

export async function getPreferences(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    res.status(200).json({ preferences: await getOrCreatePreferences(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function updatePreferences(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    // Re-parsed for defense in depth; the route validator already stripped
    // unknown fields, so only mapped columns can reach the SET clause.
    const patch = UserPreferencesUpdateSchema.parse(req.body);
    const keys = Object.keys(patch) as PreferenceKey[];
    if (keys.length === 0) {
      res.status(200).json({ preferences: await getOrCreatePreferences(req.user.id) });
      return;
    }
    const assignments = keys.map((key, index) => `${COLUMN_MAP[key]} = $${index + 2}`);
    const values: unknown[] = keys.map((key) => patch[key]);
    const rows = await queryDatabase<PreferencesRow>(
      `INSERT INTO user_preferences (user_id, ${keys.map((key) => COLUMN_MAP[key]).join(', ')})
       VALUES ($1, ${keys.map((_, index) => `$${index + 2}`).join(', ')})
       ON CONFLICT (user_id) DO UPDATE SET ${assignments.join(', ')}, updated_at = now()
       RETURNING theme, workspace_layout, editor_mode, default_tone`,
      [req.user.id, ...values],
    );
    if (rows[0] === undefined) {
      throw new NotFoundError('Preferences could not be saved.');
    }
    res.status(200).json({ preferences: toResponse(rows[0]) });
  } catch (error) {
    next(error);
  }
}
