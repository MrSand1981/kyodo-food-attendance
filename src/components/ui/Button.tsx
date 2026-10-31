// src/components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from '\''react'\'';
import { clsx } from '\''clsx'\'';
import { twMerge } from '\''tailwind-merge'\'';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: '\''primary'\'' | '\''secondary'\'' | '\''outline'\'' | '\''ghost'\'' | '\''danger'\'';
  size?: '\''sm'\'' | '\''md'\'' | '\''lg'\'';
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = '\''primary'\'', size = '\''md'\'', loading, iconLeft, iconRight, fullWidth, disabled, children, ...props }, ref) => {
    const baseStyles = '\'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed\'';
    
    const variants = {
      primary: '\'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 shadow-sm\'',
      secondary: '\'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-400 border border-neutral-200\'',
      outline: '\'bg-transparent text-brand-600 border-2 border-brand-600 hover:bg-brand-50 active:bg-brand-100 focus-visible:ring-brand-500\'',
      ghost: '\'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-400\'',
      danger: '\'bg-error-main text-white hover:bg-error-dark active:bg-error-darker focus-visible:ring-error-main\''
    };
    
    const sizes = {
      sm: '\'px-3 py-1.5 text-xs gap-1.5\'',
      md: '\'px-4 py-2 text-sm gap-2\'',
      lg: '\'px-6 py-3 text-base gap-2.5\''
    };
    
    return (
      <button
        ref={ref}
        className={twMerge(baseStyles, variants[variant], sizes[size], fullWidth && '\''w-full\'', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="\'animate-spin h-4 w-4\'" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="\'opacity-25\'" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="\'opacity-75\'" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : iconLeft}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);

Button.displayName = '\'Button\'';
