/**
 * Real-time Firms Hook
 *
 * Subscribes to firms data collection with real-time updates.
 * Uses TanStack Query for caching and data management.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy, where, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================
// Types
// ============================================

/**
 * Real-time firm data
 */
export interface RealtimeFirm {
  id: string;
  firmId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'basic' | 'pro' | 'enterprise';
  createdAt: number;
  updatedAt: number;
  userCount?: number;
  matterCount?: number;
}

/**
 * Real-time firms hook parameters
 */
export interface UseRealtimeFirmsParams {
  /** Optional search query */
  searchQuery?: string;
  /** Filter by status */
  status?: string;
  /** Filter by plan */
  plan?: string;
  /** Limit number of results */
  limit?: number;
}

/**
 * Real-time firms hook return value
 */
export interface UseRealtimeFirmsResult {
  /** Firms data */
  firms: RealtimeFirm[];
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Invalidate function */
  invalidate: () => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Firms Hook
 *
 * Subscribes to firms collection with real-time updates.
 */
export function useRealtimeFirms(params: UseRealtimeFirmsParams): UseRealtimeFirmsResult {
  const {
    searchQuery,
    status,
    plan,
    limit,
  } = params;

  const queryClient = useQueryClient();
  const [firms, setFirms] = useState<RealtimeFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // TanStack Query for initial data
  const {
    data: initialFirms,
    isLoading: initialLoading,
    error: initialError,
    refetch: queryRefetch,
  } = useQuery<RealtimeFirm[]>({
    queryKey: ['realtime-firms', searchQuery, status, plan],
    queryFn: async () => {
      let q: Query = collection(db, 'firms');

      // Add status filter
      if (status) {
        q = query(q, where('status', '==', status));
      }

      // Add plan filter
      if (plan) {
        q = query(q, where('plan', '==', plan));
      }

      // Add search filter
      if (searchQuery) {
        q = query(q, where('name', '>=', searchQuery));
        q = query(q, where('name', '<=', searchQuery + '\uf8ff'));
      }

      // Sort by name
      q = query(q, orderBy('name', 'asc'));

      // Add limit
      if (limit) {
        q = query(q, limit);
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        firmId: doc.data().firmId || doc.id,
        name: doc.data().name || '',
        email: doc.data().email,
        phone: doc.data().phone,
        address: doc.data().address,
        logo: doc.data().logo,
        status: doc.data().status || 'active',
        plan: doc.data().plan || 'basic',
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
        userCount: doc.data().userCount,
        matterCount: doc.data().matterCount,
      })) as RealtimeFirm[];
    },
    staleTime: 30000, // 30 seconds
    enabled: !searchQuery && !status && !plan, // Disable for queries
  });

  // Handle loading state
  useEffect(() => {
    setLoading(initialLoading);
  }, [initialLoading]);

  // Handle error state
  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  // Real-time subscription to Firestore
  useEffect(() => {
    let q: Query = collection(db, 'firms');

    // Apply filters
    if (status) {
      q = query(q, where('status', '==', status));
    }

    if (plan) {
      q = query(q, where('plan', '==', plan));
    }

    // Apply search (only for real-time if not querying)
    if (searchQuery && !status && !plan) {
      q = query(q, where('name', '>=', searchQuery));
      q = query(q, where('name', '<=', searchQuery + '\uf8ff'));
    }

    // Sort by name
    q = query(q, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realtimeFirms = snapshot.docs.map(doc => ({
        id: doc.id,
        firmId: doc.data().firmId || doc.id,
        name: doc.data().name || '',
        email: doc.data().email,
        phone: doc.data().phone,
        address: doc.data().address,
        logo: doc.data().logo,
        status: doc.data().status || 'active',
        plan: doc.data().plan || 'basic',
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
        userCount: doc.data().userCount,
        matterCount: doc.data().matterCount,
      }));

      setFirms(realtimeFirms);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('Error in firms subscription:', error);
      setLoading(false);
      setError(error as Error);
    });

    return unsubscribe;
  }, [searchQuery, status, plan]);

  // Combine initial data with real-time data
  useEffect(() => {
    if (initialFirms && !initialLoading) {
      setFirms(initialFirms);
    }
  }, [initialFirms, initialLoading]);

  // Refetch function
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Invalidate function
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['realtime-firms', searchQuery, status, plan] });
  }, [queryClient, searchQuery, status, plan]);

  return {
    firms,
    loading,
    error,
    refetch,
    invalidate,
  };
}
