import type { NextFunction, Request, Response } from 'express';
import { queryDatabase } from '../config/database.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { ServiceUnavailableError, UnauthorizedError } from '../middleware/errorHandler.js';

/**
 * Account deletion endpoint (SNZ-034).
 *
 * `DELETE /api/v1/account` permanently purges the caller's data. Auth user
 * removal goes first so a failure leaves everything intact and retryable;
 * profile deletion cascades to preferences, jobs, and usage events at the
 * database layer (audit rows detach via `SET NULL` per SNZ-009). The client
 * signs out and redirects after a 200 — session cleanup is frontend-owned.
 */
export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user === undefined) {
      throw new UnauthorizedError();
    }
    const userId = req.user.id;

    const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId);
    if (error !== null) {
      throw new ServiceUnavailableError('Could not delete your account. Please try again.');
    }
    await queryDatabase('DELETE FROM profiles WHERE id = $1', [userId]);

    res.status(200).json({ deleted: true });
  } catch (error) {
    next(error);
  }
}
