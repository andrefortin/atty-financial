import React from 'react';
import { cn } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    success: 'bg-emerald-100 text-black',
    warning: 'bg-amber-100 text-black',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-black',
    default: 'bg-stone-100 text-gray-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

// Matter Status Badge
export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusStyles: Record<string, { bg: string; text: string }> = {
    Active: STATUS_COLORS.Active,
    Closed: STATUS_COLORS.Closed,
    Archive: { bg: 'bg-gray-200', text: 'text-gray-700' },
    Unassigned: STATUS_COLORS.Unassigned,
    Assigned: STATUS_COLORS.Assigned,
    Allocated: STATUS_COLORS.Allocated,
    Warning: STATUS_COLORS.Warning,
    Error: STATUS_COLORS.Error,
  };

  const styles = statusStyles[status] || { bg: 'bg-stone-100', text: 'text-gray-700' };

  return (
    <Badge
      className={cn(styles.bg, styles.text, className)}
    >
      {status}
    </Badge>
  );
};

// Transaction Type Badge
export interface TransactionTypeBadgeProps {
  type: string;
  className?: string;
}

export const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({
  type,
  className,
}) => {
  const typeStyles: Record<string, { bg: string; text: string }> = {
    Draw: { bg: 'bg-emerald-100', text: 'text-black' },
    'Principal Payment': { bg: 'bg-blue-100', text: 'text-black' },
    'Interest Autodraft': { bg: 'bg-amber-100', text: 'text-black' },
  };

  const styles = typeStyles[type] || { bg: 'bg-stone-100', text: 'text-gray-700' };

  return (
    <Badge
      className={cn(styles.bg, styles.text, className)}
    >
      {type}
    </Badge>
  );
};

// Alert Level Badge
export interface AlertLevelBadgeProps {
  level: 'Warning' | 'Error';
  days: number;
  className?: string;
}

export const AlertLevelBadge: React.FC<AlertLevelBadgeProps> = ({ level, days, className }) => {
  return (
    <Badge
      variant={level === 'Error' ? 'error' : 'warning'}
      className={cn(className)}
    >
      {days} days
    </Badge>
  );
};

export default Badge;
