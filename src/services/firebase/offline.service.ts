/**
 * Offline Service
 *
 * Handles offline mode detection, offline data persistence,
 * and sync queue for offline changes.
 *
 * @module services/firebase/offline.service
 */

import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import {
  executeBatch,
  executeTransaction,
  type OperationResult,
  type FirestoreDocument,
} from './firestore.service';
import type { FirestoreMatter, FirestoreMatterData } from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Offline sync operation
 */
export interface OfflineSyncOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  documentId: string;
  data: any;
  timestamp: number;
}

/**
 * Offline sync status
 */
export interface OfflineSyncStatus {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTimestamp: number;
  lastError?: Error;
}

/**
 * Offline queue item
 */
export interface OfflineQueueItem {
  id: string;
  operation: OfflineSyncOperation;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: Error;
}

// ============================================
// Offline Service
// ============================================

/**
 * Offline service for handling offline mode and sync queue
 */
export class OfflineService {
  private syncQueue: Map<string, OfflineQueueItem> = new Map();
  private isOnline = true;
  private lastSyncTimestamp = Date.now();
  private lastError: Error | undefined;

  constructor() {
    this.setupOnlineListeners();
    this.loadSyncQueueFromStorage();
  }

  // ============================================
  // Connection Status Management
  // ============================================

  /**
   * Setup online/offline listeners
   */
  private setupOnlineListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Handle online event
   */
  private handleOnline = async (): Promise<void> => {
    this.isOnline = true;
    this.lastSyncTimestamp = Date.now();
    this.lastError = undefined;

    console.log('Online - Syncing queue...');

    // Sync any pending operations
    await this.syncPendingOperations();

    // Clear sync queue
    this.syncQueue.clear();
    this.saveSyncQueueToStorage();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.isOnline = false;
    console.log('Offline - Queuing operations...');

    // Persist sync queue to local storage
    this.saveSyncQueueToStorage();
  };

  /**
   * Check if online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get offline sync status
   */
  getOfflineSyncStatus(): OfflineSyncStatus {
    return {
      isOnline: this.isOnline,
      pendingSyncCount: this.syncQueue.size,
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastError: this.lastError,
    };
  }

  // ============================================
  // Offline Queue Management
  // ============================================

  /**
   * Queue an offline operation
   *
   * @param operation - Offline sync operation
   * @returns Operation result
   */
  async queueOfflineOperation(
    operation: OfflineSyncOperation
  ): Promise<OperationResult<void>> {
    const queueItem: OfflineQueueItem = {
      id: `${operation.type}-${operation.collection}-${operation.documentId}`,
      operation,
      retries: 0,
      status: 'pending',
    };

    this.syncQueue.set(queueItem.id, queueItem);

    // Save to local storage
    await this.saveSyncQueueToStorage();

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Get pending sync operations
   *
   * @returns Array of pending operations
   */
  getPendingSyncOperations(): OfflineQueueItem[] {
    return Array.from(this.syncQueue.values()).filter(
      (item) => item.status === 'pending'
    );
  }

  /**
   * Get failed sync operations
   *
   * @returns Array of failed operations
   */
  getFailedSyncOperations(): OfflineQueueItem[] {
    return Array.from(this.syncQueue.values()).filter(
      (item) => item.status === 'failed'
    );
  }

  /**
   * Retry failed operations
   *
   * @param maxRetries - Maximum number of retries (default: 3)
   * @returns Operation result
   */
  async retryFailedOperations(maxRetries: number = 3): Promise<OperationResult<void>> {
    const failedItems = Array.from(this.syncQueue.values()).filter(
      (item) => item.status === 'failed' && item.retries < maxRetries
    );

    const results = await Promise.all(
      failedItems.map((item) => this.syncOperation(item))
    );

    // Check for errors
    const errors = results.filter((r) => !r.success);

    if (errors.length > 0) {
      this.lastError = new Error(`${errors.length} operations failed to sync`);
    return {
      success: false,
      error: this.lastError.message,
      code: 'sync-error',
      data: undefined,
    };
    }

    // Update queue
    await this.saveSyncQueueToStorage();

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Clear all failed operations
   */
  clearFailedOperations(): void {
    const itemsToDelete = Array.from(this.syncQueue.entries()).filter(
      ([_, item]) => item.status === 'failed'
    );

    itemsToDelete.forEach(([id]) => {
      this.syncQueue.delete(id);
    });

    this.saveSyncQueueToStorage();
  }

  /**
   * Clear entire sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue.clear();
    this.saveSyncQueueToStorage();
  }

  // ============================================
  // Sync Operations
  // ============================================

  /**
   * Sync pending operations
   *
   * @returns Operation result
   */
  async syncPendingOperations(): Promise<OperationResult<void>> {
    const pendingItems = this.getPendingSyncOperations();

    if (pendingItems.length === 0) {
      return {
        success: true,
        data: undefined,
      };
    }

    const results = await Promise.all(
      pendingItems.map((item) => this.syncOperation(item))
    );

    // Check for errors
    const errors = results.filter((r) => !r.success);

    if (errors.length > 0) {
      this.lastError = new Error(`${errors.length} operations failed to sync`);
      return {
        success: false,
        error: this.lastError.message,
        code: 'sync-error',
        data: undefined,
      };
    }

    // Update queue
    await this.saveSyncQueueToStorage();

    // Update last sync timestamp
    this.lastSyncTimestamp = Date.now();

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Sync a single operation
   *
   * @param queueItem - Queue item to sync
   * @returns Operation result
   */
  private async syncOperation(
    queueItem: OfflineQueueItem
  ): Promise<OperationResult<void>> {
    const { operation } = queueItem;

    // Mark as syncing
    queueItem.status = 'syncing';

    try {
      switch (operation.type) {
        case 'create':
          await this.syncCreateOperation(operation);
          break;

        case 'update':
          await this.syncUpdateOperation(operation);
          break;

        case 'delete':
          await this.syncDeleteOperation(operation);
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      // Mark as completed
      queueItem.status = 'pending';

      // Remove from queue
      this.syncQueue.delete(queueItem.id);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      // Mark as failed
      queueItem.status = 'failed';
      queueItem.error = error as Error;
      queueItem.retries++;

      this.lastError = error;

      return {
        success: false,
        error: (error as Error).message,
        code: 'sync-error',
        data: undefined,
      };
    }
  }

  /**
   * Sync create operation
   */
  private async syncCreateOperation(
    operation: OfflineSyncOperation
  ): Promise<OperationResult<void>> {
    const { createDocument } = await import('./firestore.service');

    const result = await createDocument<FirestoreMatterData>(
      operation.collection,
      operation.data
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to sync create operation');
    }

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Sync update operation
   */
  private async syncUpdateOperation(
    operation: OfflineSyncOperation
  ): Promise<OperationResult<void>> {
    const { updateDocument } = await import('./firestore.service');

    const result = await updateDocument<FirestoreMatterData>(
      operation.collection,
      operation.documentId,
      operation.data
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to sync update operation');
    }

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Sync delete operation
   */
  private async syncDeleteOperation(
    operation: OfflineSyncOperation
  ): Promise<OperationResult<void>> {
    const { deleteDocument } = await import('./firestore.service');

    const result = await deleteDocument(operation.collection, operation.documentId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to sync delete operation');
    }

    return {
      success: true,
      data: undefined,
    };
  }

  // ============================================
  // Local Storage Management
  // ============================================

  /**
   * Save sync queue to local storage
   */
  private async saveSyncQueueToStorage(): Promise<void> {
    try {
      const queueArray = Array.from(this.syncQueue.entries());

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('firestore_sync_queue', JSON.stringify(queueArray));
      }

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('firestore_sync_queue', JSON.stringify(queueArray));
      }
    } catch (error) {
      console.error('Failed to save sync queue to local storage:', error);
    }
  }

  /**
   * Load sync queue from local storage
   */
  private async loadSyncQueueFromStorage(): Promise<void> {
    try {
      let queueArray: Array<[string, OfflineQueueItem]> = [];

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('firestore_sync_queue');
        if (stored) {
          queueArray = JSON.parse(stored);
        }
      } else if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem('firestore_sync_queue');
        if (stored) {
          queueArray = JSON.parse(stored);
        }
      }

      // Rehydrate sync queue
      queueArray.forEach(([id, item]) => {
        this.syncQueue.set(id, item);
      });

      console.log(`Loaded ${queueArray.length} operations from sync queue`);
    } catch (error) {
      console.error('Failed to load sync queue from local storage:', error);
    }
  }

  /**
   * Clear sync queue from local storage
   */
  async clearSyncQueueFromStorage(): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('firestore_sync_queue');
      }

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('firestore_sync_queue');
      }

      console.log('Cleared sync queue from local storage');
    } catch (error) {
      console.error('Failed to clear sync queue from local storage:', error);
    }
  }

  /**
   * Get offline data from local storage
   *
   * @param key - Storage key
   * @returns Stored data or null
   */
  async getOfflineData(key: string): Promise<any | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`firestore_offline_${key}`);
        return stored ? JSON.parse(stored) : null;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get offline data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set offline data in local storage
   *
   * @param key - Storage key
   * @param data - Data to store
   */
  async setOfflineData(key: string, data: any): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`firestore_offline_${key}`, JSON.stringify({
          data,
          timestamp: Date.now(),
        }));
      }

      console.log(`Stored offline data for ${key}`);
    } catch (error) {
      console.error(`Failed to set offline data for ${key}:`, error);
    }
  }

  /**
   * Clear offline data from local storage
   *
   * @param key - Storage key
   */
  async clearOfflineData(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`firestore_offline_${key}`);
      }

      console.log(`Cleared offline data for ${key}`);
    } catch (error) {
      console.error(`Failed to clear offline data for ${key}:`, error);
    }
  }

  /**
   * Clear all offline data
   */
  async clearAllOfflineData(): Promise<void> {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith('firestore_offline_')
    );

    keys.forEach((key) => localStorage.removeItem(key));

    console.log(`Cleared ${keys.length} offline data keys`);
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Check if there are pending operations
   */
  hasPendingOperations(): boolean {
    return this.getPendingSyncOperations().length > 0;
  }

  /**
   * Get operation statistics
   */
  getOperationStatistics(): {
    pendingCount: number;
    syncingCount: number;
    failedCount: number;
    totalCount: number;
  } {
    const pendingCount = Array.from(this.syncQueue.values()).filter(
      (item) => item.status === 'pending'
    ).length;
    const syncingCount = Array.from(this.syncQueue.values()).filter(
      (item) => item.status === 'syncing'
    ).length;
    const failedCount = Array.from(this.syncQueue.values()).filter(
      (item) => item.status === 'failed'
    ).length;

    return {
      pendingCount,
      syncingCount,
      failedCount,
      totalCount: this.syncQueue.size,
    };
  }

  /**
   * Force sync regardless of online status
   *
   * @returns Operation result
   */
  async forceSync(): Promise<OperationResult<void>> {
    console.log('Forcing sync...');

    return this.syncPendingOperations();
  }

  /**
   * Get sync queue for debugging
   */
  getSyncQueue(): OfflineQueueItem[] {
    return Array.from(this.syncQueue.values());
  }
}

// ============================================
// Singleton Instance
// ============================================

let offlineServiceInstance: OfflineService | null = null;

/**
 * Get offline service singleton instance
 */
export function getOfflineService(): OfflineService {
  if (!offlineServiceInstance) {
    offlineServiceInstance = new OfflineService();
  }
  return offlineServiceInstance;
}

/**
 * Reset offline service singleton (for testing)
 */
export function resetOfflineService(): void {
  offlineServiceInstance = null;
}
