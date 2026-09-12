import { z } from 'zod';

/**
 * Auth form validation schemas (SNZ-013). These cover form-level UX rules;
 * API/domain auth schemas arrive in shared/ with SNZ-016.
 */
const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.');

const passwordField = z.string().min(8, 'Password must be at least 8 characters.');

export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
