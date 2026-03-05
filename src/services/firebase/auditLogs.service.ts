/**
 * Audit Logs Service
 *
 * Comprehensive audit logging for all operations.
 * Immutable audit logs for SOC 2 compliance.
 *
 * @module services/firebase/auditLogs.service
 */

import {
  query,
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import {
  createDocument,
  createDocumentWithId,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  queryDocumentsPaginated,
  executeBatch,
  type OperationResult,
  type FirestoreDocument,
  type PaginationOptions,
  type PaginatedResult,
} from './firestore.service';
import type {
  FirestoreAuditLog,
  FirestoreAuditLogData,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /**
   * Audit log ID (auto-generated)
   */
  auditLogId: string;

  /**
   * Operation type
   */
  operation: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';

  /**
   * Collection name
   */
  collection: string;

  /**
   * Document ID
   */
  documentId: string;

  /**
   * User ID who performed operation
   */
  userId: string;

  /**
   * User email (for display)
   */
  userEmail: string;

  /**
   * Firm ID (for multi-tenant support)
   */
  firmId: string;

  /**
   * Matter ID (if applicable)
   */
  matterId?: string;

  /**
   * Transaction ID (if applicable)
   */
  transactionId?: string;

  /**
   * Allocation ID (if applicable)
   */
  allocationId?: string;

  /**
   * Bank feed ID (if applicable)
   */
  bankFeedId?: string;

  /**
   * Before state (before operation)
   */
  beforeState: any;

  /**
   * After state (after operation)
   */
  afterState: any;

  /**
   * Changes made (delta)
   */
  changes: Record<string, any>;

  /**
   * Remote IP address
   */
  remoteIp?: string;

  /**
   * User agent string
   */
  userAgent?: string;

  /**
   * Request ID (for tracing)
   */
  requestId?: string;

  /**
   * Session ID (for session tracking)
   */
  sessionId?: string;

  /**
   * Operation timestamp
   */
  timestamp: number;

  /**
   * Operation duration in milliseconds
   */
  duration?: number;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Error message (if failed)
   */
  errorMessage?: string;

  /**
   * Error code (if failed)
   */
  errorCode?: string;

  /**
   * Stack trace (if failed)
   */
  stackTrace?: string;

  /**
   * Compliance status
   */
  complianceStatus: 'compliant' | 'non-compliant' | 'flagged' | 'investigated';

  /**
   * Risk level (0-1, 1 = high)
   */
  riskLevel: number;

  /**
   * Whether audit log has been reviewed
   */
  reviewed: boolean;

  /**
   * Review notes
   */
  reviewNotes?: string;

  /**
   * Reviewed by (user ID)
   */
  reviewedBy?: string;

  /**
   * Review timestamp
   */
  reviewedAt?: number;

  /**
   * Whether audit log is immutable
   */
  immutable: boolean;

  /**
   * Metadata
   */
  metadata: {
    source: string;
    serviceName: string;
    serviceVersion: string;
    environment: string;
  };
}

/**
 * Audit log creation input
 */
export interface CreateAuditLogInput {
  operation: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
  collection: string;
  documentId: string;
  userId: string;
  userEmail: string;
  firmId: string;
  matterId?: string;
  transactionId?: string;
  allocationId?: string;
  bankFeedId?: string;
  beforeState: any;
  afterState: any;
  changes?: Record<string, any>;
  remoteIp?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  errorCode?: string;
  stackTrace?: string;
  complianceStatus?: 'compliant' | 'non-compliant' | 'flagged' | 'investigated';
  riskLevel?: number;
  reviewed?: boolean;
  reviewNotes?: string;
}

/**
 * Audit log query filters
 */
export interface AuditLogQueryFilters {
  firmId?: string;
  userId?: string;
  operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
  collection?: string;
  documentId?: string;
  matterId?: string;
  transactionId?: string;
  allocationId?: string;
  bankFeedId?: string;
  startDate?: number;
  endDate?: number;
  success?: boolean;
  complianceStatus?: 'compliant' | 'non-compliant' | 'flagged' | 'investigated';
  riskLevel?: number;
  reviewed?: boolean;
  minRiskLevel?: number;
  maxRiskLevel?: number;
  remoteIp?: string;
  requestId?: string;
  sessionId?: string;
}

/**
 * Audit log summary
 */
export interface AuditLogSummary {
  totalLogs: number;
  totalCreates: number;
  totalUpdates: number;
  totalDeletes: number;
  totalReads: number;
  totalBatches: number;
  totalMatches: number;
  totalReconciles: number;
  successfulLogs: number;
  failedLogs: number;
  successRate: number;
  averageDuration: number;
  compliantLogs: number;
  nonCompliantLogs: number;
  flaggedLogs: number;
  investigatedLogs: number;
  complianceRate: number;
  averageRiskLevel: number;
  highRiskLogs: number;
  reviewedLogs: number;
  unreviewedLogs: number;
  uniqueUsers: number;
  uniqueCollections: number;
  uniqueMatters: number;
  uniqueTransactions: number;
  uniqueAllocations: number;
  uniqueBankFeeds: number;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create an audit log entry
 *
 * @param input - Audit log creation data
 * @returns Operation result with created audit log document
 */
export async function createAuditLog(
  input: CreateAuditLogInput
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>>> {
  const auditLogId = crypto.randomUUID();

  const auditLogData: Omit<FirestoreAuditLogData, 'auditLogId' | 'createdAt' | 'updatedAt' | 'immutable'> = {
    operation: input.operation,
    collection: input.collection,
    documentId: input.documentId,
    userId: input.userId,
    userEmail: input.userEmail,
    firmId: input.firmId,
    matterId: input.matterId,
    transactionId: input.transactionId,
    allocationId: input.allocationId,
    bankFeedId: input.bankFeedId,
    beforeState: input.beforeState,
    afterState: input.afterState,
    changes: input.changes || {},
    remoteIp: input.remoteIp,
    userAgent: input.userAgent,
    requestId: input.requestId,
    sessionId: input.sessionId,
    timestamp: Date.now(),
    duration: input.duration,
    success: input.success,
    errorMessage: input.errorMessage,
    errorCode: input.errorCode,
    stackTrace: input.stackTrace,
    complianceStatus: input.complianceStatus || 'compliant',
    riskLevel: input.riskLevel || 0,
    reviewed: input.reviewed || false,
    reviewNotes: input.reviewNotes,
    reviewedBy: input.reviewedBy || null,
    reviewedAt: input.reviewedAt || null,
    immutable: true,
  };

  return createDocumentWithId<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    auditLogId,
    auditLogData
  );
}

/**
 * Get audit log by ID
 *
 * @param auditLogId - Audit log ID
 * @returns Operation result with audit log document
 */
export async function getAuditLogById(
  auditLogId: string
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>>> {
  return getDocument<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    auditLogId
  );
}

/**
 * Update audit log (only certain fields can be updated)
 *
 * Note: Core fields (operation, collection, documentId, userId, etc.) are immutable
 * Only reviewed, reviewNotes, reviewedBy, reviewedAt can be updated
 *
 * @param auditLogId - Audit log ID
 * @param updates - Updates to apply (only reviewed, reviewNotes, reviewedBy, reviewedAt)
 * @returns Operation result
 */
export async function updateAuditLog(
  auditLogId: string,
  updates: {
    reviewed?: boolean;
    reviewNotes?: string;
    reviewedBy?: string;
    reviewedAt?: number;
  }
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    auditLogId,
    updates
  );
}

/**
 * Delete audit log
 *
 * Note: Audit logs should never be deleted (retain forever for compliance)
 * This function is only for testing purposes
 *
 * @param auditLogId - Audit log ID
 * @returns Operation result
 */
export async function deleteAuditLog(
  auditLogId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.AUDIT_LOGS, auditLogId);
}

// ============================================
// Query Operations
// ============================================

/**
 * Get audit logs by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByFirm(
  firmId: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    startDate?: number;
    endDate?: number;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  if (options?.startDate) {
    whereClauses.push(where('timestamp', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('timestamp', '<=', options.endDate));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by user
 *
 * @param userId - User ID
 * @param options - Query options (operation, startDate, endDate, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByUser(
  userId: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    startDate?: number;
    endDate?: number;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('userId', '==', userId),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  if (options?.startDate) {
    whereClauses.push(where('timestamp', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('timestamp', '<=', options.endDate));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by collection
 *
 * @param collection - Collection name
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByCollection(
  collection: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('collection', '==', collection),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by document
 *
 * @param documentId - Document ID
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByDocument(
  documentId: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('documentId', '==', documentId),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by matter
 *
 * @param matterId - Matter ID
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByMatter(
  matterId: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('matterId', '==', matterId),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by transaction
 *
 * @param transactionId - Transaction ID
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByTransaction(
  transactionId: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('transactionId', '==', transactionId),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by allocation
 *
 * @param allocationId - Allocation ID
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByAllocation(
  allocationId: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('allocationId', '==', allocationId),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by bank feed
 *
 * @param bankFeedId - Bank feed ID
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByBankFeed(
  bankFeedId: string,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('bankFeedId', '==', bankFeedId),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by date range
 *
 * @param firmId - Firm ID
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Query options (operation, limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByDateRange(
  firmId: string,
  startDate: number,
  endDate: number,
  options?: {
    operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
  ];

  if (options?.operation) {
    whereClauses.push(where('operation', '==', options.operation));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by compliance status
 *
 * @param firmId - Firm ID
 * @param complianceStatus - Compliance status
 * @param options - Query options (limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByComplianceStatus(
  firmId: string,
  complianceStatus: 'compliant' | 'non-compliant' | 'flagged' | 'investigated',
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('complianceStatus', '==', complianceStatus),
  ];

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by risk level
 *
 * @param firmId - Firm ID
 * @param minRiskLevel - Minimum risk level (0-1)
 * @param maxRiskLevel - Maximum risk level (0-1)
 * @param options - Query options (limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByRiskLevel(
  firmId: string,
  minRiskLevel: number,
  maxRiskLevel: number,
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('riskLevel', '>=', minRiskLevel),
    where('riskLevel', '<=', maxRiskLevel),
  ];

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get unreviewed audit logs
 *
 * @param firmId - Firm ID
 * @param options - Query options (minRiskLevel, limit)
 * @returns Operation result with unreviewed audit log documents
 */
export async function getUnreviewedAuditLogs(
  firmId: string,
  options?: {
    minRiskLevel?: number;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('reviewed', '==', false),
  ];

  if (options?.minRiskLevel) {
    whereClauses.push(where('riskLevel', '>=', options.minRiskLevel));
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
        {
          field: 'riskLevel',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get reviewed audit logs
 *
 * @param firmId - Firm ID
 * @param options - Query options (limit)
 * @returns Operation result with reviewed audit log documents
 */
export async function getReviewedAuditLogs(
  firmId: string,
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('reviewed', '==', true),
  ];

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get failed audit logs
 *
 * @param firmId - Firm ID
 * @param options - Query options (limit)
 * @returns Operation result with failed audit log documents
 */
export async function getFailedAuditLogs(
  firmId: string,
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('success', '==', false),
  ];

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs with pagination
 *
 * @param filters - Query filters
 * @param pagination - Pagination options
 * @param sort - Sort options
 * @returns Operation result with paginated audit logs
 */
export async function getAuditLogsPaginated(
  filters: AuditLogQueryFilters,
  pagination?: PaginationOptions,
  sort?: {
    field: 'timestamp' | 'duration' | 'riskLevel' | 'complianceStatus';
    direction: 'asc' | 'desc';
  }
): Promise<OperationResult<PaginatedResult<FirestoreAuditLog>>> {
  const whereClauses: QueryConstraint[] = [];

  if (filters.firmId) {
    whereClauses.push(where('firmId', '==', filters.firmId));
  }

  if (filters.userId) {
    whereClauses.push(where('userId', '==', filters.userId));
  }

  if (filters.operation) {
    whereClauses.push(where('operation', '==', filters.operation));
  }

  if (filters.collection) {
    whereClauses.push(where('collection', '==', filters.collection));
  }

  if (filters.documentId) {
    whereClauses.push(where('documentId', '==', filters.documentId));
  }

  if (filters.matterId) {
    whereClauses.push(where('matterId', '==', filters.matterId));
  }

  if (filters.transactionId) {
    whereClauses.push(where('transactionId', '==', filters.transactionId));
  }

  if (filters.allocationId) {
    whereClauses.push(where('allocationId', '==', filters.allocationId));
  }

  if (filters.bankFeedId) {
    whereClauses.push(where('bankFeedId', '==', filters.bankFeedId));
  }

  if (filters.startDate) {
    whereClauses.push(where('timestamp', '>=', filters.startDate));
  }

  if (filters.endDate) {
    whereClauses.push(where('timestamp', '<=', filters.endDate));
  }

  if (filters.success !== undefined) {
    whereClauses.push(where('success', '==', filters.success));
  }

  if (filters.complianceStatus) {
    whereClauses.push(where('complianceStatus', '==', filters.complianceStatus));
  }

  if (filters.riskLevel !== undefined) {
    whereClauses.push(where('riskLevel', '==', filters.riskLevel));
  }

  if (filters.reviewed !== undefined) {
    whereClauses.push(where('reviewed', '==', filters.reviewed));
  }

  if (filters.minRiskLevel) {
    whereClauses.push(where('riskLevel', '>=', filters.minRiskLevel));
  }

  if (filters.maxRiskLevel) {
    whereClauses.push(where('riskLevel', '<=', filters.maxRiskLevel));
  }

  const orderByClauses = sort
    ? [{
        field: sort.field as string,
        direction: sort.direction,
      }]
    : [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ];

  return queryDocumentsPaginated<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    pagination,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: orderByClauses,
    }
  );
}

// ============================================
// Summary Operations
// ============================================

/**
 * Get audit log summary for a firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (startDate, endDate)
 * @returns Operation result with audit log summary
 */
export async function getAuditLogSummary(
  firmId: string,
  options?: {
    startDate?: number;
    endDate?: number;
  }
): Promise<OperationResult<AuditLogSummary>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.startDate) {
    whereClauses.push(where('timestamp', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('timestamp', '<=', options.endDate));
  }

  const result = await queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
    }
  );

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch audit logs',
      code: result.code,
    };
  }

  const auditLogs = result.data;

  // Calculate summary
  const totalLogs = auditLogs.length;
  const totalCreates = auditLogs.filter((l) => l.data.operation === 'create').length;
  const totalUpdates = auditLogs.filter((l) => l.data.operation === 'update').length;
  const totalDeletes = auditLogs.filter((l) => l.data.operation === 'delete').length;
  const totalReads = auditLogs.filter((l) => l.data.operation === 'read').length;
  const totalBatches = auditLogs.filter((l) => l.data.operation === 'batch').length;
  const totalMatches = auditLogs.filter((l) => l.data.operation === 'match').length;
  const totalReconciles = auditLogs.filter((l) => l.data.operation === 'reconcile').length;

  const successfulLogs = auditLogs.filter((l) => l.data.success).length;
  const failedLogs = auditLogs.filter((l) => !l.data.success).length;
  const successRate = totalLogs > 0 ? successfulLogs / totalLogs : 0;

  const durations = auditLogs
    .map((l) => l.data.duration)
    .filter((d) => d !== undefined && d !== null) as number[]);
  const averageDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  const compliantLogs = auditLogs.filter((l) => l.data.complianceStatus === 'compliant').length;
  const nonCompliantLogs = auditLogs.filter((l) => l.data.complianceStatus === 'non-compliant').length;
  const flaggedLogs = auditLogs.filter((l) => l.data.complianceStatus === 'flagged').length;
  const investigatedLogs = auditLogs.filter((l) => l.data.complianceStatus === 'investigated').length;
  const complianceRate = totalLogs > 0 ? compliantLogs / totalLogs : 0;

  const riskLevels = auditLogs.map((l) => l.data.riskLevel).filter((r) => r !== undefined && r !== null) as number[]);
  const averageRiskLevel = riskLevels.length > 0
    ? riskLevels.reduce((sum, r) => sum + r, 0) / riskLevels.length
    : 0;
  const highRiskLogs = riskLevels.filter((r) => r >= 0.7).length;

  const reviewedLogs = auditLogs.filter((l) => l.data.reviewed).length;
  const unreviewedLogs = auditLogs.filter((l) => !l.data.reviewed).length;

  const uniqueUsers = new Set(auditLogs.map((l) => l.data.userId)).size;
  const uniqueCollections = new Set(auditLogs.map((l) => l.data.collection)).size;
  const uniqueMatters = new Set(auditLogs.map((l) => l.data.matterId).filter((m) => m !== undefined)).size;
  const uniqueTransactions = new Set(auditLogs.map((l) => l.data.transactionId).filter((t) => t !== undefined)).size;
  const uniqueAllocations = new Set(auditLogs.map((l) => l.data.allocationId).filter((a) => a !== undefined)).size;
  const uniqueBankFeeds = new Set(auditLogs.map((l) => l.data.bankFeedId).filter((b) => b !== undefined)).size;

  return {
    success: true,
    data: {
      totalLogs,
      totalCreates,
      totalUpdates,
      totalDeletes,
      totalReads,
      totalBatches,
      totalMatches,
      totalReconciles,
      successfulLogs,
      failedLogs,
      successRate,
      averageDuration,
      compliantLogs,
      nonCompliantLogs,
      flaggedLogs,
      investigatedLogs,
      complianceRate,
      averageRiskLevel,
      highRiskLogs,
      reviewedLogs,
      unreviewedLogs,
      uniqueUsers,
      uniqueCollections,
      uniqueMatters,
      uniqueTransactions,
      uniqueAllocations,
      uniqueBankFeeds,
    },
  };
}

/**
 * Get audit log summary for a user
 *
 * @param userId - User ID
 * @param options - Query options (startDate, endDate)
 * @returns Operation result with audit log summary
 */
export async function getUserAuditSummary(
  userId: string,
  options?: {
    startDate?: number;
    endDate?: number;
  }
): Promise<OperationResult<AuditLogSummary>> {
  const whereClauses: QueryConstraint[] = [
    where('userId', '==', userId),
  ];

  if (options?.startDate) {
    whereClauses.push(where('timestamp', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('timestamp', '<=', options.endDate));
  }

  const result = await queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
    }
  );

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch audit logs',
      code: result.code,
    };
  }

  const auditLogs = result.data;

  // Calculate summary
  const totalLogs = auditLogs.length;
  const totalCreates = auditLogs.filter((l) => l.data.operation === 'create').length;
  const totalUpdates = auditLogs.filter((l) => l.data.operation === 'update').length;
  const totalDeletes = auditLogs.filter((l) => l.data.operation === 'delete').length;
  const totalReads = auditLogs.filter((l) => l.data.operation === 'read').length;
  const totalBatches = auditLogs.filter((l) => l.data.operation === 'batch').length;
  const totalMatches = auditLogs.filter((l) => l.data.operation === 'match').length;
  const totalReconciles = auditLogs.filter((l) => l.data.operation === 'reconcile').length;

  const successfulLogs = auditLogs.filter((l) => l.data.success).length;
  const failedLogs = auditLogs.filter((l) => !l.data.success).length;
  const successRate = totalLogs > 0 ? successfulLogs / totalLogs : 0;

  const durations = auditLogs
    .map((l) => l.data.duration)
    .filter((d) => d !== undefined && d !== null) as number[]);
  const averageDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  const compliantLogs = auditLogs.filter((l) => l.data.complianceStatus === 'compliant').length;
  const nonCompliantLogs = auditLogs.filter((l) => l.data.complianceStatus === 'non-compliant').length;
  const flaggedLogs = auditLogs.filter((l) => l.data.complianceStatus === 'flagged').length;
  const investigatedLogs = auditLogs.filter((l) => l.data.complianceStatus === 'investigated').length;
  const complianceRate = totalLogs > 0 ? compliantLogs / totalLogs : 0;

  const riskLevels = auditLogs.map((l) => l.data.riskLevel).filter((r) => r !== undefined && r !== null) as number[]);
  const averageRiskLevel = riskLevels.length > 0
    ? riskLevels.reduce((sum, r) => sum + r, 0) / riskLevels.length
    : 0;
  const highRiskLogs = riskLevels.filter((r) => r >= 0.7).length;

  const reviewedLogs = auditLogs.filter((l) => l.data.reviewed).length;
  const unreviewedLogs = auditLogs.filter((l) => !l.data.reviewed).length;

  const uniqueCollections = new Set(auditLogs.map((l) => l.data.collection)).size;
  const uniqueMatters = new Set(auditLogs.map((l) => l.data.matterId).filter((m) => m !== undefined)).size;
  const uniqueTransactions = new Set(auditLogs.map((l) => l.data.transactionId).filter((t) => t !== undefined)).size;
  const uniqueAllocations = new Set(auditLogs.map((l) => l.data.allocationId).filter((a) => a !== undefined)).size;
  const uniqueBankFeeds = new Set(auditLogs.map((l) => l.data.bankFeedId).filter((b) => b !== undefined)).size;

  return {
    success: true,
    data: {
      totalLogs,
      totalCreates,
      totalUpdates,
      totalDeletes,
      totalReads,
      totalBatches,
      totalMatches,
      totalReconciles,
      successfulLogs,
      failedLogs,
      successRate,
      averageDuration,
      compliantLogs,
      nonCompliantLogs,
      flaggedLogs,
      investigatedLogs,
      complianceRate,
      averageRiskLevel,
      highRiskLogs,
      reviewedLogs,
      unreviewedLogs,
      uniqueUsers: 1,
      uniqueCollections,
      uniqueMatters,
      uniqueTransactions,
      uniqueAllocations,
      uniqueBankFeeds,
    },
  };
}

// ============================================
// Batch Operations
// ============================================

/**
 * Create multiple audit logs in a batch
 *
 * @param inputs - Array of audit log inputs
 * @returns Operation result
 */
export async function createAuditLogsBatch(
  inputs: CreateAuditLogInput[]
): Promise<OperationResult<void>> {
  const operations = inputs.map((input) => ({
    type: 'set',
    collection: COLLECTION_NAMES.AUDIT_LOGS,
    data: {
      ...input,
      auditLogId: crypto.randomUUID(),
      immutable: true,
      metadata: {
        source: 'client',
        serviceName: 'atty-financial',
        serviceVersion: process.env.NEXT_PUBLIC_CLIENT_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  }));

  return executeBatch(operations);
}

/**
 * Update multiple audit logs in a batch
 *
 * @param updates - Array of { auditLogId, updates } tuples
 * @returns Operation result
 */
export async function updateAuditLogsBatch(
  updates: Array<{
    auditLogId: string;
    updates: {
      reviewed?: boolean;
      reviewNotes?: string;
      reviewedBy?: string;
      reviewedAt?: number;
    };
  }>
): Promise<OperationResult<void>> {
  const operations = updates.map((update) => ({
    type: 'update',
    collection: COLLECTION_NAMES.AUDIT_LOGS,
    documentId: update.auditLogId,
    data: {
      ...update.updates,
      updatedAt: Date.now(),
    },
  }));

  return executeBatch(operations);
}

/**
 * Get audit logs by multiple users
 *
 * @param userIds - Array of user IDs
 * @param options - Query options (limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByUsers(
  userIds: string[],
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  if (userIds.length === 0) {
    return {
      success: true,
      data: [],
    };
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: userIds.map((userId) => ({
        field: 'userId',
        operator: 'in',
        value: userIds,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by multiple documents
 *
 * @param documentIds - Array of document IDs
 * @param options - Query options (limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByDocuments(
  documentIds: string[],
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  if (documentIds.length === 0) {
    return {
      success: true,
      data: [],
    };
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: documentIds.map((documentId) => ({
        field: 'documentId',
        operator: 'in',
        value: documentIds,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get audit logs by multiple matters
 *
 * @param matterIds - Array of matter IDs
 * @param options - Query options (limit)
 * @returns Operation result with audit log documents
 */
export async function getAuditLogsByMatters(
  matterIds: string[],
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAuditLog>[]>> {
  if (matterIds.length === 0) {
    return {
      success: true,
      data: [],
    };
  }

  return queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: matterIds.map((matterId) => ({
        field: 'matterId',
        operator: 'in',
        value: matterIds,
      })),
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

// ============================================
// Export Operations
// ============================================

/**
 * Export audit logs to CSV
 *
 * @param auditLogs - Audit logs to export
 * @returns CSV string
 */
export function exportAuditLogsToCSV(auditLogs: FirestoreDocument<FirestoreAuditLog>[]): string {
  if (auditLogs.length === 0) {
    return '';
  }

  const headers = [
    'Audit Log ID',
    'Operation',
    'Collection',
    'Document ID',
    'User ID',
    'User Email',
    'Firm ID',
    'Matter ID',
    'Transaction ID',
    'Allocation ID',
    'Bank Feed ID',
    'Remote IP',
    'Request ID',
    'Session ID',
    'Timestamp',
    'Duration',
    'Success',
    'Error Message',
    'Error Code',
    'Compliance Status',
    'Risk Level',
    'Reviewed',
    'Reviewed By',
    'Reviewed At',
    'Created At',
  ];

  const rows = auditLogs.map((auditLog) => {
    const { data } = auditLog;

    return [
      data.auditLogId,
      data.operation,
      data.collection,
      data.documentId,
      data.userId,
      data.userEmail,
      data.firmId,
      data.matterId || '',
      data.transactionId || '',
      data.allocationId || '',
      data.bankFeedId || '',
      data.remoteIp || '',
      data.requestId || '',
      data.sessionId || '',
      new Date(data.timestamp).toISOString(),
      data.duration || 0,
      data.success,
      data.errorMessage || '',
      data.errorCode || '',
      data.complianceStatus,
      data.riskLevel,
      data.reviewed,
      data.reviewedBy || '',
      data.reviewedAt ? new Date(data.reviewedAt).toISOString() : '',
      new Date(data.createdAt).toISOString(),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export audit logs to JSON
 *
 * @param auditLogs - Audit logs to export
 * @returns JSON string
 */
export function exportAuditLogsToJSON(auditLogs: FirestoreDocument<FirestoreAuditLog>[]): string {
  return JSON.stringify(auditLogs.map((auditLog) => ({
    auditLogId: auditLog.id,
    operation: auditLog.data.operation,
    collection: auditLog.data.collection,
    documentId: auditLog.data.documentId,
    userId: auditLog.data.userId,
    userEmail: auditLog.data.userEmail,
    firmId: auditLog.data.firmId,
    matterId: auditLog.data.matterId,
    transactionId: auditLog.data.transactionId,
    allocationId: auditLog.data.allocationId,
    bankFeedId: auditLog.data.bankFeedId,
    remoteIp: auditLog.data.remoteIp,
    requestId: auditLog.data.requestId,
    sessionId: auditLog.data.sessionId,
    timestamp: new Date(auditLog.data.timestamp).toISOString(),
    duration: auditLog.data.duration,
    success: auditLog.data.success,
    errorMessage: auditLog.data.errorMessage,
    errorCode: auditLog.data.errorCode,
    complianceStatus: auditLog.data.complianceStatus,
    riskLevel: auditLog.data.riskLevel,
    reviewed: auditLog.data.reviewed,
    reviewedBy: auditLog.data.reviewedBy,
    reviewedAt: auditLog.data.reviewedAt ? new Date(auditLog.data.reviewedAt).toISOString() : '',
    immutable: auditLog.data.immutable,
    createdAt: new Date(auditLog.data.createdAt).toISOString(),
    updatedAt: new Date(auditLog.data.updatedAt).toISOString(),
  })), null, 2);
}

/**
 * Format audit log for display
 *
 * @param auditLog - Audit log document
 * @returns Formatted audit log
 */
export function formatAuditLogForDisplay(
  auditLog: FirestoreDocument<FirestoreAuditLog>
): string {
  const { data } = auditLog;

  const timestamp = new Date(data.timestamp);
  const createdAt = new Date(data.createdAt);

  return `${data.operation.toUpperCase()}: ${data.collection}\n` +
    `User: ${data.userEmail} (${data.userId})\n` +
    `Time: ${timestamp.toLocaleString()}\n` +
    `Success: ${data.success ? '✅' : '❌'}${data.success ? '' : ' - ' + (data.errorMessage || data.errorCode)}\n` +
    `Compliance: ${data.complianceStatus}\n` +
    `Risk Level: ${(data.riskLevel * 100).toFixed(0)}%`;
}
