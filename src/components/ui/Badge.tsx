// src/components/ui/Badge.tsx
import { type ReactNode, type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  dotColor?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', dot, dotColor, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-100 text-brand-800 border border-brand-200',
      success: 'bg-success-light text-success-dark border border-success-main/20',
      warning: 'bg-warning-light text-warning-dark border border-warning-main/20',
      error: 'bg-error-light text-error-dark border border-error-main/20',
      neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
      outline: 'bg-transparent text-brand-600 border-2 border-brand-600'
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 rounded text-[10px]',
      md: 'px-2 py-0.5 rounded-md text-xs'
    };

    return (
      <span
        ref={ref}
        className={twMerge(
          'inline-flex items-center gap-1.5 font-bold',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: dotColor || 'currentColor' }}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge variants for common use cases
export const StatusBadge = ({ 
  status, 
  label,
  size = 'md'
}: { 
  status: 'working' | 'completed' | 'cancelled' | 'approved' | 'pending' | 'rejected' | 'active' | 'inactive';
  label?: string;
  size?: 'sm' | 'md';
}) => {
  const configs: Record<string, { variant: BadgeProps['variant']; dot: boolean; text: string }> = {
    working: { variant: 'warning', dot: true, text: 'Đang làm' },
    completed: { variant: 'success', dot: true, text: 'Hoàn thành' },
    cancelled: { variant: 'error', dot: true, text: 'Đã hủy' },
    approved: { variant: 'success', dot: true, text: 'Đã duyệt' },
    pending: { variant: 'warning', dot: true, text: 'Chờ duyệt' },
    rejected: { variant: 'error', dot: true, text: 'Từ chối' },
    active: { variant: 'success', dot: true, text: 'Hoạt động' },
    inactive: { variant: 'neutral', dot: true, text: 'Ngưng hoạt động' }
  };

  const config = configs[status] || { variant: 'neutral', dot: false, text: status };
  
  return (
    <Badge variant={config.variant} size={size} dot={config.dot}>
      {label || config.text}
    </Badge>
  );
};