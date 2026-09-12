import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { getSupabaseClient } from '../../lib/supabase.js';
import { AuthCard, AuthLink } from './AuthCard.js';
import { PasswordInput } from './PasswordInput.js';
import { updatePasswordSchema, type UpdatePasswordFormValues } from './schemas.js';

/**
 * New-password form for the recovery-link flow (SNZ-014). Supabase exchanges
 * the emailed link for a session automatically; without a valid session the
 * update fails and the user gets an expired-link message with a recovery
 * path instead of a dead end.
 */
export function UpdatePasswordForm() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = async (values: UpdatePasswordFormValues): Promise<void> => {
    setServerError(null);
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password: values.password });
      if (error !== null) {
        setServerError(
          'This reset link is invalid or has expired. Request a new one and try again.',
        );
        return;
      }
      setDone(true);
    } catch {
      setServerError('This reset link is invalid or has expired. Request a new one and try again.');
    }
  };

  if (done) {
    return (
      <AuthCard
        title="Password updated"
        subtitle="Your password has been changed."
        footer={
          <>
            Continue to <AuthLink to="/login">Sign in</AuthLink>
          </>
        }
      >
        <div
          role="status"
          className="rounded-lg border border-line-light bg-muted-light p-3 text-sm text-ink-light dark:border-line-dark dark:bg-muted-dark dark:text-ink-dark"
        >
          Use your new password next time you sign in.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something at least 8 characters long."
      footer={
        <>
          Link expired? <AuthLink to="/forgot-password">Request a new one</AuthLink>
        </>
      }
    >
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
        className="space-y-4"
      >
        <PasswordInput
          id="update-password"
          label="New password"
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
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthCard>
  );
}
