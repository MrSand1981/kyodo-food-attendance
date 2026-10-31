// src/components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes, type ReactNode } from '\''react'\'';
import { clsx } from '\''clsx'\'';
import { twMerge } from '\''tailwind-merge'\'';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, iconLeft, iconRight, fullWidth, id, disabled, required, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '\''-'\'');
    
    return (
      <div className={twMerge(fullWidth && '\''w-full\'')}>
        {label && (
          <label htmlFor={inputId} className="\'label\'">
            {label}
            {required && <span className="\'text-error-main ml-1\'" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="\'relative\'">
          {iconLeft && (
            <div className="\'absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none\'">
              {iconLeft}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={twMerge(
              '\''w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 font-medium text-neutral-900 text-sm\'',
              '\''focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all\'',
              iconLeft && '\''pl-10\'',
              iconRight && '\''pr-10\'',
              error && '\''border-error-main focus:ring-error-main bg-error-light\'',
              disabled && '\''opacity-50 cursor-not-allowed bg-neutral-100\'',
              className
            )}
            aria-invalid={error ? '\''true'\'' : '\''false'\''}
            aria-describedby={error ? `\${inputId}-error` : helperText ? `\${inputId}-helper` : undefined}
            {...props}
          />
          {iconRight && (
            <div className="\'absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none\'">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <p id={`\${inputId}-error`} className="\'mt-1.5 text-xs text-error-main font-medium flex items-center gap-1\'" role="alert">
            <svg className="\'w-3.5 h-3.5 flex-shrink-0\'" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`\${inputId}-helper`} className="\'mt-1.5 text-xs text-neutral-500\'">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = '\'Input\'';
