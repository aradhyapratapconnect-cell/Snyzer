import { z } from 'zod';

/**
 * Auth identity contracts (SNZ-016).
 *
 * The backend attaches this shape to `req.user` after verifying the Supabase
 * JWT (SNZ-012); the frontend reads the same shape from its session store
 * (SNZ-011). Role values match the `profiles.role` database CHECK (SNZ-006)
 * and RLS expectations (SNZ-010). Passwords never appear here — Supabase
 * owns credentials; forms validate locally (SNZ-013).
 */
export const UserRoleSchema = z.enum(['FREE_USER', 'PREMIUM_USER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const AuthContextSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  role: UserRoleSchema.default('FREE_USER'),
});
export type AuthContext = z.infer<typeof AuthContextSchema>;
