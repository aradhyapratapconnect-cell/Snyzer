import { Router, type Request, type Response } from 'express';

/**
 * Liveness probe (SNZ-002). Exposes status only — no secrets or diagnostics.
 */
export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
