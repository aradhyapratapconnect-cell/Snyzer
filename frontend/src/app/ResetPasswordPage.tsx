import { UpdatePasswordForm } from '../features/auth/UpdatePasswordForm.js';

/** New-password page opened from the emailed recovery link (SNZ-014). */
export function ResetPasswordPage() {
  return <UpdatePasswordForm />;
}
