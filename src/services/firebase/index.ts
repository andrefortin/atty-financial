/**
 * Firebase Services Index
 *
 * Central export point for all Firebase service modules.
 *
 * @module services/firebase
 */

// Base service
export * from './firestore.service';

// Collection services
export * from './users.service';
export * from './firms.service';
export * from './matters.service';
export * from './transactions.service';
export * from './rateEntries.service';
export * from './dailyBalances.service';

// High-level services
export * from './interest.service';
export * from './allocations.service';
export * from './allocationDetails.service';
export * from './allocationWorkflow.service';
export * from './allocationReports.service';
export * from './realtime.service';
export * from './offline.service';
export * from './auditLogs.service';
export * from './compliance.service';
export * from './notifications.service';

// Re-export matter service functions
export {
  createMatter,
  getMatterById,
  getMatters,
  updateMatter,
  deleteMatter,
  closeMatter,
  reopenMatter,
  listenToMatters,
  type MatterQueryOptions,
  type MatterListenerOptions,
  type CreateMatterResult,
  type UpdateMatterResult,
  type DeleteMatterResult,
  type MatterService,
} from './matters.service';

// Re-export transaction service functions
export {
  createTransaction,
  getTransactionById,
  getTransactions,
  getTransactionsByMatter,
  updateTransaction,
  deleteTransaction,
  updateTransactionStatus,
  listenToTransactions,
  type TransactionQueryOptions,
  type TransactionListenerOptions,
  type CreateTransactionResult,
  type UpdateTransactionResult,
  type DeleteTransactionResult,
  type TransactionService,
} from './transactions.service';

// Re-export notification service functions
export {
  createNotification,
  getNotificationById,
  getNotifications,
  getUnreadCount,
  updateNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  listenToNotifications,
  type NotificationType,
  type NotificationStatus,
  type Notification,
  type CreateNotificationInput,
  type UpdateNotificationInput,
  type CreateNotificationResult,
  type UpdateNotificationResult,
  type DeleteNotificationResult,
  type MarkAllReadResult,
  type NotificationService,
} from './notifications.service';
