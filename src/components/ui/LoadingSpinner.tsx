import React from 'react';
import { cn } from '../../utils/formatters';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'border-t-primary',
    white: 'border-t-white',
    gray: 'border-t-gray-400',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        'border-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
};

export default LoadingSpinner;
