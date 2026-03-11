/**
 * Notification Service
 *
 * Manages user notifications including creation, reading, deletion,
 * real-time subscriptions, and notification preferences.
 * Uses Firebase Firestore for notification storage.
 *
 * @module services/realtime/notificationService
 */

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  collection,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type DocumentReference,
  type Query,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RealtimeEventEmitter, EventType } from './eventEmitter';

// ============================================
// Notification Type Enum
// ============================================

/**
 * Notification type enumeration
 */
export enum NotificationType {
  // Matter Notifications
  MATTER_CREATED = 'matter:created',
  MATTER_UPDATED = 'matter:updated',
  MATTER_STATUS_CHANGED = 'matter:status:changed',
  MATTER_BALANCE_CHANGED = 'matter:balance:changed',
  MATTER_CLOSED = 'matter:closed',
  MATTER_REOPENED = 'matter:reopened',

  // Transaction Notifications
  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_UPDATED = 'transaction:updated',
  TRANSACTION_ASSIGNED = 'transaction:assigned',
  TRANSACTION_MATCHED = 'transaction:matched',
  TRANSACTION_IMPORT_COMPLETE = 'transaction:import:complete',
  TRANSACTION_IMPORT_FAILED = 'transaction:import:failed',

  // Allocation Notifications
  ALLOCATION_EXECUTED = 'allocation:executed',
  ALLOCATION_COMPLETED = 'allocation:completed',
  ALLOCATION_FAILED = 'allocation:failed',
  ALLOCATION_CARRY_FORWARD = 'allocation:carry:forward',

  // Interest Notifications
  INTEREST_ACCRUED = 'interest:accrued',
  INTEREST_RATE_CHANGED = 'interest:rate:changed',
  INTEREST_CALCULATED = 'interest:calculated',

  // Report Notifications
  REPORT_GENERATED = 'report:generated',
  REPORT_AVAILABLE = 'report:available',

  // User Notifications
  USER_MENTION = 'user:mention',
  USER_JOINED_FIRM = 'user:joined:firm',
  USER_LEFT_FIRM = 'user:left:firm',

  // System Notifications
  SYSTEM_MAINTENANCE = 'system:maintenance',
  SYSTEM_UPDATE = 'system:update',
  SYSTEM_ERROR = 'system:error',
  SYSTEM_BACKUP = 'system:backup',

  // Security Notifications
  SECURITY_LOGIN = 'security:login',
  SECURITY_LOGOUT = 'security:logout',
  SECURITY_PASSWORD_CHANGED = 'security:password:changed',
  SECURITY_SETTINGS_CHANGED = 'security:settings:changed',

  // General Notifications
  GENERAL = 'general',
}

// ============================================
// Notification Priority Enum
// ============================================

/**
 * Notification priority level
 */
export enum NotificationPriority {
  /** Low priority - informational */
  LOW = 'low',
  /** Normal priority - default */
  NORMAL = 'normal',
  /** High priority - requires attention */
  HIGH = 'high',
  /** Urgent priority - immediate attention */
  URGENT = 'urgent',
}

// ============================================
// Notification Status Enum
// ============================================

/**
 * Notification status
 */
export enum NotificationStatus {
  /** Notification has not been read */
  UNREAD = 'unread',
  /** Notification has been read */
  READ = 'read',
  /** Notification has been archived */
  ARCHIVED = 'archived',
  /** Notification has been deleted */
  DELETED = 'deleted',
}

// ============================================
// Core Types
// ============================================

/**
 * Notification data structure
 */
export interface NotificationData {
  /** Notification title */
  title: string;
  /** Notification message/body */
  message: string;
  /** Related entity type (matter, transaction, etc.) */
  entityType?: string;
  /** Related entity ID */
  entityId?: string;
  /** Action URL or identifier */
  actionUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete notification information
 */
export interface Notification {
  /** Unique notification ID */
  id: string;
  /** User ID who should receive the notification */
  userId: string;
  /** Notification type */
  type: NotificationType;
  /** Notification priority */
  priority: NotificationPriority;
  /** Notification status */
  status: NotificationStatus;
  /** Notification data */
  data: NotificationData;
  /** Creation timestamp */
  createdAt: number;
  /** Read timestamp (if read) */
  readAt?: number;
  /** Delivery timestamp */
  deliveredAt?: number;
  /** Expiration timestamp (optional) */
  expiresAt?: number;
  /** Sender user ID (if applicable) */
  senderId?: string;
  /** Sender user name (if applicable) */
  senderName?: string;
  /** Document reference */
  ref?: DocumentReference;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  /** User ID */
  userId: string;
  /** Enable email notifications */
  emailEnabled?: boolean;
  /** Enable push notifications */
  pushEnabled?: boolean;
  /** Enable in-app notifications */
  inAppEnabled?: boolean;
  /** Muted notification types */
  mutedTypes?: NotificationType[];
  /** Quiet hours start (HH:MM format) */
  quietHoursStart?: string;
  /** Quiet hours end (HH:MM format) */
  quietHoursEnd?: string;
  /** Sound enabled */
  soundEnabled?: boolean;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  /** Total notifications */
  total: number;
  /** Unread notifications */
  unread: number;
  /** Read notifications */
  read: number;
  /** Archived notifications */
  archived: number;
  /** Notifications by type */
  byType: Record<NotificationType, number>;
  /** Notifications by priority */
  byPriority: Record<NotificationPriority, number>;
  /** Notifications in last 24 hours */
  last24Hours: number;
  /** Notifications in last 7 days */
  last7Days: number;
  /** Notifications in last 30 days */
  last30Days: number;
  /** Average notifications per day */
  averagePerDay: number;
}

/**
 * Notification filter options
 */
export interface NotificationFilter {
  /** Filter by status */
  status?: NotificationStatus | NotificationStatus[];
  /** Filter by type */
  type?: NotificationType | NotificationType[];
  /** Filter by priority */
  priority?: NotificationPriority | NotificationPriority[];
  /** Filter by date range */
  dateRange?: {
    start: number;
    end: number;
  };
  /** Search in title or message */
  search?: string;
  /** Filter by entity type */
  entityType?: string;
  /** Filter by entity ID */
  entityId?: string;
  /** Maximum number of results */
  limit?: number;
  /** Start after notification (for pagination) */
  startAfter?: string;
}

/**
 * Notification service configuration
 */
export interface NotificationServiceConfig {
  /** Collection name for notifications (default: 'notifications') */
  collectionName?: string;
  /** Collection name for preferences (default: 'notificationPreferences') */
  preferencesCollectionName?: string;
  /** Maximum notifications to keep per user (default: 1000) */
  maxNotificationsPerUser?: number;
  /** Default notification priority (default: NORMAL) */
  defaultPriority?: NotificationPriority;
  /** Enable real-time updates (default: true) */
  realtimeEnabled?: boolean;
  /** Enable automatic cleanup of old notifications (default: true) */
  autoCleanup?: boolean;
  /** Cleanup interval in milliseconds (default: 3600000 = 1 hour) */
  cleanupInterval?: number;
  /** Notification retention in milliseconds (default: 7776000000 = 90 days) */
  retentionPeriod?: number;
  /** Custom event emitter for notification events */
  eventEmitter?: RealtimeEventEmitter;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Notification subscription callback
 */
export type NotificationCallback = (notifications: Notification[]) => void;

/**
 * Unread count callback
 */
export type UnreadCountCallback = (count: number) => void;

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: Required<Omit<NotificationServiceConfig, 'eventEmitter'>> = {
  collectionName: 'notifications',
  preferencesCollectionName: 'notificationPreferences',
  maxNotificationsPerUser: 1000,
  defaultPriority: NotificationPriority.NORMAL,
  realtimeEnabled: true,
  autoCleanup: true,
  cleanupInterval: 3600000, // 1 hour
  retentionPeriod: 7776000000, // 90 days
  debug: false,
};

const NOTIFICATIONS_COLLECTION = 'notifications';
const PREFERENCES_COLLECTION = 'notificationPreferences';

// ============================================
// Notification Service Class
// ============================================

/**
 * Notification Service
 *
 * Manages user notifications with Firebase Firestore storage.
 * Provides real-time updates, filtering, batching,
 * and preference management.
 */
export class NotificationService {
  private config: Required<NotificationServiceConfig>;
  private currentUserId: string | null = null;
  private subscriptions: Map<string, () => void>;
  private cleanupTimer: number | null = null;
  private preferences: NotificationPreferences | null = null;

  constructor(config: NotificationServiceConfig = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize storage
    this.subscriptions = new Map();

    this.debug('NotificationService initialized');
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize notification service
   *
   * @param userId - Current user ID
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;

    // Load user preferences
    await this.loadPreferences();

    // Start cleanup timer
    if (this.config.autoCleanup) {
      this.startCleanupTimer();
    }

    this.debug('NotificationService initialized', { userId });

    // Emit initialization event
    this.emitNotificationEvent('initialized', { userId });
  }

  // ============================================
  // Notification Management
  // ============================================

  /**
   * Create a notification
   *
   * @param userId - User ID to send notification to
   * @param type - Notification type
   * @param data - Notification data
   * @param options - Optional options
   * @returns Notification ID
   */
  async create(
    userId: string,
    type: NotificationType,
    data: NotificationData,
    options?: {
      priority?: NotificationPriority;
      senderId?: string;
      senderName?: string;
      expiresAt?: number;
    }
  ): Promise<string> {
    const now = Date.now();

    const notification: Omit<Notification, 'ref'> = {
      id: this.generateId('notif-'),
      userId,
      type,
      priority: options?.priority || this.config.defaultPriority,
      status: NotificationStatus.UNREAD,
      data,
      createdAt: now,
      deliveredAt: now,
      readAt: undefined,
      expiresAt: options?.expiresAt,
      senderId: options?.senderId,
      senderName: options?.senderName,
    };

    // Create notification document
    const notifRef = doc(db, this.config.collectionName, notification.id);
    await setDoc(notifRef, notification);

    this.debug('Notification created', { id: notification.id, type });

    // Emit notification event
    this.emitNotificationEvent('created', notification);

    return notification.id;
  }

  /**
   * Mark notification as read
   *
   * @param notificationId - Notification ID to mark as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notifRef = doc(db, this.config.collectionName, notificationId);

    await updateDoc(notifRef, {
      status: NotificationStatus.READ,
      readAt: Date.now(),
    });

    this.debug('Notification marked as read', { id: notificationId });

    // Emit notification event
    this.emitNotificationEvent('read', { notificationId });
  }

  /**
   * Mark all notifications as read for user
   *
   * @param userId - User ID (defaults to current user)
   */
  async markAllAsRead(userId?: string): Promise<number> {
    const targetUserId = userId || this.currentUserId;
    if (!targetUserId) {
      throw new Error('User ID not provided');
    }

    // Query unread notifications
    const q = query(
      collection(db, this.config.collectionName),
      where('userId', '==', targetUserId),
      where('status', '==', NotificationStatus.UNREAD)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: NotificationStatus.READ,
        readAt: Date.now(),
      });
    });

    await batch.commit();

    this.debug('Marked all notifications as read', {
      count: snapshot.size,
      userId: targetUserId,
    });

    // Emit notification event
    this.emitNotificationEvent('readAll', { userId: targetUserId, count: snapshot.size });

    return snapshot.size;
  }

  /**
   * Delete a notification
   *
   * @param notificationId - Notification ID to delete
   */
  async delete(notificationId: string): Promise<void> {
    const notifRef = doc(db, this.config.collectionName, notificationId);

    await deleteDoc(notifRef);

    this.debug('Notification deleted', { id: notificationId });

    // Emit notification event
    this.emitNotificationEvent('deleted', { notificationId });
  }

  /**
   * Archive a notification
   *
   * @param notificationId - Notification ID to archive
   */
  async archive(notificationId: string): Promise<void> {
    const notifRef = doc(db, this.config.collectionName, notificationId);

    await updateDoc(notifRef, {
      status: NotificationStatus.ARCHIVED,
    });

    this.debug('Notification archived', { id: notificationId });

    // Emit notification event
    this.emitNotificationEvent('archived', { notificationId });
  }

  // ============================================
  // Notification Queries
  // ============================================

  /**
   * Get notifications for a user
   *
   * @param userId - User ID
   * @param filter - Optional filter
   * @returns Array of notifications
   */
  async getNotifications(
    userId: string,
    filter?: NotificationFilter
  ): Promise<Notification[]> {
    const queryConstraints = this.buildQuery(userId, filter);
    const q = query(...queryConstraints);

    const snapshot = await getDocs(q);
    const notifications = this.snapshotToNotifications(snapshot);

    this.debug('Notifications retrieved', {
      count: notifications.length,
      userId,
    });

    return notifications;
  }

  /**
   * Get unread notification count for a user
   *
   * @param userId - User ID
   * @param type - Optional notification type filter
   * @returns Unread count
   */
  async getUnreadCount(userId: string, type?: NotificationType): Promise<number> {
    let q = query(
      collection(db, this.config.collectionName),
      where('userId', '==', userId),
      where('status', '==', NotificationStatus.UNREAD)
    );

    if (type) {
      q = query(q, where('type', '==', type));
    }

    const snapshot = await getDocs(q);
    const count = snapshot.size;

    this.debug('Unread count retrieved', { count, userId, type });

    return count;
  }

  /**
   * Get notifications by type
   *
   * @param userId - User ID
   * @param type - Notification type(s)
   * @param options - Optional options
   * @returns Array of notifications
   */
  async getByType(
    userId: string,
    type: NotificationType | NotificationType[],
    options?: {
      limit?: number;
      includeRead?: boolean;
    }
  ): Promise<Notification[]> {
    const types = Array.isArray(type) ? type : [type];
    const q = query(
      collection(db, this.config.collectionName),
      where('userId', '==', userId),
      where('type', 'in', types),
      orderBy('createdAt', 'desc'),
      orderBy(options?.includeRead ? 'status' : undefined, 'asc')
    );

    const snapshot = await getDocs(q);
    let notifications = this.snapshotToNotifications(snapshot);

    // Apply limit
    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    this.debug('Notifications by type retrieved', {
      count: notifications.length,
      type,
    });

    return notifications;
  }

  /**
   * Get notifications by priority
   *
   * @param userId - User ID
   * @param priority - Priority level
   * @returns Array of notifications
   */
  async getByPriority(
    userId: string,
    priority: NotificationPriority
  ): Promise<Notification[]> {
    const q = query(
      collection(db, this.config.collectionName),
      where('userId', '==', userId),
      where('priority', '==', priority),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const notifications = this.snapshotToNotifications(snapshot);

    this.debug('Notifications by priority retrieved', {
      count: notifications.length,
      priority,
    });

    return notifications;
  }

  /**
   * Get notification statistics
   *
   * @param userId - User ID
   * @returns Notification statistics
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const allNotifications = await this.getNotifications(userId);
    const now = Date.now();
    const dayMs = 86400000; // 24 hours in milliseconds

    const stats: NotificationStats = {
      total: allNotifications.length,
      unread: 0,
      read: 0,
      archived: 0,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      averagePerDay: 0,
    };

    // Initialize counts
    Object.values(NotificationType).forEach((type) => {
      stats.byType[type] = 0;
    });
    Object.values(NotificationPriority).forEach((priority) => {
      stats.byPriority[priority] = 0;
    });

    // Calculate statistics
    for (const notification of allNotifications) {
      // Count by status
      switch (notification.status) {
        case NotificationStatus.UNREAD:
          stats.unread++;
          break;
        case NotificationStatus.READ:
          stats.read++;
          break;
        case NotificationStatus.ARCHIVED:
          stats.archived++;
          break;
      }

      // Count by type
      stats.byType[notification.type]++;

      // Count by priority
      stats.byPriority[notification.priority]++;

      // Count by time period
      const age = now - notification.createdAt;
      if (age <= dayMs) {
        stats.last24Hours++;
      } else if (age <= dayMs * 7) {
        stats.last7Days++;
      } else if (age <= dayMs * 30) {
        stats.last30Days++;
      }
    }

    // Calculate average per day (last 30 days)
    stats.averagePerDay = stats.last30Days / 30;

    this.debug('Notification stats calculated', stats);

    return stats;
  }

  // ============================================
  // Notification Batching
  // ============================================

  /**
   * Create multiple notifications in batch
   *
   * @param userIdsAndData - Array of user IDs and notification data
   * @returns Array of notification IDs
   */
  async batchCreate(
    userIdsAndData: Array<{
      userId: string;
      type: NotificationType;
      data: NotificationData;
      priority?: NotificationPriority;
      senderId?: string;
      senderName?: string;
    }>
  ): Promise<string[]> {
    const now = Date.now();
    const batch = writeBatch(db);
    const notificationIds: string[] = [];

    for (const item of userIdsAndData) {
      const notificationId = this.generateId('notif-');
      const notification: Omit<Notification, 'ref'> = {
        id: notificationId,
        userId: item.userId,
        type: item.type,
        priority: item.priority || this.config.defaultPriority,
        status: NotificationStatus.UNREAD,
        data: item.data,
        createdAt: now,
        deliveredAt: now,
        readAt: undefined,
        senderId: item.senderId,
        senderName: item.senderName,
      };

      const notifRef = doc(db, this.config.collectionName, notificationId);
      batch.set(notifRef, notification);
      notificationIds.push(notificationId);
    }

    await batch.commit();

    this.debug('Batch notifications created', {
      count: notificationIds.length,
    });

    // Emit notification event
    this.emitNotificationEvent('batchCreated', { notificationIds });

    return notificationIds;
  }

  /**
   * Delete multiple notifications in batch
   *
   * @param notificationIds - Array of notification IDs to delete
   */
  async batchDelete(notificationIds: string[]): Promise<number> {
    const batch = writeBatch(db);

    for (const notificationId of notificationIds) {
      const notifRef = doc(db, this.config.collectionName, notificationId);
      batch.delete(notifRef);
    }

    await batch.commit();

    this.debug('Batch notifications deleted', {
      count: notificationIds.length,
    });

    // Emit notification event
    this.emitNotificationEvent('batchDeleted', { count: notificationIds.length });

    return notificationIds.length;
  }

  /**
   * Mark multiple notifications as read in batch
   *
   * @param notificationIds - Array of notification IDs
   */
  async batchMarkAsRead(notificationIds: string[]): Promise<number> {
    const batch = writeBatch(db);

    for (const notificationId of notificationIds) {
      const notifRef = doc(db, this.config.collectionName, notificationId);
      batch.update(notifRef, {
        status: NotificationStatus.READ,
        readAt: Date.now(),
      });
    }

    await batch.commit();

    this.debug('Batch notifications marked as read', {
      count: notificationIds.length,
    });

    // Emit notification event
    this.emitNotificationEvent('batchRead', { count: notificationIds.length });

    return notificationIds.length;
  }

  // ============================================
  // Real-time Subscriptions
  // ============================================

  /**
   * Subscribe to user notifications
   *
   * @param userId - User ID to subscribe to
   * @param callback - Callback function
   * @param filter - Optional filter
   * @returns Unsubscribe function
   */
  subscribeToNotifications(
    userId: string,
    callback: NotificationCallback,
    filter?: NotificationFilter
  ): () => void {
    const subscriptionId = `notifs-${userId}`;

    const queryConstraints = this.buildQuery(userId, filter);
    const q = query(...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications = this.snapshotToNotifications(snapshot);
        callback(notifications);
      },
      (error) => {
        this.debug('Error in notifications subscription', { userId, error });
        this.emitNotificationEvent('subscriptionError', { userId, error });
      }
    );

    this.subscriptions.set(subscriptionId, unsubscribe);

    this.debug('Subscribed to notifications', { userId });

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.debug('Unsubscribed from notifications', { userId });
    };
  }

  /**
   * Subscribe to unread count updates
   *
   * @param userId - User ID to subscribe to
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribeToUnreadCount(
    userId: string,
    callback: UnreadCountCallback
  ): () => void {
    const subscriptionId = `unread-${userId}`;

    const q = query(
      collection(db, this.config.collectionName),
      where('userId', '==', userId),
      where('status', '==', NotificationStatus.UNREAD)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.size);
      },
      (error) => {
        this.debug('Error in unread count subscription', { userId, error });
      }
    );

    this.subscriptions.set(subscriptionId, unsubscribe);

    this.debug('Subscribed to unread count', { userId });

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.debug('Unsubscribed from unread count', { userId });
    };
  }

  /**
   * Subscribe to notifications by type
   *
   * @param userId - User ID to subscribe to
   * @param type - Notification type(s)
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribeToType(
    userId: string,
    type: NotificationType | NotificationType[],
    callback: NotificationCallback
  ): () => void {
    const subscriptionId = `type-${userId}-${Array.isArray(type) ? type.join(',') : type}`;

    const types = Array.isArray(type) ? type : [type];
    const q = query(
      collection(db, this.config.collectionName),
      where('userId', '==', userId),
      where('type', 'in', types),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications = this.snapshotToNotifications(snapshot);
        callback(notifications);
      },
      (error) => {
        this.debug('Error in type subscription', { userId, type, error });
      }
    );

    this.subscriptions.set(subscriptionId, unsubscribe);

    this.debug('Subscribed to notification type', { userId, type });

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.debug('Unsubscribed from notification type', { userId, type });
    };
  }

  // ============================================
  // Notification Preferences
  // ============================================

  /**
   * Get user notification preferences
   *
   * @param userId - User ID
   * @returns User preferences or null
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    const prefRef = doc(db, this.config.preferencesCollectionName, userId);
    const snapshot = await getDoc(prefRef);

    if (!snapshot.exists()) {
      return null;
    }

    const preferences = snapshot.data() as NotificationPreferences;
    this.preferences = preferences;

    this.debug('Preferences retrieved', { userId });

    return preferences;
  }

  /**
   * Save user notification preferences
   *
   * @param preferences - User preferences to save
   */
  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User ID not set');
    }

    const prefRef = doc(
      db,
      this.config.preferencesCollectionName,
      this.currentUserId
    );

    const updatedPreferences: NotificationPreferences = {
      userId: this.currentUserId,
      ...this.preferences,
      ...preferences,
    };

    await setDoc(prefRef, updatedPreferences, { merge: true });
    this.preferences = updatedPreferences;

    this.debug('Preferences saved', updatedPreferences);

    // Emit preferences event
    this.emitNotificationEvent('preferencesUpdated', updatedPreferences);
  }

  /**
   * Update a single preference
   *
   * @param key - Preference key
   * @param value - Preference value
   */
  async updatePreference<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ): Promise<void> {
    await this.savePreferences({ [key]: value });
  }

  /**
   * Mute a notification type
   *
   * @param type - Notification type to mute
   */
  async muteType(type: NotificationType): Promise<void> {
    const mutedTypes = this.preferences?.mutedTypes || [];
    if (!mutedTypes.includes(type)) {
      await this.savePreferences({ mutedTypes: [...mutedTypes, type] });
    }
  }

  /**
   * Unmute a notification type
   *
   * @param type - Notification type to unmute
   */
  async unmuteType(type: NotificationType): Promise<void> {
    const mutedTypes = this.preferences?.mutedTypes || [];
    await this.savePreferences({
      mutedTypes: mutedTypes.filter((t) => t !== type),
    });
  }

  /**
   * Check if a notification type is muted
   *
   * @param type - Notification type to check
   * @returns Whether the type is muted
   */
  isTypeMuted(type: NotificationType): boolean {
    return this.preferences?.mutedTypes?.includes(type) || false;
  }

  /**
   * Check if currently in quiet hours
   *
   * @returns Whether in quiet hours
   */
  isInQuietHours(): boolean {
    if (!this.preferences?.quietHoursStart || !this.preferences?.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHours, startMinutes] = this.preferences.quietHoursStart.split(':').map(Number);
    const [endHours, endMinutes] = this.preferences.quietHoursEnd.split(':').map(Number);

    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  // ============================================
  // Notification Cleanup
  // ============================================

  /**
   * Clean up old notifications
   *
   * @param olderThan - Remove notifications older than this time (ms)
   * @returns Number of notifications cleaned up
   */
  async cleanupOldNotifications(olderThan?: number): Promise<number> {
    const cutoffTime = Date.now() - (olderThan || this.config.retentionPeriod);

    // Query old notifications
    const q = query(
      collection(db, this.config.collectionName),
      where('createdAt', '<', cutoffTime)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let cleanupCount = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      cleanupCount++;
    }

    // Firestore batches limited to 500 operations
    if (cleanupCount > 500) {
      const batches = Math.ceil(cleanupCount / 500);
      for (let i = 0; i < batches; i++) {
        const batch = writeBatch(db);
        const start = i * 500;
        const end = Math.min(start + 500, snapshot.docs.length);

        for (let j = start; j < end; j++) {
          batch.delete(snapshot.docs[j].ref);
        }

        await batch.commit();
      }
    } else {
      await batch.commit();
    }

    this.debug('Cleaned up old notifications', { count: cleanupCount });

    // Emit cleanup event
    this.emitNotificationEvent('cleanup', { count: cleanupCount });

    return cleanupCount;
  }

  /**
   * Clear all notifications for a user
   *
   * @param userId - User ID
   * @returns Number of notifications cleared
   */
  async clearAll(userId?: string): Promise<number> {
    const targetUserId = userId || this.currentUserId;
    if (!targetUserId) {
      throw new Error('User ID not provided');
    }

    const q = query(
      collection(db, this.config.collectionName),
      where('userId', '==', targetUserId)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    this.debug('Cleared all notifications', { count: snapshot.size, userId: targetUserId });

    // Emit clear event
    this.emitNotificationEvent('cleared', { userId: targetUserId, count: snapshot.size });

    return snapshot.size;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build Firestore query from filter
   */
  private buildQuery(
    userId: string,
    filter?: NotificationFilter
  ): Parameters<typeof query> {
    const constraints: Parameters<typeof query> = [
      collection(db, this.config.collectionName),
      where('userId', '==', userId),
    ];

    // Filter by status
    if (filter?.status) {
      if (Array.isArray(filter.status)) {
        constraints.push(where('status', 'in', filter.status));
      } else {
        constraints.push(where('status', '==', filter.status));
      }
    }

    // Filter by type
    if (filter?.type) {
      if (Array.isArray(filter.type)) {
        constraints.push(where('type', 'in', filter.type));
      } else {
        constraints.push(where('type', '==', filter.type));
      }
    }

    // Filter by priority
    if (filter?.priority) {
      if (Array.isArray(filter.priority)) {
        constraints.push(where('priority', 'in', filter.priority));
      } else {
        constraints.push(where('priority', '==', filter.priority));
      }
    }

    // Filter by date range
    if (filter?.dateRange) {
      constraints.push(where('createdAt', '>=', filter.dateRange.start));
      constraints.push(where('createdAt', '<=', filter.dateRange.end));
    }

    // Filter by entity
    if (filter?.entityType) {
      constraints.push(where('data.entityType', '==', filter.entityType));
    }
    if (filter?.entityId) {
      constraints.push(where('data.entityId', '==', filter.entityId));
    }

    // Order by creation time (descending)
    constraints.push(orderBy('createdAt', 'desc'));

    return constraints;
  }

  /**
   * Convert snapshot to notifications
   */
  private snapshotToNotifications(
    snapshot: Awaited<ReturnType<typeof getDocs>>
  ): Notification[] {
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      ref: doc.ref,
    })) as Notification[];
  }

  /**
   * Load user preferences
   */
  private async loadPreferences(): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    const preferences = await this.getPreferences(this.currentUserId);
    if (preferences) {
      this.preferences = preferences;
    } else {
      // Create default preferences
      this.preferences = {
        userId: this.currentUserId,
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        mutedTypes: [],
        soundEnabled: true,
      };
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupOldNotifications().catch((error) => {
        this.debug('Error in cleanup timer', { error });
      });
    }, this.config.cleanupInterval);

    this.debug('Cleanup timer started', { interval: this.config.cleanupInterval });
  }

  /**
   * Emit notification event
   */
  private emitNotificationEvent(eventType: string, data: any): void {
    if (this.config.eventEmitter) {
      this.config.eventEmitter.emit(`notification:${eventType}`, data, {
        source: 'local',
        metadata: { userId: this.currentUserId },
      });
    }
  }

  /**
   * Debug logging
   */
  private debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[NotificationService] ${message}`, data || '');
    }
  }

  /**
   * Cleanup and destroy
   */
  async destroy(): Promise<void> {
    // Stop cleanup timer
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Unsubscribe from all subscriptions
    for (const [id, unsubscribe] of this.subscriptions.entries()) {
      try {
        unsubscribe();
      } catch (error) {
        this.debug('Error unsubscribing', { id, error });
      }
    }
    this.subscriptions.clear();

    this.preferences = null;
    this.currentUserId = null;

    this.debug('NotificationService destroyed');
  }
}

// ============================================
// Factory Functions
// ============================================

let defaultNotificationService: NotificationService | null = null;

/**
 * Create a new notification service instance
 */
export function createNotificationService(config?: NotificationServiceConfig): NotificationService {
  return new NotificationService(config);
}

/**
 * Get default notification service instance
 */
export function getDefaultNotificationService(): NotificationService | null {
  return defaultNotificationService;
}

/**
 * Set default notification service instance
 */
export function setDefaultNotificationService(service: NotificationService): void {
  defaultNotificationService = service;
}

/**
 * Reset default notification service instance
 */
export function resetDefaultNotificationService(): void {
  if (defaultNotificationService) {
    defaultNotificationService.destroy();
    defaultNotificationService = null;
  }
}
