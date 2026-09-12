import { Router } from 'express';
import { deleteAccount } from '../controllers/accountController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Account routes (SNZ-034).
 */
export const accountRouter = Router();

accountRouter.delete('/account', requireAuth, asyncHandler(deleteAccount));
