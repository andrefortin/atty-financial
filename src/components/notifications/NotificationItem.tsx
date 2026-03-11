/**
 * Notification Item Component
 *
 * Individual notification display with read/archive actions.
 * Integrates with useNotifications hook.
 *
 * @module components/notifications
 */

import { useState } from 'react';
import { Bell, Check, Archive, X, MoreVertical, ChevronDown } from 'lucide-react';
import { useNotifications, Notification, NotificationStatus, NotificationType } from '@/hooks/realtime';

// ============================================
// Types
// ============================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

// ============================================
// Notification Item Component
// ============================================

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onArchive,
  showActions = true,
  compact = false,
}: NotificationItemProps) {
  const [expanded, setExpanded] = useState(false);

  // Get icon based on type
  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.MATTER_CREATED:
      case NotificationType.MATTER_UPDATED:
        return '📋';
      case NotificationType.TRANSACTION_CREATED:
      case NotificationType.TRANSACTION_ASSIGNED:
        return '💰';
      case NotificationType.ALLOCATION_EXECUTED:
        return '💵';
      case NotificationType.INTEREST_ACCRUED:
        return '📈';
      case NotificationType.REPORT_GENERATED:
        return '📊';
      case NotificationType.USER_MENTION:
        return '@';
      case NotificationType.SYSTEM_ERROR:
        return '⚠️';
      case NotificationType.SECURITY_LOGIN:
        return '🔐';
      default:
        return '🔔';
    }
  };

  // Get color based on priority
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-4 border-red-500 dark:border-red-400';
      case 'low':
        return 'border-l-4 border-gray-300 dark:border-gray-600';
      default:
        return 'border-l-4 border-blue-500 dark:border-blue-400';
    }
  };

  // Get status styles
  const getStatusStyles = () => {
    switch (notification.status) {
      case NotificationStatus.UNREAD:
        return 'bg-white dark:bg-gray-900';
      case NotificationStatus.READ:
        return 'bg-gray-50 dark:bg-gray-800';
      case NotificationStatus.ARCHIVED:
        return 'bg-gray-100 dark:bg-gray-800/50';
      default:
        return 'bg-white dark:bg-gray-900';
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(notification.id);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (onArchive) {
      await onArchive(notification.id);
    }
  };

  // Toggle expansion
  const toggleExpand = () => {
    setExpanded(prev => !prev);
  };

  // Compact version (small notification)
  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg border ${getPriorityColor()} hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer ${getStatusStyles()}`}
        onClick={() => {
          if (onMarkAsRead && notification.status === NotificationStatus.UNREAD) {
            handleMarkAsRead();
          }
          if (notification.data.actionUrl) {
            window.location.href = notification.data.actionUrl;
          }
        }}
        role="button"
        aria-label={`Notification: ${notification.data.title}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
              {notification.data.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              {notification.data.message}
            </p>
          </div>
          <span className={`text-xs text-gray-400 dark:text-gray-500 ${notification.status === NotificationStatus.UNREAD ? 'font-semibold' : ''}`}>
            {new Date(notification.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div
      className={`p-4 rounded-lg border ${getPriorityColor()} hover:shadow-md transition-all ${getStatusStyles()}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Icon and Content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Type Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4
              className={`text-sm font-semibold ${
                notification.status === NotificationStatus.UNREAD
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300'
              } mb-1`}
            >
              {notification.data.title}
            </h4>

            {/* Message */}
            {notification.data.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {notification.data.message}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
              {notification.senderName && (
                <span>From: {notification.senderName}</span>
              )}
              <span>•</span>
              <span>{new Date(notification.createdAt).toLocaleString()}</span>
              {notification.priority === 'high' && (
                <span className="font-semibold text-red-600 dark:text-red-400">
                  High Priority
                </span>
              )}
            </div>

            {/* Action URL */}
            {notification.data.actionUrl && (
              <a
                href={notification.data.actionUrl}
                onClick={(e) => {
                  e.stopPropagation();
                if (notification.status === NotificationStatus.UNREAD && onMarkAsRead) {
                  handleMarkAsRead();
                }
                }}
                className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Details
              </a>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {notification.status === NotificationStatus.UNREAD && (
            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0" />
          )}
          <button
            onClick={toggleExpand}
            className="p-1 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Expand notification"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Additional Details */}
          {notification.data.metadata && Object.keys(notification.data.metadata).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Details
              </p>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2">
                {Object.entries(notification.data.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 capitalize">
                      {key}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-end gap-2 mt-3">
              {notification.status === NotificationStatus.UNREAD && onMarkAsRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors"
                  disabled={notification.status !== NotificationStatus.UNREAD}
                >
                  <Check className="h-4 w-4" />
                  Mark as Read
                </button>
              )}

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800 rounded-md transition-colors"
                  title="Delete notification"
                >
                  <X className="h-4 w-4" />
                  Delete
                </button>
              )}

              {onArchive && notification.status !== NotificationStatus.ARCHIVED && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Archive notification"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
