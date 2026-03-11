/**
 * Notification Center Component
 *
 * Main notification hub with list view, filters, and actions.
 * Integrates with useNotifications hook and NotificationService.
 *
 * @module components/notifications
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Bell,
  X,
  Check,
  Archive,
  Filter,
  MoreVertical,
  ChevronDown,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useNotifications, Notification, NotificationStatus, NotificationType } from '@/hooks/realtime';

// ============================================
// Types
// ============================================

interface NotificationCenterProps {
  userId: string;
  autoMarkRead?: boolean;
  showToast?: boolean;
  maxDisplay?: number;
  onNotificationClick?: (notification: Notification) => void;
}

interface NotificationFilter {
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: 'high' | 'normal' | 'low';
  search: string;
}

// ============================================
// Notification Center Component
// ============================================

export function NotificationCenter({
  userId,
  autoMarkRead = true,
  showToast = true,
  maxDisplay = 50,
  onNotificationClick,
}: NotificationCenterProps) {
  // State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<NotificationFilter>({});
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Get notifications
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch,
    invalidate,
  } = useNotifications({
    userId,
    limit: maxDisplay,
  });

  // Computed values
  const unreadNotifications = useMemo(
    () => notifications.filter(n => n.status === NotificationStatus.UNREAD),
    [notifications]
  );

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });

    return groups;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by status
    if (selectedFilter.status) {
      filtered = filtered.filter(
        n => n.status === selectedFilter.status
      );
    }

    // Filter by type
    if (selectedFilter.type) {
      if (Array.isArray(selectedFilter.type)) {
        filtered = filtered.filter(n =>
          selectedFilter.type.includes(n.type)
        );
      } else {
        filtered = filtered.filter(
          n => n.type === selectedFilter.type
        );
      }
    }

    // Filter by priority
    if (selectedFilter.priority) {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      filtered.sort((a, b) => {
        const priorityA = a.priority
          ? priorityOrder[a.priority]
          : priorityOrder.normal;
        const priorityB = b.priority
          ? priorityOrder[b.priority]
          : priorityOrder.normal;
        return priorityA - priorityB;
      });
    }

    // Search filter
    if (selectedFilter.search) {
      const search = selectedFilter.search.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.data.title.toLowerCase().includes(search) ||
          n.data.message.toLowerCase().includes(search)
      );
    }

    // Show archived
    if (!showArchived) {
      filtered = filtered.filter(
        n => n.status !== NotificationStatus.ARCHIVED
      );
    }

    return filtered;
  }, [notifications, selectedFilter, showArchived]);

  // Handlers
  const handleFilterToggle = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleFilterChange = useCallback((filter: NotificationFilter) => {
    setSelectedFilter(prev => ({ ...prev, ...filter }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedFilter({});
    setShowArchived(false);
  }, []);

  const handleExpandNotification = useCallback((notificationId: string) => {
    setExpandedNotification(
      prev => (prev === notificationId ? null : notificationId)
    );
  }, []);

  const handleMarkAsRead = useCallback(
    async (notification: Notification) => {
      await markAsRead(notification.id);
      if (autoMarkRead) {
        onNotificationClick?.(notification);
      }
    },
    [markAsRead, autoMarkRead, onNotificationClick]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadIds = unreadNotifications.map(n => n.id);
    await markAllAsRead();
  }, [markAllAsRead, unreadNotifications]);

  const handleDelete = useCallback(
    async (notification: Notification) => {
      // In a real implementation, you would call NotificationService.delete(notification.id)
      console.log('Delete notification:', notification.id);
      invalidate();
    },
    [invalidate]
  );

  const handleArchive = useCallback(
    async (notification: Notification) => {
      // In a real implementation, you would call NotificationService.archive(notification.id)
      console.log('Archive notification:', notification.id);
      invalidate();
    },
    [invalidate]
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      onNotificationClick?.(notification);

      if (autoMarkRead && notification.status === NotificationStatus.UNREAD) {
        handleMarkAsRead(notification);
      }

      if (notification.data.actionUrl) {
        window.location.href = notification.data.actionUrl;
      }
    },
    [autoMarkRead, onNotificationClick]
  );

  // Get notification icon based on type
  const getNotificationIcon = useCallback((type: NotificationType) => {
    switch (type) {
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
  }, []);

  // Get status color
  const getStatusColor = useCallback((status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.UNREAD:
        return 'text-blue-600 dark:text-blue-400';
      case NotificationStatus.READ:
        return 'text-gray-600 dark:text-gray-400';
      case NotificationStatus.ARCHIVED:
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }, []);

  // Render
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
          {loading && (
            <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-red-500 dark:text-red-400 text-sm">
              Error loading notifications
            </span>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Filter notifications"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={handleFilterToggle}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Mark all as read"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleFilterToggle}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Filter Notifications
            </h3>
            <button
              onClick={handleFilterToggle}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(NotificationStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      handleFilterChange({
                        status:
                          selectedFilter.status === status
                            ? undefined
                            : status,
                      })
                    }
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedFilter.status === status
                        ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.values(NotificationType).map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      handleFilterChange({
                        type: selectedFilter.type === type
                          ? undefined
                          : type,
                      })
                    }
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      selectedFilter.type === type
                        ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {getNotificationIcon(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {(
                  [{ value: 'high', label: 'High' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'low', label: 'Low' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                      handleFilterChange({
                        priority:
                          selectedFilter.priority === value
                            ? undefined
                            : (value as 'high' | 'normal' | 'low'),
                      })
                    }
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedFilter.priority === value
                        ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))
                )}
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={selectedFilter.search}
                  onChange={(e) =>
                    handleFilterChange({ search: e.target.value })
                  }
                  className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <Filter className="absolute left-3 top-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={handleFilterToggle}
                className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading notifications...
            </span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-center">
            <p className="text-red-600 dark:text-red-400 text-sm">
              Failed to load notifications
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No notifications
            </p>
            {selectedFilter.status ||
            selectedFilter.type ||
            selectedFilter.priority ||
            selectedFilter.search ? (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors"
              >
                Clear filters to see all notifications
              </button>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                You're all caught up!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grouped notifications by date */}
            {Object.entries(groupedNotifications).map(
              ([date, dateNotifications]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {date}
                  </h3>

                  {dateNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group relative p-3 rounded-lg border transition-all ${
                        notification.status === NotificationStatus.UNREAD
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400'
                          : notification.status === NotificationStatus.ARCHIVED
                          ? 'bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-200 dark:border-gray-700'
                          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                      aria-label={notification.data.title}
                    >
                      {/* Notification Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base ${
                          notification.status === NotificationStatus.UNREAD
                            ? 'bg-blue-600 dark:bg-blue-500 text-white'
                            : notification.status === NotificationStatus.ARCHIVED
                            ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                notification.status === NotificationStatus.UNREAD
                                  ? 'text-gray-900 dark:text-white font-semibold'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {notification.data.title}
                            </p>
                            <p
                              className={`text-sm text-gray-600 dark:text-gray-400 line-clamp-2 ${
                                notification.status === NotificationStatus.UNREAD
                                  ? 'font-semibold'
                                  : ''
                              }`}
                            >
                              {notification.data.message}
                            </p>
                            {notification.data.actionUrl && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {notification.data.actionUrl}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {notification.status !== NotificationStatus.ARCHIVED && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification);
                                }}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                title="Mark as read"
                                aria-label="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(notification);
                                }}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                title="Archive notification"
                                aria-label="Archive notification"
                              >
                                <Archive className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Expand Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandNotification(notification.id);
                          }}
                          className="ml-2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all"
                          aria-label="Expand details"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              expandedNotification === notification.id
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {expandedNotification === notification.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                          {notification.senderName && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              From: {notification.senderName}
                            </p>
                          )}
                          {notification.data.metadata && Object.keys(
                            notification.data.metadata
                          ).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                Details
                              </p>
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 space-y-1">
                                {Object.entries(notification.data.metadata).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between text-xs text-gray-700 dark:text-gray-300"
                                    >
                                      <span className="capitalize">{key}:</span>
                                      <span>{String(value)}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
          {notifications.length > filteredNotifications.length && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
