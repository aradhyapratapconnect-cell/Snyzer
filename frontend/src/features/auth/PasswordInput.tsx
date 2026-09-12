import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';

/**
 * Password field with visibility toggle (SNZ-013). The toggle is a real
 * button with pressed state so keyboard and screen-reader users can operate
 * it; the input keeps focus and content when toggled.
 */
export function PasswordInput({
  id,
  label,
  error,
  registration,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  error?: string;
  registration: UseFormRegisterReturn;
  disabled: boolean;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={error !== undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
          className="pr-16"
          disabled={disabled}
          {...registration}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => {
            setVisible((previous) => !previous);
          }}
          disabled={disabled}
          className="absolute right-1 top-1/2 h-8 -translate-y-1/2"
        >
          {visible ? 'Hide' : 'Show'}
        </Button>
      </div>
      {error !== undefined && (
        <p id={errorId} className="mt-1 text-sm text-danger-light dark:text-danger-dark">
          {error}
        </p>
      )}
    </div>
  );
}
