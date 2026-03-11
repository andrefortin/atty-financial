# Notification Service

The Notification Service manages user notifications including creation, reading, deletion, real-time subscriptions, and notification preferences using Firebase Firestore.

## Features

- **Notification Management**: Create, mark as read, archive, and delete notifications
- **Query Notifications**: Get notifications with filters, unread count, and statistics
- **Real-time Subscriptions**: Subscribe to notifications and unread count updates
- **Notification Batching**: Batch create, delete, and mark as read operations
- **Notification Filtering**: Filter by status, type, priority, date range, and search
- **Notification Preferences**: Manage user notification preferences and muted types
- **Push Notification Support**: Prepared for future push notification integration
- **Statistics**: Comprehensive notification statistics and analytics

## Basic Usage

### Creating a Notification Service

```typescript
import { NotificationService, createNotificationService } from '@/services/realtime';

// Using factory function
const notificationService = createNotificationService({
  maxNotificationsPerUser: 1000,
  defaultPriority: NotificationPriority.NORMAL,
  autoCleanup: true,
  debug: true,
});

// Or using class directly
const notificationService = new NotificationService({
  debug: true,
});
```

### Initializing the Service

```typescript
// Initialize for current user
await notificationService.initialize('user-123');

console.log('Current user ID:', notificationService.getCurrentUserId());
```

## Creating Notifications

### Basic Notification

```typescript
const notificationId = await notificationService.create(
  'user-456',  // Recipient user ID
  NotificationType.MATTER_CREATED,
  {
    title: 'New Matter Created',
    message: 'A new matter has been created for you.',
    entityType: 'matter',
    entityId: 'matter-789',
    actionUrl: '/matters/matter-789',
  },
  {
    priority: NotificationPriority.HIGH,
    senderId: 'user-123',
    senderName: 'John Doe',
  }
);

console.log('Notification created:', notificationId);
```

### Different Notification Types

```typescript
// Matter notification
await notificationService.create(
  'user-456',
  NotificationType.MATTER_STATUS_CHANGED,
  {
    title: 'Matter Status Changed',
    message: 'Matter status has been updated to Closed.',
    entityType: 'matter',
    entityId: 'matter-789',
  }
);

// Transaction notification
await notificationService.create(
  'user-456',
  NotificationType.TRANSACTION_ASSIGNED,
  {
    title: 'Transaction Assigned',
    message: 'A transaction has been assigned to your matter.',
    entityType: 'transaction',
    entityId: 'txn-123',
    actionUrl: '/transactions/txn-123',
  }
);

// System notification
await notificationService.create(
  'user-456',
  NotificationType.SYSTEM_MAINTENANCE,
  {
    title: 'Scheduled Maintenance',
    message: 'System will be down for maintenance on Saturday.',
  },
  {
    priority: NotificationPriority.URGENT,
  }
);
```

## Reading Notifications

### Mark as Read

```typescript
// Mark single notification as read
await notificationService.markAsRead('notif-123');

console.log('Notification marked as read');
```

### Mark All as Read

```typescript
// Mark all notifications as read for user
const readCount = await notificationService.markAllAsRead();

console.log('Marked', readCount, 'notifications as read');

// Mark for specific user
const userReadCount = await notificationService.markAllAsRead('user-456');
```

### Archive Notification

```typescript
// Archive a notification (moves to archived status)
await notificationService.archive('notif-123');
```

## Deleting Notifications

```typescript
// Delete single notification
await notificationService.delete('notif-123');

console.log('Notification deleted');
```

## Querying Notifications

### Get All Notifications

```typescript
// Get all notifications for user
const notifications = await notificationService.getNotifications('user-123');

console.log('Notifications:', notifications.length);
notifications.forEach(notif => {
  console.log(`${notif.data.title}: ${notif.data.message}`);
});
```

### Get with Filters

```typescript
// Get unread notifications only
const unreadNotifications = await notificationService.getNotifications('user-123', {
  status: NotificationStatus.UNREAD,
});

// Get notifications by type
const matterNotifications = await notificationService.getNotifications('user-123', {
  type: NotificationType.MATTER_CREATED,
});

// Get notifications by priority
const highPriority = await notificationService.getNotifications('user-123', {
  priority: [NotificationPriority.HIGH, NotificationPriority.URGENT],
});

// Get notifications in date range
const recentNotifications = await notificationService.getNotifications('user-123', {
  dateRange: {
    start: Date.now() - 86400000, // 24 hours ago
    end: Date.now(),
  },
});

// Search notifications
const searchResults = await notificationService.getNotifications('user-123', {
  search: 'matter',
});

// Filter by entity
const matterRelated = await notificationService.getNotifications('user-123', {
  entityType: 'matter',
  entityId: 'matter-789',
});

// Combined filters
const filtered = await notificationService.getNotifications('user-123', {
  status: [NotificationStatus.UNREAD, NotificationStatus.READ],
  type: NotificationType.MATTER_CREATED,
  priority: NotificationPriority.HIGH,
  limit: 20,
});
```

### Get Unread Count

```typescript
// Get total unread count
const unreadCount = await notificationService.getUnreadCount('user-123');

console.log('Unread notifications:', unreadCount);

// Get unread count for specific type
const matterUnread = await notificationService.getUnreadCount(
  'user-123',
  NotificationType.MATTER_CREATED
);
```

### Get by Type

```typescript
// Get notifications by type
const matterNotifications = await notificationService.getByType(
  'user-123',
  NotificationType.MATTER_CREATED
);

// Get multiple types
const allMatterNotifications = await notificationService.getByType(
  'user-123',
  [
    NotificationType.MATTER_CREATED,
    NotificationType.MATTER_UPDATED,
    NotificationType.MATTER_STATUS_CHANGED,
  ],
  { limit: 50, includeRead: true }
);
```

### Get by Priority

```typescript
// Get high priority notifications
const urgentNotifications = await notificationService.getByPriority(
  'user-123',
  NotificationPriority.URGENT
);
```

### Get Statistics

```typescript
const stats = await notificationService.getNotificationStats('user-123');

console.log('Notification Statistics:');
console.log(`Total: ${stats.total}`);
console.log(`Unread: ${stats.unread}`);
console.log(`Read: ${stats.read}`);
console.log(`Archived: ${stats.archived}`);
console.log(`Last 24h: ${stats.last24Hours}`);
console.log(`Last 7 days: ${stats.last7Days}`);
console.log(`Last 30 days: ${stats.last30Days}`);
console.log(`Average per day: ${stats.averagePerDay.toFixed(2)}`);
console.log('By type:', stats.byType);
console.log('By priority:', stats.byPriority);
```

## Real-time Subscriptions

### Subscribe to Notifications

```typescript
// Subscribe to all user notifications
const unsubscribe = notificationService.subscribeToNotifications(
  'user-123',
  (notifications) => {
    console.log('Notifications updated:', notifications.length);
    updateNotificationList(notifications);
  }
);

// Subscribe with filter
const unsubscribeFiltered = notificationService.subscribeToNotifications(
  'user-123',
  (notifications) => {
    updateNotificationList(notifications);
  },
  {
    status: NotificationStatus.UNREAD,
  }
);

// Unsubscribe later
// unsubscribe();
```

### Subscribe to Unread Count

```typescript
// Subscribe to unread count updates
const unsubscribe = notificationService.subscribeToUnreadCount(
  'user-123',
  (count) => {
    console.log('Unread count:', count);
    updateBadge(count);
  }
);
```

### Subscribe by Type

```typescript
// Subscribe to specific notification type
const unsubscribe = notificationService.subscribeToType(
  'user-123',
  NotificationType.MATTER_CREATED,
  (notifications) => {
    console.log('Matter notifications:', notifications);
    updateMatterNotifications(notifications);
  }
);
```

## Notification Batching

### Batch Create

```typescript
// Create multiple notifications at once
const notificationIds = await notificationService.batchCreate([
  {
    userId: 'user-456',
    type: NotificationType.MATTER_CREATED,
    data: {
      title: 'Matter 1 Created',
      message: 'First matter created',
    },
  },
  {
    userId: 'user-456',
    type: NotificationType.MATTER_CREATED,
    data: {
      title: 'Matter 2 Created',
      message: 'Second matter created',
    },
  },
  {
    userId: 'user-456',
    type: NotificationType.TRANSACTION_ASSIGNED,
    data: {
      title: 'Transaction Assigned',
      message: 'Transaction assigned to matter',
    },
    priority: NotificationPriority.HIGH,
  },
]);

console.log('Created', notificationIds.length, 'notifications');
```

### Batch Delete

```typescript
// Delete multiple notifications at once
const deletedCount = await notificationService.batchDelete([
  'notif-123',
  'notif-456',
  'notif-789',
]);

console.log('Deleted', deletedCount, 'notifications');
```

### Batch Mark as Read

```typescript
// Mark multiple notifications as read at once
const readCount = await notificationService.batchMarkAsRead([
  'notif-123',
  'notif-456',
  'notif-789',
]);

console.log('Marked', readCount, 'notifications as read');
```

## Notification Preferences

### Get Preferences

```typescript
// Get user preferences
const preferences = await notificationService.getPreferences('user-123');

if (preferences) {
  console.log('Email enabled:', preferences.emailEnabled);
  console.log('Push enabled:', preferences.pushEnabled);
  console.log('In-app enabled:', preferences.inAppEnabled);
  console.log('Muted types:', preferences.mutedTypes);
  console.log('Quiet hours:', preferences.quietHoursStart, '-', preferences.quietHoursEnd);
  console.log('Sound enabled:', preferences.soundEnabled);
}
```

### Save Preferences

```typescript
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
```

### Update Single Preference

```typescript
// Update specific preference
await notificationService.updatePreference('emailEnabled', false);
await notificationService.updatePreference('pushEnabled', true);
await notificationService.updatePreference('soundEnabled', false);
```

### Mute Notification Types

```typescript
// Mute a specific notification type
await notificationService.muteType(NotificationType.SYSTEM_UPDATE);

// Check if type is muted
if (notificationService.isTypeMuted(NotificationType.SYSTEM_UPDATE)) {
  console.log('System updates are muted');
}

// Unmute a notification type
await notificationService.unmuteType(NotificationType.SYSTEM_UPDATE);
```

### Quiet Hours

```typescript
// Set quiet hours
await notificationService.savePreferences({
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
});

// Check if currently in quiet hours
if (notificationService.isInQuietHours()) {
  console.log('Currently in quiet hours - suppressing notifications');
}
```

## Notification Cleanup

### Clean Up Old Notifications

```typescript
// Clean up notifications older than retention period (default: 90 days)
const cleanupCount = await notificationService.cleanupOldNotifications();

console.log('Cleaned up', cleanupCount, 'old notifications');

// Clean up notifications older than specific time
const customCleanup = await notificationService.cleanupOldNotifications(7776000000); // 90 days

console.log('Custom cleanup:', customCleanup, 'notifications');
```

### Clear All Notifications

```typescript
// Clear all notifications for current user
const clearedCount = await notificationService.clearAll();

console.log('Cleared', clearedCount, 'notifications');

// Clear all notifications for specific user
const userCleared = await notificationService.clearAll('user-456');

console.log('Cleared', userCleared, 'notifications for user');
```

## React Integration

### Custom Hooks

```typescript
import { useEffect, useState, useCallback } from 'react';
import {
  NotificationService,
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '@/services/realtime';

function useNotifications(notificationService: NotificationService, userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribeNotifs = notificationService.subscribeToNotifications(
      userId,
      setNotifications
    );

    const unsubscribeCount = notificationService.subscribeToUnreadCount(
      userId,
      setUnreadCount
    );

    return () => {
      unsubscribeNotifs();
      unsubscribeCount();
    };
  }, [notificationService, userId]);

  return { notifications, unreadCount };
}

function useUnreadCount(notificationService: NotificationService, userId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToUnreadCount(
      userId,
      setCount
    );

    return unsubscribe;
  }, [notificationService, userId]);

  return count;
}

function useNotificationStats(notificationService: NotificationService, userId: string) {
  const [stats, setStats] = useState<NotificationStats | null>(null);

  useEffect(() => {
    let mounted = true;

    notificationService.getNotificationStats(userId).then((result) => {
      if (mounted) {
        setStats(result);
      }
    });

    return () => {
      mounted = false;
    };
  }, [notificationService, userId]);

  return stats;
}
```

### Notification List Component

```typescript
function NotificationList({ 
  notificationService,
  userId 
}: { 
  notificationService: NotificationService;
  userId: string;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationStatus | 'all'>('all');

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (notifs) => {
        if (filter === 'all') {
          setNotifications(notifs);
        } else {
          setNotifications(notifs.filter(n => n.status === filter));
        }
      }
    );

    return unsubscribe;
  }, [notificationService, userId, filter]);

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
  };

  const handleDelete = async (notificationId: string) => {
    await notificationService.delete(notificationId);
  };

  const getStatusColor = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.UNREAD: return 'blue';
      case NotificationStatus.READ: return 'gray';
      case NotificationStatus.ARCHIVED: return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="notification-list">
      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter(NotificationStatus.UNREAD)}>Unread</button>
        <button onClick={() => setFilter(NotificationStatus.READ)}>Read</button>
        <button onClick={() => setFilter(NotificationStatus.ARCHIVED)}>Archived</button>
      </div>
      <ul>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    </div>
  );
}

function NotificationItem({ 
  notification,
  onMarkAsRead,
  onDelete 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { data, status, createdAt } = notification;
  const timeAgo = getTimeAgo(createdAt);

  return (
    <li className={`notification-item ${status}`}>
      <div className="notification-icon" />
      <div className="notification-content">
        <h4 className="notification-title">{data.title}</h4>
        <p className="notification-message">{data.message}</p>
        <span className="notification-time">{timeAgo}</span>
        {data.actionUrl && (
          <a href={data.actionUrl} className="notification-action">
            View
          </a>
        )}
      </div>
      <div className="notification-actions">
        {status === NotificationStatus.UNREAD && (
          <button onClick={() => onMarkAsRead(notification.id)}>
            Mark as Read
          </button>
        )}
        <button onClick={() => onDelete(notification.id)}>
          Delete
        </button>
      </div>
    </li>
  );
}
```

### Notification Badge Component

```typescript
function NotificationBadge({ 
  notificationService,
  userId 
}: { 
  notificationService: NotificationService;
  userId: string;
}) {
  const unreadCount = useUnreadCount(notificationService, userId);

  return (
    <div className="notification-badge">
      <span className="icon">🔔</span>
      {unreadCount > 0 && (
        <span className="count">{unreadCount}</span>
      )}
    </div>
  );
}
```

### Notification Preferences Component

```typescript
function NotificationPreferences({ 
  notificationService 
}: { 
  notificationService: NotificationService;
}) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    const userId = notificationService.getCurrentUserId();
    if (userId) {
      notificationService.getPreferences(userId).then(setPreferences);
    }
  }, [notificationService]);

  if (!preferences) {
    return <div>Loading...</div>;
  }

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: any) => {
    await notificationService.updatePreference(key, value);
    setPreferences({ ...preferences, [key]: value });
  };

  const handleMuteType = async (type: NotificationType) => {
    if (notificationService.isTypeMuted(type)) {
      await notificationService.unmuteType(type);
    } else {
      await notificationService.muteType(type);
    }
  };

  return (
    <div className="notification-preferences">
      <h3>Notification Preferences</h3>
      
      <div className="preference-group">
        <h4>Delivery Methods</h4>
        <label>
          <input
            type="checkbox"
            checked={preferences.emailEnabled || false}
            onChange={(e) => handlePreferenceChange('emailEnabled', e.target.checked)}
          />
          Email notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.pushEnabled || false}
            onChange={(e) => handlePreferenceChange('pushEnabled', e.target.checked)}
          />
          Push notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.inAppEnabled || false}
            onChange={(e) => handlePreferenceChange('inAppEnabled', e.target.checked)}
          />
          In-app notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.soundEnabled || false}
            onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
          />
          Notification sounds
        </label>
      </div>

      <div className="preference-group">
        <h4>Quiet Hours</h4>
        <label>
          Start:
          <input
            type="time"
            value={preferences.quietHoursStart || ''}
            onChange={(e) => handlePreferenceChange('quietHoursStart', e.target.value)}
          />
        </label>
        <label>
          End:
          <input
            type="time"
            value={preferences.quietHoursEnd || ''}
            onChange={(e) => handlePreferenceChange('quietHoursEnd', e.target.value)}
          />
        </label>
      </div>

      <div className="preference-group">
        <h4>Muted Notification Types</h4>
        {Object.values(NotificationType).map((type) => (
          <label key={type}>
            <input
              type="checkbox"
              checked={notificationService.isTypeMuted(type)}
              onChange={() => handleMuteType(type)}
            />
            {type}
          </label>
        ))}
      </div>
    </div>
  );
}
```

## Notification Types Reference

| Type | Description |
|------|-------------|
| `matter:created` | New matter created |
| `matter:updated` | Matter details updated |
| `matter:status:changed` | Matter status changed |
| `matter:balance:changed` | Matter balance changed |
| `matter:closed` | Matter closed |
| `matter:reopened` | Matter reopened |
| `transaction:created` | Transaction created |
| `transaction:updated` | Transaction updated |
| `transaction:assigned` | Transaction assigned to matter |
| `transaction:matched` | Transaction matched |
| `transaction:import:complete` | Transaction import completed |
| `transaction:import:failed` | Transaction import failed |
| `allocation:executed` | Interest allocation executed |
| `allocation:completed` | Allocation calculation completed |
| `allocation:failed` | Allocation failed |
| `allocation:carry:forward` | Carry forward amount created |
| `interest:accrued` | Interest accrued |
| `interest:rate:changed` | Interest rate changed |
| `interest:calculated` | Interest calculated |
| `report:generated` | Report generated |
| `report:available` | Report available |
| `user:mention` | User mentioned |
| `user:joined:firm` | User joined firm |
| `user:left:firm` | User left firm |
| `system:maintenance` | Scheduled maintenance |
| `system:update` | System update |
| `system:error` | System error |
| `system:backup` | System backup |
| `security:login` | User logged in |
| `security:logout` | User logged out |
| `security:password:changed` | Password changed |
| `security:settings:changed` | Security settings changed |
| `general` | General notification |

## Configuration Options

```typescript
interface NotificationServiceConfig {
  // Collection names
  collectionName?: string;              // Default: 'notifications'
  preferencesCollectionName?: string;   // Default: 'notificationPreferences'
  
  // Limits
  maxNotificationsPerUser?: number;      // Default: 1000
  
  // Defaults
  defaultPriority?: NotificationPriority;  // Default: NORMAL
  
  // Behavior
  realtimeEnabled?: boolean;           // Default: true
  autoCleanup?: boolean;              // Default: true
  cleanupInterval?: number;             // Default: 3600000 (1 hour)
  retentionPeriod?: number;            // Default: 7776000000 (90 days)
  
  // Integration
  eventEmitter?: RealtimeEventEmitter;
  
  // Debugging
  debug?: boolean;                     // Default: false
}
```

## Firestore Schema

### Notifications Collection

```
notifications/{notificationId}
{
  id: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  data: {
    title: string
    message: string
    entityType?: string
    entityId?: string
    actionUrl?: string
    metadata?: Record<string, unknown>
  }
  createdAt: number (timestamp)
  readAt?: number (timestamp)
  deliveredAt?: number (timestamp)
  expiresAt?: number (timestamp)
  senderId?: string
  senderName?: string
}
```

### Notification Preferences Collection

```
notificationPreferences/{userId}
{
  userId: string
  emailEnabled?: boolean
  pushEnabled?: boolean
  inAppEnabled?: boolean
  mutedTypes?: NotificationType[]
  quietHoursStart?: string (HH:MM)
  quietHoursEnd?: string (HH:MM)
  soundEnabled?: boolean
}
```

## Best Practices

1. **Initialize Early**: Initialize notification service early in your app lifecycle
2. **Batch Operations**: Use batch operations for multiple actions
3. **Clean Up**: Always call `destroy()` when component unmounts
4. **Use Filters**: Use filters to reduce unnecessary data transfer
5. **Set Limits**: Always use limits on queries for pagination
6. **Handle Preferences**: Respect user notification preferences
7. **Quiet Hours**: Check quiet hours before showing notifications
8. **Check Muted Types**: Don't create notifications for muted types
9. **Use Real-time Subscriptions**: Use subscriptions for live updates
10. **Monitor Statistics**: Use statistics to understand notification patterns

## License

MIT
