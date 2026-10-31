// src/components/ui/Select.tsx
import { forwardRef, type ReactNode } from '\''react'\'';
import * as SelectPrimitive from '\''@radix-ui/react-select'\'';
import { Check, ChevronDown, ChevronUp } from '\''lucide-react'\'';
import { clsx } from '\''clsx'\'';
import { twMerge } from '\''tailwind-merge'\'';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  id?: string;
}

const Select = SelectPrimitive.Root;
const SelectTrigger = SelectPrimitive.Trigger;
const SelectValue = SelectPrimitive.Value;
const SelectContent = SelectPrimitive.Content;
const SelectItem = SelectPrimitive.Item;
const SelectItemText = SelectPrimitive.ItemText;
const SelectItemIndicator = SelectPrimitive.ItemIndicator;
const SelectSeparator = SelectPrimitive.Separator;
const SelectScrollUpButton = SelectPrimitive.ScrollUpButton;
const SelectScrollDownButton = SelectPrimitive.ScrollDownButton;

export function SelectComponent({
  label,
  error,
  helperText,
  placeholder = '\''Chọn...\'',
  options,
  value,
  onValueChange,
  disabled,
  required,
  fullWidth,
  id
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '\''-'\'');

  return (
    <div className={twMerge(fullWidth && '\''w-full\'')}>
      {label && (
        <label htmlFor={selectId} className="\'label\'">
          {label}
          {required && <span className="\'text-error-main ml-1\'" aria-hidden="true">*</span>}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={selectId}
          className={twMerge(
            '\''w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 font-medium text-neutral-900 text-sm\'',
            '\''focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all\'',
            '\''data-[placeholder]:text-neutral-500\'',
            '\''data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:bg-neutral-100\'',
            error && '\''border-error-main focus:ring-error-main bg-error-light\'',
          )}
          aria-invalid={error ? '\''true'\'' : '\''false'\''}
          aria-describedby={error ? `\${selectId}-error` : helperText ? `\${selectId}-helper` : undefined}
        >
          <SelectValue placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="\'w-4 h-4 text-neutral-400 data-[state=open]:rotate-180 transition-transform\'" />
          </SelectPrimitive.Icon>
        </SelectTrigger>
        <SelectContent
          className="\'overflow-hidden bg-white rounded-xl border border-neutral-200 shadow-lg z-50\'"
          position="popper"
          sideOffset={4}
        >
          <SelectScrollUpButton className="\'flex items-center justify-center h-8 bg-white\'">
            <ChevronUp className="\'w-4 h-4 text-neutral-500\'" />
          </SelectScrollUpButton>
          <SelectPrimitive.Viewport className="\'p-1 max-h-60\'">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={twMerge(
                  '\''relative flex items-center px-3 py-2 rounded-lg text-sm text-neutral-900\'',
                  '\''focus:bg-brand-50 focus:text-brand-700 focus:outline-none\'',
                  '\''data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed\'',
                  '\''data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700\'',
                )}
              >
                <SelectItemText>{option.label}</SelectItemText>
                <SelectItemIndicator className="\'ml-auto h-4 w-4 text-brand-600\'">
                  <Check className="\'w-4 h-4\'" />
                </SelectItemIndicator>
              </SelectItem>
            ))}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton className="\'flex items-center justify-center h-8 bg-white border-t border-neutral-100\'">
            <ChevronDown className="\'w-4 h-4 text-neutral-500\'" />
          </SelectScrollDownButton>
        </SelectContent>
      </Select>
      {error && (
        <p id={`\${selectId}-error`} className="\'mt-1.5 text-xs text-error-main font-medium flex items-center gap-1\'" role="alert">
          <svg className="\'w-3.5 h-3.5 flex-shrink-0\'" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`\${selectId}-helper`} className="\'mt-1.5 text-xs text-neutral-500\'">
          {helperText}
        </p>
      )}
    </div>
  );
}
