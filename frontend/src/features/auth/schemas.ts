import { z } from 'zod';

/**
 * Auth form validation schemas (SNZ-013). These cover form-level UX rules;
 * API/domain auth schemas arrive in shared/ with SNZ-016.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.');

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;
