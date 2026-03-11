/**
 * Real-time Daily Balances Hook
 *
 * Subscribes to daily balances data collection with real-time updates.
 * Supports filtering, sorting, and aggregation.
 * Uses TanStack Query for caching and data management.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy, where, sum, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================
// Types
// ============================================

/**
 * Real-time daily balance data
 */
export interface RealtimeDailyBalance {
  id: string;
  matterId: string;
  clientId: string;
  clientName: string;
  balanceDate: Date | string;
  startingBalance: number;
  accruedInterest: number;
  paidInterest: number;
  paidPrincipal: number;
  endingBalance: number;
  rate: number;
  type: 'simple' | 'compound';
  days: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Real-time daily balances hook parameters
 */
export interface UseRealtimeDailyBalancesParams {
  /** Matter ID to filter by */
  matterId?: string;
  /** Client ID to filter by */
  clientId?: string;
  /** Start date for filtering */
  startDate?: Date | string;
  /** End date for filtering */
  endDate?: Date | string;
  /** Type filter */
  type?: 'simple' | 'compound';
  /** Minimum balance filter */
  minBalance?: number;
  /** Maximum balance filter */
  maxBalance?: number;
  /** Limit number of results */
  limit?: number;
  /** Order results by field */
  orderByField?: 'balanceDate' | 'startingBalance' | 'endingBalance' | 'rate';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Start after for pagination */
  startAfter?: string;
}

/**
 * Real-time daily balances hook return value
 */
export interface UseRealtimeDailyBalancesResult {
  /** Daily balances data */
  balances: RealtimeDailyBalance[];
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Total ending balance sum */
  totalEndingBalance: number;
  /** Total interest sum */
  totalInterest: number;
  /** Average rate */
  averageRate: number;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Invalidate function */
  invalidate: () => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Daily Balances Hook
 *
 * Subscribes to daily balances collection with real-time updates.
 * Provides filtering by matter, client, date range, and balance.
 * Calculates aggregates for total balance, interest, and average rate.
 */
export function useRealtimeDailyBalances(
  params: UseRealtimeDailyBalancesParams = {}
): UseRealtimeDailyBalancesResult {
  const {
    matterId,
    clientId,
    startDate,
    endDate,
    type,
    minBalance,
    maxBalance,
    limit = 100,
    orderByField = 'balanceDate',
    sortOrder = 'desc',
    startAfter,
  } = params;

  const queryClient = useQueryClient();
  const [balances, setBalances] = useState<RealtimeDailyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // TanStack Query for initial data
  const {
    data: initialData,
    isLoading: initialLoading,
    error: initialError,
    refetch: queryRefetch,
  } = useQuery<RealtimeDailyBalance[]>({
    queryKey: ['realtime-daily-balances', matterId, clientId, startDate, endDate, type, minBalance, maxBalance, limit, orderByField, sortOrder, startAfter],
    queryFn: async () => {
      let q: Query = collection(db, 'dailyBalances');

      // Add matter filter
      if (matterId) {
        q = query(q, where('matterId', '==', matterId));
      }

      // Add client filter
      if (clientId) {
        q = query(q, where('clientId', '==', clientId));
      }

      // Add date range filter
      if (startDate || endDate) {
        const startTimestamp = typeof startDate === 'string'
          ? new Date(startDate).getTime()
          : startDate instanceof Date
          ? startDate.getTime()
          : undefined;
        const endTimestamp = typeof endDate === 'string'
          ? new Date(endDate).getTime()
          : endDate instanceof Date
          ? endDate.getTime()
          : undefined;

        if (startTimestamp !== undefined) {
          q = query(q, where('balanceDate', '>=', startTimestamp / 1000));
        }
        if (endTimestamp !== undefined) {
          q = query(q, where('balanceDate', '<=', endTimestamp / 1000));
        }
      }

      // Add type filter
      if (type) {
        q = query(q, where('type', '==', type));
      }

      // Add balance range filter
      if (minBalance !== undefined) {
        q = query(q, where('endingBalance', '>=', minBalance));
      }
      if (maxBalance !== undefined) {
        q = query(q, where('endingBalance', '<=', maxBalance));
      }

      // Add ordering
      q = query(q, orderBy(orderByField, sortOrder));

      // Add limit
      q = query(q, limit(limit));

      // Add pagination
      if (startAfter) {
        q = query(q, startAfter(startAfter));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        matterId: doc.data().matterId || '',
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        balanceDate: doc.data().balanceDate,
        startingBalance: doc.data().startingBalance || 0,
        accruedInterest: doc.data().accruedInterest || 0,
        paidInterest: doc.data().paidInterest || 0,
        paidPrincipal: doc.data().paidPrincipal || 0,
        endingBalance: doc.data().endingBalance || 0,
        rate: doc.data().rate || 0,
        type: doc.data().type || 'simple',
        days: doc.data().days || 0,
        notes: doc.data().notes,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
      })) as RealtimeDailyBalance[];
    },
    staleTime: 30000, // 30 seconds
  });

  // Real-time subscription to Firestore
  useEffect(() => {
    setLoading(initialLoading);

    let q: Query = collection(db, 'dailyBalances');

    // Add matter filter
    if (matterId) {
      q = query(q, where('matterId', '==', matterId));
    }

    // Add client filter
    if (clientId) {
      q = query(q, where('clientId', '==', clientId));
    }

    // Add date range filter
    if (startDate || endDate) {
      const startTimestamp = typeof startDate === 'string'
        ? new Date(startDate).getTime()
        : startDate instanceof Date
        ? startDate.getTime()
        : undefined;
      const endTimestamp = typeof endDate === 'string'
        ? new Date(endDate).getTime()
        : endDate instanceof Date
        ? endDate.getTime()
        : undefined;

      if (startTimestamp !== undefined) {
        q = query(q, where('balanceDate', '>=', startTimestamp / 1000));
      }
      if (endTimestamp !== undefined) {
        q = query(q, where('balanceDate', '<=', endTimestamp / 1000));
      }
    }

    // Add type filter
    if (type) {
      q = query(q, where('type', '==', type));
    }

    // Add balance range filter
    if (minBalance !== undefined) {
      q = query(q, where('endingBalance', '>=', minBalance));
    }
    if (maxBalance !== undefined) {
      q = query(q, where('endingBalance', '<=', maxBalance));
    }

    // Add ordering
    q = query(q, orderBy(orderByField, sortOrder));

    // Add limit
    if (limit) {
      q = query(q, limit(limit));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dailyBalances = snapshot.docs.map(doc => ({
        id: doc.id,
        matterId: doc.data().matterId || '',
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        balanceDate: doc.data().balanceDate,
        startingBalance: doc.data().startingBalance || 0,
        accruedInterest: doc.data().accruedInterest || 0,
        paidInterest: doc.data().paidInterest || 0,
        paidPrincipal: doc.data().paidPrincipal || 0,
        endingBalance: doc.data().endingBalance || 0,
        rate: doc.data().rate || 0,
        type: doc.data().type || 'simple',
        days: doc.data().days || 0,
        notes: doc.data().notes,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
      })) as RealtimeDailyBalance[];

      setBalances(dailyBalances);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('Error in daily balances subscription:', error);
      setLoading(false);
      setError(error as Error);
    });

    return unsubscribe;
  }, [matterId, clientId, startDate, endDate, type, minBalance, maxBalance, limit, orderByField, sortOrder, startAfter]);

  // Handle error state
  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  // Combine initial data with real-time data
  useEffect(() => {
    if (initialData && !initialLoading) {
      setBalances(initialData);
    }
  }, [initialData, initialLoading]);

  // Calculate aggregates
  const aggregates = useMemo(() => {
    const totalEndingBalance = balances.reduce((sum, b) => sum + b.endingBalance, 0);
    const totalInterest = balances.reduce((sum, b) => sum + b.accruedInterest + b.paidInterest, 0);

    // Calculate average rate
    const balancesWithRate = balances.filter(b => b.rate > 0);
    const averageRate = balancesWithRate.length > 0
      ? balancesWithRate.reduce((sum, b) => sum + b.rate, 0) / balancesWithRate.length
      : 0;

    return {
      totalEndingBalance,
      totalInterest,
      averageRate,
    };
  }, [balances]);

  // Refetch function
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Invalidate function
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['realtime-daily-balances', matterId, clientId, startDate, endDate, type, minBalance, maxBalance, limit, orderByField, sortOrder, startAfter] });
  }, [queryClient, matterId, clientId, startDate, endDate, type, minBalance, maxBalance, limit, orderByField, sortOrder, startAfter]);

  return {
    balances,
    loading: loading || initialLoading,
    error: error || initialError,
    ...aggregates,
    refetch,
    invalidate,
  };
}
