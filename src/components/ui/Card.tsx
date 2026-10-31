// src/components/ui/Card.tsx
import { type ReactNode, type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white rounded-2xl border border-neutral-200 shadow-sm\'',
      hover: 'bg-white rounded-2xl border border-neutral-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-200\'',
      bordered: 'bg-white rounded-2xl border-2 border-neutral-200\''
    };

    const paddings = {
      none: '\',
      sm: 'p-3\'',
      md: 'p-5\'',
      lg: 'p-6\''
    };

    return (
      <div
        ref={ref}
        className={twMerge(variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = '\'Card\'';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={twMerge('\'mb-4\'', className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = '\'CardHeader\'';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={twMerge('\'text-lg font-extrabold text-neutral-900\'', className)} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = '\'CardTitle\'';

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={twMerge('\'mt-1 text-sm text-neutral-500\'', className)} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = '\'CardDescription\'';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={twMerge('\', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = '\'CardContent\'';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={twMerge('\'mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2\'', className)} {...props}>
      {children}
    </div>
  )
);

CardFooter.displayName = '\'CardFooter\'';
