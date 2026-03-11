/**
 * Notification Badge Component
 *
 * Displays unread notification count.
 * Integrates with useNotifications hook.
 *
 * @module components/notifications
 */

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/realtime';

// ============================================
// Types
// ============================================

interface NotificationBadgeProps {
  userId: string;
  className?: string;
  showLabel?: boolean;
  onClick?: () => void;
}

// ============================================
// Notification Badge Component
// ============================================

export function NotificationBadge({
  userId,
  className = '',
  showLabel = true,
  onClick,
}: NotificationBadgeProps) {
  const {
    unreadCount,
    loading,
    error,
  } = useNotifications({
    userId,
    limit: 1, // Only need count
  });

  return (
    <div className={`relative ${className}`}>
      {loading ? (
        <div className="relative">
          <Bell className="h-5 w-5 text-gray-400 dark:text-gray-600 animate-pulse" />
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-ping"></div>
        </div>
      ) : error ? (
        <div
          className="relative cursor-not-allowed group"
          title="Error loading notifications"
        >
          <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-600 dark:bg-red-500 rounded-full"></div>
        </div>
      ) : unreadCount > 0 ? (
        <button
          type="button"
          onClick={onClick}
          className="relative group focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-label={`${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
        >
          <Bell className="h-5 w-5 text-white dark:text-gray-900" />
          {unreadCount > 99 ? (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center bg-blue-600 dark:bg-blue-500 text-xs font-bold text-white rounded-full">
              99+
            </span>
          ) : (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-gray-900 group-hover:bg-blue-700 dark:group-hover:bg-blue-600"
            >
              {unreadCount}
            </span>
          )}
          {unreadCount > 0 && showLabel && (
            <span className="sr-only">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="relative group focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
          aria-label="No unread notifications"
        >
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200" />
        </button>
      )}
    </div>
  );
}

// ============================================
// Simplified Version
// ============================================

export function NotificationBadgeSimple({
  userId,
  className = '',
}: Omit<NotificationBadgeProps, 'showLabel' | 'onClick'>) & { className?: string }) {
  const { unreadCount } = useNotifications({ userId, limit: 1 });

  return (
    <div className={`relative ${className}`}>
      {unreadCount > 0 ? (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
          {unreadCount > 99 ? '99+' : String(unreadCount)}
        </span>
      ) : null}
    </div>
  );
}
