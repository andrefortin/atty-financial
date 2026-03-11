import React from 'react';
import { cn } from '../../utils/formatters';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-md border border-gray-300';

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const interactiveClasses = hover
    ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-200'
    : '';

  return (
    <div
      className={cn(
        baseClasses,
        paddingClasses[padding],
        interactiveClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div
      className={cn('flex items-center justify-between mb-4', className)}
    >
      {children}
    </div>
  );
};

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3
      className={cn('text-lg font-semibold text-black m-0', className)}
    >
      {children}
    </h3>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'mt-4 pt-4 border-t border-gray-300 flex items-center justify-between',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
