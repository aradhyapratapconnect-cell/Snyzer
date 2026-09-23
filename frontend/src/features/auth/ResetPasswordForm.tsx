import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Spinner } from '../../components/ui/spinner.js';
import { getSupabaseClient } from '../../lib/supabase.js';
import { AuthCard, AuthLink } from './AuthCard.js';
import { resetRequestSchema, type ResetRequestFormValues } from './schemas.js';

/**
 * Password-reset request form (SNZ-014). Sends a recovery link via Supabase
 * Auth, then shows a confirmation. The message never reveals whether the
 * email is registered.
 */
export function ResetPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestFormValues>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ResetRequestFormValues): Promise<void> => {
    setServerError(null);
    try {
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error !== null) {
        setServerError('Could not send the reset link. Please try again.');
        return;
      }
      setSent(true);
    } catch {
      setServerError('Could not send the reset link. Please try again.');
    }
  };

  if (sent) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="If an account uses that email, a password reset link is on its way."
        footer={
          <>
            Remembered it? <AuthLink to="/login">Sign in</AuthLink>
          </>
        }
      >
        <div
          role="status"
          className="rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
        >
          The link expires soon. Open it on this device to choose a new password.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <>
          Remembered it? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
        className="space-y-4"
      >
        <div>
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email !== undefined ? 'reset-email-error' : undefined}
            disabled={isSubmitting}
            className="mt-1"
            {...register('email')}
          />
          {errors.email !== undefined && (
            <p
              id="reset-email-error"
              className="mt-1 text-sm text-danger-light dark:text-danger-dark"
            >
              {errors.email.message}
            </p>
          )}
        </div>
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
          {isSubmitting ? 'Sending link…' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  );
}
