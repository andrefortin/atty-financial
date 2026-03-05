/**
 * Firebase Rates Hook
 *
 * React Query integration for rate entries collection.
 *
 * @module hooks/firebase/useFirebaseRates
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  getRateEntryById,
  getRateEntriesByFirm,
  getGlobalRateEntries,
  getEffectiveRate,
  getCurrentRate,
  getRateEntriesByDateRange,
  detectRateChanges,
  getRateCalendar,
  createRateEntry,
  updateRateEntry,
  deleteRateEntry,
  subscribeToRateEntry,
  subscribeToFirmRateEntries,
  subscribeToGlobalRateEntries,
  type OperationResult,
  type FirestoreDocument,
} from '@/services/firebase/rateEntries.service';
import type { FirestoreRateEntry, RateLookupResult, RateCalendarEntry } from '@/types/firestore';

// ============================================
// Types
// ============================================

export interface UseRateEntryOptions extends Omit<UseQueryOptions<FirestoreDocument<FirestoreRateEntry>>, 'queryKey'> {
  rateEntryId: string;
}

export interface UseFirmRatesOptions {
  firmId: string;
  limit?: number;
}

export interface UseGlobalRatesOptions {
  limit?: number;
}

export interface UseEffectiveRateOptions {
  firmId?: string;
  targetDate?: number;
}

export interface UseRateCalendarOptions {
  firmId?: string;
  startDate: number;
  endDate: number;
}

export interface UseRateChangesOptions {
  firmId?: string;
  startDate: number;
  endDate: number;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Hook to fetch a rate entry by ID
 */
export function useRateEntry(options: UseRateEntryOptions) {
  return useQuery({
    queryKey: ['rateEntry', options.rateEntryId],
    queryFn: async () => {
      const result = await getRateEntryById(options.rateEntryId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch rate entry');
      }
      return result.data;
    },
    enabled: !!options.rateEntryId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch rates by firm
 */
export function useFirmRates(options: UseFirmRatesOptions) {
  const { firmId, limit, ...queryOptions } = options;

  return useQuery({
    queryKey: ['rates', 'firm', firmId, { limit }],
    queryFn: async () => {
      const result = await getRateEntriesByFirm(firmId, { limit });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch firm rates');
      }
      return result.data;
    },
    enabled: !!firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
}

/**
 * Hook to fetch global rates
 */
export function useGlobalRates(options?: UseGlobalRatesOptions) {
  return useQuery({
    queryKey: ['rates', 'global', options?.limit],
    queryFn: async () => {
      const result = await getGlobalRateEntries(options);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch global rates');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to get effective rate for a date
 */
export function useEffectiveRate(options: UseEffectiveRateOptions) {
  const { firmId, targetDate = Date.now(), ...queryOptions } = options;

  return useQuery({
    queryKey: ['rates', 'effective', firmId, targetDate],
    queryFn: async () => {
      const result = await getEffectiveRate(targetDate, firmId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get effective rate');
      }
      return result.data;
    },
    enabled: !!targetDate,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...queryOptions,
  });
}

/**
 * Hook to get current effective rate
 */
export function useCurrentRate(firmId?: string) {
  return useQuery({
    queryKey: ['rates', 'current', firmId],
    queryFn: async () => {
      const result = await getCurrentRate(firmId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get current rate');
      }
      return result.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get rate entries by date range
 */
export function useRateEntriesByDateRange(
  startDate: number,
  endDate: number,
  firmId?: string,
  queryOptions?: Omit<UseQueryOptions<FirestoreDocument<FirestoreRateEntry>[]>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['rates', 'range', startDate, endDate, firmId],
    queryFn: async () => {
      const result = await getRateEntriesByDateRange(startDate, endDate, firmId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch rate entries by date range');
      }
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...queryOptions,
  });
}

/**
 * Hook to detect rate changes
 */
export function useRateChanges(
  startDate: number,
  endDate: number,
  firmId?: string,
  queryOptions?: Omit<UseQueryOptions<Array<{ date: number; oldRate: number; newRate: number }>>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['rates', 'changes', startDate, endDate, firmId],
    queryFn: async () => {
      const result = await detectRateChanges(startDate, endDate, firmId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to detect rate changes');
      }
      return result.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    ...queryOptions,
  });
}

/**
 * Hook to get rate calendar
 */
export function useRateCalendar(options: UseRateCalendarOptions) {
  const { firmId, startDate, endDate, ...queryOptions } = options;

  return useQuery({
    queryKey: ['rates', 'calendar', firmId, startDate, endDate],
    queryFn: async () => {
      const result = await getRateCalendar(startDate, endDate, firmId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get rate calendar');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryOptions,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook to create a rate entry
 */
export function useCreateRateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createRateEntry>[0]) => {
      const result = await createRateEntry(input);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create rate entry');
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate rates queries
      queryClient.invalidateQueries({ queryKey: ['rates'] });
    },
  });
}

/**
 * Hook to update a rate entry
 */
export function useUpdateRateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rateEntryId,
      updates,
    }: {
        rateEntryId: string;
        updates: Parameters<typeof updateRateEntry>[1];
      }) => {
      const result = await updateRateEntry(rateEntryId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update rate entry');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Optimistic update
      queryClient.setQueryData(
        ['rateEntry', variables.rateEntryId],
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

      // Invalidate rates queries
      queryClient.invalidateQueries({ queryKey: ['rates', 'effective'] });
    },
  });
}

/**
 * Hook to delete a rate entry
 */
export function useDeleteRateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rateEntryId: string) => {
      const result = await deleteRateEntry(rateEntryId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete rate entry');
      }
      return result;
    },
    onSuccess: (_, rateEntryId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['rateEntry', rateEntryId] });

      // Invalidate rates queries
      queryClient.invalidateQueries({ queryKey: ['rates', 'effective', 'calendar'] });
    },
  });
}

// ============================================
// Real-time Subscription Hooks
// ============================================

/**
 * Hook to subscribe to a rate entry
 */
export function useRateEntryRealtime(
  rateEntryId: string,
  onUpdate: (rateEntry: FirestoreDocument<FirestoreRateEntry> | null) => void,
  onError?: (error: any) => void
) {
  const [rateEntry, setRateEntry] = React.useState<FirestoreDocument<FirestoreRateEntry> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!rateEntryId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToRateEntry(
      rateEntryId,
      (data) => {
        setRateEntry(data);
        setLoading(false);
        onUpdate(data);
      },
      (err) => {
        setError(err);
        setLoading(false);
        onError?.(err);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [rateEntryId]);

  return { rateEntry, loading, error };
}

/**
 * Hook to subscribe to firm rate entries
 */
export function useFirmRatesRealtime(
  firmId: string,
  options?: {
    limit?: number;
  },
  onUpdate: (rateEntries: FirestoreDocument<FirestoreRateEntry>[]) => void,
  onError?: (error: any) => void
) {
  const [rateEntries, setRateEntries] = React.useState<FirestoreDocument<FirestoreRateEntry>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!firmId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFirmRateEntries(
      firmId,
      options,
      (data) => {
        setRateEntries(data);
        setLoading(false);
        onUpdate(data);
      },
      (err) => {
        setError(err);
        setLoading(false);
        onError?.(err);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [firmId]);

  return { rateEntries, loading, error };
}

/**
 * Hook to subscribe to global rate entries
 */
export function useGlobalRatesRealtime(
  options?: {
    limit?: number;
  },
  onUpdate: (rateEntries: FirestoreDocument<FirestoreRateEntry>[]) => void,
  onError?: (error: any) => void
) {
  const [rateEntries, setRateEntries] = React.useState<FirestoreDocument<FirestoreRateEntry>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToGlobalRateEntries(
      options,
      (data) => {
        setRateEntries(data);
        setLoading(false);
        onUpdate(data);
      },
      (err) => {
        setError(err);
        setLoading(false);
        onError?.(err);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, []);

  return { rateEntries, loading, error };
}
