/**
 * BankJoy Hooks
 *
 * React Query integration for BankJoy API.
 * Read-only access as per security requirements.
 *
 * @module hooks/useBankJoy
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBankJoyClient,
  type BankJoyClientConfig,
} from '@/services/bankjoy/client';
import {
  getBankJoyTransactionsService,
  type TransactionFilterOptions,
  type TransactionFetchResult,
} from '@/services/bankjoy/transactions.service';
import type { NormalizedTransaction } from '@/services/bankjoy/transactions.service';

// ============================================
// Types
// ============================================

export interface UseBankJoyTransactionsOptions {
  firmId: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  type?: 'credit' | 'debit';
  minAmount?: number;
  maxAmount?: number;
  counterparty?: string;
  referenceNumber?: string;
  page?: number;
  pageSize?: number;
}

export interface UseBankJoyTransactionOptions {
  transactionId: string;
}

export interface UseBankJoyCreditTransactionsOptions extends UseBankJoyTransactionsOptions {}

export interface UseBankJoyDebitTransactionsOptions extends UseBankJoyTransactionsOptions {}

export interface UseBankJoyTransactionsByReferenceOptions {
  referenceNumber: string;
  accountId?: string;
  bankId?: string;
  page?: number;
  pageSize?: number;
}

export interface UseBankJoyTransactionsForDateRangeOptions {
  startDate: string;
  endDate: string;
  accountId?: string;
  bankId?: string;
  page?: number;
  pageSize?: number;
}

export interface UseBankJoyTransactionsByCounterpartyOptions {
  counterparty: string;
  accountId?: string;
  bankId?: string;
  page?: number;
  pageSize?: number;
}

export interface UseBankJoyAccountsOptions {
  bankId?: string;
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch BankJoy transactions
 *
 * @param options - Query options
 * @returns Query result with transactions
 */
export function useBankJoyTransactions(
  options: UseBankJoyTransactionsOptions
): {
  data: NormalizedTransaction[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const result = useQuery<TransactionFetchResult>({
    queryKey: ['bankjoy', 'transactions', options],
    queryFn: async () => {
      const transactionsService = getBankJoyTransactionsService();
      const filterOptions: TransactionFilterOptions = {
        accountId: options.accountId,
        bankId: options.bankId,
        startDate: options.startDate,
        endDate: options.endDate,
        minAmount: options.minAmount,
        maxAmount: options.maxAmount,
        type: options.type,
        counterparty: options.counterparty,
        referenceNumber: options.referenceNumber,
        page: options.page,
        pageSize: options.pageSize,
      };

      return await transactionsService.fetchTransactions(filterOptions);
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data: result.data?.transactions,
    totalCount: result.data?.totalCount || 0,
    page: result.data?.page || 1,
    pageSize: result.data?.pageSize || 50,
    hasMore: result.data?.hasMore || false,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Fetch BankJoy transaction by ID
 *
 * @param options - Query options
 * @returns Query result with transaction
 */
export function useBankJoyTransaction(
  options: UseBankJoyTransactionOptions
): {
  data: NormalizedTransaction | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const result = useQuery<NormalizedTransaction | null>({
    queryKey: ['bankjoy', 'transaction', options.transactionId],
    queryFn: async () => {
      const transactionsService = getBankJoyTransactionsService();
      return await transactionsService.fetchTransactionById(options.transactionId);
    },
    enabled: !!options.transactionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: result.data || undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Fetch BankJoy credit transactions
 *
 * @param options - Query options
 * @returns Query result with credit transactions
 */
export function useBankJoyCreditTransactions(
  options: UseBankJoyCreditTransactionsOptions
): {
  data: NormalizedTransaction[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useBankJoyTransactions({
    ...options,
    type: 'credit',
  });
}

/**
 * Fetch BankJoy debit transactions
 *
 * @param options - Query options
 * @returns Query result with debit transactions
 */
export function useBankJoyDebitTransactions(
  options: UseBankJoyDebitTransactionsOptions
): {
  data: NormalizedTransaction[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useBankJoyTransactions({
    ...options,
    type: 'debit',
  });
}

/**
 * Search BankJoy transactions by reference number
 *
 * @param options - Query options
 * @returns Query result with matching transactions
 */
export function useBankJoyTransactionsByReference(
  options: UseBankJoyTransactionsByReferenceOptions
): {
  data: NormalizedTransaction[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const result = useQuery<TransactionFetchResult>({
    queryKey: ['bankjoy', 'transactions', 'reference', options.referenceNumber],
    queryFn: async () => {
      const transactionsService = getBankJoyTransactionsService();
      return await transactionsService.searchTransactionsByReference(options.referenceNumber, {
        accountId: options.accountId,
        bankId: options.bankId,
        pageSize: options.pageSize,
      });
    },
    enabled: !!options.referenceNumber,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data: result.data?.transactions,
    totalCount: result.data?.totalCount || 0,
    page: result.data?.page || 1,
    pageSize: result.data?.pageSize || 50,
    hasMore: result.data?.hasMore || false,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Get BankJoy transactions for date range
 *
 * @param options - Query options
 * @returns Query result with transactions for date range
 */
export function useBankJoyTransactionsForDateRange(
  options: UseBankJoyTransactionsForDateRangeOptions
): {
  data: NormalizedTransaction[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const result = useQuery<TransactionFetchResult>({
    queryKey: ['bankjoy', 'transactions', 'daterange', options.startDate, options.endDate],
    queryFn: async () => {
      const transactionsService = getBankJoyTransactionsService();
      return await transactionsService.getTransactionsForDateRange(
        options.startDate,
        options.endDate,
        {
          accountId: options.accountId,
          bankId: options.bankId,
          pageSize: options.pageSize,
        }
      );
    },
    enabled: !!options.startDate && !!options.endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data: result.data?.transactions,
    totalCount: result.data?.totalCount || 0,
    page: result.data?.page || 1,
    pageSize: result.data?.pageSize || 50,
    hasMore: result.data?.hasMore || false,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Get BankJoy transactions by counterparty
 *
 * @param options - Query options
 * @returns Query result with transactions for counterparty
 */
export function useBankJoyTransactionsByCounterparty(
  options: UseBankJoyTransactionsByCounterpartyOptions
): {
  data: NormalizedTransaction[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const result = useQuery<TransactionFetchResult>({
    queryKey: ['bankjoy', 'transactions', 'counterparty', options.counterparty],
    queryFn: async () => {
      const transactionsService = getBankJoyTransactionsService();
      return await transactionsService.getTransactionsByCounterparty(options.counterparty, {
        accountId: options.accountId,
        bankId: options.bankId,
        pageSize: options.pageSize,
      });
    },
    enabled: !!options.counterparty,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data: result.data?.transactions,
    totalCount: result.data?.totalCount || 0,
    page: result.data?.page || 1,
    pageSize: result.data?.pageSize || 50,
    hasMore: result.data?.hasMore || false,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

/**
 * Get BankJoy transactions for specific account
 *
 * @param options - Query options
 * @returns Query result with transactions for account
 */
export function useBankJoyAccountTransactions(
  accountId: string
): {
  data: NormalizedTransaction[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const result = useQuery<TransactionFetchResult>({
    queryKey: ['bankjoy', 'account', 'transactions', accountId],
    queryFn: async () => {
      const transactionsService = getBankJoyTransactionsService();
      return await transactionsService.fetchTransactions({
        accountId,
        page: 1,
        pageSize: 100,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      });
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data: result.data?.transactions,
    totalCount: result.data?.totalCount || 0,
    page: result.data?.page || 1,
    pageSize: result.data?.pageSize || 100,
    hasMore: result.data?.hasMore || false,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Match BankJoy transaction to matter
 *
 * @returns Mutation hook
 */
export function useMatchBankJoyTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bankJoyTransactionId,
      matterId,
      forceMatch = false,
    }) => {
      // Import matching service
      const { getBankJoyMatchingService } = await import('@/services/bankjoy/matching.service');
      const matchingService = getBankJoyMatchingService();

      // Get transactions service
      const { getBankJoyTransactionsService } = await import('@/services/bankjoy/transactions.service');
      const transactionsService = getBankJoyTransactionsService();

      // Fetch BankJoy transaction
      const transaction = await transactionsService.fetchTransactionById(bankJoyTransactionId);

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get matter details
      const { getMatterById } = await import('@/services/firebase/matters.service');
      const matterResult = await getMatterById(matterId);

      if (!matterResult.success || !matterResult.data) {
        throw new Error('Matter not found');
      }

      const matter = matterResult.data.data;

      // Normalize transaction and matter
      const bankJoyTransactions = [{
        id: transaction.id,
        referenceNumber: transaction.referenceNumber,
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        type: transaction.type,
        counterparty: transaction.counterparty,
        accountNumber: transaction.accountNumber,
        accountType: transaction.accountType,
        accountName: transaction.accountName,
      }];

      const matters = [{
        id: matter.id,
        matterId: matter.data.matterId,
        clientName: matter.data.clientName,
        principalBalance: matter.data.principalBalance,
      }];

      // Perform matching
      const matches = matchingService.matchByReferenceNumber(
        bankJoyTransactions,
        matters
      );

      // Check match result
      const matchResult = matches.get(bankJoyTransactionId);

      if (!matchResult || matchResult.status !== 'matched') {
        throw new Error('Failed to match transaction');
      }

      return matchResult;
    },
    onSuccess: (result, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['bankjoy', 'transactions'] });

      // Invalidate matter queries
      queryClient.invalidateQueries({ queryKey: ['matters'] });

      console.log(`Matched BankJoy transaction ${variables.bankJoyTransactionId} to matter ${variables.matterId}`);
    },
  });
}

// ============================================
// Exports
// ============================================

export {
  useBankJoyTransactions,
  useBankJoyTransaction,
  useBankJoyCreditTransactions,
  useBankJoyDebitTransactions,
  useBankJoyTransactionsByReference,
  useBankJoyTransactionsForDateRange,
  useBankJoyTransactionsByCounterparty,
  useBankJoyAccountTransactions,
  useMatchBankJoyTransaction,
};
