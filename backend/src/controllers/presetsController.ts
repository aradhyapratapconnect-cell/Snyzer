import type { NextFunction, Request, Response } from 'express';
import {
  MAX_PRESETS_PER_USER,
  PresetCreateSchema,
  PresetSchema,
  type Preset,
} from '@snyzer/shared';
import { queryDatabase } from '../config/database.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../middleware/errorHandler.js';

/**
 * Style preset endpoints (SNZ-062).
 *
 * `GET /api/v1/presets` lists the caller's presets newest-first.
 * `POST /api/v1/presets` saves the current control snapshot under a name
 * (capped at `MAX_PRESETS_PER_USER` per user — the cap error names the
 * limit so the UI can explain it). `DELETE /api/v1/presets/:id` removes one
 * owned preset (missing and foreign-owned ids both 404, never 403). The API
 * speaks camelCase; storage is snake_case.
 */
interface PresetRow {
  id: string;
  name: string;
  mode: string;
  tone: string;
  clarity: number;
  sentence_variety: number;
  created_at: string | Date;
}

const SELECT_COLUMNS = 'id, name, mode, tone, clarity, sentence_variety, created_at';

function toResponse(row: PresetRow): Preset {
  return PresetSchema.parse({
    id: row.id,
    name: row.name,
    mode: row.mode,
    tone: row.tone,
    clarity: row.clarity,
    sentenceVariety: row.sentence_variety,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  });
}

export async function listPresets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    const rows = await queryDatabase<PresetRow>(
      `SELECT ${SELECT_COLUMNS} FROM user_presets WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id],
    );
    res.status(200).json({ presets: rows.map(toResponse) });
  } catch (error) {
    next(error);
  }
}

export async function createPreset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    // Re-parsed for defense in depth; the route validator already stripped
    // unknown fields.
    const preset = PresetCreateSchema.parse(req.body);
    const counted = await queryDatabase<{ count: string }>(
      'SELECT COUNT(*) AS count FROM user_presets WHERE user_id = $1',
      [req.user.id],
    );
    if (Number.parseInt(counted[0]?.count ?? '0', 10) >= MAX_PRESETS_PER_USER) {
      throw new ValidationError(
        `You can save up to ${String(MAX_PRESETS_PER_USER)} presets. Delete one to save another.`,
      );
    }
    const rows = await queryDatabase<PresetRow>(
      `INSERT INTO user_presets (user_id, name, mode, tone, clarity, sentence_variety)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SELECT_COLUMNS}`,
      [req.user.id, preset.name, preset.mode, preset.tone, preset.clarity, preset.sentenceVariety],
    );
    if (rows[0] === undefined) {
      throw new NotFoundError('Preset could not be saved.');
    }
    res.status(201).json({ preset: toResponse(rows[0]) });
  } catch (error) {
    next(error);
  }
}

export async function deletePreset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    const rows = await queryDatabase<{ id: string }>(
      'DELETE FROM user_presets WHERE id = $1 AND user_id = $2 RETURNING id',
      [(req.params as { id: string }).id, req.user.id],
    );
    if (rows[0] === undefined) {
      throw new NotFoundError('Preset not found.');
    }
    res.status(200).json({ deleted: true });
  } catch (error) {
    next(error);
  }
}
