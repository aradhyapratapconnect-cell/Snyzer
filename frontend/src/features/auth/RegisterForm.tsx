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
 *
 * Email confirmation: the signup request carries `emailRedirectTo` derived
 * from the running origin (never a hardcoded host), so confirmation links
 * return to this deployment. When Supabase requires confirmation before
 * issuing a session, the form shows an inbox notice with a resend action
 * instead of navigating to a guarded route that would bounce.
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
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
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
      const { data, error } = await getSupabaseClient().auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error !== null) {
        setServerError(toFriendlyError(error.message));
        return;
      }
      if (data.session === null) {
        setConfirmationEmail(values.email);
        return;
      }
      navigate(resolvePostAuthRedirect(location.state), { replace: true });
    } catch {
      setServerError('Something went wrong. Please try again.');
    }
  };

  const handleResend = async (): Promise<void> => {
    if (confirmationEmail === null || resending) {
      return;
    }
    setResending(true);
    setResendNotice(null);
    setResendError(null);
    try {
      const { error } = await getSupabaseClient().auth.resend({
        type: 'signup',
        email: confirmationEmail,
      });
      if (error !== null) {
        setResendError('Could not resend the confirmation link. Please try again.');
        return;
      }
      setResendNotice('Confirmation link sent. Check your inbox.');
    } catch {
      setResendError('Could not resend the confirmation link. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (confirmationEmail !== null) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle={`We sent a confirmation link to ${confirmationEmail}. Confirm your email to finish creating your account.`}
        footer={
          <>
            Wrong address? <AuthLink to="/register">Try again</AuthLink>
          </>
        }
      >
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
          >
            The link expires soon. Open it on this device, then sign in.
          </div>
          {resendNotice !== null && (
            <div
              role="status"
              className="rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
            >
              {resendNotice}
            </div>
          )}
          {resendError !== null && (
            <div
              role="alert"
              className="rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
            >
              {resendError}
            </div>
          )}
          <Button
            type="button"
            disabled={resending}
            onClick={() => void handleResend()}
            className="w-full bg-[#091e3a] font-semibold text-white hover:bg-[#0d2a52] dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
          >
            {resending && <Spinner />}
            {resending ? 'Sending…' : 'Resend confirmation link'}
          </Button>
          <p className="text-center text-sm">
            <AuthLink to="/login">Back to sign in</AuthLink>
          </p>
        </div>
      </AuthCard>
    );
  }

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
