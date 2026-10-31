// src/components/ui/Modal.tsx
import { type ReactNode, Fragment } from '\''react'\'';
import * as DialogPrimitive from '\''@radix-ui/react-dialog'\'';
import { X } from '\''lucide-react'\'';
import { clsx } from '\''clsx'\'';
import { twMerge } from '\''tailwind-merge'\'';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: '\''sm'\'' | '\''md'\'' | '\''lg'\'' | '\''xl'\'' | '\''full'\'';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizes = {
  sm: '\''max-w-sm\'',
  md: '\''max-w-md\'',
  lg: '\''max-w-lg\'',
  xl: '\''max-w-xl\'',
  full: '\''max-w-4xl\''
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = '\''md'\'',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={twMerge(
            '\''fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 z-50\'',
            !closeOnOverlayClick && '\''pointer-events-none\''
          )}
          onPointerDown={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
        />
        <DialogPrimitive.Content
          className={twMerge(
            '\''fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-h-[90vh] overflow-y-auto\'',
            '\''bg-white rounded-3xl shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200\'',
            sizes[size],
            '\''sm:mx-4\''
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="\'flex flex-col\'">
            {/* Header */}
            <div className="\'flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 flex-shrink-0\'">
              <div className="\'flex items-center gap-3\'">
                <DialogPrimitive.Title className="\'text-base font-bold text-neutral-900 tracking-tight\'">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="\'text-xs text-neutral-500\'">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {showCloseButton && (
                <DialogPrimitive.Close
                  className="\'w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer transition-colors\'"
                  aria-label="Đóng"
                >
                  <X className="\'w-4 h-4\'" />
                </DialogPrimitive.Close>
              )}
            </div>

            {/* Content */}
            <div className="\'p-5 sm:p-6 flex-1\'">
              {children}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: '\''danger'\'' | '\''primary'\'';
  loading?: boolean;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '\''Xác nhận\'',
  cancelText = '\''Hủy\'',
  onConfirm,
  onCancel,
  variant = '\''danger'\'',
  loading = false
}: AlertDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      // Error handled by caller
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="\'fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 z-50\'" />
        <DialogPrimitive.Content className="\'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 sm:mx-4\'">
          <div className="\'p-5 sm:p-6\'">
            <DialogPrimitive.Title className="\'text-lg font-bold text-neutral-900 text-center mb-2\'">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="\'text-sm text-neutral-500 text-center mb-6\'">
                {description}
              </DialogPrimitive.Description>
            )}
            <div className="\'flex gap-3\'">
              <DialogPrimitive.Close
                onClick={handleCancel}
                className="\'flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-sm transition-colors\'"
              >
                {cancelText}
              </DialogPrimitive.Close>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={twMerge(
                  '\''flex-1 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all\'',
                  variant === '\''danger'\'' 
                    ? '\''bg-error-main hover:bg-error-dark active:bg-error-darker focus-visible:ring-error-main\'' 
                    : '\''bg-brand-600 hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500\''
                )}
              >
                {loading ? (
                  <svg className="\'mx-auto animate-spin h-5 w-5\'" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="\'opacity-25\'" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="\'opacity-75\'" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
