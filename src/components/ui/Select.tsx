import React, { forwardRef } from 'react';
import { cn } from '../../utils/formatters';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      options,
      placeholder,
      className,
      value,
      ...props
    },
    ref
  ) => {
    const selectStyles = cn(
      'w-full px-3 py-2 pr-10 border rounded-lg',
      'bg-white',
      'text-sm',
      'appearance-none',
      'bg-no-repeat bg-right',
      'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270%200%2020%2020%27%3e%3cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6%208l4%204%204-4%27/%3e%3c/svg%3e")]',
      'bg-[length:1.5em_1.5em] bg-[right_0.5rem_center]',
      'transition-all duration-150',
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
        <select ref={ref} className={selectStyles} value={value} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className={errorStyles}>{error}</p>}
        {!error && helperText && <p className={helperStyles}>{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
