/**
 * useTransactions Hook
 *
 * TanStack Query hook for managing transactions data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransactions,
  fetchTransactionsByMatter,
  createTransaction,
  updateTransaction,
} from '../../services/api';

export interface UseTransactionsOptions {
  enabled?: boolean;
  matterId?: string;
}

/**
 * Fetch all transactions
 */
export function useTransactions(options: UseTransactionsOptions = {}) {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    enabled: options.enabled !== undefined ? options.enabled : true,
    staleTime: 1000 * 60 * 3, // 3 minutes for transactions
  });
}

/**
 * Fetch transactions by matter ID
 */
export function useTransactionsByMatter(matterId: string, options: UseTransactionsOptions = {}) {
  return useQuery({
    queryKey: ['transactions', 'matter', matterId],
    queryFn: () => fetchTransactionsByMatter(matterId),
    enabled: options.enabled !== undefined ? options.enabled : !!matterId,
  });
}

/**
 * Create transaction mutation
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      // Invalidate transactions queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      console.error('Failed to create transaction:', error);
    },
  });
}

/**
 * Update transaction mutation
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      // Invalidate transactions queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      console.error('Failed to update transaction:', error);
    },
  });
}
