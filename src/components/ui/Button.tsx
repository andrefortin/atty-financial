import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-black dark:bg-gray-900 text-white dark:text-gray-100 hover:bg-gray-800 dark:hover:bg-gray-700 focus:ring-offset-2',
    secondary: 'bg-blue-200 dark:bg-blue-900 text-black dark:text-gray-100 hover:bg-blue-300 dark:hover:bg-blue-800 focus:ring-offset-2',
    ghost: 'bg-transparent dark:bg-transparent text-gray-900 dark:text-gray-100 hover:bg-stone-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white focus:ring-offset-2',
    danger: 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 focus:ring-offset-2',
    outline: 'border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-stone-50 dark:hover:bg-gray-800 focus:ring-offset-2',
    default: 'bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:ring-offset-2',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const loaderSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className={cn(loaderSize[size], 'animate-spin')} />}
      {!loading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export const IconButton: React.FC<ButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  children,
  className,
  disabled,
  icon,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-black dark:bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-blue-200 text-black hover:bg-blue-300',
    ghost: 'bg-transparent text-gray-900 hover:bg-stone-100',
    danger: 'bg-transparent text-red-500 hover:bg-red-50',
  };

  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={cn(iconSize[size])}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
