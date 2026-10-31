// src/components/ui/Avatar.tsx
import { type ReactNode, type HTMLAttributes, forwardRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5'
};

const statusColors = {
  online: 'bg-success-main',
  offline: 'bg-neutral-400',
  busy: 'bg-error-main',
  away: 'bg-warning-main'
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className, 
    src, 
    alt, 
    fallback, 
    size = 'md', 
    shape = 'circle', 
    status, 
    statusPosition = 'bottom-right',
    ...props 
  }, ref) => {
    const statusPosClasses = {
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0'
    };

    return (
      <AvatarPrimitive.Root 
        ref={ref}
        className={twMerge(
          'inline-flex shrink-0 relative',
          sizes[size],
          shape === 'square' ? 'rounded-xl' : 'rounded-full',
          className
        )}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src || undefined}
          alt={alt || ''}
          className={twMerge(
            'w-full h-full object-cover',
            shape === 'square' ? 'rounded-xl' : 'rounded-full'
          )}
        />
        <AvatarPrimitive.Fallback 
          className={twMerge(
            'flex items-center justify-center bg-neutral-100 text-neutral-600 font-semibold',
            'w-full h-full',
            shape === 'square' ? 'rounded-xl' : 'rounded-full'
          )}
          delayMs={100}
        >
          {fallback || (alt ? alt.charAt(0).toUpperCase() : '?')}
        </AvatarPrimitive.Fallback>
        {status && (
          <span
            className={twMerge(
              'absolute rounded-full border-2 border-white',
              statusSizes[size],
              statusColors[status],
              statusPosClasses[statusPosition]
            )}
            aria-label={`Trạng thái: ${status}`}
          />
        )}
      </AvatarPrimitive.Root>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar group for stacking multiple avatars
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}

export function AvatarGroup({ className, max = 5, size = 'md', children, ...props }: AvatarGroupProps) {
  const kids = Array.isArray(children) ? children : [children];
  const visible = kids.slice(0, max);
  const remaining = kids.length - max;

  return (
    <div className={twMerge('flex -space-x-2', className)} {...props}>
      {visible.map((child, index) => (
        <div key={index} className="relative z-10" style={{ zIndex: max - index }}>
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={twMerge(
            'flex items-center justify-center bg-neutral-100 text-neutral-600 font-semibold border-2 border-white',
            sizes[size],
            'rounded-full'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}