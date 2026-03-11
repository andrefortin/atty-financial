/**
 * Real-time Rate Entries Hook
 *
 * Subscribes to rate entries data collection with real-time updates.
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
 * Real-time rate entry data
 */
export interface RealtimeRateEntry {
  id: string;
  matterId: string;
  clientId: string;
  clientName?: string;
  rateType: 'interest_rate' | 'attorney_fee' | 'cost_rate' | 'other';
  rate: number;
  balance?: number;
  principal?: number;
  startDate: Date | string;
  endDate?: Date | string | null;
  effectiveDate?: Date | string;
  description?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Real-time rate entries hook parameters
 */
export interface UseRealtimeRatesParams {
  /** Matter ID to filter by */
  matterId?: string;
  /** Client ID to filter by */
  clientId?: string;
  /** Rate type to filter by */
  rateType?: string;
  /** Active only filter (default: false) */
  activeOnly?: boolean;
  /** Start date filter */
  startDate?: Date | string;
  /** End date filter */
  endDate?: Date | string | null;
  /** Limit number of results */
  limit?: number;
  /** Order results by field */
  orderByField?: 'startDate' | 'endDate' | 'rate' | 'createdAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Real-time rate entries hook return value
 */
export interface UseRealtimeRatesResult {
  /** Rate entries data */
  entries: RealtimeRateEntry[];
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Total entries count */
  totalCount?: number;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Invalidate function */
  invalidate: () => void;
  /** Aggregated data */
  aggregates: {
    totalBalance: number;
    totalPrincipal: number;
    averageRate: number;
    byRateType: Record<string, RealtimeRateEntry[]>;
    byClient: Record<string, RealtimeRateEntry[]>;
  };
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Rate Entries Hook
 *
 * Subscribes to rate entries collection with real-time updates.
 * Provides aggregation by type and client, filtering by date, matter, and client.
 */
export function useRealtimeRates(params: UseRealtimeRatesParams = {}): UseRealtimeRatesResult {
  const {
    matterId,
    clientId,
    rateType,
    activeOnly = false,
    startDate,
    endDate,
    limit = 100,
    orderByField = 'startDate',
    sortOrder = 'desc',
  } = params;

  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<RealtimeRateEntry[]>([]);

  // TanStack Query for initial data
  const {
    data: initialData,
    isLoading: initialLoading,
    error: initialError,
    refetch: queryRefetch,
  } = useQuery<RealtimeRateEntry[]>({
    queryKey: ['realtime-rate-entries', matterId, clientId, rateType, activeOnly, startDate, endDate, limit, orderByField, sortOrder],
    queryFn: async () => {
      let q: Query = collection(db, 'rateEntries');

      // Add matter filter
      if (matterId) {
        q = query(q, where('matterId', '==', matterId));
      }

      // Add client filter
      if (clientId) {
        q = query(q, where('clientId', '==', clientId));
      }

      // Add rate type filter
      if (rateType) {
        q = query(q, where('rateType', '==', rateType));
      }

      // Add active filter
      if (activeOnly) {
        q = query(q, where('endDate', '==', null));
      }

      // Add date range filter
      if (startDate || endDate) {
        const startTimestamp = typeof startDate === 'string'
          ? new Date(startDate).getTime()
          : startDate instanceof Date
          ? startDate.getTime()
          : undefined;
        const endTimestamp = endDate === null
          ? undefined
          : typeof endDate === 'string'
          ? new Date(endDate).getTime()
          : endDate instanceof Date
          ? endDate.getTime()
          : undefined;

        if (startTimestamp !== undefined) {
          q = query(q, where('startDate', '>=', startTimestamp / 1000));
        }

        if (endTimestamp !== undefined) {
          q = query(q, where('startDate', '<=', endTimestamp / 1000));
        }
      }

      // Add ordering
      q = query(q, orderBy(orderByField, sortOrder));

      // Add limit
      if (limit) {
        q = query(q, limit(limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        matterId: doc.data().matterId || '',
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        rateType: doc.data().rateType || 'other',
        rate: doc.data().rate || 0,
        balance: doc.data().balance,
        principal: doc.data().principal,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
        effectiveDate: doc.data().effectiveDate || doc.data().startDate,
        description: doc.data().description,
        notes: doc.data().notes,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
      })) as RealtimeRateEntry[];
    },
    staleTime: 30000, // 30 seconds
    enabled: !!(activeOnly && startDate && endDate), // Disable cache for date range queries
  });

  // Real-time subscription to Firestore
  useEffect(() => {
    setLoading(initialLoading);

    if (!matterId && !clientId && !rateType) {
      return;
    }

    let q: Query = collection(db, 'rateEntries');

    // Add matter filter
    if (matterId) {
      q = query(q, where('matterId', '==', matterId));
    }

    // Add client filter
    if (clientId) {
      q = query(q, where('clientId', '==', clientId));
    }

    // Add rate type filter
    if (rateType) {
      q = query(q, where('rateType', '==', rateType));
    }

    // Add active filter
    if (activeOnly) {
      q = query(q, where('endDate', '==', null));
    }

    // Add date range filter
    if (startDate || endDate) {
      const startTimestamp = typeof startDate === 'string'
        ? new Date(startDate).getTime()
        : startDate instanceof Date
        ? startDate.getTime()
        : undefined;
      const endTimestamp = endDate === null
        ? undefined
        : typeof endDate === 'string'
        ? new Date(endDate).getTime()
        : endDate instanceof Date
        ? endDate.getTime()
        : undefined;

      if (startTimestamp !== undefined) {
        q = query(q, where('startDate', '>=', startTimestamp / 1000));
      }

      if (endTimestamp !== undefined) {
        q = query(q, where('startDate', '<=', endTimestamp / 1000));
      }
    }

    // Add ordering
    q = query(q, orderBy(orderByField, sortOrder));

    // Add limit
    if (limit) {
      q = query(q, limit);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rateEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        matterId: doc.data().matterId || '',
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        rateType: doc.data().rateType || 'other',
        rate: doc.data().rate || 0,
        balance: doc.data().balance,
        principal: doc.data().principal,
        startDate: doc.data().startDate,
        endDate: doc.data().endDate,
        effectiveDate: doc.data().effectiveDate || doc.data().startDate,
        description: doc.data().description,
        notes: doc.data().notes,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
      })) as RealtimeRateEntry[];

      setEntries(rateEntries);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('Error in rate entries subscription:', error);
      setLoading(false);
      setError(error as Error);
    });

    return unsubscribe;
  }, [matterId, clientId, rateType, activeOnly, startDate, endDate, limit, orderByField, sortOrder]);

  // Combine initial data with real-time data
  useEffect(() => {
    if (initialData && !initialLoading) {
      setEntries(initialData);
    }
  }, [initialData, initialLoading]);

  // Calculate aggregates
  const aggregates = useMemo(() => {
    // Total balance
    const totalBalance = entries.reduce((sum, entry) => sum + (entry.balance || 0), 0);

    // Total principal
    const totalPrincipal = entries.reduce((sum, entry) => sum + (entry.principal || 0), 0);

    // Average rate
    const entriesWithRate = entries.filter(e => e.rate > 0);
    const averageRate = entriesWithRate.length > 0
      ? entriesWithRate.reduce((sum, e) => sum + e.rate, 0) / entriesWithRate.length
      : 0;

    // Group by rate type
    const byRateType = entries.reduce((acc, entry) => {
      const type = entry.rateType || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(entry);
      return acc;
    }, {} as Record<string, RealtimeRateEntry[]>);

    // Group by client
    const byClient = entries.reduce((acc, entry) => {
      const client = entry.clientId || 'unknown';
      if (!acc[client]) {
        acc[client] = [];
      }
      acc[client].push(entry);
      return acc;
    }, {} as Record<string, RealtimeRateEntry[]>);

    return {
      totalBalance,
      totalPrincipal,
      averageRate,
      byRateType,
      byClient,
    };
  }, [entries]);

  // Refetch function
  const handleRefetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Invalidate function
  const handleInvalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['realtime-rate-entries', matterId, clientId, rateType, activeOnly, startDate, endDate, limit, orderByField, sortOrder] });
  }, [queryClient, matterId, clientId, rateType, activeOnly, startDate, endDate, limit, orderByField, sortOrder]);

  return {
    entries,
    loading: initialLoading || loading,
    error: initialError,
    totalCount: entries.length,
    refetch: handleRefetch,
    invalidate: handleInvalidate,
    aggregates,
  };
}
