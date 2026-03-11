/**
 * Optimistic Update Helper
 *
 * Manages optimistic updates with rollback support,
 * conflict detection, and retry logic for Firebase operations.
 *
 * @module services/realtime/optimisticUpdateHelper
 */

import {
  runTransaction,
  writeBatch,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RealtimeEventEmitter } from './eventEmitter';

// ============================================
// Optimistic Update Status Enum
// ============================================

/**
 * Optimistic update status
 */
export enum OptimisticUpdateStatus {
  /** Update is pending confirmation */
  PENDING = 'pending',
  /** Update has been confirmed by server */
  CONFIRMED = 'confirmed',
  /** Update failed and needs retry */
  FAILED = 'failed',
  /** Update was rolled back due to conflict */
  ROLLED_BACK = 'rolled_back',
}

// ============================================
// Core Types
// ============================================

/**
 * Optimistic update operation
 */
export interface OptimisticUpdate<T = unknown> {
  /** Unique update ID */
  id: string;
  /** Update operation type */
  operation: 'create' | 'update' | 'delete';
  /** Target collection */
  collection: string;
  /** Target document ID */
  documentId?: string;
  /** Original data (before update) */
  originalData?: T;
  /** Updated data (after optimistic update) */
  updatedData?: T;
  /** Document reference */
  ref?: DocumentReference;
  /** Current status */
  status: OptimisticUpdateStatus;
  /** Timestamp when update was created */
  createdAt: number;
  /** Timestamp when update was confirmed */
  confirmedAt?: number;
  /** Error if update failed */
  error?: Error;
  /** Number of retry attempts */
  retryCount: number;
  /** Update tag for grouping */
  tag?: string;
  /** Whether update is part of a batch */
  isBatch: boolean;
  /** Batch ID if part of batch */
  batchId?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Result of server operation */
  serverResult?: T;
}

/**
 * Optimistic update options
 */
export interface OptimisticUpdateOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Whether to auto-rollback on conflict (default: true) */
  autoRollback?: boolean;
  /** Conflict detection threshold (default: 0 - strict) */
  conflictThreshold?: number;
  /** Whether to emit events (default: true) */
  emitEvents?: boolean;
  /** Custom rollback function */
  customRollback?: (update: OptimisticUpdate) => Promise<void>;
  /** Custom conflict resolver */
  customConflictResolver?: (
    local: any,
    server: any
  ) => any;
}

/**
 * Optimistic update result
 */
export interface OptimisticUpdateResult<T = unknown> {
  /** Whether update was successful */
  success: boolean;
  /** Update ID */
  updateId: string;
  /** Updated data */
  data?: T;
  /** Error if failed */
  error?: Error;
  /** Number of retry attempts */
  retryCount: number;
  /** Whether rollback was performed */
  rolledBack?: boolean;
}

/**
 * Rollback options
 */
export interface RollbackOptions {
  /** Whether to remove from pending list */
  removeFromPending?: boolean;
  /** Custom rollback function */
  customRollback?: (update: OptimisticUpdate) => Promise<void>;
}

/**
 * Optimistic update statistics
 */
export interface OptimisticUpdateStats {
  /** Total updates executed */
  totalUpdates: number;
  /** Pending updates */
  pendingUpdates: number;
  /** Confirmed updates */
  confirmedUpdates: number;
  /** Failed updates */
  failedUpdates: number;
  /** Rolled back updates */
  rolledBackUpdates: number;
  /** Average retry count */
  averageRetries: number;
  /** Updates by operation type */
  byOperation: Record<string, number>;
  /** Updates by status */
  byStatus: Record<OptimisticUpdateStatus, number>;
  /** Success rate percentage */
  successRate: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Update executor function type
 */
export type UpdateExecutor<T = unknown> = (
  update: OptimisticUpdate<T>
) => Promise<OptimisticUpdateResult<T>>;

// ============================================
// Constants
// ============================================

const DEFAULT_OPTIONS: Required<Omit<OptimisticUpdateOptions, 'customRollback' | 'customConflictResolver'>> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  autoRollback: true,
  conflictThreshold: 0,
  emitEvents: true,
};

// ============================================
// Optimistic Update Helper Class
// ============================================

/**
 * Optimistic Update Helper
 *
 * Manages optimistic updates with rollback support,
 * conflict detection, and retry logic.
 */
export class OptimisticUpdateHelper {
  private options: Required<Omit<OptimisticUpdateOptions, 'customRollback' | 'customConflictResolver'>>;
  private pendingUpdates: Map<string, OptimisticUpdate>;
  private updateQueue: Map<string, () => void>;
  private batches: Map<string, OptimisticUpdate[]>;
  private stats: OptimisticUpdateStats;
  private eventEmitter: RealtimeEventEmitter | null;
  private updateIdCounter: number;
  private batchIdCounter: number;
  private isProcessing: boolean;

  constructor(options: OptimisticUpdateOptions = {}) {
    // Merge options with defaults
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Initialize storage
    this.pendingUpdates = new Map();
    this.updateQueue = new Map();
    this.batches = new Map();

    // Initialize counters
    this.updateIdCounter = 0;
    this.batchIdCounter = 0;
    this.isProcessing = false;

    // Initialize statistics
    this.stats = this.initializeStats();

    // Initialize event emitter
    this.eventEmitter = null;
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Set event emitter for update events
   *
   * @param eventEmitter - Event emitter instance
   */
  setEventEmitter(eventEmitter: RealtimeEventEmitter): void {
    this.eventEmitter = eventEmitter;
  }

  // ============================================
  // Optimistic Update Execution
  // ============================================

  /**
   * Execute a single optimistic update
   *
   * @param collection - Target collection
   * @param operation - Operation type
   * @param data - Data for the operation
   * @param executor - Function to execute the actual server update
   * @param options - Update options
   * @returns Promise resolving to update result
   */
  async execute<T = unknown>(
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: T,
    executor: UpdateExecutor<T>,
    options?: Partial<OptimisticUpdateOptions>
  ): Promise<OptimisticUpdateResult<T>> {
    const updateId = this.generateId('update-');
    const mergedOptions = { ...this.options, ...options };

    // Create optimistic update
    const update: OptimisticUpdate<T> = {
      id: updateId,
      operation,
      collection,
      documentId: (data as any).id,
      originalData: operation === 'update' || operation === 'delete' ? (data as any).original : undefined,
      updatedData: operation === 'delete' ? undefined : data,
      status: OptimisticUpdateStatus.PENDING,
      createdAt: Date.now(),
      retryCount: 0,
      isBatch: false,
    };

    // Add to pending updates
    this.pendingUpdates.set(updateId, update);
    this.updateStats(update, OptimisticUpdateStatus.PENDING);

    // Emit update created event
    this.emitUpdateEvent('created', update);

    // Apply optimistic update to UI immediately
    await this.applyOptimisticUpdate(update);

    // Execute server update
    const result = await this.executeWithRetry(update, executor, mergedOptions);

    if (result.success) {
      update.status = OptimisticUpdateStatus.CONFIRMED;
      update.confirmedAt = Date.now();
      update.serverResult = result.data;
      this.updateStats(update, OptimisticUpdateStatus.CONFIRMED);
      this.pendingUpdates.delete(updateId);
      this.emitUpdateEvent('confirmed', update);
    } else {
      update.status = OptimisticUpdateStatus.FAILED;
      update.error = result.error;
      this.updateStats(update, OptimisticUpdateStatus.FAILED);
      this.emitUpdateEvent('failed', update);
    }

    return {
      ...result,
      updateId,
      retryCount: update.retryCount,
      rolledBack: false,
    };
  }

  /**
   * Execute multiple optimistic updates in batch
   *
   * @param updates - Array of updates to execute
   * @param executor - Function to execute the batch
   * @param options - Batch options
   * @returns Promise resolving to batch results
   */
  async executeBatch<T = unknown>(
    updates: Array<{
      collection: string;
      operation: 'create' | 'update' | 'delete';
      data: T;
      executor: UpdateExecutor<T>;
    }>,
    options?: Partial<OptimisticUpdateOptions>
  ): Promise<OptimisticUpdateResult<T>[]> {
    const batchId = this.generateId('batch-');
    const mergedOptions = { ...this.options, ...options };

    // Create optimistic updates for batch
    const optimisticUpdates: OptimisticUpdate<T>[] = [];

    for (const updateData of updates) {
      const updateId = this.generateId('update-');
      const update: OptimisticUpdate<T> = {
        id: updateId,
        operation: updateData.operation,
        collection: updateData.collection,
        documentId: (updateData.data as any).id,
        originalData: (updateData.data as any).original,
        updatedData: updateData.operation === 'delete' ? undefined : updateData.data,
        status: OptimisticUpdateStatus.PENDING,
        createdAt: Date.now(),
        retryCount: 0,
        tag: batchId,
        isBatch: true,
        batchId,
      };

      optimisticUpdates.push(update);
      this.pendingUpdates.set(updateId, update);
    }

    // Store batch
    this.batches.set(batchId, optimisticUpdates);
    this.updateStatsBatch(optimisticUpdates, OptimisticUpdateStatus.PENDING);

    // Emit batch created event
    this.emitUpdateEvent('batchCreated', { batchId, updates: optimisticUpdates });

    // Apply optimistic updates to UI immediately
    for (const update of optimisticUpdates) {
      await this.applyOptimisticUpdate(update);
    }

    // Execute server updates
    const results: OptimisticUpdateResult<T>[] = [];
    let allSuccessful = true;

    for (let i = 0; i < optimisticUpdates.length; i++) {
      const update = optimisticUpdates[i];
      const result = await this.executeWithRetry(update, updates[i].executor, mergedOptions);

      results.push({
        ...result,
        updateId: update.id,
        retryCount: update.retryCount,
      });

      if (!result.success) {
        allSuccessful = false;
        update.status = OptimisticUpdateStatus.FAILED;
        update.error = result.error;
        this.updateStats(update, OptimisticUpdateStatus.FAILED);
      } else {
        update.status = OptimisticUpdateStatus.CONFIRMED;
        update.confirmedAt = Date.now();
        update.serverResult = result.data;
        this.updateStats(update, OptimisticUpdateStatus.CONFIRMED);
      }

      this.pendingUpdates.delete(update.id);
    }

    if (allSuccessful) {
      this.emitUpdateEvent('batchConfirmed', { batchId, results });
      this.batches.delete(batchId);
    } else {
      this.emitUpdateEvent('batchFailed', { batchId, results });
      this.batches.delete(batchId);
    }

    return results;
  }

  // ============================================
  // Rollback Management
  // ============================================

  /**
   * Rollback a specific update
   *
   * @param updateId - Update ID to rollback
   * @param options - Rollback options
   * @returns Promise resolving to success status
   */
  async rollback(updateId: string, options?: RollbackOptions): Promise<boolean> {
    const update = this.pendingUpdates.get(updateId);

    if (!update) {
      console.warn(`Update ${updateId} not found in pending updates`);
      return false;
    }

    const mergedOptions = {
      removeFromPending: true,
      ...options,
    };

    // Use custom rollback if provided
    if (mergedOptions.customRollback) {
      try {
        await mergedOptions.customRollback(update);
      } catch (error) {
        console.error('Custom rollback failed:', error);
      }
    } else {
      // Default rollback
      await this.defaultRollback(update);
    }

    update.status = OptimisticUpdateStatus.ROLLED_BACK;
    this.updateStats(update, OptimisticUpdateStatus.ROLLED_BACK);
    this.emitUpdateEvent('rolledBack', update);

    // Remove from pending if requested
    if (mergedOptions.removeFromPending) {
      this.pendingUpdates.delete(updateId);
    }

    return true;
  }

  /**
   * Rollback all pending updates
   *
   * @param options - Rollback options
   * @returns Promise resolving to number of rollbacks performed
   */
  async rollbackAll(options?: RollbackOptions): Promise<number> {
    const rollbacks: Promise<boolean>[] = [];

    for (const [updateId, update] of this.pendingUpdates.entries()) {
      if (update.status === OptimisticUpdateStatus.PENDING || update.status === OptimisticUpdateStatus.FAILED) {
        rollbacks.push(this.rollback(updateId, options));
      }
    }

    const results = await Promise.all(rollbacks);
    const count = results.filter(r => r).length;

    this.emitUpdateEvent('rolledBackAll', { count });

    return count;
  }

  /**
   * Rollback updates by tag
   *
   * @param tag - Tag to rollback
   * @param options - Rollback options
   * @returns Promise resolving to number of rollbacks performed
   */
  async rollbackByTag(tag: string, options?: RollbackOptions): Promise<number> {
    const rollbacks: Promise<boolean>[] = [];

    for (const [updateId, update] of this.pendingUpdates.entries()) {
      if (update.tag === tag && update.status === OptimisticUpdateStatus.PENDING) {
        rollbacks.push(this.rollback(updateId, options));
      }
    }

    const results = await Promise.all(rollbacks);
    const count = results.filter(r => r).length;

    this.emitUpdateEvent('rolledBackByTag', { tag, count });

    return count;
  }

  // ============================================
  // Pending Updates Tracking
  // ============================================

  /**
   * Get all pending updates
   *
   * @returns Array of pending updates
   */
  getPendingUpdates(): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values()).filter(
      update => update.status === OptimisticUpdateStatus.PENDING
    );
  }

  /**
   * Get pending updates by tag
   *
   * @param tag - Tag to filter by
   * @returns Array of pending updates with tag
   */
  getPendingUpdatesByTag(tag: string): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values()).filter(
      update => update.tag === tag && update.status === OptimisticUpdateStatus.PENDING
    );
  }

  /**
   * Get pending updates count
   *
   * @returns Number of pending updates
   */
  getPendingCount(): number {
    return this.getPendingUpdates().length;
  }

  /**
   * Get pending count by tag
   *
   * @param tag - Tag to count
   * @returns Number of pending updates with tag
   */
  getPendingCountByTag(tag: string): number {
    return this.getPendingUpdatesByTag(tag).length;
  }

  /**
   * Get update by ID
   *
   * @param updateId - Update ID
   * @returns Update or null
   */
  getUpdate(updateId: string): OptimisticUpdate | null {
    return this.pendingUpdates.get(updateId) || null;
  }

  /**
   * Get updates by status
   *
   * @param status - Status to filter by
   * @returns Array of updates with status
   */
  getUpdatesByStatus(status: OptimisticUpdateStatus): OptimisticUpdate[] {
    return Array.from(this.pendingUpdates.values()).filter(
      update => update.status === status
    );
  }

  // ============================================
  // Update Queue Management
  // ============================================

  /**
   * Add update to queue
   *
   * @param updateId - Update ID
   * @param cancelFn - Cancel function
   */
  queueUpdate(updateId: string, cancelFn: () => void): void {
    this.updateQueue.set(updateId, cancelFn);
  }

  /**
   * Remove update from queue
   *
   * @param updateId - Update ID
   */
  dequeueUpdate(updateId: string): void {
    const cancelFn = this.updateQueue.get(updateId);
    if (cancelFn) {
      cancelFn();
    }
    this.updateQueue.delete(updateId);
  }

  /**
   * Clear update queue
   */
  clearQueue(): void {
    for (const [updateId, cancelFn] of this.updateQueue.entries()) {
      cancelFn();
    }
    this.updateQueue.clear();
  }

  /**
   * Get queue size
   *
   * @returns Number of items in queue
   */
  getQueueSize(): number {
    return this.updateQueue.size;
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get optimistic update statistics
   *
   * @returns Current statistics
   */
  getStats(): OptimisticUpdateStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Execute update with retry logic
   */
  private async executeWithRetry<T>(
    update: OptimisticUpdate<T>,
    executor: UpdateExecutor<T>,
    options: Required<OptimisticUpdateOptions>
  ): Promise<OptimisticUpdateResult<T>> {
    let lastError: Error | undefined;
    let result: OptimisticUpdateResult<T>;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        result = await executor(update);

        if (result.success) {
          return result;
        }
      } catch (error) {
        lastError = error as Error;
        update.retryCount++;

        if (attempt < options.maxRetries) {
          // Wait before retry with exponential backoff
          const delay = options.retryDelay * Math.pow(options.backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Check for conflict and auto-rollback
    if (options.autoRollback && await this.detectConflict(update, lastError)) {
      await this.rollback(update.id, {
        customRollback: options.customRollback,
      });

      result = {
        success: false,
        updateId: update.id,
        error: lastError || new Error('Conflict detected'),
        retryCount: update.retryCount,
        rolledBack: true,
      };
    } else {
      // Use custom conflict resolver if provided
      if (options.customConflictResolver && update.originalData && result.data) {
        try {
          const resolvedData = options.customConflictResolver(update.originalData, result.data);
          result.data = resolvedData;
          result.success = true;
        } catch (error) {
          result.success = false;
          result.error = error as Error;
        }
      } else {
        result = {
          success: false,
          updateId: update.id,
          error: lastError || new Error('Update failed'),
          retryCount: update.retryCount,
          rolledBack: false,
        };
      }
    }

    return result;
  }

  /**
   * Apply optimistic update immediately
   */
  private async applyOptimisticUpdate<T>(update: OptimisticUpdate<T>): Promise<void> {
    // This would typically update TanStack Query cache or UI state
    // Implementation depends on how you want to handle optimistic updates

    // Example: Emit event for UI to handle
    this.emitUpdateEvent('optimisticApplied', update);
  }

  /**
   * Default rollback implementation
   */
  private async defaultRollback(update: OptimisticUpdate): Promise<void> {
    if (!update.ref || !update.originalData) {
      return;
    }

    try {
      // Restore original data
      await setDoc(update.ref, update.originalData);
    } catch (error) {
      console.error('Rollback failed:', error);
      this.emitUpdateEvent('rollbackFailed', { updateId: update.id, error });
    }
  }

  /**
   * Detect conflict in update
   */
  private async detectConflict(update: OptimisticUpdate, error?: Error): Promise<boolean> {
    if (!error) {
      return false;
    }

    // Check for conflict error codes
    const conflictCodes = ['aborted', 'already-exists', 'permission-denied'];
    const errorMessage = error.message.toLowerCase();
    const hasConflictCode = conflictCodes.some(code => errorMessage.includes(code));

    if (hasConflictCode) {
      return true;
    }

    // Check version conflict if update has version field
    if (update.originalData && update.updatedData) {
      const originalVersion = (update.originalData as any).version;
      const updatedVersion = (update.updatedData as any).version;

      if (originalVersion !== undefined && updatedVersion !== undefined) {
        // Fetch current server version
        if (update.ref) {
          const snapshot = await getDoc(update.ref);
          if (snapshot.exists()) {
            const serverData = snapshot.data();
            const serverVersion = (serverData as any).version;
            if (serverVersion > updatedVersion) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): OptimisticUpdateStats {
    return {
      totalUpdates: 0,
      pendingUpdates: 0,
      confirmedUpdates: 0,
      failedUpdates: 0,
      rolledBackUpdates: 0,
      averageRetries: 0,
      byOperation: {
        create: 0,
        update: 0,
        delete: 0,
      },
      byStatus: {
        [OptimisticUpdateStatus.PENDING]: 0,
        [OptimisticUpdateStatus.CONFIRMED]: 0,
        [OptimisticUpdateStatus.FAILED]: 0,
        [OptimisticUpdateStatus.ROLLED_BACK]: 0,
      },
      successRate: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Update statistics for single update
   */
  private updateStats(update: OptimisticUpdate, status: OptimisticUpdateStatus): void {
    this.stats.totalUpdates++;
    this.stats.byStatus[status]++;

    if (status === OptimisticUpdateStatus.PENDING) {
      this.stats.pendingUpdates++;
    } else if (status === OptimisticUpdateStatus.PENDING) {
      this.stats.pendingUpdates--;
    }

    if (status === OptimisticUpdateStatus.CONFIRMED) {
      this.stats.confirmedUpdates++;
      this.stats.byOperation[update.operation]++;
      // Update success rate
      const completed = this.stats.confirmedUpdates + this.stats.failedUpdates;
      this.stats.successRate = completed > 0 ? (this.stats.confirmedUpdates / completed) * 100 : 0;
      // Update average retries
      const totalRetries = this.stats.byOperation[update.operation] * this.stats.averageRetries + update.retryCount;
      this.stats.averageRetries = totalRetries / (this.stats.byOperation[update.operation] + 1);
    } else if (status === OptimisticUpdateStatus.FAILED) {
      this.stats.failedUpdates++;
    } else if (status === OptimisticUpdateStatus.ROLLED_BACK) {
      this.stats.rolledBackUpdates++;
    }

    this.stats.lastUpdated = Date.now();
  }

  /**
   * Update statistics for batch
   */
  private updateStatsBatch(updates: OptimisticUpdate[], status: OptimisticUpdateStatus): void {
    for (const update of updates) {
      this.stats.totalUpdates++;
      this.stats.byStatus[status]++;

      if (status === OptimisticUpdateStatus.PENDING) {
        this.stats.pendingUpdates++;
      }
    }

    this.stats.lastUpdated = Date.now();
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    if (prefix === 'batch-') {
      return `${prefix}${Date.now()}-${++this.batchIdCounter}`;
    }
    return `${prefix}${Date.now()}-${++this.updateIdCounter}`;
  }

  /**
   * Emit update event
   */
  private emitUpdateEvent(eventType: string, data: any): void {
    if (this.eventEmitter && this.options.emitEvents) {
      this.eventEmitter.emit(`optimisticUpdate:${eventType}`, data, {
        source: 'local',
      });
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    // Clear all updates
    this.pendingUpdates.clear();
    this.batches.clear();

    // Clear queue
    this.clearQueue();

    // Clear event emitter reference
    this.eventEmitter = null;
  }
}

// ============================================
// Factory Functions
// ============================================

let defaultOptisticHelper: OptimisticUpdateHelper | null = null;

/**
 * Create a new optimistic update helper instance
 */
export function createOptimisticUpdateHelper(options?: OptimisticUpdateOptions): OptimisticUpdateHelper {
  return new OptimisticUpdateHelper(options);
}

/**
 * Get default optimistic update helper instance
 */
export function getDefaultOptimisticUpdateHelper(): OptimisticUpdateHelper | null {
  return defaultOptimisticHelper;
}

/**
 * Set default optimistic update helper instance
 */
export function setDefaultOptimisticUpdateHelper(helper: OptimisticUpdateHelper): void {
  defaultOptimisticHelper = helper;
}

/**
 * Reset default optimistic update helper instance
 */
export function resetDefaultOptimisticUpdateHelper(): void {
  if (defaultOptimisticHelper) {
    defaultOptimisticHelper.destroy();
    defaultOptimisticHelper = null;
  }
}
