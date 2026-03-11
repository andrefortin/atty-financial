import React from 'react';
import { cn } from '../../utils/formatters';

export interface SkeletonLoaderProps {
  count?: number;
  className?: string;
  variant?: 'default' | 'card' | 'table-row';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  className,
  variant = 'default',
}) => {
  const skeletonElements = Array.from({ length: count }, (_, i) => (
    <Skeleton key={i} variant={variant} />
  ));

  return (
    <div
      className={cn(
        'space-y-4',
        variant === 'table-row' && 'divide-y divide-gray-200',
        className
      )}
      aria-label="Loading content"
      role="status"
    >
      {skeletonElements}
    </div>
  );
};

const Skeleton: React.FC<{ variant: 'default' | 'card' | 'table-row' }> = ({ variant }) => {
  return (
    <div className="animate-pulse" role="presentation">
      {variant === 'card' && (
        <div className="h-40 bg-gray-200 rounded-lg" />
      )}
      {variant === 'default' && (
        <div className="h-8 bg-gray-200 rounded" />
      )}
      {variant === 'table-row' && (
        <div className="flex items-center space-x-4">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      )}
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="h-32 bg-gray-200 rounded-lg mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="animate-pulse" role="presentation">
    <div className="space-y-3">
      <TableHeaderSkeleton />
      <TableRowSkeleton />
      <TableRowSkeleton />
      <TableRowSkeleton />
    </div>
  </div>
);

const TableHeaderSkeleton: React.FC = () => (
  <div className="flex space-x-4 mb-4">
    <div className="h-8 bg-gray-200 rounded w-1/4" />
    <div className="h-8 bg-gray-200 rounded w-1/4" />
    <div className="h-8 bg-gray-200 rounded w-1/4" />
    <div className="h-8 bg-gray-200 rounded w-1/4" />
  </div>
);

const TableRowSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4">
    <div className="h-10 w-10 bg-gray-200 rounded" />
    <div className="h-10 w-32 bg-gray-200 rounded" />
    <div className="h-10 w-24 bg-gray-200 rounded" />
    <div className="h-10 w-24 bg-gray-200 rounded" />
    <div className="h-10 w-20 bg-gray-200 rounded" />
    <div className="h-10 w-16 bg-gray-200 rounded" />
    <div className="h-10 w-20 bg-gray-200 rounded" />
  </div>
);

export const TextSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-4 bg-gray-200 rounded w-3/4" />
  </div>
);

export const AvatarSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-10 w-10 bg-gray-200 rounded-full" />
  </div>
);
