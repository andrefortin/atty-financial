import React from 'react';
import { cn } from '../../utils/formatters';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  const defaultIcon = (
    <svg
      className="h-12 w-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div className={cn('text-center py-12 px-4', className)}>
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex justify-center mb-4">
          {icon || defaultIcon}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-6">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-black-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

// Pre-configured empty states
export const NoDataEmptyState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    title="No data available"
    description="There are no items to display at this time."
    action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
  />
);

export const NoResultsEmptyState: React.FC<{ onClearFilters?: () => void }> = ({ onClearFilters }) => (
  <EmptyState
    icon={
      <svg
        className="h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    }
    title="No results found"
    description="Try adjusting your search or filter criteria."
    action={onClearFilters ? { label: 'Clear Filters', onClick: onClearFilters } : undefined}
  />
);

export const ErrorEmptyState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Something went wrong', onRetry }) => (
  <EmptyState
    icon={
      <svg
        className="h-12 w-12 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    }
    title={message}
    description="Please try again or contact support if the problem persists."
    action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
  />
);

export const SuccessEmptyState: React.FC<{
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}> = ({ title = 'Success!', description, action }) => (
  <EmptyState
    icon={
      <svg
        className="h-12 w-12 text-green-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    }
    title={title}
    description={description}
    action={action}
  />
);
