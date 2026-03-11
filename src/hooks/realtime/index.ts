/**
 * Real-time Optimistic Update Hook
 *
 * Wraps OptimisticUpdateHelper for React use.
 * Provides optimistic UI updates with rollback support.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OptimisticUpdateHelper, OptimisticUpdateStatus, OptimisticUpdateOptions, OptimisticUpdate, OptimisticUpdateResult, OptimisticUpdatePriority } from '@/services/realtime';

// ============================================
// Types
// ============================================

/**
 * Optimistic update hook parameters
 */
export interface UseOptimisticUpdateParams {
  /** Update executor function */
  executor: (data: any) => Promise<any>;
  /** Operation options */
  options?: {
    collection: string;
    operation: 'create' | 'update' | 'delete';
    documentId?: string;
  };
  /** Optimistic update options */
  optimisticOptions?: Partial<OptimisticUpdateOptions>;
}

/**
 * Optimistic update hook return value
 */
export interface UseOptimisticUpdateResult {
  /** Execute function */
  execute: (data: any) => Promise<OptimisticUpdateResult<any>>;
  /** Batch execute function */
  executeBatch: (items: Array<any>) => Promise<OptimisticUpdateResult<any>[]>;
  /** Pending updates count */
  pendingCount: number;
  /** Failed updates count */
  failedCount: number;
  /** Is loading state */
  isOptimistic: boolean;
  /** Cancel all function */
  cancelAll: () => void;
  /** Clear all function */
  clearAll: () => void;
  /** Rollback all function */
  rollbackAll: () => Promise<number>;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Optimistic Update Hook
 *
 * Provides optimistic update functionality with automatic rollback
 * on failure. Integrates with TanStack Query for UI updates
 * and OptimisticUpdateHelper for sync with conflict resolution.
 */
export function useOptimisticUpdate(params: UseOptimisticUpdateParams): UseOptimisticUpdateResult {
  const {
    executor,
    options,
    optimisticOptions,
  } = params;

  const queryClient = useQueryClient();
  const optimisticHelperRef = useRef<OptimisticUpdateHelper | null>(null);

  // Get or create optimistic helper
  if (!optimisticHelperRef.current) {
    optimisticHelperRef.current = new OptimisticUpdateHelper(optimisticOptions);
  }

  const optimisticHelper = optimisticHelperRef.current!;

  // TanStack Query for pending updates count
  const {
    data: pendingData,
    isLoading: pendingLoading,
  } = useQuery<number>({
    queryKey: ['optimistic-pending-count'],
    queryFn: async () => optimisticHelper.getPendingCount(),
    staleTime: 10000,
    refetchInterval: 5000,
  });

  // TanStack Query for failed updates count
  const {
    data: failedData,
    isLoading: failedLoading,
  } = useQuery<number>({
    queryKey: ['optimistic-failed-count'],
    queryFn: async () => {
      const failed = optimisticHelper.getUpdatesByStatus(OptimisticUpdateStatus.FAILED);
      return failed.length;
    },
    staleTime: 10000,
    refetchInterval: 10000,
  });

  // State
  const [isOptimistic, setIsOptimistic] = useState(false);

  // Execute single update
  const execute = useCallback(async (data: any) => {
    if (!options) {
      throw new Error('Options are required for optimistic update');
    }

    const { collection, operation, documentId } = options;

    setIsOptimistic(true);

    try {
      // Original data for rollback
      const originalData = operation === 'update' || operation === 'delete'
        ? await fetchOriginalData(collection, documentId)
        : undefined;

      const result = await optimisticHelper.execute(
        collection,
        operation,
        data,
        async (update) => {
          return executor(data);
        },
        {
          priority: getPriority(data),
          original: originalData,
        }
      );

      setIsOptimistic(false);

      return result;
    } catch (error) {
      setIsOptimistic(false);
      throw error;
    }
  }, [optimisticHelper, executor, options, setIsOptimistic]);

  // Batch execute
  const executeBatch = useCallback(async (items: Array<any>) => {
    if (!options) {
      throw new Error('Options are required for optimistic batch update');
    }

    const { collection, operation } = options;

    setIsOptimistic(true);

    try {
      const batchItems = items.map(data => ({
        data,
        operation,
        collection,
        documentId: (data as any).id,
        executor,
      }));

      const results = await optimisticHelper.executeBatch(batchItems);

      setIsOptimistic(false);

      return results;
    } catch (error) {
      setIsOptimistic(false);
      throw error;
    }
  }, [optimisticHelper, executor, options, setIsOptimistic]);

  // Cancel all
  const cancelAll = useCallback(async () => {
    optimisticHelper.clearQueue();
    setIsOptimistic(false);
  }, [optimisticHelper]);

  // Clear all
  const clearAll = useCallback(async () => {
    await optimisticHelper.clearAll();
    setIsOptimistic(false);
  }, [optimisticHelper]);

  // Rollback all
  const rollbackAll = useCallback(async () => {
    const count = await optimisticHelper.rollbackAll();
    setIsOptimistic(false);
    return count;
  }, [optimisticHelper, setIsOptimistic]);

  // Refetch pending/failed
  const refetch = useCallback(async () => {
    await pendingRefetch();
    await failedRefetch();
  }, [pendingRefetch, failedRefetch]);

  return {
    execute,
    executeBatch,
    pendingCount: pendingData || 0,
    failedCount: failedData || 0,
    isOptimistic,
    cancelAll,
    clearAll,
    rollbackAll,
    refetch,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Fetch original data for rollback
 */
async function fetchOriginalData(collection: string, documentId: string): Promise<any> {
  const { getDoc, doc } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');

  const docRef = doc(db, collection, documentId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

/**
 * Get update priority based on data
 */
function getPriority(data: any): OptimisticUpdatePriority {
  // Check if data has priority flag
  if (data.priority) {
    return data.priority;
  }

  // Check for urgent fields
  if (data.isUrgent || data.status === 'urgent') {
    return OptimisticUpdatePriority.HIGH;
  }

  // Check for important fields
  if (data.important || data.status === 'important') {
    return OptimisticUpdatePriority.NORMAL;
  }

  // Default priority
  return OptimisticUpdatePriority.NORMAL;
}

// ============================================
// Index Export
// ============================================

/**
 * Real-time React Hooks Index
 *
 * Exports all real-time React hooks.
 *
 * @module hooks/realtime
 */

export * from './useRealtimeUsers';
export * from './useRealtimeFirms';
export * from './useRealtimeMatters';
export * from './useRealtimeTransactions';
export * from './useRealtimeRates';
export * from './useRealtimeDailyBalances';
export * from './usePresence';
export * from './useNotifications';
export * from './useOptimisticUpdate';
