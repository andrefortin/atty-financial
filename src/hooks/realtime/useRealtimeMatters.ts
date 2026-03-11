/**
 * Real-time Matters Hook
 *
 * Subscribes to matters data collection with real-time updates.
 * Supports filtering, sorting, and pagination.
 * Uses TanStack Query for caching and data management.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy, where, whereIn, limit, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================
// Types
// ============================================

/**
 * Real-time matter data
 */
export interface RealtimeMatter {
  id: string;
  matterId: string;
  clientId: string;
  clientName: string;
  fileNumber?: string;
  matterType: 'litigation' | 'bankruptcy' | 'personal_injury' | 'insurance_claim' | 'other';
  status: 'active' | 'closed' | 'archived' | 'suspended';
  openDate?: Date | string;
  closeDate?: Date | string;
  statusDate?: Date | string;
  createdAt: number;
  updatedAt: number;
  firmId: string;
  assignedUsers?: string[];
  assignedAttorney?: string;
  leadAttorney?: string;
  principal?: string;
  opposingCounsel?: string;
  judge?: string;
  amount?: number;
  balance?: number;
  jurisdiction?: string;
  court?: string;
  practiceArea?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Real-time matters hook parameters
 */
export interface UseRealtimeMattersParams {
  /** Client ID to filter by */
  clientId?: string;
  /** Matter ID to filter by */
  matterId?: string;
  /** Matter type to filter by */
  matterType?: string;
  /** Status to filter by */
  status?: string;
  /** Jurisdiction to filter by */
  jurisdiction?: string;
  /** Court to filter by */
  court?: string;
  /** Assigned attorney to filter by */
  assignedAttorney?: string;
  /** Lead attorney to filter by */
  leadAttorney?: string;
  /** Search query for client name */
  searchQuery?: string;
  /** Filter by file number */
  fileNumber?: string;
  /** Filter by date range */
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
  /** Order results by field */
  orderByField?: 'openDate' | 'closeDate' | 'createdAt' | 'updatedAt' | 'clientName';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Limit number of results */
  limit?: number;
  /** Start after for pagination */
  startAfter?: string;
}

/**
 * Real-time matters hook return value
 */
export interface UseRealtimeMattersResult {
  /** Matters data */
  matters: RealtimeMatter[];
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Total count */
  totalCount?: number;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Invalidate function */
  invalidate: () => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Matters Hook
 *
 * Subscribes to matters collection with real-time updates.
 * Supports filtering by status, type, jurisdiction, court, attorney, date range, and search.
 * Provides sorting, pagination, and caching via TanStack Query.
 */
export function useRealtimeMatters(params: UseRealtimeMattersParams = {}): UseRealtimeMattersResult {
  const {
    clientId,
    matterId,
    matterType,
    status,
    jurisdiction,
    court,
    assignedAttorney,
    leadAttorney,
    searchQuery,
    fileNumber,
    dateRange,
    orderByField = 'updatedAt',
    sortOrder = 'desc',
    limit: 100,
    startAfter,
  } = params;

  const queryClient = useQueryClient();
  const [matters, setMatters] = useState<RealtimeMatter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // TanStack Query for initial data
  const {
    data: initialMatters,
    isLoading: initialLoading,
    error: initialError,
    refetch: queryRefetch,
  } = useQuery<RealtimeMatter[]>({
    queryKey: ['realtime-matters', clientId, matterId, matterType, status, jurisdiction, court, assignedAttorney, leadAttorney, searchQuery, fileNumber, dateRange, orderByField, sortOrder, limit, startAfter],
    queryFn: async () => {
      let q: Query = collection(db, 'matters');

      // Add filters
      if (clientId) {
        q = query(q, where('clientId', '==', clientId));
      }

      if (matterId) {
        q = query(q, where('matterId', '==', matterId));
      }

      if (matterType) {
        q = query(q, where('matterType', '==', matterType));
      }

      if (status) {
        q = query(q, where('status', '==', status));
      }

      if (jurisdiction) {
        q = query(q, where('jurisdiction', '==', jurisdiction));
      }

      if (court) {
        q = query(q, where('court', '==', court));
      }

      if (assignedAttorney) {
        q = query(q, where('assignedAttorney', '==', assignedAttorney));
      }

      if (leadAttorney) {
        q = query(q, where('leadAttorney', '==', leadAttorney));
      }

      if (fileNumber) {
        q = query(q, where('fileNumber', '==', fileNumber));
      }

      // Add date range filter
      if (dateRange) {
        const startDate = typeof dateRange.start === 'string' ? new Date(dateRange.start).getTime() : dateRange.start instanceof Date ? dateRange.start.getTime() : dateRange.start;
        const endDate = typeof dateRange.end === 'string' ? new Date(dateRange.end).getTime() : dateRange.end instanceof Date ? dateRange.end.getTime() : dateRange.end;

        if (startDate) {
          q = query(q, where('createdAt', '>=', startDate / 1000));
        }

        if (endDate) {
          q = query(q, where('createdAt', '<=', endDate / 1000));
        }
      }

      // Add search filter
      if (searchQuery) {
        q = query(q, where('clientName', '>=', searchQuery));
        q = query(q, where('clientName', '<=', searchQuery + '\uf8ff'));
      }

      // Add ordering
      q = query(q, orderBy(orderByField, sortOrder));

      // Add limit
      if (limit) {
        q = query(q, limit);
      }

      // Start after for pagination
      if (startAfter) {
        q = query(q, startAfter(startAfter));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        matterId: doc.data().matterId || doc.id,
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        fileNumber: doc.data().fileNumber,
        matterType: doc.data().matterType || 'other',
        status: doc.data().status || 'active',
        openDate: doc.data().openDate,
        closeDate: doc.data().closeDate,
        statusDate: doc.data().statusDate,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
        firmId: doc.data().firmId || '',
        assignedUsers: doc.data().assignedUsers || [],
        assignedAttorney: doc.data().assignedAttorney || '',
        leadAttorney: doc.data().leadAttorney || '',
        principal: doc.data().principal || '',
        opposingCounsel: doc.data().opposingCounsel || '',
        judge: doc.data().judge || '',
        amount: doc.data().amount,
        balance: doc.data().balance,
        jurisdiction: doc.data().jurisdiction || '',
        court: doc.data().court || '',
        practiceArea: doc.data().practiceArea || [],
        metadata: doc.data().metadata || {},
      })) as RealtimeMatter[];
    },
    enabled: !!(searchQuery && !clientId && !matterId), // Disable cache if filters
    staleTime: 30000, // 30 seconds
  });

  // Handle loading state
  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  // Handle error state
  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  // Combine initial data with real-time updates
  useEffect(() => {
    if (initialMatters && !initialLoading) {
      setMatters(initialMatters);
    }
  }, [initialMatters, initialLoading]);

  // Real-time subscription to Firestore
  useEffect(() => {
    let q: Query = collection(db, 'matters');

    // Add filters
    if (clientId) {
      q = query(q, where('clientId', '==', clientId));
    }

    if (matterId) {
      q = query(q, where('matterId', '==', matterId));
    }

    if (matterType) {
      q = query(q, where('matterType', '==', matterType));
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    if (jurisdiction) {
      q = query(q, where('jurisdiction', '==', jurisdiction));
    }

    if (court) {
      q = query(q, where('court', '==', court));
    }

    if (assignedAttorney) {
      q = query(q, where('assignedAttorney', '==', assignedAttorney));
    }

    if (leadAttorney) {
      q = query(q, where('leadAttorney', '==', leadAttorney));
    }

    if (fileNumber) {
      q = query(q, where('fileNumber', '==', fileNumber));
    }

    // Add date range filter
    if (dateRange) {
      const startDate = typeof dateRange.start === 'string' ? new Date(dateRange.start).getTime() : dateRange.start instanceof Date ? dateRange.start.getTime() : dateRange.start;
      const endDate = typeof dateRange.end === 'string' ? new Date(dateRange.end).getTime() : dateRange.end instanceof Date ? dateRange.end.getTime() : dateRange.end;

      if (startDate) {
        q = query(q, where('createdAt', '>=', startDate / 1000));
      }

      if (endDate) {
        q = query(q, where('createdAt', '<=', endDate / 1000));
      }
    }

    // Add ordering
    q = query(q, orderBy(orderByField, sortOrder));

    // Add limit
    if (limit) {
      q = query(q, limit);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realtimeMatters = snapshot.docs.map(doc => ({
        id: doc.id,
        matterId: doc.data().matterId || doc.id,
        clientId: doc.data().clientId || '',
        clientName: doc.data().clientName || '',
        fileNumber: doc.data().fileNumber,
        matterType: doc.data().matterType || 'other',
        status: doc.data().status || 'active',
        openDate: doc.data().openDate,
        closeDate: doc.data().closeDate,
        statusDate: doc.data().statusDate,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
        firmId: doc.data().firmId || '',
        assignedUsers: doc.data().assignedUsers || [],
        assignedAttorney: doc.data().assignedAttorney || '',
        leadAttorney: doc.data().leadAttorney || '',
        principal: doc.data().principal || '',
        opposingCounsel: doc.data().opposingCounsel || '',
        judge: doc.data().judge || '',
        amount: doc.data().amount,
        balance: doc.data().balance,
        jurisdiction: doc.data().jurisdiction || '',
        court: doc.data().court || '',
        practiceArea: doc.data().practiceArea || [],
        metadata: doc.data().metadata || {},
      })) as RealtimeMatter[];

      setMatters(realtimeMatters);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('Error in matters subscription:', error);
      setLoading(false);
      setError(error as Error);
    });

    return unsubscribe;
  }, [clientId, matterId, matterType, status, jurisdiction, court, assignedAttorney, leadAttorney, searchQuery, fileNumber, dateRange, orderByField, sortOrder, limit, startAfter]);

  // Invalidate function
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['realtime-matters', clientId, matterId, matterType, status, jurisdiction, court, assignedAttorney, leadAttorney, searchQuery, fileNumber, dateRange, orderByField, sortOrder, limit, startAfter],
    });
  }, [queryClient, clientId, matterId, matterType, status, jurisdiction, court, assignedAttorney, leadAttorney, searchQuery, fileNumber, dateRange, orderByField, sortOrder, limit, startAfter]);

  // Refetch function
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Calculate total count if limited
  const totalCount = useMemo(() => {
    if (!limit || !initialMatters) {
      return undefined;
    }
    return initialMatters.length; // TanStack Query returns all if not limited
  }, [limit, initialMatters]);

  return {
    matters,
    loading: loading || initialLoading,
    error: error || initialError,
    totalCount,
    refetch,
    invalidate,
  };
}
