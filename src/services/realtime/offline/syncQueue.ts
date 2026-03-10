/**
 * Sync Queue
 *
 * Manages synchronization queue for offline-first applications with
 * priority handling, retry logic, conflict resolution, and online/offline detection.
 *
 * @module services/realtime/offline/syncQueue
 */

import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  collection,
  addDoc,
  doc,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RealtimeEventEmitter } from '../../eventEmitter';
import { ConflictResolver, Conflict, ConflictType } from './conflictResolver';
import { OptimisticUpdateHelper, OptimisticUpdateStatus, OptimisticUpdate } from '../optimisticUpdateHelper';

// ============================================
// Sync Priority Enum
// ============================================

/**
 * Sync priority levels
 */
export enum SyncPriority {
  /** High priority - execute immediately */
  HIGH = 'high',
  /** Normal priority - execute in order */
  NORMAL = 'normal',
  /** Low priority - execute when queue is empty */
  LOW = 'low',
}

// ============================================
// Sync Status Enum
// ============================================

/**
 * Sync operation status
 */
export enum SyncStatus {
  /** Operation is pending in queue */
  PENDING = 'pending',
  /** Operation is currently being processed */
  IN_PROGRESS = 'in_progress',
  /** Operation completed successfully */
  COMPLETED = 'completed',
  /** Operation failed and will be retried */
  FAILED = 'failed',
  /** Operation failed permanently */
  PERMANENTLY_FAILED = 'permanently_failed',
  /** Operation was cancelled */
  CANCELLED = 'cancelled',
}

// ============================================
// Core Types
// ============================================

/**
 * Sync queue item
 */
export interface SyncQueueItem {
  /** Unique queue item ID */
  id: string;
  /** Operation type */
  operation: 'create' | 'update' | 'delete';
  /** Target collection */
  collection: string;
  /** Target document ID */
  documentId?: string;
  /** Original data (before update) */
  originalData?: Record<string, unknown>;
  /** Updated data */
  data?: Record<string, unknown>;
  /** Sync priority */
  priority: SyncPriority;
  /** Current status */
  status: SyncStatus;
  /** Number of retry attempts */
  retryCount: number;
  /** Max retry attempts */
  maxRetries: number;
  /** Delay until next retry (ms) */
  retryDelay?: number;
  /** Timestamp when queued */
  queuedAt: number;
  /** Timestamp when processing started */
  startedAt?: number;
  /** Timestamp when completed */
  completedAt?: number;
  /** Error if operation failed */
  error?: Error;
  /** Conflict information */
  conflict?: Conflict;
  /** Tag for grouping related items */
  tag?: string;
  /** Whether to detect and resolve conflicts */
  detectConflict?: boolean;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Optimistic update ID if part of one */
  optimisticUpdateId?: string;
}

/**
 * Sync queue configuration
 */
export interface SyncQueueConfig {
  /** Collection name for sync queue (default: 'syncQueue') */
  collectionName?: string;
  /** Maximum concurrent sync operations (default: 3) */
  maxConcurrentOps?: number;
  /** Maximum queue size (default: 1000) */
  maxQueueSize?: number;
  /** Default priority for items (default: NORMAL) */
  defaultPriority?: SyncPriority;
  /** Enable queue persistence to localStorage (default: true) */
  persistQueue?: boolean;
  /** Enable sync on visibility change (default: true) */
  syncOnVisibilityChange?: boolean;
  /** Enable auto-retry on failed items (default: true) */
  autoRetry?: boolean;
  /** Default max retry attempts (default: 3) */
  defaultMaxRetries?: number;
  /** Default retry delay in ms (default: 1000) */
  defaultRetryDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Default sync timeout in ms (default: 30000) */
  syncTimeout?: number;
  /** Enable conflict detection (default: true) */
  enableConflictDetection?: boolean;
  /** Enable online/offline detection (default: true) */
  enableOnlineDetection?: boolean;
  /** Custom event emitter for sync events */
  eventEmitter?: RealtimeEventEmitter;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Sync result
 */
export interface SyncResult {
  /** Whether operation was successful */
  success: boolean;
  /** Queue item ID */
  itemId: string;
  /** Resulting data */
  data?: Record<string, unknown>;
  /** Error if failed */
  error?: Error;
  /** Number of retries */
  retryCount: number;
  /** Whether conflict was detected */
  conflictDetected?: boolean;
  /** Whether conflict was resolved */
  conflictResolved?: boolean;
  /** Processing time in ms */
  processingTime?: number;
  /** Timestamp when completed */
  completedAt: number;
}

/**
 * Sync batch result
 */
export interface SyncBatchResult {
  /** Whether all operations succeeded */
  allSuccess: boolean;
  /** Total number of operations */
  total: number;
  /** Number of successful operations */
  successful: number;
  /** Number of failed operations */
  failed: number;
  /** Array of individual results */
  results: SyncResult[];
}

/**
 * Sync queue statistics
 */
export interface SyncQueueStats {
  /** Total items added to queue */
  totalItems: number;
  /** Items currently in queue */
  queueSize: number;
  /** Items by priority */
  byPriority: Record<SyncPriority, number>;
  /** Items by status */
  byStatus: Record<SyncStatus, number>;
  /** Items by operation type */
  byOperation: Record<string, number>;
  /** Items by tag */
  byTag: Record<string, number>;
  /** Total sync operations performed */
  totalSyncs: number;
  /** Successful syncs */
  successfulSyncs: number;
  /** Failed syncs */
  failedSyncs: number;
  /** Conflicts detected */
  conflictsDetected: number;
  /** Conflicts resolved */
  conflictsResolved: number;
  /** Average sync time (ms) */
  averageSyncTime: number;
  /** Current concurrent operations */
  concurrentOps: number;
  /** Online status */
  isOnline: boolean;
  /** Last online/offline change */
  lastOnlineChange: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Sync executor function type
 */
export type SyncExecutor<T> = (
  item: SyncQueueItem
) => Promise<SyncResult<T>>;

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: Required<Omit<SyncQueueConfig, 'eventEmitter' | 'enableConflictDetection' | 'enableOnlineDetection'>> = {
  collectionName: 'syncQueue',
  maxConcurrentOps: 3,
  maxQueueSize: 1000,
  defaultPriority: SyncPriority.NORMAL,
  persistQueue: true,
  syncOnVisibilityChange: true,
  autoRetry: true,
  defaultMaxRetries: 3,
  defaultRetryDelay: 1000,
  backoffMultiplier: 2,
  syncTimeout: 30000,
  debug: false,
};

const SYNC_QUEUE_COLLECTION = 'syncQueue';
const LOCAL_STORAGE_KEY = 'syncQueue';

// ============================================
// Sync Queue Class
// ============================================

/**
 * Sync Queue
 *
 * Manages synchronization queue with priority handling,
 * retry logic, conflict resolution, and online/offline detection.
 */
export class SyncQueue {
  private config: Required<SyncQueueConfig>;
  private queue: Map<string, SyncQueueItem>;
  private processingItems: Map<string, SyncQueueItem>;
  private optimisticHelper: OptimisticUpdateHelper;
  private conflictResolver: ConflictResolver;
  private isOnline: boolean;
  private lastOnlineStatus: boolean;
  private concurrentOps: number;
  private syncInterval: number | null = null;
  private visibilityHandler: ((e: Event) => void) | null;
  private networkHandler: ((e: Event) => void) | null;
  private queueItemIdCounter: number;
  private stats: SyncQueueStats;
  private isProcessing: boolean;

  constructor(config: SyncQueueConfig = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize storage
    this.queue = new Map();
    this.processingItems = new Map();

    // Initialize services
    this.optimisticHelper = new OptimisticUpdateHelper();
    this.conflictResolver = new ConflictResolver({
      autoResolve: true,
      emitEvents: this.config.eventEmitter !== undefined,
      debug: this.config.debug,
      eventEmitter: this.config.eventEmitter || null,
    });
    if (this.config.eventEmitter) {
      this.optimisticHelper.setEventEmitter(this.config.eventEmitter);
      this.conflictResolver.setEventEmitter(this.config.eventEmitter);
    }

    // Initialize counters
    this.queueItemIdCounter = 0;
    this.concurrentOps = 0;
    this.isOnline = navigator.onLine;
    this.lastOnlineStatus = navigator.onLine;

    // Initialize statistics
    this.stats = this.initializeStats();

    this.debug('SyncQueue initialized', {
      maxConcurrentOps: this.config.maxConcurrentOps,
      maxQueueSize: this.config.maxQueueSize,
    });
  }

  // ============================================
  // Queue Management
  // ============================================

  /**
   * Add item to queue
   *
   * @param item - Queue item to add
   * @returns Queue item ID
   */
  add(item: Omit<SyncQueueItem, 'id' | 'queuedAt' | 'retryCount'>): string {
    const queueItemId = this.generateId('sync-');

    const queueItem: SyncQueueItem = {
      id: queueItemId,
      queuedAt: Date.now(),
      retryCount: 0,
      maxRetries: this.config.defaultMaxRetries,
      priority: item.priority || this.config.defaultPriority,
      status: SyncStatus.PENDING,
      ...item,
      detectConflict: this.config.enableConflictDetection,
    };

    // Check queue size limit
    if (this.queue.size >= this.config.maxQueueSize) {
      this.debug('Queue full - cannot add item');
      this.emitQueueEvent('queueFull', { itemId: queueItemId, item });
      return queueItemId;
    }

    // Add to queue
    this.queue.set(queueItemId, queueItem);
    this.updateStats(queueItem, 'added');

    // Persist queue if enabled
    if (this.config.persistQueue) {
      this.persistQueueToStorage();
    }

    this.debug('Item added to queue', { itemId: queueItemId, item: queueItem });

    // Emit queue changed event
    this.emitQueueEvent('itemAdded', { itemId: queueItemId, item: queueItem });

    // Trigger sync if we have capacity
    this.syncIfNeeded();

    return queueItemId;
  }

  /**
   * Remove item from queue
   *
   * @param itemId - Queue item ID to remove
   * @returns Whether item was removed
   */
  remove(itemId: string): boolean {
    const item = this.queue.get(itemId);

    if (!item) {
      this.debug('Item not found in queue', { itemId });
      return false;
    }

    // Update status to cancelled
    item.status = SyncStatus.CANCELLED;

    // Remove from queue
    const removed = this.queue.delete(itemId);
    this.updateStats(item, 'removed');

    // Cancel in-progress item
    if (item.status === SyncStatus.IN_PROGRESS) {
      this.optimisticHelper.rollback(item.optimisticUpdateId).catch((error) => {
        this.debug('Rollback failed on remove', { itemId, error });
      });
    }

    // Persist queue if enabled
    if (removed && this.config.persistQueue) {
      this.persistQueueToStorage();
    }

    this.debug('Item removed from queue', { itemId });

    // Emit queue changed event
    this.emitQueueEvent('itemRemoved', { itemId });

    return removed;
  }

  /**
   * Clear all items from queue
   *
   * @param cancelProcessing - Whether to cancel in-progress items
   * @returns Number of items cleared
   */
  clear(cancelProcessing: boolean = false): number {
    const count = this.queue.size;

    // Cancel processing if requested
    if (cancelProcessing) {
      for (const [itemId, item] of this.queue.entries()) {
        if (item.status === SyncStatus.IN_PROGRESS) {
          item.status = SyncStatus.CANCELLED;
          this.optimisticHelper.rollback(item.optimisticUpdateId).catch((error) => {
            this.debug('Rollback failed on clear', { itemId, error });
          });
        }
      }
    }

    // Clear queue
    this.queue.clear();
    this.updateStats(null, 'cleared', count);

    // Persist queue if enabled
    if (this.config.persistQueue) {
      this.persistQueueToStorage();
    }

    this.debug('Queue cleared', { count, cancelProcessing });

    // Emit queue cleared event
    this.emitQueueEvent('queueCleared', { count });

    return count;
  }

  /**
   * Get queue size
   *
   * @returns Number of items in queue
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Get items by status
   *
   * @param status - Status to filter by
   * @returns Array of items with status
   */
  getItemsByStatus(status: SyncStatus): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.status === status);
  }

  // ============================================
  // Sync Execution
  // ============================================

  /**
   * Process queue and sync all items
   *
   * @param options - Sync options
   * @returns Promise resolving to sync results
   */
  async sync(options?: {
    force?: boolean;
    timeout?: number;
  }): Promise<SyncBatchResult> {
    this.debug('Starting sync', options);

    // Don't sync if offline (unless forced)
    if (!this.isOnline && !options?.force) {
      this.debug('Offline - skipping sync');
      return {
        allSuccess: true,
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    // Check if already processing
    if (this.isProcessing) {
      this.debug('Already processing - skipping sync');
      return {
        allSuccess: true,
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    this.isProcessing = true;

    try {
      // Process queue items
      const results = await this.processQueue(options?.timeout);

      this.isProcessing = false;

      this.emitQueueEvent('syncCompleted', { results });

      return {
        allSuccess: results.every(r => r.success),
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    } catch (error) {
      this.isProcessing = false;

      this.emitQueueEvent('syncFailed', { error });

      return {
        allSuccess: false,
        total: 0,
        successful: 0,
        failed: 1,
        results: [],
      };
    }
  }

  /**
   * Sync all items with specific tag
   *
   * @param tag - Tag to sync
   * @param options - Sync options
   * @returns Promise resolving to sync results
   */
  async syncByTag(
    tag: string,
    options?: {
      force?: boolean;
      timeout?: number;
    }
  ): Promise<SyncBatchResult> {
    const items = Array.from(this.queue.values()).filter(item => item.tag === tag);

    if (items.length === 0) {
      return {
        allSuccess: true,
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
      };
    }

    this.debug('Syncing by tag', { tag, count: items.length });

    // Move tagged items to front of queue
    for (const item of items) {
      this.queue.delete(item.id);
      this.queue.set(item.id, item);
    }

    // Persist queue if enabled
    if (this.config.persistQueue) {
      this.persistQueueToStorage();
    }

    return this.sync(options);
  }

  /**
   * Sync single item by ID
   *
   * @param itemId - Queue item ID
   * @param options - Sync options
   * @returns Promise resolving to sync result
   */
  async syncById(
    itemId: string,
    options?: {
      force?: boolean;
      timeout?: number;
    }
  ): Promise<SyncResult> {
    const item = this.queue.get(itemId);

    if (!item) {
      return {
        success: false,
        itemId,
        error: new Error('Item not found in queue'),
      };
    }

    this.debug('Syncing item by ID', { itemId, operation: item.operation });

    // Check if offline (unless forced)
    if (!this.isOnline && !options?.force) {
      return {
        success: false,
        itemId,
        error: new Error('Offline - cannot sync'),
      };
    }

    // Add to processing
    this.processingItems.set(itemId, item);
    item.status = SyncStatus.IN_PROGRESS;
    item.startedAt = Date.now();

    try {
      // Execute sync with timeout
      const timeout = options?.timeout || this.config.syncTimeout;

      const syncPromise = this.executeItem(item, timeout);

      // Wait for completion
      const result = await syncPromise;

      // Update item status
      if (result.success) {
        item.status = SyncStatus.COMPLETED;
        item.completedAt = Date.now();
        item.error = undefined;
        this.updateStats(item, 'completed');
      } else if (result.retryCount >= item.maxRetries) {
        item.status = SyncStatus.PERMANENTLY_FAILED;
        item.error = result.error;
        this.updateStats(item, 'permanently_failed');
      } else {
        item.status = SyncStatus.FAILED;
        item.error = result.error;
        this.updateStats(item, 'failed');
      }

      // Remove from processing
      this.processingItems.delete(itemId);

      // Remove from queue if completed
      if (item.status === SyncStatus.COMPLETED) {
        this.queue.delete(itemId);
        if (this.config.persistQueue) {
          this.persistQueueToStorage();
        }
      }

      this.emitQueueEvent('itemSynced', { itemId, result });

      return {
        ...result,
        itemId,
        processingTime: item.completedAt && item.startedAt ? item.completedAt - item.startedAt : undefined,
        completedAt: Date.now(),
      };

    } catch (error) {
      item.status = SyncStatus.FAILED;
      item.error = error;

      // Remove from processing
      this.processingItems.delete(itemId);

      this.emitQueueEvent('itemSyncFailed', { itemId, error });

      return {
        success: false,
        itemId,
        error: error as Error,
        retryCount: item.retryCount,
        completedAt: Date.now(),
      };
    }
  }

  /**
   * Process entire queue
   *
   * @param timeout - Global timeout for sync
   * @returns Promise resolving to sync results
   */
  private async processQueue(timeout?: number): Promise<SyncResult[]> {
    this.debug('Processing queue', { queueSize: this.queue.size });

    const results: SyncResult[] = [];
    let processedCount = 0;
    const startTime = Date.now();

    // Process items while we have capacity
    while (this.processingItems.size < this.config.maxConcurrentOps && this.queue.size > 0) {
      // Check timeout
      if (timeout && Date.now() - startTime > timeout) {
        this.debug('Sync timeout reached');
        break;
      }

      // Get next item based on priority
      const nextItem = this.getNextItem();

      if (!nextItem) {
        break;
      }

      // Execute item sync
      try {
        // Add to processing
        this.processingItems.set(nextItem.id, nextItem);
        nextItem.status = SyncStatus.IN_PROGRESS;
        nextItem.startedAt = Date.now();

        // Create sync promise with timeout
        const itemTimeout = this.config.syncTimeout + (nextItem.priority === SyncPriority.HIGH ? 10000 : 0);
        const syncPromise = this.executeItemWithTimeout(nextItem, itemTimeout);

        // Wait for completion
        const result = await syncPromise;

        processedCount++;

        // Update item based on result
        if (result.success) {
          nextItem.status = SyncStatus.COMPLETED;
          nextItem.completedAt = Date.now();
          nextItem.error = undefined;
          this.updateStats(nextItem, 'completed');
        } else if (result.retryCount >= nextItem.maxRetries) {
          nextItem.status = SyncStatus.PERMANENTLY_FAILED;
          nextItem.error = result.error;
          this.updateStats(nextItem, 'permanently_failed');
        } else {
          nextItem.status = SyncStatus.FAILED;
          nextItem.error = result.error;
          nextItem.retryDelay = result.retryDelay;
          this.updateStats(nextItem, 'failed');
        }

        // Track optimistic update
        if (nextItem.optimisticUpdateId && nextItem.detectConflict) {
          if (result.success) {
            this.optimisticHelper.execute(
              nextItem.collection,
              nextItem.operation,
              nextItem.data || {}
            ).catch((error) => {
              this.debug('Optimistic update failed', { itemId: nextItem.id, error });
            });
          } else {
            // Rollback on failure
            if (result.conflictDetected) {
              this.optimisticHelper.rollback(nextItem.optimisticUpdateId).catch((error) => {
                this.debug('Rollback failed', { itemId: nextItem.id, error });
              });
            }
          }
        }

        results.push({
          ...result,
          itemId: nextItem.id,
          processingTime: nextItem.completedAt && nextItem.startedAt ? nextItem.completedAt - nextItem.startedAt : undefined,
          completedAt: Date.now(),
        });

        // Remove from processing
        this.processingItems.delete(nextItem.id);

        // Remove from queue if completed
        if (nextItem.status === SyncStatus.COMPLETED) {
          this.queue.delete(nextItem.id);
          if (this.config.persistQueue) {
            this.persistQueueToStorage();
          }
        }

        // Emit item synced event
        this.emitQueueEvent('itemSynced', { itemId: nextItem.id, result });

      } catch (error) {
        nextItem.status = SyncStatus.FAILED;
        nextItem.error = error;

        results.push({
          success: false,
          itemId: nextItem.id,
          error: error,
          retryCount: nextItem.retryCount,
          completedAt: Date.now(),
        });

        // Remove from processing
        this.processingItems.delete(nextItem.id);

        this.emitQueueEvent('itemSyncFailed', { itemId: nextItem.id, error });
      }
    }

    this.debug('Queue processed', { processed: processedCount });

    return results;
  }

  // ============================================
  // Priority Handling
  // ============================================

  /**
   * Get next item based on priority
   *
   * @returns Next item or null
   */
  private getNextItem(): SyncQueueItem | null {
    // Filter pending items
    const pendingItems = Array.from(this.queue.values()).filter(
      item => item.status === SyncStatus.PENDING
    );

    if (pendingItems.length === 0) {
      return null;
    }

    // Sort by priority (high first)
    const priorityOrder = {
      [SyncPriority.HIGH]: 0,
      [SyncPriority.NORMAL]: 1,
      [SyncPriority.LOW]: 2,
    };

    pendingItems.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] as number;
      const bPriority = priorityOrder[b.priority] as number;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Same priority - sort by queued time (FIFO)
      return a.queuedAt - b.queuedAt;
    });

    return pendingItems[0];
  }

  /**
   * Get items by priority
   *
   * @param priority - Priority to filter by
   * @returns Array of items with priority
   */
  getItemsByPriority(priority: SyncPriority): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.priority === priority);
  }

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * Add multiple items in batch
   *
   * @param items - Array of queue items to add
   * @returns Array of queue item IDs
   */
  addBatch(items: Array<Omit<SyncQueueItem, 'id' | 'queuedAt' | 'retryCount'>>): string[] {
    const itemIds: string[] = [];

    for (const item of items) {
      itemIds.push(this.add(item));
    }

    this.debug('Batch added', { count: itemIds.length });

    return itemIds;
  }

  /**
   * Remove multiple items in batch
   *
   * @param itemIds - Array of item IDs to remove
   * @returns Number of items removed
   */
  removeBatch(itemIds: string[]): number {
    let removed = 0;

    for (const itemId of itemIds) {
      if (this.remove(itemId)) {
        removed++;
      }
    }

    this.debug('Batch removed', { count: removed });

    return removed;
  }

  /**
   * Retry failed items in batch
   *
   * @returns Promise resolving to retry count
   */
  async retryFailedItems(): Promise<number> {
    const failedItems = this.getFailedItems();
    let retried = 0;

    for (const item of failedItems) {
      // Check retry limits
      if (item.retryCount < item.maxRetries) {
        // Reset status to pending
        item.status = SyncStatus.PENDING;
        item.retryCount++;
        item.retryDelay = this.calculateRetryDelay(item.retryCount);

        // Remove from processing
        this.processingItems.delete(item.id);

        this.updateStats(item, 'retrying');
        this.emitQueueEvent('itemRetry', { itemId: item.id, retryCount: item.retryCount });

        retried++;
      } else {
        // Mark as permanently failed
        item.status = SyncStatus.PERMANENTLY_FAILED;
        this.updateStats(item, 'permanently_failed');

        // Remove from queue
        this.queue.delete(item.id);
      }
    }

    // Persist queue if enabled
    if (this.config.persistQueue) {
      this.persistQueueToStorage();
    }

    if (retried > 0 && this.queue.size > 0) {
      // Trigger sync to process retried items
      this.sync();
    }

    return retried;
  }

  // ============================================
  // Conflict Detection and Resolution
  // ============================================

  /**
   * Detect conflicts for an item
   *
   * @param item - Queue item to check for conflicts
   * @returns Promise resolving to conflict or null
   */
  async detectConflicts(item: SyncQueueItem): Promise<Conflict | null> {
    if (!this.config.enableConflictDetection || !item.detectConflict) {
      return null;
    }

    if (!item.collection || !item.documentId) {
      return null;
    }

    try {
      // Get current server data
      const docRef = doc(db, item.collection, item.documentId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        // Document was deleted
        const conflict: Conflict = this.createDeleteConflict(item);
        item.conflict = conflict;
        return conflict;
      }

      const serverData = snapshot.data() as Record<string, unknown>;

      // Detect conflict with conflict resolver
      const conflict = this.conflictResolver.detectConflict(
        item.collection,
        item.documentId,
        item.originalData || {},
        serverData
      );

      if (conflict) {
        item.conflict = conflict;
      }

      return conflict;
    } catch (error) {
      this.debug('Conflict detection failed', { itemId: item.id, error });
      return null;
    }
  }

  /**
   * Resolve conflicts for an item
   *
   * @param item - Queue item with conflict
   * @param options - Resolution options
   * @returns Promise resolving to resolution result
   */
  async resolveConflict(
    item: SyncQueueItem,
    options?: {
      strategy?: 'auto' | 'manual';
      timeout?: number;
    }
  ): Promise<{
    resolved: boolean;
    data?: Record<string, unknown>;
  }> {
    if (!item.conflict) {
      return { resolved: true, data: item.data };
    }

    this.debug('Resolving conflict', { itemId: item.id, conflictId: item.conflict.id });

    // Auto-resolve if enabled
    if (this.config.autoRetry && options?.strategy !== 'manual') {
      const resolutionResult = await this.conflictResolver.resolveConflict(
        item.conflict,
        {
          timeout: options?.timeout || 30000,
          strategy: 'last_write_wins', // Use latest server data
        }
      );

      if (resolutionResult.success && resolutionResult.resolvedData) {
        // Update optimistic update
        if (item.optimisticUpdateId) {
          await this.optimisticHelper.execute(
            item.collection,
            item.operation,
            resolutionResult.resolvedData
          );
        }

        this.emitQueueEvent('conflictResolved', {
          itemId: item.id,
          conflictId: item.conflict.id,
          strategy: resolutionResult.strategy,
        });

        return { resolved: true, data: resolutionResult.resolvedData };
      }
    }

    // Manual resolution required
    this.emitQueueEvent('manualResolutionRequired', {
      itemId: item.id,
      conflict: item.conflict,
    });

    return { resolved: false };
  }

  // ============================================
  // Online/Offline Detection
  // ============================================

  /**
   * Handle online status
   */
  private handleOnline(): void {
    if (!this.isOnline) {
      this.isOnline = true;
      this.lastOnlineStatus = true;

      this.debug('Now online');

      // Update statistics
      this.stats.isOnline = true;
      this.stats.lastOnlineChange = Date.now();

      // Emit online event
      this.emitQueueEvent('online', {});

      // Sync now that we're online
      this.sync();
    }
  }

  /**
   * Handle offline status
   */
  private handleOffline(): void {
    if (this.isOnline) {
      this.isOnline = false;
      this.lastOnlineStatus = false;

      this.debug('Now offline');

      // Update statistics
      this.stats.isOnline = false;
      this.stats.lastOnlineChange = Date.now();

      // Cancel in-progress operations
      for (const [itemId, item] of this.processingItems.entries()) {
        if (item.status === SyncStatus.IN_PROGRESS) {
          item.status = SyncStatus.CANCELLED;
          item.error = new Error('Offline - operation cancelled');

          // Rollback optimistic update
          if (item.optimisticUpdateId) {
            this.optimisticHelper.rollback(item.optimisticUpdateId).catch((error) => {
              this.debug('Rollback failed on offline', { itemId, error });
            });
          }
        }
      }

      // Cancel sync if running
      this.cancelSync();

      // Emit offline event
      this.emitQueueEvent('offline', {});

      // Clear pending item reconnection timers
      this.clearRetryTimers();
    }
  }

  /**
   * Check online status
   */
  private checkOnlineStatus(): void {
    const currentOnline = navigator.onLine;

    if (currentOnline !== this.isOnline) {
      if (currentOnline) {
        this.handleOnline();
      } else {
        this.handleOffline();
      }
    }
  }

  // ============================================
  // Sync Execution
  // ============================================

  /**
   * Execute item with timeout
   */
  private async executeItemWithTimeout(
    item: SyncQueueItem,
    timeout: number
  ): Promise<SyncResult> {
    return Promise.race([
      this.executeItem(item),
      new Promise<SyncResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Sync timeout after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  /**
   * Execute item and handle conflicts
   */
  private async executeItem(item: SyncQueueItem): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      // Detect conflicts
      const conflict = await this.detectConflicts(item);

      if (conflict) {
        // Try to resolve conflict
        const result = await this.resolveConflict(item);

        if (result.resolved) {
          // Update item with resolved data
          item.data = result.data;

          return {
            success: true,
            itemId: item.id,
            data: result.data,
            error: undefined,
            retryCount: item.retryCount,
            conflictDetected: true,
            conflictResolved: true,
            processingTime: Date.now() - startTime,
          };
        } else {
          // Conflict resolution failed
          item.status = SyncStatus.FAILED;
          item.error = new Error('Conflict resolution failed');

          return {
            success: false,
            itemId: item.id,
            error: item.error,
            retryCount: item.retryCount,
            conflictDetected: true,
            conflictResolved: false,
            processingTime: Date.now() - startTime,
          };
        }
      }

      // Execute Firestore operation
      const result = await this.executeFirestoreOperation(item);

      return {
        ...result,
        processingTime: Date.now() - startTime,
        completedAt: Date.now(),
      };

    } catch (error) {
      item.status = SyncStatus.FAILED;
      item.error = error;

      return {
        success: false,
        itemId: item.id,
        error: error,
        retryCount: item.retryCount,
        processingTime: Date.now() - startTime,
        completedAt: Date.now(),
      };
    }
  }

  /**
   * Execute Firestore operation
   */
  private async executeFirestoreOperation(item: SyncQueueItem): Promise<SyncResult> {
    const docRef = item.documentId ? doc(db, item.collection, item.documentId) : null;
    const colRef = collection(db, item.collection);

    switch (item.operation) {
      case 'create':
        if (docRef) {
          // Document exists - error
          return {
            success: false,
            itemId: item.id,
            error: new Error('Document already exists'),
            retryCount: item.retryCount,
          };
        }

        // Create document
        const createResult = await this.conflictResolver.execute(
          item.collection,
          'create',
          item.data || {},
          async (update) => {
            const newDocRef = await addDoc(colRef, {
              ...item.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            return {
              success: true,
              data: { id: newDocRef.id, ...item.data },
              error: undefined,
              retryCount: createResult.retryCount,
            };
          },
          {
            autoRollback: false,
            customConflictResolver: async (local, remote) => {
              // Custom conflict logic for create
              return remote; // Server wins for create conflicts
            },
          }
        );

        return {
          success: createResult.success,
          itemId: item.id,
          data: createResult.data,
          error: createResult.error,
          retryCount: createResult.retryCount,
        };

      case 'update':
        if (!docRef) {
          return {
            success: false,
            itemId: item.id,
            error: new Error('Document ID not provided for update'),
            retryCount: item.retryCount,
          };
        }

        // Update document
        const updateResult = await this.conflictResolver.execute(
          item.collection,
          'update',
          item.data || {},
          async (update) => {
            await updateDoc(docRef, {
              ...item.data,
              updatedAt: serverTimestamp(),
            });
            return {
              success: true,
              error: undefined,
              retryCount: updateResult.retryCount,
            };
          },
          {
            autoRollback: false,
            customConflictResolver: async (local, remote) => {
              // Custom merge logic for update
              return {
                ...remote,
                // Preserve some local fields if needed
                lastModified: new Date(),
              };
            },
          }
        );

        return {
          success: updateResult.success,
          itemId: item.id,
          data: updateResult.data,
          error: updateResult.error,
          retryCount: updateResult.retryCount,
        };

      case 'delete':
        if (!docRef) {
          return {
            success: false,
            itemId: item.id,
            error: new Error('Document ID not provided for delete'),
            retryCount: item.retryCount,
          };
        }

        // Delete document
        await deleteDoc(docRef);

        return {
          success: true,
          itemId: item.id,
          data: null,
          error: undefined,
          retryCount: 0,
        };

      default:
        return {
          success: false,
          itemId: item.id,
          error: new Error(`Unknown operation: ${item.operation}`),
          retryCount: 0,
        };
    }
  }

  // ============================================
  // Retry Logic
  // ============================================

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    return this.config.defaultRetryDelay * Math.pow(this.config.backoffMultiplier, retryCount);
  }

  /**
   * Clear retry timers
   */
  private clearRetryTimers(): void {
    // Clear any pending retry timeouts for items
    for (const [itemId, item] of this.queue.entries()) {
      if (item.retryDelay && item.status === SyncStatus.PENDING) {
        delete item.retryDelay;
      }
    }
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get sync statistics
   *
   * @returns Current statistics
   */
  getStats(): SyncQueueStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * Update statistics for item
   */
  private updateStats(item: SyncQueueItem, action: 'added' | 'removed' | 'cleared' | 'completed' | 'failed' | 'permanently_failed' | 'retrying', count?: number): void {
    switch (action) {
      case 'added':
        this.stats.totalItems++;
        this.stats.byPriority[item.priority]++;
        break;

      case 'removed':
        this.stats.queueSize--;
        break;

      case 'cleared':
        this.stats.queueSize = 0;
        break;

      case 'completed':
        this.stats.totalSyncs++;
        this.stats.successfulSyncs++;
        this.stats.byOperation[item.operation]++;
        this.updateAverageSyncTime(item);
        break;

      case 'failed':
        this.stats.totalSyncs++;
        this.stats.failedSyncs++;
        this.stats.byOperation[item.operation]++;
        break;

      case 'permanently_failed':
        this.stats.totalSyncs++;
        this.stats.failedSyncs++;
        this.stats.byOperation[item.operation]++;
        break;

      case 'retrying':
        // Count is handled in add method
        break;
    }

    // Update queue size
    this.stats.queueSize = this.queue.size;

    // Update by status
    this.stats.byStatus[item.status]++;

    // Update by tag
    if (item.tag) {
      this.stats.byTag[item.tag] = (this.stats.byTag[item.tag] || 0) + 1;
    }

    // Update conflicts
    if (item.conflict) {
      this.stats.conflictsDetected++;
      if (item.status === SyncStatus.COMPLETED) {
        this.stats.conflictsResolved++;
      }
    }

    this.stats.lastUpdated = Date.now();
  }

  /**
   * Update average sync time
   */
  private updateAverageSyncTime(item: SyncQueueItem): void {
    const total = this.stats.totalSyncs;
    const average = this.stats.averageSyncTime;

    const processingTime = item.completedAt && item.startedAt
      ? item.completedAt - item.startedAt
      : 0;

    this.stats.averageSyncTime = average * (total - 1) / total + processingTime / total;
  }

  // ============================================
  // Queue Persistence
  // ============================================

  /**
   * Persist queue to localStorage
   */
  private persistQueueToStorage(): void {
    if (!this.config.persistQueue) {
      return;
    }

    try {
      const queueData = Array.from(this.queue.entries())
        .map(([_, item]) => ({
          id: item.id,
          operation: item.operation,
          collection: item.collection,
          documentId: item.documentId,
          data: item.data,
          priority: item.priority,
          status: item.status,
          retryCount: item.retryCount,
          queuedAt: item.queuedAt,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
          error: item.error ? item.error.message : undefined,
          tag: item.tag,
          metadata: item.metadata,
          optimisticUpdateId: item.optimisticUpdateId,
        }));

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queueData));
    } catch (error) {
      this.debug('Failed to persist queue', { error });
    }
  }

  /**
   * Restore queue from localStorage
   */
  private async restoreQueueFromStorage(): Promise<void> {
    if (!this.config.persistQueue) {
      return;
    }

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const queueData = JSON.parse(stored);
        const now = Date.now();

        for (const itemData of queueData) {
          const item: SyncQueueItem = {
            id: itemData.id,
            ...itemData,
            status: SyncStatus.PENDING, // Reset status
          };

          // Add to queue if not exists
          if (!this.queue.has(itemData.id)) {
            this.queue.set(itemData.id, item);
          }
        }
      }
    } catch (error) {
      this.debug('Failed to restore queue', { error });
    }
  }

  // ============================================
  // Online/Offline Detection
  // ============================================

  /**
   * Setup online/offline detection
   */
  private setupOnlineOfflineDetection(): void {
    if (!this.config.enableOnlineDetection) {
      return;
    }

    // Listen for online/offline events
    this.networkHandler = () => this.handleOnline();
    window.addEventListener('online', this.networkHandler);
    window.addEventListener('offline', () => this.handleOffline());

    // Check initial status
    this.checkOnlineStatus();
  }

  /**
   * Setup visibility detection for sync on tab change
   */
  private setupVisibilityDetection(): void {
    if (!this.config.syncOnVisibilityChange) {
      return;
    }

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && this.queue.size > 0) {
        this.debug('Tab visible - triggering sync');
        this.sync();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // ============================================
  // Sync Execution
  // ============================================

  /**
   * Cancel sync
   */
  cancelSync(): void {
    // Cancel sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get failed items
   */
  getFailedItems(): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(
      item => item.status === SyncStatus.FAILED
    );
  }

  /**
   * Get items by tag
   */
  getItemsByTag(tag: string): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.tag === tag);
  }

  /**
   * Get items by operation type
   */
  getItemsByOperation(operation: string): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.operation === operation);
  }

  /**
   * Get pending items
   */
  getPendingItems(): SyncQueueItem[] {
    return this.getItemsByStatus(SyncStatus.PENDING);
  }

  /**
   * Get in-progress items
   */
  getInProgressItems(): SyncQueueItem[] {
    return this.getItemsByStatus(SyncStatus.IN_PROGRESS);
  }

  /**
   * Trigger sync if we have capacity
   */
  private syncIfNeeded(): void {
    if (this.isOnline && this.processingItems.size < this.config.maxConcurrentOps && this.queue.size > 0) {
      this.sync().catch(err => {
        this.debug('Error in syncIfNeeded', { error: err });
      });
    }
  }

  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    this.cancelSync();

    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && this.queue.size > 0) {
        this.syncIfNeeded();
      }
    }, 60000); // Check every minute
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize sync queue
   *
   * @param userId - User ID for sync tracking
   */
  async initialize(userId: string): Promise<void> {
    // Restore queue from storage
    await this.restoreQueueFromStorage();

    // Setup online/offline detection
    this.setupOnlineOfflineDetection();

    // Setup visibility detection
    this.setupVisibilityDetection();

    // Start sync interval
    this.startSyncInterval();

    this.debug('SyncQueue initialized', { userId });

    // Emit initialized event
    this.emitQueueEvent('initialized', { userId });
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Debug logging helper
   *
   * @param message - Debug message
   * @param data - Optional data to log
   */
  private debug(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[SyncQueue] ${message}`, data ?? '');
    }
  }

  /**
   * Emit queue event
   *
   * @param event - Event name
   * @param data - Event data
   */
  private emitQueueEvent(event: string, data?: unknown): void {
    if (this.config.eventEmitter) {
      this.config.eventEmitter.emit(`syncQueue:${event}`, data);
    }
  }

  /**
   * Initialize statistics
   *
   * @returns Initial statistics object
   */
  private initializeStats(): SyncQueueStats {
    return {
      totalItems: 0,
      queueSize: 0,
      byPriority: {
        [SyncPriority.HIGH]: 0,
        [SyncPriority.NORMAL]: 0,
        [SyncPriority.LOW]: 0,
      },
      byStatus: {
        [SyncStatus.PENDING]: 0,
        [SyncStatus.IN_PROGRESS]: 0,
        [SyncStatus.COMPLETED]: 0,
        [SyncStatus.FAILED]: 0,
        [SyncStatus.CANCELLED]: 0,
        [SyncStatus.PERMANENTLY_FAILED]: 0,
      },
      byOperation: {},
      byTag: {},
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      averageSyncTime: 0,
      concurrentOps: 0,
      isOnline: this.isOnline,
      lastOnlineChange: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Generate unique ID
   *
   * @param prefix - ID prefix
   * @returns Unique ID
   */
  private generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    this.queueItemIdCounter++;
    return `${prefix}${timestamp}${random}${this.queueItemIdCounter}`;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    // Cancel sync interval
    this.cancelSync();

    // Clear timers
    this.clearRetryTimers();

    // Remove network handlers
    if (this.networkHandler) {
      window.removeEventListener('online', this.networkHandler);
      window.removeEventListener('offline', this.networkHandler);
    }

    // Remove visibility handler
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    // Destroy helpers
    this.optimisticHelper.destroy();
    this.conflictResolver.destroy();

    // Clear queue
    this.queue.clear();
    this.processingItems.clear();

    // Clear persisted queue
    if (this.config.persistQueue) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (error) {
        this.debug('Failed to clear persisted queue', { error });
      }
    }

    this.debug('SyncQueue destroyed');
  }
}

// ============================================
// Factory Functions
// ============================================

let defaultSyncQueue: SyncQueue | null = null;

/**
 * Create a new sync queue instance
 */
export function createSyncQueue(config?: SyncQueueConfig): SyncQueue {
  return new SyncQueue(config);
}

/**
 * Get default sync queue instance
 */
export function getDefaultSyncQueue(): SyncQueue | null {
  return defaultSyncQueue;
}

/**
 * Set default sync queue instance
 */
export function setDefaultSyncQueue(queue: SyncQueue): void {
  defaultSyncQueue = queue;
}

/**
 * Reset default sync queue instance
 */
export function resetDefaultSyncQueue(): void {
  if (defaultSyncQueue) {
    defaultSyncQueue.destroy();
    defaultSyncQueue = null;
  }
}
