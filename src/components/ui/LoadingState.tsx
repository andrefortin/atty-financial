/**
 * Loading State Components
 *
 * Reusable loading indicator components with various styles
 * Uses lucide-react icons for loading spinners
 */

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// ============================================
// Loading State Component
// ============================================

export interface LoadingStateProps {
  /**
   * Size variant for the spinner
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Custom message to display below the spinner
   */
  message?: string;

  /**
   * Custom subtext to display below message
   */
  subtext?: string;

  /**
   * Whether to show the logo (for page loading)
   */
  showLogo?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 'md',
  message,
  subtext,
  showLogo = false,
  className,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={sizeStyles[size]} />
      {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
      {subtext && <p className="text-xs text-gray-500 dark:text-gray-500">{subtext}</p>}
    </div>
  );

  if (showLogo) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900 rounded-lg p-6">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2L2 7l10 5V17L4 12z" />
          </svg>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
};

// ============================================
// Page Loading State Component
// ============================================

export interface PageLoadingStateProps {
  /**
   * Size variant for the spinner
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Custom message to display
   */
  message?: string;

  /**
   * Custom subtext to display below message
   */
  subtext?: string;

  /**
   * Whether to show the logo (for full-page loading)
   */
  showLogo?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const PageLoadingState: React.FC<PageLoadingStateProps> = ({
  size = 'lg',
  message,
  subtext,
  showLogo = true,
  className,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className={sizeStyles[size]} />
      <div className="text-center">
        {message && (
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {message}
          </p>
        )}
        {subtext && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`h-screen w-full bg-white dark:bg-gray-900 flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message || 'Loading'}
    >
      {showLogo && (
        <div className="mb-8">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 2L2 7l10 5V17L4 12z" />
            </svg>
          </div>
        </div>
      )}
      {content}
    </div>
  );
};

// ============================================
// Inline Loading Component
// ============================================

export interface InlineLoadingProps {
  /**
   * Size variant for the spinner
   */
  size?: 'xs' | 'sm' | 'md';

  /**
   * Text to display alongside the spinner
   */
  text?: string;

  /**
   * Color variant for the spinner
   */
  color?: 'primary' | 'gray';

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'sm',
  text,
  color = 'primary',
  className,
}) => {
  const sizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    gray: 'text-gray-500 dark:text-gray-400',
  };

  if (!text) {
    return (
      <div className={className}>
        <Loader2 className={sizeStyles[size]} />
      </div>
    );
  }

  const textContent = <span className={`text-sm ${colorClasses[color]}`}>{text}</span>;

  if (text && size === 'xs' || size === 'sm') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className={sizeStyles[size]} />
        <div className="flex-1">{textContent}</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={sizeStyles[size]} />
      {textContent}
    </div>
  );
};

export default LoadingState;
