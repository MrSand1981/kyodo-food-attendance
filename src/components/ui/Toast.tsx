// src/components/ui/Toast.tsx
import { type ReactNode, Fragment } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: ReactNode;
  onClose?: () => void;
}

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = ToastPrimitive.Viewport;
const ToastRoot = ToastPrimitive.Root;
const ToastTitle = ToastPrimitive.Title;
const ToastDescription = ToastPrimitive.Description;
const ToastClose = ToastPrimitive.Close;
const ToastAction = ToastPrimitive.Action;

const icons = {
  default: null,
  success: <CheckCircle className="w-5 h-5 text-success-main" />,
  error: <AlertCircle className="w-5 h-5 text-error-main" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-main" />,
  info: <Info className="w-5 h-5 text-brand-600" />
};

const variants = {
  default: 'bg-white border-neutral-200',
  success: 'bg-success-light border-success-main/20',
  error: 'bg-error-light border-error-main/20',
  warning: 'bg-warning-light border-warning-main/20',
  info: 'bg-brand-50 border-brand-200'
};

function ToastContent({ title, description, variant = 'default', action, onClose, ...props }: ToastProps) {
  return (
    <ToastRoot
      className={twMerge(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-top-right-2 fade-in duration-300',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
        variants[variant]
      )}
      {...props}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[variant]}
      </div>
      <div className="flex-1 min-w-0">
        <ToastTitle className="font-semibold text-neutral-900 text-sm">{title}</ToastTitle>
        {description && (
          <ToastDescription className="mt-1 text-xs text-neutral-600">{description}</ToastDescription>
        )}
        {action && (
          <ToastAction asChild altText={action.props?.['aria-label'] || 'Action'}>
            {action}
          </ToastAction>
        )}
      </div>
      <ToastClose
        onClick={onClose}
        className="flex-shrink-0 w-6 h-6 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
        aria-label="Đóng"
      >
        <X className="w-3.5 h-3.5" />
      </ToastClose>
    </ToastRoot>
  );
}

export interface ToastContextValue {
  toasts: Array<ToastProps & { id: string }>;
  addToast: (toast: Omit<ToastProps & { id: string }, 'id'>) => string;
  removeToast: (id: string) => void;
}

// Simple toast hook for programmatic usage
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastContainer({ children, defaultDuration = 5000 }: { children: ReactNode; defaultDuration?: number }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const addToast = useCallback((toast: Omit<ToastProps & { id: string }, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration || defaultDuration);
    }
    
    return id;
  }, [defaultDuration]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastProvider>
        <ToastViewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[320px] sm:w-[380px] pointer-events-none">
          {toasts.map((toast) => (
            <ToastContent key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
          ))}
        </ToastViewport>
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastContainer');
  }
  return context;
}

// Convenience functions
export const toast = {
  success: (title: string, description?: string, duration?: number) => 
    ({ title, description, variant: 'success', duration: duration ?? 5000 } as ToastProps),
  error: (title: string, description?: string, duration?: number) => 
    ({ title, description, variant: 'error', duration: duration ?? 7000 } as ToastProps),
  warning: (title: string, description?: string, duration?: number) => 
    ({ title, description, variant: 'warning', duration: duration ?? 6000 } as ToastProps),
  info: (title: string, description?: string, duration?: number) => 
    ({ title, description, variant: 'info', duration: duration ?? 5000 } as ToastProps),
  default: (title: string, description?: string, duration?: number) => 
    ({ title, description, variant: 'default', duration: duration ?? 5000 } as ToastProps),
};