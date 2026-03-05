/**
 * Firebase Matters Hook
 *
 * React Query integration for matters collection with real-time subscriptions.
 *
 * @module hooks/firebase/useFirebaseMatters
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  createMatter,
  getMatterById,
  getMattersByFirm,
  updateMatter,
  deleteMatter as deleteMatterDoc,
  closeMatter,
  reopenMatter,
  searchMatters,
  subscribeToFirmMatters,
  type OperationResult,
  type FirestoreDocument,
  type PaginationOptions,
} from '@/services/firebase';
import type { FirestoreMatter } from '@/types/firestore';

// ============================================
// Types
// ============================================

export interface UseMatterOptions extends Omit<UseQueryOptions<FirestoreDocument<FirestoreMatter>>, 'queryKey'> {
  matterId: string;
}

export interface UseFirmMattersOptions {
  firmId: string;
  includeInactive?: boolean;
  status?: FirestoreMatter['data']['status'];
}

// ============================================
// Query Hooks
// ============================================

export function useMatter(options: UseMatterOptions) {
  const { matterId, ...queryOptions } = options;

  return useQuery({
    queryKey: ['matter', matterId],
    queryFn: async () => {
      const result = await getMatterById(matterId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch matter');
      }
      return result.data;
    },
    enabled: !!matterId,
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

export function useFirmMatters(options: UseFirmMattersOptions) {
  const { firmId, includeInactive, status, ...queryOptions } = options;

  return useQuery({
    queryKey: ['matters', 'firm', firmId, { includeInactive, status }],
    queryFn: async () => {
      const result = await getMattersByFirm(firmId, {
        includeInactive,
        status,
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch matters');
      }
      return result.data;
    },
    enabled: !!firmId,
    staleTime: 2 * 60 * 1000,
    ...queryOptions,
  });
}

export function useSearchMatters(
  firmId: string,
  searchTerm: string,
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreMatter>[]>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['matters', 'search', firmId, searchTerm],
    queryFn: async () => {
      const result = await searchMatters(firmId, searchTerm);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to search matters');
      }
      return result.data;
    },
    enabled: !!firmId && searchTerm.length >= 2,
    staleTime: 30 * 1000,
    ...options,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createMatter>[0]) => {
      const result = await createMatter(input);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create matter');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matters', 'firm', variables.firmId] });
      queryClient.invalidateQueries({ queryKey: ['matters', 'search'] });
    },
  });
}

export function useUpdateMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matterId,
      updates,
    }: {
        matterId: string;
        updates: Parameters<typeof updateMatter>[1];
      }) => {
      const result = await updateMatter(matterId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update matter');
      }
      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(['matter', variables.matterId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...variables.updates,
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
  });
}

export function useDeleteMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matterId: string) => {
      const result = await deleteMatterDoc(matterId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete matter');
      }
      return result;
    },
    onSuccess: (_, matterId) => {
      queryClient.removeQueries({ queryKey: ['matter', matterId] });
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
  });
}

export function useCloseMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matterId,
      closeDate,
    }: {
        matterId: string;
        closeDate?: number;
      }) => {
      const result = await closeMatter(matterId, closeDate);
      if (!result.success) {
        throw new Error(result.error || 'Failed to close matter');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['matter', variables.matterId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Closed',
            closeDate: variables.closeDate || Date.now(),
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
  });
}

export function useReopenMatter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matterId: string) => {
      const result = await reopenMatter(matterId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to reopen matter');
      }
      return result;
    },
    onSuccess: (_, matterId) => {
      queryClient.setQueryData(['matter', matterId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'Active',
            closeDate: undefined,
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['matters'] });
    },
  });
}

// Real-time
export function useFirmMattersRealtime(options: UseFirmMattersOptions) {
  const { firmId, includeInactive, status } = options;
  const [matters, setMatters] = React.useState<FirestoreDocument<FirestoreMatter>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!firmId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFirmMatters(
      firmId,
      { includeInactive, status },
      (data) => {
        setMatters(data);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, [firmId, includeInactive, status]);

  return { matters, loading, error };
}
