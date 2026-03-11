/**
 * Real-time Notifications Hook
 *
 * Subscribes to user notifications with unread count.
 * Uses TanStack Query for caching and data management.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy, where, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationService, NotificationType, NotificationStatus, NotificationPriority, Notification } from '@/services/realtime';

// ============================================
// Types
// ============================================

/**
 * Notifications hook parameters
 */
export interface UseNotificationsParams {
  /** Current user ID */
  userId: string;
  /** Filter by status */
  status?: NotificationStatus;
  /** Filter by type */
  type?: NotificationType | NotificationType[];
  /** Filter by priority */
  priority?: NotificationPriority | NotificationPriority[];
  /** Search query for title/message */
  searchQuery?: string;
  /** Filter by entity type */
  entityType?: string;
  /** Filter by entity ID */
  entityId?: string;
  /** Maximum number of results */
  limit?: number;
  /** Whether to auto-mark as read (default: false) */
  autoMarkRead?: boolean;
  /** Auto-refresh interval in ms (default: 30000) */
  refreshInterval?: number;
}

/**
 * Notifications hook return value
 */
export interface UseNotificationsResult {
  /** Notifications data */
  notifications: Notification[];
  /** Unread count */
  unreadCount: number;
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Invalidate function */
  invalidate: () => void;
  /** Mark as read function */
  markAsRead: (notificationId: string) => Promise<void>;
  /** Mark all as read function */
  markAllAsRead: () => Promise<void>;
  /** Delete notification function */
  deleteNotification: (notificationId: string) => Promise<void>;
  /** Archive notification function */
  archiveNotification: (notificationId: string) => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Notifications Hook
 *
 * Subscribes to user notifications with real-time updates.
 * Provides unread count and notification management functions.
 */
export function useNotifications(params: UseNotificationsParams): UseNotificationsResult {
  const {
    userId,
    status,
    type,
    priority,
    searchQuery,
    entityType,
    entityId,
    limit,
    autoMarkRead = false,
    refreshInterval = 30000,
  } = params;

  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // TanStack Query for notifications
  const {
    data: initialNotifications,
    isLoading: initialLoading,
    error: initialError,
    refetch: queryRefetch,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', userId, status, type, priority, searchQuery, entityType, entityId, limit],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      let q: Query = collection(db, 'notifications');

      // Add status filter
      if (status) {
        q = query(q, where('status', '==', status));
      } else {
        // Default: unread first, then read
        q = query(q, where('status', 'in', [NotificationStatus.UNREAD, NotificationStatus.READ]));
      }

      // Add type filter
      if (type) {
        if (Array.isArray(type)) {
          q = query(q, where('type', 'in', type));
        } else {
          q = query(q, where('type', '==', type));
        }
      }

      // Add priority filter
      if (priority) {
        if (Array.isArray(priority)) {
          q = query(q, where('priority', 'in', priority));
        } else {
          q = query(q, where('priority', '==', priority));
        }
      }

      // Add entity filter
      if (entityType) {
        q = query(q, where('data.entityType', '==', entityType));
      }
      if (entityId) {
        q = query(q, where('data.entityId', '==', entityId));
      }

      // Add search filter
      if (searchQuery) {
        q = query(q, where('data.title', '>=', searchQuery));
        q = query(q, where('data.title', '<=', searchQuery + '\uf8ff'));
      }

      // Sort by createdAt (newest first)
      q = query(q, orderBy('createdAt', 'desc'));

      // Add limit
      if (limit) {
        q = query(q, limit);
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        type: doc.data().type,
        priority: doc.data().priority,
        status: doc.data().status,
        data: doc.data().data,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        readAt: doc.data().readAt?.toMillis() || undefined,
        deliveredAt: doc.data().deliveredAt?.toMillis() || undefined,
        expiresAt: doc.data().expiresAt?.toMillis() || undefined,
        senderId: doc.data().senderId,
        senderName: doc.data().senderName,
        ref: doc.ref,
      }));
    },
    staleTime: 30000, // 30 seconds
  });

  // TanStack Query for unread count
  const {
    data: unreadCountData,
    isLoading: unreadCountLoading,
    refetch: refetchUnreadCount,
  } = useQuery<number>({
    queryKey: ['notifications-unread', userId],
    queryFn: async () => {
      if (!userId) {
        return 0;
      }

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('status', '==', NotificationStatus.UNREAD)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    },
    staleTime: 15000, // 15 seconds
  });

  // Get notification service
  const notificationService = useMemo(() => {
    return window.__notificationService as NotificationService | null;
  }, []);

  // Real-time subscription to Firestore
  useEffect(() => {
    if (!userId) {
      return;
    }

    setLoading(initialLoading);

    let q: Query = collection(db, 'notifications');

    // Add status filter
    if (status) {
      q = query(q, where('status', '==', status));
    } else {
      q = query(q, where('userId', '==', userId));
    }

    // Add type filter
    if (type) {
      if (Array.isArray(type)) {
        q = query(q, where('type', 'in', type));
      } else {
        q = query(q, where('type', '==', type));
      }
    }

    // Add priority filter
    if (priority) {
      if (Array.isArray(priority)) {
        q = query(q, where('priority', 'in', priority));
      } else {
        q = query(q, where('priority', '==', priority));
      }
    }

    // Add entity filter
    if (entityType) {
      q = query(q, where('data.entityType', '==', entityType));
    }
    if (entityId) {
      q = query(q, where('data.entityId', '==', entityId));
    }

    // Add search filter
    if (searchQuery) {
      q = query(q, where('data.title', '>=', searchQuery));
      q = query(q, where('data.title', '<=', searchQuery + '\uf8ff'));
    }

    // Sort by createdAt (newest first)
    q = query(q, orderBy('createdAt', 'desc'));

    // Add limit
    if (limit) {
      q = query(q, limit);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realtimeNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        type: doc.data().type,
        priority: doc.data().priority,
        status: doc.data().status,
        data: doc.data().data,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        readAt: doc.data().readAt?.toMillis() || undefined,
        deliveredAt: doc.data().deliveredAt?.toMillis() || undefined,
        expiresAt: doc.data().expiresAt?.toMillis() || undefined,
        senderId: doc.data().senderId,
        senderName: doc.data().senderName,
        ref: doc.ref,
      }));

      setNotifications(realtimeNotifications);
      setLoading(false);
      setError(null);

      // Auto-mark as read if enabled
      if (autoMarkRead) {
        realtimeNotifications.forEach(notif => {
          if (notif.status === NotificationStatus.UNREAD) {
            notificationService?.markAsRead(notif.id).catch(err => {
              console.error('Failed to mark as read:', err);
            });
          }
        });
      }
    }, (err) => {
      console.error('Error in notifications subscription:', err);
      setLoading(false);
      setError(err as Error);
    });

    return unsubscribe;
  }, [userId, status, type, priority, searchQuery, entityType, entityId, limit, autoMarkRead, notificationService]);

  // Set unread count from query
  useEffect(() => {
    if (!unreadCountLoading) {
      setUnreadCount(unreadCountData || 0);
    }
  }, [unreadCountData, unreadCountLoading]);

  // Combine initial data with real-time data
  useEffect(() => {
    if (initialNotifications && !initialLoading) {
      setNotifications(initialNotifications);
    }
  }, [initialNotifications, initialLoading]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && userId) {
      const interval = setInterval(() => {
        refetchUnreadCount();
        queryRefetch();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, userId, refetchUnreadCount, queryRefetch]);

  // Mark as read function
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!notificationService) {
      return;
    }

    await notificationService.markAsRead(notificationId);

    // Update local state
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, status: NotificationStatus.READ, readAt: Date.now() } : n
    ));

    // Update unread count
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && notification.status === NotificationStatus.UNREAD) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications, notificationService]);

  // Mark all as read function
  const markAllAsRead = useCallback(async () => {
    if (!notificationService) {
      return;
    }

    const unreadNotifications = notifications.filter(n => n.status === NotificationStatus.UNREAD);
    const unreadIds = unreadNotifications.map(n => n.id);

    if (unreadIds.length === 0) {
      return;
    }

    await notificationService.batchMarkAsRead(unreadIds);

    // Update local state
    setNotifications(prev => prev.map(n => 
      unreadIds.includes(n.id) ? { ...n, status: NotificationStatus.READ, readAt: Date.now() } : n
    ));

    // Update unread count
    setUnreadCount(0);
  }, [notifications, notificationService]);

  // Delete notification function
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!notificationService) {
      return;
    }

    await notificationService.delete(notificationId);

    // Update local state
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    const notification = notifications.find(n => n.id === notificationId);
    if (notification && notification.status === NotificationStatus.UNREAD) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications, notificationService]);

  // Archive notification function
  const archiveNotification = useCallback(async (notificationId: string) => {
    if (!notificationService) {
      return;
    }

    await notificationService.archive(notificationId);

    // Update local state
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, status: NotificationStatus.ARCHIVED } : n
    ));

    const notification = notifications.find(n => n.id === notificationId);
    if (notification && notification.status === NotificationStatus.UNREAD) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications, notificationService]);

  // Refetch function
  const refetch = useCallback(async () => {
    await queryRefetch();
    await refetchUnreadCount();
  }, [queryRefetch, refetchUnreadCount]);

  // Invalidate function
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread', userId] });
  }, [queryClient, userId]);

  return {
    notifications,
    unreadCount,
    loading: loading || initialLoading,
    error: error || initialError,
    refetch,
    invalidate,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
  };
}
