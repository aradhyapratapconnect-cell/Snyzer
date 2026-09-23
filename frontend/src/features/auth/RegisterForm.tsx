import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Spinner } from '../../components/ui/spinner.js';
import { getSupabaseClient } from '../../lib/supabase.js';
import { AuthCard, AuthLink } from './AuthCard.js';
import { PasswordInput } from './PasswordInput.js';
import { resolvePostAuthRedirect } from './ProtectedRoute.js';
import { registerSchema, type RegisterFormValues } from './schemas.js';

/**
 * Registration form (SNZ-013). Validates email/password client-side, creates
 * the account via Supabase Auth, and navigates to the workspace on success.
 * Server failures map to friendly messages; raw provider text never renders.
 */
function toFriendlyError(message: string): string {
  if (message.toLowerCase().includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  return 'Could not create your account. Please check your details and try again.';
}

export function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    setServerError(null);
    try {
      const { error } = await getSupabaseClient().auth.signUp({
        email: values.email,
        password: values.password,
      });
      if (error !== null) {
        setServerError(toFriendlyError(error.message));
        return;
      }
      navigate(resolvePostAuthRedirect(location.state), { replace: true });
    } catch {
      setServerError('Something went wrong. Please try again.');
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start improving your writing in seconds."
      footer={
        <>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
        className="space-y-4"
      >
        <div>
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email !== undefined ? 'register-email-error' : undefined}
            disabled={isSubmitting}
            className="mt-1"
            {...register('email')}
          />
          {errors.email !== undefined && (
            <p
              id="register-email-error"
              className="mt-1 text-sm text-danger-light dark:text-danger-dark"
            >
              {errors.email.message}
            </p>
          )}
        </div>
        <PasswordInput
          id="register-password"
          label="Password"
          error={errors.password?.message}
          registration={register('password')}
          disabled={isSubmitting}
          autoComplete="new-password"
        />
        {serverError !== null && (
          <div
            role="alert"
            className="rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
          >
            {serverError}
          </div>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#091e3a] font-semibold text-white hover:bg-[#0d2a52] dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}
