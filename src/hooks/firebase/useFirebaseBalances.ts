/**
 * Firebase Balances Hook
 *
 * React Query integration for daily balances collection.
 *
 * @module hooks/firebase/useFirebaseBalances
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  getDailyBalanceById,
  getDailyBalancesByMatter,
  getLatestDailyBalance,
  getDailyBalancesByFirm,
  getDailyBalancesPaginated,
  getDailyBalanceForDate,
  getBalanceHistory,
  getBalanceSummary,
  createDailyBalance,
  updateDailyBalance,
  deleteDailyBalance,
  createDailyBalancesBatch,
  updateDailyBalancesBatch,
  deleteDailyBalancesByDateRange,
  dailyBalanceExists,
  getCachedDailyBalances,
  subscribeToDailyBalance,
  subscribeToMatterDailyBalances,
  type OperationResult,
  type FirestoreDocument,
} from '@/services/firebase/dailyBalances.service';
import type { FirestoreDailyBalance } from '@/types/firestore';

// ============================================
// Types
// ============================================

export interface UseDailyBalanceOptions extends Omit<UseQueryOptions<FirestoreDocument<FirestoreDailyBalance>>, 'queryKey'> {
  balanceId: string;
}

export interface UseMatterBalancesOptions {
  matterId: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

export interface UseFirmBalancesOptions {
  firmId: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

export interface UsePaginatedBalancesOptions {
  matterId?: string;
  firmId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

export interface UseBalanceHistoryOptions {
  matterId: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

// ============================================
// Query Hooks
// ============================================

export function useDailyBalance(options: UseDailyBalanceOptions) {
  const { balanceId, ...queryOptions } = options;

  return useQuery({
    queryKey: ['dailyBalance', balanceId],
    queryFn: async () => {
      const result = await getDailyBalanceById(balanceId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch daily balance');
      }
      return result.data;
    },
    enabled: !!balanceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
}

export function useMatterBalances(options: UseMatterBalancesOptions) {
  const { matterId, startDate, endDate, limit, ...queryOptions } = options;

  return useQuery({
    queryKey: ['dailyBalances', 'matter', matterId, { startDate, endDate, limit }],
    queryFn: async () => {
      const result = await getDailyBalancesByMatter(matterId, {
        startDate,
        endDate,
        limit,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch daily balances');
      }
      return result.data;
    },
    enabled: !!matterId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...queryOptions,
  });
}

export function useFirmBalances(options: UseFirmBalancesOptions) {
  const { firmId, startDate, endDate, limit, ...queryOptions } = options;

  return useQuery({
    queryKey: ['dailyBalances', 'firm', firmId, { startDate, endDate, limit }],
    queryFn: async () => {
      const result = await getDailyBalancesByFirm(firmId, {
        startDate,
        endDate,
        limit,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch daily balances');
      }
      return result.data;
    },
    enabled: !!firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
}

export function useDailyBalanceForDate(
  matterId: string,
  date: number,
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreDailyBalance>>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['dailyBalance', 'matter', matterId, 'date', date],
    queryFn: async () => {
      const result = await getDailyBalanceForDate(matterId, date);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch daily balance for date');
      }
      return result.data;
    },
    enabled: !!matterId && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useLatestDailyBalance(
  matterId: string,
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreDailyBalance>>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['dailyBalance', 'latest', matterId],
    queryFn: async () => {
      const result = await getLatestDailyBalance(matterId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch latest daily balance');
      }
      return result.data;
    },
    enabled: !!matterId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useBalanceHistory(options: UseBalanceHistoryOptions) {
  const { matterId, startDate, endDate, limit, ...queryOptions } = options;

  return useQuery({
    queryKey: ['dailyBalances', 'history', matterId, { startDate, endDate, limit }],
    queryFn: async () => {
      const result = await getBalanceHistory({
        matterId,
        startDate,
        endDate,
        limit,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch balance history');
      }
      return result.data;
    },
    enabled: !!matterId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...queryOptions,
  });
}

export function useBalanceSummary(options: UseBalanceHistoryOptions) {
  const { matterId, startDate, endDate, ...queryOptions } = options;

  return useQuery({
    queryKey: ['dailyBalances', 'summary', matterId, startDate, endDate],
    queryFn: async () => {
      const result = await getBalanceSummary({
        matterId,
        startDate,
        endDate,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch balance summary');
      }
      return result.data;
    },
    enabled: !!matterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });
}

export function useCachedDailyBalances(
  matterId: string,
  count: number = 30,
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreDailyBalance>[]>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['dailyBalances', 'cached', matterId, count],
    queryFn: async () => {
      const result = await getCachedDailyBalances(matterId, count);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch cached daily balances');
      }
      return result.data;
    },
    enabled: !!matterId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
}

export function usePaginatedBalances(options: UsePaginatedBalancesOptions) {
  const { matterId, firmId, startDate, endDate, limit, ...queryOptions } = options;

  return useQuery({
    queryKey: ['dailyBalances', 'paginated', matterId, firmId, {
      startDate,
      endDate,
      limit,
    }],
    queryFn: async () => {
      const result = await getDailyBalancesPaginated(
        { matterId, firmId, startDate, endDate },
        { pageSize: limit || 50 }
      );
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch paginated daily balances');
      }
      return result.data;
    },
    enabled: !!(matterId || firmId),
    ...queryOptions,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateDailyBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createDailyBalance>[0]) => {
      const result = await createDailyBalance(input);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create daily balance');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Optimistic update for matter balance
      if (variables.matterId) {
        queryClient.setQueryData(
          ['dailyBalance', 'latest', variables.matterId],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: {
                ...old.data,
                principalBalance: variables.principal,
                balance: variables.principal + variables.interestToDate,
              },
            };
          }
        );
      }

      // Invalidate daily balance queries
      queryClient.invalidateQueries({
        queryKey: ['dailyBalances', 'matter', variables.matterId],
      });
    },
  });
}

export function useUpdateDailyBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      balanceId,
      updates,
    }: {
      balanceId: string;
      updates: Parameters<typeof updateDailyBalance>[1];
    }) => {
      const result = await updateDailyBalance(balanceId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update daily balance');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(
        ['dailyBalance', variables.balanceId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: {
              ...old.data,
              ...variables.updates,
            },
          };
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['dailyBalances', 'matter'],
      });
    },
  });
}

export function useDeleteDailyBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (balanceId: string) => {
      const result = await deleteDailyBalance(balanceId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete daily balance');
      }
      return result;
    },
    onSuccess: (_, balanceId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['dailyBalance', balanceId] });

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['dailyBalances', 'matter'],
      });
    },
  });
}

export function useCreateDailyBalancesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: Parameters<typeof createDailyBalancesBatch>[0]) => {
      const result = await createDailyBalancesBatch(inputs);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create daily balances batch');
      }
      return result;
    },
    onSuccess: (data, variables) => {
      // Invalidate all daily balance queries
      queryClient.invalidateQueries({
        queryKey: ['dailyBalances'],
      });
    },
  });
}

export function useUpdateDailyBalancesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: Parameters<typeof updateDailyBalancesBatch>[0]) => {
      const result = await updateDailyBalancesBatch(inputs);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update daily balances batch');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate all daily balance queries
      queryClient.invalidateQueries({
        queryKey: ['dailyBalances'],
      });
    },
  });
}

export function useDeleteDailyBalancesByDateRange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matterId,
      startDate,
      endDate,
    }: {
      matterId: string;
      startDate: number;
      endDate: number;
    }) => {
      const result = await deleteDailyBalancesByDateRange(
        matterId,
        startDate,
        endDate
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete daily balances');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate daily balance queries
      queryClient.invalidateQueries({
        queryKey: ['dailyBalances', 'matter', variables.matterId],
      });
    },
  });
}

// ============================================
// Real-time Subscription Hooks
// ============================================

export function useDailyBalanceRealtime(
  balanceId: string,
  onUpdate: (balance: FirestoreDocument<FirestoreDailyBalance> | null) => void,
  onError?: (error: any) => void
) {
  const [balance, setBalance] = React.useState<FirestoreDocument<FirestoreDailyBalance> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!balanceId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToDailyBalance(
      balanceId,
      (data) => {
        setBalance(data);
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
  }, [balanceId]);

  return { balance, loading, error };
}

export function useMatterDailyBalancesRealtime(
  matterId: string,
  options?: {
    startDate?: number;
    endDate?: number;
    limit?: number;
  },
  onUpdate: (balances: FirestoreDocument<FirestoreDailyBalance>[]) => void,
  onError?: (error: any) => void
) {
  const [balances, setBalances] = React.useState<FirestoreDocument<FirestoreDailyBalance>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!matterId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToMatterDailyBalances(
      matterId,
      options,
      (data) => {
        setBalances(data);
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
  }, [matterId]);

  return { balances, loading, error };
}
