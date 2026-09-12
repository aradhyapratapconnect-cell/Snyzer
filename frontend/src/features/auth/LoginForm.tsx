import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import { Spinner } from '../../components/ui/spinner.js';
import { getSupabaseClient } from '../../lib/supabase.js';
import { AuthCard, AuthLink } from './AuthCard.js';
import { PasswordInput } from './PasswordInput.js';
import { loginSchema, type LoginFormValues } from './schemas.js';

/**
 * Login form (SNZ-013). Sign-in failures always map to the same generic
 * message so the UI never reveals whether an email is registered.
 */
export function LoginForm() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setServerError(null);
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error !== null) {
        setServerError('Invalid email or password.');
        return;
      }
      navigate('/workspace');
    } catch {
      setServerError('Invalid email or password.');
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to your workspace."
      footer={
        <>
          New to Snyzer? <AuthLink to="/register">Create an account</AuthLink>
        </>
      }
    >
      <form
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
        className="space-y-4"
      >
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email !== undefined ? 'login-email-error' : undefined}
            disabled={isSubmitting}
            className="mt-1"
            {...register('email')}
          />
          {errors.email !== undefined && (
            <p
              id="login-email-error"
              className="mt-1 text-sm text-danger-light dark:text-danger-dark"
            >
              {errors.email.message}
            </p>
          )}
        </div>
        <PasswordInput
          id="login-password"
          label="Password"
          error={errors.password?.message}
          registration={register('password')}
          disabled={isSubmitting}
          autoComplete="current-password"
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
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}
