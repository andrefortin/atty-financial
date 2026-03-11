/**
 * Real-time Transactions Hook
 *
 * Subscribes to transactions data collection with real-time updates.
 * Supports filtering, sorting, and pagination.
 * Uses TanStack Query for caching and data management.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy, where, limit, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================
// Types
// ============================================

/**
 * Real-time transaction data
 */
export interface RealtimeTransaction {
  id: string;
  transactionId: string;
  clientId: string;
  clientName: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  description?: string;
  date: Date | string;
  reference?: string;
  status: 'pending' | 'cleared' | 'reconciled';
  createdAt: number;
  updatedAt: number;
  clientId?: string;
  fileNumber?: string;
  matterId?: string;
  bankAccountId?: string;
  allocationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Real-time transactions hook parameters
 */
export interface UseRealtimeTransactionsParams {
  /** Client ID to filter by */
  clientId?: string;
  /** Client name to search by */
  clientNameQuery?: string;
  /** Matter ID to filter by */
  matterId?: string;
  /** Transaction type to filter by */
  type?: 'debit' | 'credit';
  /** Status to filter by */
  status?: 'pending' | 'cleared' | 'reconciled';
  /** Category to filter by */
  category?: string;
  /** Date range to filter by */
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
  /** Min amount to filter by */
  minAmount?: number;
  /** Max amount to filter by */
  maxAmount?: number;
  /** Search query for description */
  searchQuery?: string;
  /** Limit number of results */
  limit?: number;
  /** Start after for pagination */
  startAfter?: string;
  /** Order results by field */
  orderByField?: 'date' | 'amount' | 'createdAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Real-time transactions hook return value
 */
export interface UseRealtimeTransactionsResult {
  /** Transactions data */
  transactions: RealtimeTransaction[];
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Total count (if paginated) */
  totalCount?: number;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Invalidate function */
  invalidate: () => void;
  /** Balance by type */
  balance: {
    debits: number;
    credits: number;
    net: number;
  };
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Transactions Hook
 *
 * Subscribes to transactions collection with real-time updates.
 * Supports filtering by client, matter, type, status, category, amount, and date range.
 * Provides sorting and pagination capabilities.
 */
export function useRealtimeTransactions(
  params: UseRealtimeTransactionsParams = {}
): UseRealtimeTransactionsResult {
  const {
    clientId,
    clientNameQuery,
    matterId,
    type,
    status,
    category,
    dateRange,
    minAmount,
    maxAmount,
    searchQuery,
    limit = 100,
    startAfter,
    orderByField = 'date',
    sortOrder = 'desc',
  } = params;

  const queryClient = useQueryClient();

  // TanStack Query for transactions data
  const {
    data: initialData,
    isLoading: initialLoading,
    error: initialError,
    refetch: queryRefetch,
  } = useQuery<RealtimeTransaction[]>({
    queryKey: ['realtime-transactions', clientId, matterId, type, status, category, dateRange, minAmount, maxAmount, searchQuery, limit, startAfter, orderByField, sortOrder],
    queryFn: async () => {
      let q: Query = collection(db, 'transactions');

      // Add client filter
      if (clientId) {
        q = query(q, where('clientId', '==', clientId));
      }

      // Add matter filter
      if (matterId) {
        q = query(q, where('matterId', '==', matterId));
      }

      // Add type filter
      if (type) {
        q = query(q, where('type', '==', type));
      }

      // Add status filter
      if (status) {
        q = query(q, where('status', '==', status));
      }

      // Add category filter
      if (category) {
        q = query(q, where('category', '==', category));
      }

      // Add amount range filter
      if (minAmount !== undefined) {
        q = query(q, where('amount', '>=', minAmount));
      }
      if (maxAmount !== undefined) {
        q = query(q, where('amount', '<=', maxAmount));
      }

      // Add date range filter
      if (dateRange) {
        const startDate = typeof dateRange.start === 'string'
          ? new Date(dateRange.start).getTime() / 1000
          : dateRange.start instanceof Date
          ? dateRange.start.getTime() / 1000
          : dateRange.start;
        const endDate = typeof dateRange.end === 'string'
          ? new Date(dateRange.end).getTime() / 1000
          : dateRange.end instanceof Date
          ? dateRange.end.getTime() / 1000
          : dateRange.end;

        q = query(q, where('date', '>=', startDate));
        q = query(q, where('date', '<=', endDate));
      }

      // Add search filter
      if (searchQuery) {
        q = query(q, where('description', '>=', searchQuery));
        q = query(q, where('description', '<=', searchQuery + '\uf8ff'));
      }

      // Add ordering
      q = query(q, orderBy(orderByField, sortOrder));

      // Add limit
      if (limit) {
        q = query(q, limit);
      }

      // Add pagination
      if (startAfter) {
        q = query(q, startAfter(startAfter));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        transactionId: doc.data().transactionId || doc.id,
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        amount: doc.data().amount || 0,
        type: doc.data().type || 'debit',
        category: doc.data().category || '',
        description: doc.data().description,
        date: doc.data().date,
        reference: doc.data().reference,
        status: doc.data().status || 'pending',
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
        clientId: doc.data().clientId || '',
        fileNumber: doc.data().fileNumber,
        matterId: doc.data().matterId,
        bankAccountId: doc.data().bankAccountId,
        allocationId: doc.data().allocationId,
        metadata: doc.data().metadata || {},
      })) as RealtimeTransaction[];
    },
    staleTime: 30000,
    enabled: !!(searchQuery && !clientId), // Disable cache for search queries
  });

  // Real-time subscription to Firestore
  useEffect(() => {
    let q: Query = collection(db, 'transactions');

    // Add filters
    if (clientId) {
      q = query(q, where('clientId', '==', clientId));
    }
    if (matterId) {
      q = query(q, where('matterId', '==', matterId));
    }
    if (type) {
      q = query(q, where('type', '==', type));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (dateRange) {
      const startDate = typeof dateRange.start === 'string'
        ? new Date(dateRange.start).getTime() / 1000
        : dateRange.start instanceof Date
        ? dateRange.start.getTime() / 1000
        : dateRange.start;
      const endDate = typeof dateRange.end === 'string'
        ? new Date(dateRange.end).getTime() / 1000
        : dateRange.end instanceof Date
        ? dateRange.end.getTime() / 1000
        : dateRange.end;

      q = query(q, where('date', '>=', startDate));
      q = query(q, where('date', '<=', endDate));
    }
    if (minAmount !== undefined) {
      q = query(q, where('amount', '>=', minAmount));
    }
    if (maxAmount !== undefined) {
      q = query(q, where('amount', '<=', maxAmount));
    }

    // Add ordering
    q = query(q, orderBy(orderByField, sortOrder));

    // Add limit
    if (limit) {
      q = query(q, limit);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        transactionId: doc.data().transactionId || doc.id,
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        amount: doc.data().amount || 0,
        type: doc.data().type || 'debit',
        category: doc.data().category || '',
        description: doc.data().description,
        date: doc.data().date,
        reference: doc.data().reference,
        status: doc.data().status || 'pending',
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
        clientId: doc.data().clientId || '',
        fileNumber: doc.data().fileNumber,
        matterId: doc.data().matterId,
        bankAccountId: doc.data().bankAccountId,
        allocationId: doc.data().allocationId,
        metadata: doc.data().metadata || {},
      })) as RealtimeTransaction[];

      setTransactions(transactions);
    }, (error) => {
      console.error('Error in transactions subscription:', error);
    });

    return unsubscribe;
  }, [clientId, matterId, type, status, category, dateRange, minAmount, maxAmount, searchQuery, limit, startAfter, orderByField, sortOrder]);

  // Calculate balance
  const balance = useMemo(() => {
    const debits = transactions.filter(t => t.type === 'debit');
    const credits = transactions.filter(t => t.type === 'credit');

    const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);

    return {
      debits: totalDebits,
      credits: totalCredits,
      net: totalCredits - totalDebits,
    };
  }, [transactions]);

  // Refetch function
  const handleRefetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Invalidate function
  const handleInvalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['realtime-transactions', clientId, matterId, type, status, category, dateRange, minAmount, maxAmount, searchQuery, limit, startAfter, orderByField, sortOrder],
    });
  }, [queryClient, clientId, matterId, type, status, category, dateRange, minAmount, maxAmount, searchQuery, limit, startAfter, orderByField, sortOrder]);

  return {
    transactions: initialData || [],
    loading: initialLoading,
    error: initialError,
    totalCount: initialData ? initialData.length : 0,
    balance,
    refetch: handleRefetch,
    invalidate: handleInvalidate,
  };
}
