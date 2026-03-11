import React, { forwardRef } from 'react';
import { cn } from '../../utils/formatters';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputStyles = cn(
      'w-full px-3 py-2 border rounded-lg',
      'bg-white',
      'text-sm',
      'transition-all duration-150',
      'placeholder:text-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      error
        ? 'border-error focus:ring-error'
        : 'border-gray-300 focus:border-blue-200 focus:ring-secondary',
      className
    );

    const labelStyles = cn(
      'block text-sm font-medium text-gray-700 mb-1',
      error && 'text-error'
    );

    const errorStyles = 'text-xs text-error mt-1';
    const helperStyles = 'text-xs text-gray-500 mt-1';

    const wrapperStyles = cn('flex flex-col', fullWidth && 'w-full');

    return (
      <div className={wrapperStyles}>
        {label && <label className={labelStyles}>{label}</label>}
        <input ref={ref} type={type} className={inputStyles} {...props} />
        {error && <p className={errorStyles}>{error}</p>}
        {!error && helperText && <p className={helperStyles}>{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      rows = 4,
      className,
      ...props
    },
    ref
  ) => {
    const textareaStyles = cn(
      'w-full px-3 py-2 border rounded-lg',
      'bg-white',
      'text-sm',
      'transition-all duration-150',
      'placeholder:text-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      error
        ? 'border-error focus:ring-error'
        : 'border-gray-300 focus:border-blue-200 focus:ring-secondary',
      'resize-none',
      className
    );

    const labelStyles = cn(
      'block text-sm font-medium text-gray-700 mb-1',
      error && 'text-error'
    );

    const errorStyles = 'text-xs text-error mt-1';
    const helperStyles = 'text-xs text-gray-500 mt-1';

    const wrapperStyles = cn('flex flex-col', fullWidth && 'w-full');

    return (
      <div className={wrapperStyles}>
        {label && <label className={labelStyles}>{label}</label>}
        <textarea ref={ref} rows={rows} className={textareaStyles} {...props} />
        {error && <p className={errorStyles}>{error}</p>}
        {!error && helperText && <p className={helperStyles}>{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
