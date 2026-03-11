/**
 * Firestore Document Types
 *
 * Comprehensive TypeScript types for all Firestore collections.
 * These types extend the existing application types with Firestore-specific fields
 * and ensure compatibility with the Firestore document structure.
 */

// ============================================
// Base Firestore Document Types
// ============================================

/**
 * Base interface for all Firestore documents
 * Includes the document ID and timestamp fields
 */
export interface FirestoreDocument<T = unknown> {
  id: string; // Firestore document ID
  data: T; // Document data
}

/**
 * Base timestamp fields for all Firestore documents
 */
export interface FirestoreTimestamps {
  createdAt: number; // Firestore timestamp (milliseconds since epoch)
  updatedAt?: number; // Firestore timestamp (milliseconds since epoch)
  createdBy?: string; // User ID of creator
  updatedBy?: string; // User ID of last updater
}

/**
 * Firestore document with timestamps
 */
export type TimestampedDocument<T> = T & FirestoreTimestamps;

// ============================================
// Collection References
// ============================================

import type {
  CollectionReference,
  DocumentReference,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

/**
 * Type-safe collection reference for a specific document type
 */
export type TypedCollectionReference<T> = CollectionReference<TimestampedDocument<T>>;

/**
 * Type-safe document reference for a specific document type
 */
export type TypedDocumentReference<T> = DocumentReference<TimestampedDocument<T>>;

/**
 * Type-safe query document snapshot
 */
export type TypedQuerySnapshot<T> = QueryDocumentSnapshot<TimestampedDocument<T>>;

// ============================================
// User Role Types
// ============================================

export type FirestoreUserRole =
  | 'Admin'
  | 'Accountant'
  | 'Attorney'
  | 'View-only'
  | 'System';

/**
 * User permissions by role
 */
export interface UserPermissions {
  matters: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    close: boolean;
  };
  transactions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    allocate: boolean;
  };
  reports: {
    view: boolean;
    generate: boolean;
    export: boolean;
  };
  settings: {
    read: boolean;
    update: boolean;
    certify: boolean;
  };
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manageRoles: boolean;
  };
}

/**
 * Default permissions for each role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<FirestoreUserRole, UserPermissions> = {
  Admin: {
    matters: { create: true, read: true, update: true, delete: true, close: true },
    transactions: { create: true, read: true, update: true, delete: true, allocate: true },
    reports: { view: true, generate: true, export: true },
    settings: { read: true, update: true, certify: true },
    users: { create: true, read: true, update: true, delete: true, manageRoles: true },
  },
  Accountant: {
    matters: { create: true, read: true, update: true, delete: false, close: false },
    transactions: { create: true, read: true, update: true, delete: true, allocate: true },
    reports: { view: true, generate: true, export: true },
    settings: { read: true, update: false, certify: false },
    users: { create: false, read: true, update: false, delete: false, manageRoles: false },
  },
  Attorney: {
    matters: { create: true, read: true, update: true, delete: false, close: true },
    transactions: { create: true, read: true, update: true, delete: false, allocate: false },
    reports: { view: true, generate: true, export: true },
    settings: { read: true, update: false, certify: false },
    users: { create: false, read: true, update: false, delete: false, manageRoles: false },
  },
  'View-only': {
    matters: { create: false, read: true, update: false, delete: false, close: false },
    transactions: { create: false, read: true, update: false, delete: false, allocate: false },
    reports: { view: true, generate: false, export: false },
    settings: { read: true, update: false, certify: false },
    users: { create: false, read: false, update: false, delete: false, manageRoles: false },
  },
  System: {
    matters: { create: false, read: true, update: false, delete: false, close: false },
    transactions: { create: false, read: true, update: false, delete: false, allocate: false },
    reports: { view: true, generate: true, export: true },
    settings: { read: true, update: false, certify: false },
    users: { create: false, read: true, update: false, delete: false, manageRoles: false },
  },
};

// ============================================
// FirestoreUser - Users Collection
// ============================================

export interface FirestoreUserData {
  email: string;
  emailVerified?: boolean;
  passwordHash?: string; // Only for account creation, not stored directly
  name: string;
  role: FirestoreUserRole;
  firmId: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  lastLogin?: number;
  isActive: boolean;
  permissions?: Partial<UserPermissions>;
  preferences?: {
    timezone?: string;
    dateFormat?: string;
    currencyFormat?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
}

export type FirestoreUser = TimestampedDocument<FirestoreUserData>;

// ============================================
// FirestoreFirm - Firms Collection
// ============================================

export interface FirmSettingsData {
  dayCountConvention: 'ACT/360' | 'ACT/365' | '30/360';
  roundingMethod: 'Standard' | 'Bankers';
  primeRateModifier: number;
  lineOfCreditLimit: number;
  complianceCertified: boolean;
  complianceCertifiedAt?: number;
  complianceCertifiedBy?: string;
  autoAllocateInterest?: boolean;
  bankFeedEnabled?: boolean;
  defaultPaymentTerms?: number; // Days
}

export interface FirestoreFirmData {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  logoUrl?: string;
  settings: FirmSettingsData;
  isActive: boolean;
  subscriptionTier?: 'Free' | 'Pro' | 'Agency' | 'Enterprise';
  subscriptionExpiresAt?: number;
  stripeCustomerId?: string;
}

export type FirestoreFirm = TimestampedDocument<FirestoreFirmData>;

// ============================================
// FirestoreMatter - Matters Collection
// ============================================

export type MatterStatus = 'Active' | 'Closed' | 'Archive';
export type MatterType = 'Personal Injury' | 'Workers Compensation' | 'Mass Tort' | 'Class Action' | 'Other';

export interface FirestoreMatterData {
  matterNumber: string;
  clientName: string;
  matterType: MatterType;
  status: MatterStatus;
  principal: number;
  interestRate: number;
  openDate: number;
  closeDate?: number;
  description?: string;
  notes?: string;

  // Calculated fields (cached for performance)
  totalDraws?: number;
  totalPrincipalPayments?: number;
  totalInterestAccrued?: number;
  interestPaid?: number;
  principalBalance?: number;
  totalOwed?: number;

  // Metadata
  firmId: string;
  assignedAttorneyId?: string;
  tags?: string[];
}

export type FirestoreMatter = TimestampedDocument<FirestoreMatterData>;

// ============================================
// FirestoreTransaction - Transactions Collection
// ============================================

export type TransactionType = 'deposit' | 'withdrawal' | 'adjustment' | 'interest_payment';
export type TransactionStatus = 'pending' | 'posted' | 'allocated' | 'reconciled' | 'void';

export interface FirestoreTransactionData {
  matterId?: string;
  firmId: string;
  type: TransactionType;
  amount: number;
  date: number;
  description?: string;
  reference?: string;
  status: TransactionStatus;

  // Allocation details
  allocationId?: string;

  // Categories for expense/payment tracking
  category?: string; // e.g., 'Court & Filing Fees', 'Principal Payment/Adjustment'

  // Bank feed integration
  bankFeedId?: string;
  isReconciled?: boolean;

  // Metadata
  postedBy?: string;
  approvedBy?: string;
  approvedAt?: number;
}

export type FirestoreTransaction = TimestampedDocument<FirestoreTransactionData>;

// ============================================
// FirestoreRateEntry - Rate History Collection
// ============================================

export interface FirestoreRateEntryData {
  rate: number; // Interest rate (e.g., 8.5 for 8.5%)
  effectiveDate: number;
  source?: string; // e.g., 'Federal Reserve', 'Manual Entry'
  notes?: string;
  firmId?: string; // If firm-specific rate with modifier
  modifier?: number; // Firm-specific modifier
  totalRate?: number; // Rate + modifier
}

export type FirestoreRateEntry = TimestampedDocument<FirestoreRateEntryData>;

// ============================================
// FirestoreDailyBalance - Daily Balances Collection
// ============================================

export interface FirestoreDailyBalanceData {
  matterId: string;
  date: number;
  principal: number;
  interestToDate: number;
  balance: number;
  rate: number;
  dailyInterest?: number;
  firmId: string;
}

export type FirestoreDailyBalance = TimestampedDocument<FirestoreDailyBalanceData>;

// ============================================
// FirestoreInterestAllocation - Allocations Collection
// ============================================

export type AllocationStatus = 'draft' | 'pending' | 'finalized' | 'void';

export interface MatterAllocation {
  matterId: string;
  matterName: string;
  principalBalance: number;
  interestPaymentAmount: number;
  interestRemainingBefore: number;
  interestRemainingAfter: number;
  tier: 1 | 2; // Tier 1: $0 principal, Tier 2: Pro rata
}

export interface FirestoreInterestAllocationData {
  periodStart: number;
  periodEnd: number;
  totalInterest: number;
  tier1Amount: number; // Allocated to matters with $0 principal
  tier2Amount: number; // Allocated pro rata to matters with principal > $0
  carryForward: number;
  status: AllocationStatus;

  // Individual matter allocations
  allocations: MatterAllocation[];

  // Autodraft transaction reference
  autodraftTransactionId?: string;
  autodraftDate?: number;

  // Finalization details
  finalizedAt?: number;
  finalizedBy?: string;

  // Firm reference
  firmId: string;
}

export type FirestoreInterestAllocation = TimestampedDocument<FirestoreInterestAllocationData>;

// ============================================
// FirestoreAuditLog - Audit Logs Collection
// ============================================

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'allocate'
  | 'certify'
  | 'close_matter'
  | 'approve';

export interface FirestoreAuditLogData {
  userId: string;
  userName: string;
  userEmail?: string;
  action: AuditAction;
  collection: string; // Collection name (e.g., 'matters', 'transactions')
  documentId?: string;
  timestamp: number;

  // Change tracking
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };

  // Request metadata
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  firmId: string;
}

export type FirestoreAuditLog = TimestampedDocument<FirestoreAuditLogData>;

// ============================================
// FirestoreBankFeed - Bank Feed Collection
// ============================================

export type BankFeedSource = 'BankJoy' | 'Plaid' | 'Manual' | 'OFX';
export type BankFeedStatus = 'pending' | 'matched' | 'unmatched' | 'ignored' | 'error';

export interface FirestoreBankFeedData {
  firmId: string;
  source: BankFeedSource;
  rawTransactionId: string;
  amount: number;
  date: number;
  description: string;
  status: BankFeedStatus;

  // Matching details
  matchedTransactionId?: string;
  matchedAt?: number;
  confidenceScore?: number;

  // Source-specific data
  rawData?: Record<string, unknown>;

  // Metadata
  processedAt?: number;
  errorMessage?: string;
  retryCount?: number;
}

export type FirestoreBankFeed = TimestampedDocument<FirestoreBankFeedData>;

// ============================================
// FirestoreReport - Generated Reports Collection
// ============================================

export type ReportType =
  | 'FirmPayoff'
  | 'ClientPayoff'
  | 'Funding'
  | 'FinanceCharge'
  | 'InterestAllocation'
  | 'Activity'
  | 'Maturity';

export type ReportStatus = 'generating' | 'completed' | 'failed';

export interface FirestoreReportData {
  firmId: string;
  reportType: ReportType;
  reportDate: number;
  status: ReportStatus;

  // Report parameters
  parameters: Record<string, unknown>;

  // Results (if completed)
  results?: {
    summary?: Record<string, unknown>;
    data?: Array<Record<string, unknown>>;
    itemCount?: number;
  };

  // File storage
  storageUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;

  // Generation metadata
  generatedBy: string;
  completedAt?: number;
  errorMessage?: string;
}

export type FirestoreReport = TimestampedDocument<FirestoreReportData>;

// ============================================
// FirestoreNotification - Notifications Collection
// ============================================

export type NotificationType =
  | 'matter_alert'
  | 'transaction_pending'
  | 'allocation_required'
  | 'compliance_reminder'
  | 'report_ready'
  | 'system';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface FirestoreNotificationData {
  userId: string;
  firmId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;

  // Actionable items
  actionUrl?: string;
  actionLabel?: string;

  // Related entities
  relatedMatterId?: string;
  relatedTransactionId?: string;

  // Metadata
  expiresAt?: number;
  sentAt?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export type FirestoreNotification = TimestampedDocument<FirestoreNotificationData>;

// ============================================
// Helper Types for Queries
// ============================================

/**
 * Query constraint types for Firestore queries
 */
export interface QueryConstraints {
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'array-contains' | 'array-contains-any';
    value: unknown;
  }>;
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  startAfter?: unknown;
  startAt?: unknown;
}

/**
 * Paginated query result
 */
export interface PaginatedQueryResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Firestore query result with document metadata
 */
export interface FirestoreQueryResult<T> {
  id: string;
  data: T;
  exists: boolean;
  ref: TypedDocumentReference<T>;
}

// ============================================
// Collection Names
// ============================================

export const COLLECTION_NAMES = {
  USERS: 'users',
  FIRMS: 'firms',
  MATTERS: 'matters',
  TRANSACTIONS: 'transactions',
  RATE_ENTRIES: 'rateEntries',
  DAILY_BALANCES: 'dailyBalances',
  INTEREST_ALLOCATIONS: 'interestAllocations',
  AUDIT_LOGS: 'auditLogs',
  BANK_FEEDS: 'bankFeeds',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
} as const;

export type CollectionName = typeof COLLECTION_NAMES[keyof typeof COLLECTION_NAMES];

// ============================================
// Utility Types
// ============================================

/**
 * Convert Firestore timestamps to Date objects
 */
export type WithDates<T> = {
  [K in keyof T]: T[K] extends number
    ? K extends 'createdAt' | 'updatedAt' | 'lastLogin' | 'effectiveDate' | 'date' | 'openDate' | 'closeDate' | 'periodStart' | 'periodEnd' | 'finalizedAt' | 'timestamp' | 'postedAt' | 'approvedAt' | 'matchedAt' | 'processedAt' | 'completedAt' | 'sentAt' | 'expiresAt'
      ? Date
      : T[K]
    : T[K];
};

/**
 * Convert a Firestore document type to the app type
 */
export type FirestoreToAppType<T> = WithDates<Omit<T, 'id'>>;

/**
 * Create an update type with only optional fields
 */
export type UpdateType<T> = Partial<Omit<T, 'createdAt' | 'createdBy'>> & {
  updatedAt?: number;
  updatedBy?: string;
};

/**
 * Collection-specific update types
 */
export type FirestoreUserUpdate = UpdateType<FirestoreUserData>;
export type FirestoreFirmUpdate = UpdateType<FirestoreFirmData>;
export type FirestoreMatterUpdate = UpdateType<FirestoreMatterData>;
export type FirestoreTransactionUpdate = UpdateType<FirestoreTransactionData>;
export type FirestoreRateEntryUpdate = UpdateType<FirestoreRateEntryData>;
export type FirestoreInterestAllocationUpdate = UpdateType<FirestoreInterestAllocationData>;
