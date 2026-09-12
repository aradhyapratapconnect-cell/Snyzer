import type { NextFunction, Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { ServiceUnavailableError, UnauthorizedError } from '../middleware/errorHandler.js';
import { purgeUserAccount } from '../services/privacy/dataRetentionService.js';

/**
 * Account deletion endpoint (SNZ-034; purge logic SNZ-055).
 *
 * `DELETE /api/v1/account` permanently purges the caller's data. Auth user
 * removal goes first so a failure leaves everything intact and retryable;
 * `purgeUserAccount` then removes the profile (cascading to preferences,
 * jobs, and usage events) and records the audit event. The client signs out
 * and redirects after a 200 — session cleanup is frontend-owned.
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
    await purgeUserAccount(userId);

    res.status(200).json({ deleted: true });
  } catch (error) {
    next(error);
  }
}
