/**
 * Notification Service Example Usage
 *
 * Demonstrates common use cases for NotificationService class
 */

import {
  NotificationService,
  createNotificationService,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  type Notification,
  type NotificationStats,
  type NotificationPreferences,
} from './notificationService';

// ============================================
// Example 1: Basic Initialization
// ============================================

async function basicInitializationExample() {
  const notificationService = createNotificationService({
    maxNotificationsPerUser: 1000,
    defaultPriority: NotificationPriority.NORMAL,
    autoCleanup: true,
    debug: true,
  });

  // Initialize for current user
  await notificationService.initialize('user-123');

  console.log('Current user ID:', notificationService.getCurrentUserId());
  console.log('Notification service initialized!');

  notificationService.destroy();
}

// ============================================
// Example 2: Creating Notifications
// ============================================

async function createNotificationsExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Create simple notification
  const notifId1 = await notificationService.create(
    'user-456',
    NotificationType.MATTER_CREATED,
    {
      title: 'New Matter Created',
      message: 'A new matter has been created for your client.',
      entityType: 'matter',
      entityId: 'matter-789',
      actionUrl: '/matters/matter-789',
    }
  );

  console.log('Notification created:', notifId1);

  // Create high priority notification
  const notifId2 = await notificationService.create(
    'user-456',
    NotificationType.SYSTEM_ERROR,
    {
      title: 'System Error',
      message: 'An error occurred during processing.',
    },
    { priority: NotificationPriority.HIGH }
  );

  console.log('High priority notification created:', notifId2);

  // Create notification with sender
  const notifId3 = await notificationService.create(
    'user-456',
    NotificationType.USER_MENTION,
    {
      title: 'You were mentioned',
      message: 'John mentioned you in a comment.',
      entityType: 'comment',
      entityId: 'comment-123',
    },
    {
      senderId: 'user-789',
      senderName: 'John Doe',
    }
  );

  console.log('Notification with sender created:', notifId3);

  notificationService.destroy();
}

// ============================================
// Example 3: Reading Notifications
// ============================================

async function readNotificationsExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Mark single notification as read
  await notificationService.markAsRead('notif-123');
  console.log('Notification marked as read');

  // Mark all as read
  const readCount = await notificationService.markAllAsRead();
  console.log('Marked', readCount, 'notifications as read');

  // Archive notification
  await notificationService.archive('notif-456');
  console.log('Notification archived');

  notificationService.destroy();
}

// ============================================
// Example 4: Querying Notifications
// ============================================

async function queryNotificationsExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Get all notifications
  const allNotifs = await notificationService.getNotifications('user-456');
  console.log('Total notifications:', allNotifs.length);

  // Get unread only
  const unread = await notificationService.getNotifications('user-456', {
    status: NotificationStatus.UNREAD,
  });
  console.log('Unread notifications:', unread.length);

  // Get by type
  const matterNotifs = await notificationService.getByType(
    'user-456',
    NotificationType.MATTER_CREATED
  );
  console.log('Matter notifications:', matterNotifs.length);

  // Get by priority
  const urgent = await notificationService.getByPriority(
    'user-456',
    NotificationPriority.URGENT
  );
  console.log('Urgent notifications:', urgent.length);

  // Get unread count
  const unreadCount = await notificationService.getUnreadCount('user-456');
  console.log('Unread count:', unreadCount);

  // Get statistics
  const stats = await notificationService.getNotificationStats('user-456');
  console.log('Notification statistics:', stats);

  notificationService.destroy();
}

// ============================================
// Example 5: Filtering Notifications
// ============================================

async function filteringNotificationsExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Combined filters
  const filtered = await notificationService.getNotifications('user-456', {
    status: [NotificationStatus.UNREAD, NotificationStatus.READ],
    type: [NotificationType.MATTER_CREATED, NotificationType.TRANSACTION_ASSIGNED],
    priority: [NotificationPriority.HIGH, NotificationPriority.URGENT],
    dateRange: {
      start: Date.now() - 86400000, // 24 hours ago
      end: Date.now(),
    },
    search: 'matter',
    entityType: 'matter',
    limit: 20,
  });

  console.log('Filtered notifications:', filtered.length);

  notificationService.destroy();
}

// ============================================
// Example 6: Real-time Subscriptions
// ============================================

async function realtimeSubscriptionsExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Subscribe to all notifications
  const unsubscribe1 = notificationService.subscribeToNotifications(
    'user-456',
    (notifications) => {
      console.log('Notifications updated:', notifications.length);
      updateNotificationList(notifications);
    }
  );

  // Subscribe to unread count
  const unsubscribe2 = notificationService.subscribeToUnreadCount(
    'user-456',
    (count) => {
      console.log('Unread count:', count);
      updateBadge(count);
    }
  );

  // Subscribe to specific type
  const unsubscribe3 = notificationService.subscribeToType(
    'user-456',
    NotificationType.MATTER_CREATED,
    (notifications) => {
      console.log('Matter notifications:', notifications);
      updateMatterNotifications(notifications);
    }
  );

  // Unsubscribe later
  // unsubscribe1();
  // unsubscribe2();
  // unsubscribe3();

  notificationService.destroy();
}

function updateNotificationList(notifications: Notification[]) {
  console.log('Updating notification list with', notifications.length, 'items');
}

function updateBadge(count: number) {
  console.log('Updating badge:', count);
}

function updateMatterNotifications(notifications: Notification[]) {
  console.log('Updating matter notifications:', notifications);
}

// ============================================
// Example 7: Batch Operations
// ============================================

async function batchOperationsExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Batch create
  const notifIds = await notificationService.batchCreate([
    {
      userId: 'user-789',
      type: NotificationType.MATTER_CREATED,
      data: { title: 'Matter 1', message: 'First matter' },
    },
    {
      userId: 'user-789',
      type: NotificationType.TRANSACTION_ASSIGNED,
      data: { title: 'Transaction 1', message: 'First transaction' },
      priority: NotificationPriority.HIGH,
    },
    {
      userId: 'user-789',
      type: NotificationType.ALLOCATION_EXECUTED,
      data: { title: 'Allocation 1', message: 'First allocation' },
    },
  ]);

  console.log('Created', notifIds.length, 'notifications');

  // Batch mark as read
  const readCount = await notificationService.batchMarkAsRead(notifIds);
  console.log('Marked', readCount, 'notifications as read');

  // Batch delete
  const deletedCount = await notificationService.batchDelete(notifIds);
  console.log('Deleted', deletedCount, 'notifications');

  notificationService.destroy();
}

// ============================================
// Example 8: Preferences Management
// ============================================

async function preferencesManagementExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Get preferences
  const prefs = await notificationService.getPreferences('user-456');
  console.log('Preferences:', prefs);

  // Update preferences
  await notificationService.savePreferences({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: false,
    soundEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  console.log('Preferences saved');

  // Update single preference
  await notificationService.updatePreference('emailEnabled', false);
  console.log('Email disabled');

  // Mute type
  await notificationService.muteType(NotificationType.SYSTEM_UPDATE);
  console.log('System updates muted');

  // Check if muted
  const isMuted = notificationService.isTypeMuted(NotificationType.SYSTEM_UPDATE);
  console.log('System updates muted:', isMuted);

  // Unmute type
  await notificationService.unmuteType(NotificationType.SYSTEM_UPDATE);
  console.log('System updates unmuted');

  // Check quiet hours
  const inQuietHours = notificationService.isInQuietHours();
  console.log('In quiet hours:', inQuietHours);

  notificationService.destroy();
}

// ============================================
// Example 9: Notification Cleanup
// ============================================

async function cleanupExample() {
  const notificationService = createNotificationService();
  await notificationService.initialize('user-456');

  // Clean up old notifications
  const cleanupCount = await notificationService.cleanupOldNotifications();
  console.log('Cleaned up', cleanupCount, 'old notifications');

  // Clear all notifications
  const clearedCount = await notificationService.clearAll();
  console.log('Cleared', clearedCount, 'notifications');

  notificationService.destroy();
}

// ============================================
// Example 10: App Initialization
// ============================================

async function appInitializationExample() {
  const notificationService = createNotificationService({
    maxNotificationsPerUser: 1000,
    defaultPriority: NotificationPriority.NORMAL,
    autoCleanup: true,
    cleanupInterval: 3600000, // 1 hour
    retentionPeriod: 7776000000, // 90 days
    debug: process.env.NODE_ENV === 'development',
  });

  // Get current user
  const currentUser = {
    uid: 'user-123',
    displayName: 'John Doe',
  };

  // Initialize
  await notificationService.initialize(currentUser.uid);

  console.log('Notification service ready!');

  return notificationService;
}

// ============================================
// Example 11: Logout Cleanup
// ============================================

async function logoutCleanupExample(notificationService: NotificationService) {
  console.log('Logging out...');

  // Clear all notifications (optional)
  // await notificationService.clearAll();

  // Destroy service
  await notificationService.destroy();

  console.log('Notification service cleaned up');
}

// ============================================
// Example 12: Error Handling
// ============================================

async function errorHandlingExample() {
  const notificationService = createNotificationService();

  try {
    // Initialize
    await notificationService.initialize('user-123');
  } catch (error) {
    console.error('Initialization failed:', error);
    showErrorMessage('Could not initialize notifications');
    return;
  }

  try {
    // Create notification
    await notificationService.create(
      'user-456',
      NotificationType.MATTER_CREATED,
      { title: 'Test', message: 'Test message' }
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
  }

  try {
    // Query notifications
    await notificationService.getNotifications('user-456');
  } catch (error) {
    console.error('Failed to query notifications:', error);
  }

  notificationService.destroy();
}

function showErrorMessage(message: string) {
  console.error('Error:', message);
}

// ============================================
// Example 13: React Hook
// ============================================

/*
// React hook for using notifications
import { useEffect, useState, useCallback } from 'react';

function useNotifications(notificationService: NotificationService, userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationStatus | 'all'>('all');

  useEffect(() => {
    const unsubscribeNotifs = notificationService.subscribeToNotifications(
      userId,
      (notifs) => {
        if (filter === 'all') {
          setNotifications(notifs);
        } else {
          setNotifications(notifs.filter(n => n.status === filter));
        }
      }
    );

    const unsubscribeCount = notificationService.subscribeToUnreadCount(
      userId,
      setUnreadCount
    );

    return () => {
      unsubscribeNotifs();
      unsubscribeCount();
    };
  }, [notificationService, userId, filter]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  }, [notificationService]);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead(userId);
  }, [notificationService, userId]);

  return {
    notifications,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
  };
}

// Usage in component
function NotificationDashboard({ notificationService, userId }: { notificationService: NotificationService; userId: string }) {
  const {
    notifications,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
  } = useNotifications(notificationService, userId);

  return (
    <div className="notification-dashboard">
      <div className="header">
        <h2>Notifications</h2>
        <div className="badge">{unreadCount}</div>
      </div>
      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter(NotificationStatus.UNREAD)}>Unread</button>
      </div>
      <div className="actions">
        <button onClick={markAllAsRead}>Mark All as Read</button>
      </div>
      <ul className="notifications">
        {notifications.map(notif => (
          <NotificationItem
            key={notif.id}
            notification={notif}
            onMarkAsRead={markAsRead}
          />
        ))}
      </ul>
    </div>
  );
}

function NotificationItem({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: string) => void }) {
  const { data, status, createdAt } = notification;
  const timeAgo = getTimeAgo(createdAt);

  return (
    <li className={`notification-item ${status}`}>
      <h4>{data.title}</h4>
      <p>{data.message}</p>
      <span className="time">{timeAgo}</span>
      {status === NotificationStatus.UNREAD && (
        <button onClick={() => onMarkAsRead(notification.id)}>
          Mark as Read
        </button>
      )}
    </li>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
*/

// Export examples
export {
  basicInitializationExample,
  createNotificationsExample,
  readNotificationsExample,
  queryNotificationsExample,
  filteringNotificationsExample,
  realtimeSubscriptionsExample,
  batchOperationsExample,
  preferencesManagementExample,
  cleanupExample,
  appInitializationExample,
  logoutCleanupExample,
  errorHandlingExample,
};
