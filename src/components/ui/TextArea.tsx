// src/components/ui/TextArea.tsx
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, helperText, fullWidth, id, disabled, required, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className={twMerge(fullWidth && 'w-full\'')}>
        {label && (
          <label htmlFor={textareaId} className="\'label\'">
            {label}
            {required && <span className="\'text-error-main ml-1\'" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={twMerge(
            'w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 font-medium text-neutral-900 text-sm\'',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all resize-y min-h-[80px]\'',
            error && 'border-error-main focus:ring-error-main bg-error-light\'',
            disabled && 'opacity-50 cursor-not-allowed bg-neutral-100\'',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `\${textareaId}-error` : helperText ? `\${textareaId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`\${textareaId}-error`} className="\'mt-1.5 text-xs text-error-main font-medium flex items-center gap-1\'" role="alert">
            <svg className="\'w-3.5 h-3.5 flex-shrink-0\'" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`\${textareaId}-helper`} className="\'mt-1.5 text-xs text-neutral-500\'">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = '\'TextArea\'';
