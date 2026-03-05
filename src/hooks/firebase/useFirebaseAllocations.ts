/**
 * Firebase Allocations Hook
 *
 * React Query integration for allocations collection.
 *
 * @module hooks/firebase/useFirebaseAllocations
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  getAllocationById,
  getAllocationsByFirm,
  getAllocationsByDateRange,
  getAllocationsByPeriod,
  getAllocationsByStatus,
  getAllocationsPaginated,
  getPendingAllocations,
  getFinalizedAllocations,
  getAllocationSummary,
  getMatterAllocationSummary,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  submitAllocationForApproval,
  approveAllocation,
  rejectAllocation,
  lockAllocation,
  unlockAllocation,
  createAllocationsBatch,
  updateAllocationsBatch,
  deleteAllocationWorkflow,
  subscribeToAllocation,
  subscribeToFirmAllocations,
  subscribeToPendingAllocations,
  type OperationResult,
  type FirestoreDocument,
  type FirestoreAllocation,
} from '@/services/firebase/allocations.service';
import {
  createAllocationWorkflow,
  submitAllocationForApproval as submitForApproval,
  approveAllocation as approve,
  rejectAllocation as reject,
  undoAllocation,
  finalizeAllocation as finalize,
  lockAllocation as lock,
  unlockAllocation as unlock,
  deleteAllocationWorkflow as deleteAllocation,
  getAllocationPreview,
} from '@/services/allocationWorkflow.service';
import type { AllocationPreview } from '@/services/allocationWorkflow.service';

// ============================================
// Types
// ============================================

export interface UseAllocationOptions extends Omit<UseQueryOptions<FirestoreDocument<FirestoreAllocation>>, 'queryKey'> {
  allocationId: string;
}

export interface UseFirmAllocationsOptions {
  firmId: string;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  limit?: number;
}

export interface UseAllocationDateRangeOptions {
  firmId: string;
  startDate: number;
  endDate: number;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
}

export interface UseAllocationsByPeriodOptions {
  firmId: string;
  period: string;
}

export interface UsePendingAllocationsOptions {
  firmId: string;
  limit?: number;
}

export interface UseAllocationSummaryOptions {
  firmId: string;
  startDate?: number;
  endDate?: number;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
}

export interface UseMatterAllocationSummaryOptions {
  matterId: string;
}

export interface UsePaginatedAllocationsOptions {
  firmId?: string;
  allocationId?: string;
  matterId?: string;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  limit?: number;
}

// ============================================
// Query Hooks
// ============================================

export function useAllocation(options: UseAllocationOptions) {
  return useQuery({
    queryKey: ['allocation', options.allocationId],
    queryFn: async () => {
      const result = await getAllocationById(options.allocationId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch allocation');
      }
      return result.data;
    },
    enabled: !!options.allocationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useFirmAllocations(options: UseFirmAllocationsOptions) {
  return useQuery({
    queryKey: ['allocations', 'firm', options.firmId, options.status, options.limit],
    queryFn: async () => {
      const result = await getAllocationsByFirm(
        options.firmId,
        {
          status: options.status,
          limit: options.limit,
        }
      );
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch firm allocations');
      }
      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useAllocationsByDateRange(options: UseAllocationDateRangeOptions) {
  return useQuery({
    queryKey: ['allocations', 'dateRange', options.firmId, options.startDate, options.endDate, options.status],
    queryFn: async () => {
      const result = await getAllocationsByDateRange(
        options.firmId,
        options.startDate,
        options.endDate,
        { status: options.status }
      );
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch allocations by date range');
      }
      return result.data;
    },
    enabled: !!options.firmId && !!options.startDate && !!options.endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

export function useAllocationsByPeriod(options: UseAllocationsByPeriodOptions) {
  return useQuery({
    queryKey: ['allocations', 'period', options.firmId, options.period],
    queryFn: async () => {
      const result = await getAllocationsByPeriod(options.firmId, options.period);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch allocations by period');
      }
      return result.data;
    },
    enabled: !!options.firmId && !!options.period,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useAllocationsByStatus(options: { firmId: string; status: 'Draft' | 'Pending' | 'Finalized' | 'Locked' }) {
  return useQuery({
    queryKey: ['allocations', 'status', options.firmId, options.status],
    queryFn: async () => {
      const result = await getAllocationsByStatus(options.firmId, options.status);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch allocations by status');
      }
      return result.data;
    },
    enabled: !!options.firmId && !!options.status,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePendingAllocations(options: UsePendingAllocationsOptions) {
  return useQuery({
    queryKey: ['allocations', 'pending', options.firmId, options.limit],
    queryFn: async () => {
      const result = await getPendingAllocations(options.firmId, options.limit);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch pending allocations');
      }
      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useFinalizedAllocations(options: UsePendingAllocationsOptions) {
  return useQuery({
    queryKey: ['allocations', 'finalized', options.firmId, options.limit],
    queryFn: async () => {
      const result = await getFinalizedAllocations(options.firmId, options.limit);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch finalized allocations');
      }
      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllocationSummary(options: UseAllocationSummaryOptions) {
  return useQuery({
    queryKey: ['allocations', 'summary', options.firmId, options.startDate, options.endDate, options.status],
    queryFn: async () => {
      const result = await getAllocationSummary(options.firmId, options);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch allocation summary');
      }
      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMatterAllocationSummary(options: UseMatterAllocationSummaryOptions) {
  return useQuery({
    queryKey: ['allocations', 'matterSummary', options.matterId],
    queryFn: async () => {
      const result = await getMatterAllocationSummary(options.matterId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch matter allocation summary');
      }
      return result.data;
    },
    enabled: !!options.matterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePaginatedAllocations(options: UsePaginatedAllocationsOptions) {
  return useQuery({
    queryKey: ['allocations', 'paginated', options.firmId, options.allocationId, options.matterId, options.status],
    queryFn: async () => {
      const result = await getAllocationsPaginated(options);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch paginated allocations');
      }
      return result.data;
    },
    ...options,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createAllocation>[0]) => {
      const result = await createAllocation(input);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create allocation');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate allocations queries
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
    },
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      updates,
    }: {
      allocationId: string;
      updates: Parameters<typeof updateAllocation>[1];
    }) => {
      const result = await updateAllocation(allocationId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(['allocation', variables.allocationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...variables.updates,
          },
        };
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'summary'] });
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (allocationId: string) => {
      const result = await deleteAllocation(allocationId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete allocation');
      }
      return result;
    },
    onSuccess: (_, allocationId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['allocation', allocationId] });
      queryClient.removeQueries({ queryKey: ['allocations'] });
    },
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (allocationId: string) => {
      const result = await submitForApproval(allocationId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit allocation for approval');
      }
      return result;
    },
    onSuccess: (_, allocationId) => {
      // Optimistic update
      queryClient.setQueryData(['allocation', allocationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Pending',
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'pending'] });
    },
  });
}

export function useApproveAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      approvedBy,
      notes,
    }: {
      allocationId: string;
      approvedBy: string;
      notes?: string;
    }) => {
      const result = await approve(allocationId, approvedBy, notes);
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(['allocation', variables.allocationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Finalized',
            approvedAt: Date.now(),
            finalizedAt: Date.now(),
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'finalized'] });
    },
  });
}

export function useRejectAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      reason,
    }: {
      allocationId: string;
      reason: string;
    }) => {
      const result = await reject(allocationId, reason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(['allocation', variables.allocationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Draft',
            approvedAt: null,
            finalizedAt: null,
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'draft'] });
    },
  });
}

export function useFinalizeAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      notes,
      verifyBeforeFinalize,
    }: {
      allocationId: string;
      notes?: string;
      verifyBeforeFinalize?: boolean;
    }) => {
      const result = await finalize(allocationId, notes, verifyBeforeFinalize);
      if (!result.success) {
        throw new Error(result.error || 'Failed to finalize allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      if (variables.verifyBeforeFinalize !== false) {
        queryClient.setQueryData(['allocation', variables.allocationId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              status: 'Finalized',
              finalizedAt: Date.now(),
            },
          };
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'finalized'] });
    },
  });
}

export function useLockAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      reason,
    }: {
      allocationId: string;
      reason: string;
    }) => {
      const result = await lock(allocationId, reason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to lock allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(['allocation', variables.allocationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Locked',
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'pending'] });
    },
  });
}

export function useUnlockAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      reason,
    }: {
      allocationId: string;
      reason: string;
    }) => {
      const result = await unlock(allocationId, reason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to unlock allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(['allocation', variables.allocationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Draft',
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'draft'] });
    },
  });
}

export function useUndoAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      reason,
    }: {
      allocationId: string;
      reason: string;
    }) => {
      const result = await undo(allocationId, reason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to undo allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['allocation', variables.allocationId] });
      queryClient.removeQueries({ queryKey: ['allocations'] });

      // Invalidate matter allocations
      if (variables.allocationId) {
        queryClient.invalidateQueries({ queryKey: ['allocations', 'matterSummary', variables.allocationId] });
      }
    },
  });
}

// ============================================
// Workflow Mutation Hooks
// ============================================

export function useCreateAllocationWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createAllocationWorkflow>[0]) => {
      const result = await createAllocationWorkflow(input);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create allocation');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate allocations queries
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['allocations', 'summary'] });
    },
  });
}

export function useSubmitAllocationForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof submitForApproval>[0]) => {
      const result = await submitForApproval(input);
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit allocation for approval');
      }
      return result;
    },
    onSuccess: (data, variables) => {
      // Optimistic update
      queryClient.setQueryData(['allocation', variables.allocationId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Pending',
          },
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'pending'] });
    },
  });
}

export function useDeleteAllocationWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      reason,
    }: {
      allocationId: string;
      reason: string;
    }) => {
      const result = await deleteAllocation(allocationId, reason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete allocation');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['allocation', variables.allocationId] });
      queryClient.removeQueries({ queryKey: ['allocations'] });

      // Invalidate summary queries
      queryClient.invalidateQueries({ queryKey: ['allocations', 'summary'] });

      // Invalidate matter allocation summaries
      if (variables.allocationId) {
        queryClient.invalidateQueries({ queryKey: ['allocations', 'matterSummary', variables.allocationId] });
      }
    },
  });
}

// ============================================
// Preview Hooks
// ============================================

export function useAllocationPreview(options: {
  tier1MatterIds: string[];
  tier1Balances: number[];
  tier2MatterIds: string[];
  tier2Balances: number[];
  totalInterest: number;
}) {
  return useQuery({
    queryKey: ['allocation', 'preview', options.tier1MatterIds, options.tier1Balances, options.tier2MatterIds, options.tier2Balances, options.totalInterest],
    queryFn: async () => {
      const { getAllocationPreview } = await import('@/services/allocationWorkflow.service');
      const result = await getAllocationPreview({
        tier1Matters: options.tier1MatterIds.map((id) => ({ id, principalBalance: 0 })),
        tier1Balances: options.tier1Balances,
        tier2Matters: options.tier2MatterIds.map((id) => ({ id, principalBalance: 0 })),
        tier2Balances: options.tier2Balances,
        totalInterest: options.totalInterest,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get allocation preview');
      }
      return result.data;
    },
    enabled: !!options.tier1MatterIds.length && !!options.totalInterest,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// Real-time Subscription Hooks
// ============================================

export function useAllocationRealtime(
  allocationId: string,
  onUpdate: (allocation: FirestoreDocument<FirestoreAllocation> | null) => void,
  onError?: (error: any) => void
) {
  const [allocation, setAllocation] = React.useState<FirestoreDocument<FirestoreAllocation> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!allocationId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToAllocation(
      allocationId,
      (data) => {
        setAllocation(data);
        setLoading(false);
        onUpdate(data);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
        onError?.(err);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [allocationId]);

  return { allocation, loading, error };
}

export function useFirmAllocationsRealtime(
  firmId: string,
  options?: {
    status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  },
  onUpdate: (allocations: FirestoreDocument<FirestoreAllocation>[]) => void,
  onError?: (error: any) => void
) {
  const [allocations, setAllocations] = React.useState<FirestoreDocument<FirestoreAllocation>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!firmId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFirmAllocations(
      firmId,
      options,
      (data) => {
        setAllocations(data);
        setLoading(false);
        onUpdate(data);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
        onError?.(err);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [firmId, options?.status]);

  return { allocations, loading, error };
}

export function usePendingAllocationsRealtime(
  firmId: string,
  options?: {
    limit?: number;
  },
  onUpdate: (allocations: FirestoreDocument<FirestoreAllocation>[]) => void,
  onError?: (error: any) => void
) {
  const [allocations, setAllocations] = React.useState<FirestoreDocument<FirestoreAllocation>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!firmId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPendingAllocations(
      firmId,
      options,
      (data) => {
        setAllocations(data);
        setLoading(false);
        onUpdate(data);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
        onError?.(err);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [firmId, options?.limit]);

  return { allocations, loading, error };
}
