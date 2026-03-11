/**
 * Notification Toast Component
 *
 * Temporary toast notification component.
 * Shows ephemeral notifications with auto-dismiss.
 *
 * @module components/notifications
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// ============================================
// Types
// ============================================

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationToastProps {
  notification: ToastNotification;
  onClose: (id: string) => void;
}

// ============================================
// Component
// ============================================

export function NotificationToast({
  notification,
  onClose,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Show toast when notification changes
  useEffect(() => {
    setIsVisible(true);
    setIsExiting(false);

    // Auto-dismiss after duration
    const duration = notification.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose(notification.id);
      }, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onClose]);

  // Get toast styles based on type
  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-50',
          message: 'text-green-800 dark:text-green-200',
        };
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-50',
          message: 'text-red-800 dark:text-red-200',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-50',
          message: 'text-yellow-800 dark:text-yellow-200',
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-50',
          message: 'text-blue-800 dark:text-blue-200',
        };
    }
  };

  const styles = getToastStyles(notification.type);

  // Handle close animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(notification.id);
    }, 300);
  };

  // Get icon based on type
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full sm:max-w-md ${isExiting ? 'opacity-0 transition-opacity duration-300' : 'opacity-100 transition-all duration-300'}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      onClick={handleClose}
    >
      <div
        className={`${styles.container} rounded-lg shadow-lg border-2 p-4 cursor-pointer hover:shadow-xl transition-shadow duration-200`}
      >
        <div className="flex items-start">
          {/* Icon */}
          <div className={`${styles.icon} text-xl mt-0.5 flex-shrink-0`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 ml-3">
            <h4 className={`text-sm font-semibold ${styles.title} mb-1`}>
              {notification.title}
            </h4>
            {notification.message && (
              <p className={`text-sm ${styles.message} leading-tight`}>
                {notification.message}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar for duration */}
      {notification.duration && (
        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-current transition-all duration-[var(--notification-duration)]"
            style={{ '--notification-duration': `${notification.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
}
