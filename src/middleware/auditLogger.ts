/**
 * Audit Logger Middleware
 *
 * Middleware to log all CRUD operations to audit logs.
 * Before/after value capture with automatic audit log creation.
 *
 * @module middleware/auditLogger
 */

import type { FirestoreDocument, FirestoreUserData } from '@/types/firestore';
import { createAuditLog } from '@/services/firebase/auditLogs.service';
import type { CreateAuditLogInput } from '@/services/firebase/auditLogs.service';
import type { CollectionName } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Middleware context
 */
export interface AuditContext {
  /**
   * Current user
   */
  user?: FirestoreDocument<FirestoreUserData>;

  /**
   * User ID
   */
  userId?: string;

  /**
   * User email
   */
  userEmail?: string;

  /**
   * Firm ID
   */
  firmId?: string;

  /**
   * Request ID
   */
  requestId?: string;

  /**
   * Session ID
   */
  sessionId?: string;

  /**
   * Remote IP address
   */
  remoteIp?: string;

  /**
   * User agent string
   */
  userAgent?: string;

  /**
   * Operation start timestamp
   */
  operationStart: number;
}

/**
 * Operation result with audit log
 */
export interface AuditedOperationResult<T> {
  /**
   * Operation result
   */
  data: T;

  /**
   * Audit log ID (if created)
   */
  auditLogId?: string;

  /**
   * Operation duration
   */
  duration?: number;
}

/**
 * Before value capture options
 */
export interface BeforeCaptureOptions {
  /**
   * Whether to capture deep value
   * @default false
   */
  deep?: boolean;

  /**
   * Whether to exclude fields
   * @default []
   */
  excludeFields?: string[];
}

// ============================================
// Constants
// ============================================

const DEFAULT_BEFORE_CAPTURE_OPTIONS: BeforeCaptureOptions = {
  deep: false,
  excludeFields: [],
};

const DEFAULT_EXCLUDED_FIELDS = ['password', 'token', 'secret', 'apiKey', 'webhookSecret'];

// ============================================
// Audit Logger Middleware
// ============================================

/**
 * Create audit logger middleware
 *
 * @returns Middleware context provider and hook
 */
export function createAuditLogger() {
  /**
   * Wrap a function with audit logging
   *
   * @param collection - Collection name
   * @param operation - Operation type
   * @param fn - Function to wrap
   * @param context - Audit context
   * @returns Promise with operation result and audit log
   */
  async function withAuditLog<T>(
    collection: CollectionName,
    operation: 'create' | 'update' | 'delete' | 'read' | 'batch',
    fn: () => Promise<T>,
    context: AuditContext,
    options?: BeforeCaptureOptions
  ): Promise<AuditedOperationResult<T>> {
    const startTime = Date.now();
    const captureOptions = { ...DEFAULT_BEFORE_CAPTURE_OPTIONS, ...options };

    // Get before state (if applicable)
    let beforeState: any = undefined;
    let beforeStateError: Error | undefined;

    try {
      if (['create', 'update', 'delete'].includes(operation)) {
        // Try to get before state from function (if available)
        if (typeof fn === 'function' && fn.arguments.length > 0) {
          const docArg = fn.arguments[0];

          if (docArg && typeof docArg === 'object') {
            beforeState = captureBeforeState(docArg, captureOptions);
          }
        }
      }
    } catch (error) {
      beforeStateError = error;
    }

    // Execute operation
    let result: T;
    let error: Error | undefined;
    let success = false;
    let errorMessage: string | undefined;
    let errorCode: string | undefined;
    let stackTrace: string | undefined;

    try {
      result = await fn();
      success = true;
    } catch (err) {
      error = err as Error;
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
      errorCode = (err as any)?.code || 'UNKNOWN_ERROR';
      stackTrace = err instanceof Error ? err.stack : undefined;
      success = false;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Capture after state
    let afterState: any = undefined;
    let afterStateError: Error | undefined;

    try {
      if (['create', 'update'].includes(operation) && result && typeof result === 'object') {
        afterState = captureBeforeState(result, captureOptions);
      }
    } catch (err) {
      afterStateError = err;
    }

    // Calculate changes
    let changes: Record<string, any> = {};

    if (beforeState && afterState && operation === 'update') {
      changes = calculateChanges(beforeState, afterState);
    }

    // Determine document ID
    let documentId: string = '';

    try {
      if (result && typeof result === 'object') {
        documentId = (result as any).id || (result as any).auditLogId || (result as any).userId || (result as any).firmId || (result as any).matterId || (result as any).transactionId || (result as any).allocationId || (result as any).bankFeedId || '';
      }

      if (!documentId && typeof fn === 'function' && fn.arguments.length > 0) {
        const arg = fn.arguments[0];
        if (arg && typeof arg === 'object' && (arg as any).id) {
          documentId = (arg as any).id;
        }
      }
    } catch (err) {
      console.warn('Failed to determine document ID:', err);
    }

    // Determine entity IDs
    let matterId: string | undefined;
    let transactionId: string | undefined;
    let allocationId: string | undefined;
    let bankFeedId: string | undefined;

    try {
      if (result && typeof result === 'object') {
        matterId = (result as any).matterId;
        transactionId = (result as any).transactionId;
        allocationId = (result as any).allocationId;
        bankFeedId = (result as any).bankFeedId;
      }

      if (!matterId && typeof fn === 'function' && fn.arguments.length > 0) {
        const arg = fn.arguments[0];
        if (arg && typeof arg === 'object') {
          matterId = (arg as any).matterId;
          transactionId = (arg as any).transactionId;
          allocationId = (arg as any).allocationId;
          bankFeedId = (arg as any).bankFeedId;
        }
      }
    } catch (err) {
      console.warn('Failed to determine entity IDs:', err);
    }

    // Determine risk level
    const riskLevel = calculateRiskLevel(operation, context, result, error);

    // Determine compliance status
    const complianceStatus = determineComplianceStatus(operation, context, result, error);

    // Create audit log
    const auditLog: CreateAuditLogInput = {
      operation,
      collection,
      documentId,
      userId: context.userId || '',
      userEmail: context.userEmail || '',
      firmId: context.firmId || '',
      matterId,
      transactionId,
      allocationId,
      bankFeedId,
      beforeState,
      afterState,
      changes,
      remoteIp: context.remoteIp,
      userAgent: context.userAgent,
      requestId: context.requestId,
      sessionId: context.sessionId,
      duration,
      success,
      errorMessage,
      errorCode,
      stackTrace,
      complianceStatus,
      riskLevel,
    };

    // Create audit log
    const auditLogResult = await createAuditLog(auditLog);

    if (!auditLogResult.success || !auditLogResult.data) {
      console.error('Failed to create audit log:', auditLogResult.error);
    }

    if (beforeStateError) {
      console.warn('Failed to capture before state:', beforeStateError);
    }

    if (afterStateError) {
      console.warn('Failed to capture after state:', afterStateError);
    }

    return {
      data: result as T,
      auditLogId: auditLogResult.data?.id,
      duration,
    };
  }

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Capture before state
   *
   * @param value - Value to capture
   * @param options - Capture options
   * @returns Captured before state
   */
  function captureBeforeState(
    value: any,
    options: BeforeCaptureOptions
  ): any {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const { deep, excludeFields } = options;

    if (!deep) {
      // Shallow copy
      const captured: any = {};
      const allExcludedFields = [...DEFAULT_EXCLUDED_FIELDS, ...(excludeFields || [])];

      for (const key of Object.keys(value)) {
        if (allExcludedFields.includes(key)) {
          continue;
        }

        captured[key] = value[key];
      }

      return captured;
    } else {
      // Deep copy
      return JSON.parse(JSON.stringify(value));
    }
  }

  /**
   * Calculate changes between before and after states
   *
   * @param before - Before state
   * @param after - After state
   * @returns Record of changes
   */
  function calculateChanges(
    before: any,
    after: any
  ): Record<string, any> {
    if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
      return {};
    }

    const changes: Record<string, any> = {};

    for (const key of Object.keys(after)) {
      if (before[key] === undefined) {
        changes[key] = {
          type: 'added',
          value: after[key],
        };
      } else if (before[key] !== after[key]) {
        changes[key] = {
          type: 'changed',
          from: before[key],
          to: after[key],
        };
      }
    }

    return changes;
  }

  /**
   * Calculate risk level for operation
   *
   * @param operation - Operation type
   * @param context - Audit context
   * @param result - Operation result
   * @param error - Operation error (if any)
   * @returns Risk level (0-1)
   */
  function calculateRiskLevel(
    operation: 'create' | 'update' | 'delete' | 'read' | 'batch',
    context: AuditContext,
    result: any,
    error: Error | undefined
  ): number {
    let riskLevel = 0; // Default: low risk

    // High risk operations
    if (['create', 'update', 'delete'].includes(operation)) {
      riskLevel += 0.2;
    }

    // Batch operations
    if (operation === 'batch') {
      riskLevel += 0.3;
    }

    // Failed operations
    if (error) {
      riskLevel += 0.5;
    }

    // High risk collections
    if (['users', 'firms'].includes(operation as any)) {
      riskLevel += 0.1;
    }

    // High risk for certain operations
    if (operation === 'delete') {
      riskLevel += 0.3;
    }

    // High risk for large transactions
    if (result && typeof result === 'object') {
      if (result.amount && Math.abs(result.amount) > 10000) {
        riskLevel += 0.2;
      }

      if (result.principalBalance && result.principalBalance > 100000) {
        riskLevel += 0.2;
      }

      if (result.totalInterest && result.totalInterest > 1000) {
        riskLevel += 0.2;
      }
    }

    // High risk for non-admin users
    if (context.user && context.user.data.role !== 'admin') {
      riskLevel += 0.1;
    }

    // Cap risk level at 1.0
    return Math.min(riskLevel, 1.0);
  }

  /**
   * Determine compliance status
   *
   * @param operation - Operation type
   * @param context - Audit context
   * @param result - Operation result
   * @param error - Operation error (if any)
   * @returns Compliance status
   */
  function determineComplianceStatus(
    operation: 'create' | 'update' | 'delete' | 'read' | 'batch',
    context: AuditContext,
    result: any,
    error: Error | undefined
  ): 'compliant' | 'non-compliant' | 'flagged' | 'investigated' {
    // Default: compliant
    let complianceStatus: 'compliant' | 'non-compliant' | 'flagged' | 'investigated' = 'compliant';

    // Non-compliant if failed
    if (error && ['create', 'update', 'delete'].includes(operation)) {
      complianceStatus = 'non-compliant';
    }

    // Flagged for high risk
    if (['create', 'update', 'delete'].includes(operation)) {
      const riskLevel = calculateRiskLevel(operation, context, result, error);

      if (riskLevel >= 0.7) {
        complianceStatus = 'flagged';
      }
    }

    // Investigated for very high risk
    if (['create', 'update', 'delete'].includes(operation)) {
      const riskLevel = calculateRiskLevel(operation, context, result, error);

      if (riskLevel >= 0.9) {
        complianceStatus = 'investigated';
      }
    }

    return complianceStatus;
  }

  return {
    withAuditLog,
  };
}

/**
 * Singleton audit logger instance
 */
let auditLoggerInstance: ReturnType<typeof createAuditLogger> | null = null;

/**
 * Get audit logger singleton instance
 */
export function getAuditLogger(): ReturnType<typeof createAuditLogger> {
  if (!auditLoggerInstance) {
    auditLoggerInstance = createAuditLogger();
  }
  return auditLoggerInstance;
}

/**
 * Reset audit logger singleton (for testing)
 */
export function resetAuditLogger(): void {
  auditLoggerInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  createAuditLogger,
  getAuditLogger,
  resetAuditLogger,
  type AuditContext,
  type AuditedOperationResult,
  type BeforeCaptureOptions,
  type DEFAULT_EXCLUDED_FIELDS,
  type DEFAULT_BEFORE_CAPTURE_OPTIONS,
};
