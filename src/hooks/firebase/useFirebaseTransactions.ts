/**
 * Firebase Transactions Hook
 *
 * React Query integration for transactions collection with real-time subscriptions.
 *
 * @module hooks/firebase/useFirebaseTransactions
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  createTransaction,
  getTransactionById,
  getTransactionsByFirm,
  getTransactionsByMatter,
  updateTransaction as updateTransactionDoc,
  postTransaction,
  updateTransactionStatus,
  searchTransactions,
  subscribeToFirmTransactions,
  type OperationResult,
  type FirestoreDocument,
} from '@/services/firebase';
import type { FirestoreTransaction } from '@/types/firestore';

// ============================================
// Types
// ============================================

export interface UseTransactionOptions extends Omit<UseQueryOptions<FirestoreDocument<FirestoreTransaction>>, 'queryKey'> {
  transactionId: string;
}

export interface UseFirmTransactionsOptions {
  firmId: string;
  status?: FirestoreTransaction['data']['status'];
  type?: FirestoreTransaction['data']['type'];
}

// ============================================
// Query Hooks
// ============================================

export function useTransaction(options: UseTransactionOptions) {
  const { transactionId, ...queryOptions } = options;

  return useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      const result = await getTransactionById(transactionId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch transaction');
      }
      return result.data;
    },
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

export function useFirmTransactions(options: UseFirmTransactionsOptions) {
  const { firmId, status, type, ...queryOptions } = options;

  return useQuery({
    queryKey: ['transactions', 'firm', firmId, { status, type }],
    queryFn: async () => {
      const result = await getTransactionsByFirm(firmId, { status, type });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
      return result.data;
    },
    enabled: !!firmId,
    staleTime: 2 * 60 * 1000,
    ...queryOptions,
  });
}

export function useMatterTransactions(
  matterId: string,
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreTransaction>[]>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['transactions', 'matter', matterId],
    queryFn: async () => {
      const result = await getTransactionsByMatter(matterId);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
      return result.data;
    },
    enabled: !!matterId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useSearchTransactions(
  firmId: string,
  searchTerm: string,
  options?: Omit<UseQueryOptions<FirestoreDocument<FirestoreTransaction>[]>, 'queryKey'>
) {
  return useQuery({
    queryKey: ['transactions', 'search', firmId, searchTerm],
    queryFn: async () => {
      const result = await searchTransactions(firmId, searchTerm);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to search transactions');
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

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof createTransaction>[0]) => {
      const result = await createTransaction(input);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create transaction');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      if (variables.matterId) {
        queryClient.invalidateQueries({ queryKey: ['transactions', 'matter', variables.matterId] });
      }
      queryClient.invalidateQueries({ queryKey: ['transactions', 'firm', variables.firmId] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      updates,
    }: {
        transactionId: string;
        updates: Parameters<typeof updateTransactionDoc>[1];
      }) => {
      const result = await updateTransactionDoc(transactionId, updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update transaction');
      }
      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(['transaction', variables.transactionId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...variables.updates,
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function usePostTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, postedBy }: { transactionId: string; postedBy?: string }) => {
      const result = await postTransaction(transactionId, postedBy);
      if (!result.success) {
        throw new Error(result.error || 'Failed to post transaction');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['transaction', variables.transactionId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: 'posted',
            postedBy: variables.postedBy,
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      newStatus,
    }: {
        transactionId: string;
        newStatus: Parameters<typeof updateTransactionStatus>[1];
      }) => {
      const result = await updateTransactionStatus(transactionId, newStatus);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update transaction status');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(['transaction', variables.transactionId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: variables.newStatus,
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// Real-time
export function useFirmTransactionsRealtime(options: UseFirmTransactionsOptions) {
  const { firmId, status, type } = options;
  const [transactions, setTransactions] = React.useState<FirestoreDocument<FirestoreTransaction>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!firmId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToFirmTransactions(
      firmId,
      { status, type },
      (data) => {
        setTransactions(data);
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
  }, [firmId, status, type]);

  return { transactions, loading, error };
}
