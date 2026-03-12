/**
 * Real-time Optimistic Update Hook
 *
 * Wraps OptimisticUpdateHelper for React use.
 * Provides optimistic UI updates with rollback support.
 *
 * @module hooks/realtime
 */

import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OptimisticUpdateHelper, OptimisticUpdateStatus, OptimisticUpdateOptions, OptimisticUpdateResult, OptimisticUpdatePriority } from '@/services/realtime';

// ============================================
// Types
// ============================================

/**
 * Generic input type with optional common fields
 */
interface OptimisticInputData {
  id?: string;
  priority?: OptimisticUpdatePriority;
  isUrgent?: boolean;
  important?: boolean;
  status?: string;
  [key: string]: unknown;
}

/**
 * Optimistic update hook parameters
 */
export interface UseOptimisticUpdateParams<TInput = unknown, TResult = unknown> {
  /** Update executor function */
  executor: (data: TInput) => Promise<TResult>;
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
export interface UseOptimisticUpdateResult<TInput = unknown, TResult = unknown> {
  /** Execute function */
  execute: (data: TInput) => Promise<OptimisticUpdateResult<TResult>>;
  /** Batch execute function */
  executeBatch: (items: TInput[]) => Promise<OptimisticUpdateResult<TResult>[]>;
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
  /** Refetch counts */
  refetch: () => Promise<void>;
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
export function useOptimisticUpdate<TInput = unknown, TResult = unknown>(
  params: UseOptimisticUpdateParams<TInput, TResult>
): UseOptimisticUpdateResult<TInput, TResult> {
  const {
    executor,
    options,
    optimisticOptions,
  } = params;

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
    refetch: pendingRefetch,
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
    refetch: failedRefetch,
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
  const execute = useCallback(async (data: TInput) => {
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

      const result = await optimisticHelper.execute<TResult>(
        collection,
        operation,
        data,
        async () => {
          return executor(data);
        },
        {
          priority: getPriority(data as OptimisticInputData),
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
  const executeBatch = useCallback(async (items: TInput[]) => {
    if (!options) {
      throw new Error('Options are required for optimistic batch update');
    }

    const { collection, operation } = options;

    setIsOptimistic(true);

    try {
      const batchItems = items.map(data => {
        const inputData = data as OptimisticInputData;
        return {
          data,
          operation,
          collection,
          documentId: inputData.id,
          executor,
        };
      });

      const results = await optimisticHelper.executeBatch<TResult>(batchItems);

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
async function fetchOriginalData(collection: string, documentId?: string): Promise<Record<string, unknown> | undefined> {
  if (!documentId) {
    return undefined;
  }

  const { getDoc, doc } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');

  const docRef = doc(db, collection, documentId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return undefined;
  }

  return snapshot.data() as Record<string, unknown>;
}

/**
 * Get update priority based on data
 */
function getPriority(data: OptimisticInputData): OptimisticUpdatePriority {
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
