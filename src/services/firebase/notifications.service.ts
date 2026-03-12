/**
 * Notifications Service
 *
 * CRUD operations for notifications in Firestore.
 * Includes real-time listeners and read status management.
 *
 * Features:
 * - Notification creation
 * - Real-time updates with listeners
 * - Read status management
 * - Data validation
 * - Error handling
 * - Loading states
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseDB } from '../..';

// ============================================
// Types
// ============================================

export type NotificationType =
  | 'info'
  | 'warning'
  | 'success'
  | 'error';

export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  userId?: string;
  matterId?: string;
  createdAt: Date;
  readAt?: Date;
  data?: Record<string, any>;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  userId?: string;
  matterId?: string;
  data?: Record<string, any>;
}

export interface UpdateNotificationInput {
  status?: NotificationStatus;
  readAt?: Date;
}

export interface CreateNotificationResult {
  success: boolean;
  notification?: Notification;
  error?: string;
}

export interface UpdateNotificationResult {
  success: boolean;
  notification?: Notification;
  error?: string;
}

export interface DeleteNotificationResult {
  success: boolean;
  error?: string;
}

export interface MarkAllReadResult {
  success: boolean;
  error?: string;
}

// ============================================
// Constants
// ============================================

const NOTIFICATIONS_COLLECTION = 'notifications';

// ============================================
// Helper Functions
// ============================================

/**
 * Convert Firestore document to Notification type
 */
const documentToNotification = (doc: { id: string; data: DocumentData }): Notification => {
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title || '',
    message: data.message || '',
    type: (data.type as NotificationType) || 'info',
    status: (data.status as NotificationStatus) || 'unread',
    userId: data.userId,
    matterId: data.matterId,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    readAt: data.readAt ? new Date(data.readAt) : undefined,
    data: data.data,
  };
};

/**
 * Validate notification data
 */
const validateNotificationData = (data: Partial<Notification>): string[] => {
  const errors: string[] = [];

  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!data.message || data.message.trim() === '') {
    errors.push('Message is required');
  }

  if (!data.type || !['info', 'warning', 'success', 'error'].includes(data.type)) {
    errors.push('Invalid notification type');
  }

  return errors;
};

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new notification
 */
export const createNotification = async (
  data: CreateNotificationInput,
  firmId?: string
): Promise<CreateNotificationResult> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, NOTIFICATIONS_COLLECTION);

    // Validate data
    const validationErrors = validateNotificationData(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', '),
      };
    }

    // Create document
    const notificationData: DocumentData = {
      ...data,
      type: data.type || 'info',
      status: 'unread',
      createdAt: new Date(),
    };

    // Add firm ID if provided
    if (firmId) {
      notificationData.firmId = firmId;
    }

    const docRef = await addDoc(collectionRef, notificationData);

    // Get the created document
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Failed to create notification',
      };
    }

    const notification = documentToNotification(docSnap);

    return {
      success: true,
      notification,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create notification';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get a notification by ID
 */
export const getNotificationById = async (
  notificationId: string
): Promise<CreateNotificationResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Notification not found',
      };
    }

    const notification = documentToNotification(docSnap);

    return {
      success: true,
      notification,
    };
  } catch (error) {
    console.error('Error getting notification:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get notification';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get notifications with filters
 */
export const getNotifications = async (
  userId?: string,
  status?: NotificationStatus,
  limitCount?: number
): Promise<{ success: boolean; notifications: Notification[]; error?: string }> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, NOTIFICATIONS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    // Add limit
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push(documentToNotification(doc));
    });

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get notifications';

    return {
      success: false,
      notifications: [],
      error: errorMessage,
    };
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (
  userId?: string
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, NOTIFICATIONS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    constraints.push(where('status', '==', 'unread'));

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const count = querySnapshot.size;

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('Error getting unread count:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get unread count';

    return {
      success: false,
      count: 0,
      error: errorMessage,
    };
  }
};

/**
 * Update a notification
 */
export const updateNotification = async (
  notificationId: string,
  data: UpdateNotificationInput,
  firmId?: string
): Promise<UpdateNotificationResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

    // Check if notification exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Notification not found',
      };
    }

    // Update document
    const updateData: DocumentData = {
      ...data,
    };

    // Add firm ID if provided
    if (firmId) {
      updateData.firmId = firmId;
    }

    await updateDoc(docRef, updateData);

    // Get the updated document
    const updatedSnap = await getDoc(docRef);

    if (!updatedSnap.exists()) {
      return {
        success: false,
        error: 'Failed to update notification',
      };
    }

    const notification = documentToNotification(updatedSnap);

    return {
      success: true,
      notification,
    };
  } catch (error) {
    console.error('Error updating notification:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update notification';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (
  notificationId: string,
  firmId?: string
): Promise<UpdateNotificationResult> => {
  return updateNotification(notificationId, {
    status: 'read',
    readAt: new Date(),
  }, firmId);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  userId?: string,
  firmId?: string
): Promise<MarkAllReadResult> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, NOTIFICATIONS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    constraints.push(where('status', '==', 'unread'));

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const updates = querySnapshot.docs.map((doc) => {
      const docRef = doc.ref;
      return updateDoc(docRef, {
        status: 'read',
        readAt: new Date(),
      });
    });

    await Promise.all(updates);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error marking all as read:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to mark all as read';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string,
  firmId?: string
): Promise<DeleteNotificationResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);

    // Check if notification exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Notification not found',
      };
    }

    await deleteDoc(docRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete notification';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// ============================================
// Real-time Listeners
// ============================================

/**
 * Listen to notifications in real-time
 */
export const listenToNotifications = (
  userId?: string,
  onUpdate?: (notifications: Notification[]) => void,
  onError?: (error: Error) => void
): (() => void) | null => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, NOTIFICATIONS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collectionRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = [];
        snapshot.forEach((doc) => {
          notifications.push(documentToNotification(doc));
        });

        if (onUpdate) {
          onUpdate(notifications);
        }
      },
      (error) => {
        console.error('Error listening to notifications:', error);
        if (onError) {
          onError(error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    return null;
  }
};

// ============================================
// Export
// ============================================

export * from './notifications.service';
