/**
 * Real-time Users Hook
 *
 * Subscribes to user presence data from PresenceService.
 * Uses TanStack Query for caching and data management.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, onSnapshot, orderBy, type Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Presence } from '@/services/realtime';

// ============================================
// Types
// ============================================

/**
 * Real-time user data
 */
export interface RealtimeUser {
  id: string;
  userId: string;
  userName: string;
  email?: string;
  avatar?: string;
  role?: string;
  department?: string;
  location?: string;
  phone?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Real-time users hook parameters
 */
export interface UseRealtimeUsersParams {
  /** Firm ID to filter users by */
  firmId: string;
  /** Whether to include offline users (default: false) */
  includeOffline?: boolean;
  /** Optional role filter */
  role?: string;
  /** Optional department filter */
  department?: string;
  /** Search query for users */
  searchQuery?: string;
}

/**
 * Real-time users hook return value
 */
export interface UseRealtimeUsersResult {
  /** Users data */
  users: RealtimeUser[];
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Whether user is online */
  isOnline: boolean;
  /** Online users count */
  onlineCount: number;
  /** Offline users count */
  offlineCount: number;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Invalidate function */
  invalidate: () => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Users Hook
 *
 * Subscribes to users collection with real-time updates.
 * Filters by firm ID and includes online/offline status.
 */
export function useRealtimeUsers(params: UseRealtimeUsersParams): UseRealtimeUsersResult {
  const {
    firmId,
    includeOffline = false,
    role,
    department,
    searchQuery,
  } = params;

  const queryClient = useQueryClient();
  const [users, setUsers] = useState<RealtimeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // TanStack Query for initial data
  const {
    data: initialUsers,
    isLoading: initialLoading,
    error: initialError,
    refetch: queryRefetch,
  } = useQuery<RealtimeUser[]>({
    queryKey: ['realtime-users', firmId, role, department, searchQuery],
    queryFn: async () => {
      if (!firmId) {
        return [];
      }

      let q: Query = collection(db, 'users');
      q = query(q, where('firmId', '==', firmId));

      // Add role filter if provided
      if (role) {
        q = query(q, where('role', '==', role));
      }

      // Add department filter if provided
      if (department) {
        q = query(q, where('department', '==', department));
      }

      // Add search filter if provided
      if (searchQuery) {
        q = query(q, where('userName', '>=', searchQuery));
        q = query(q, where('userName', '<=', searchQuery + '\uf8ff'));
      }

      // Sort by name
      q = query(q, orderBy('userName', 'asc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId || doc.id,
        userName: doc.data().userName || '',
        email: doc.data().email,
        avatar: doc.data().avatar,
        role: doc.data().role,
        department: doc.data().department,
        location: doc.data().location,
        phone: doc.data().phone,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
      })) as RealtimeUser[];
    },
    staleTime: 30000, // 30 seconds
  });

  // Real-time subscription to Firestore
  useEffect(() => {
    setLoading(initialLoading);

    if (!firmId) {
      setUsers([]);
      setIsOnline(navigator.onLine);
      return;
    }

    let q: Query = collection(db, 'users');
    q = query(q, where('firmId', '==', firmId));

    // Add role filter
    if (role) {
      q = query(q, where('role', '==', role));
    }

    // Add department filter
    if (department) {
      q = query(q, where('department', '==', department));
    }

    // Add search filter
    if (searchQuery) {
      q = query(q, where('userName', '>=', searchQuery));
      q = query(q, where('userName', '<=', searchQuery + '\uf8ff'));
    }

    // Order by name
    q = query(q, orderBy('userName', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realtimeUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.data().userId || doc.id,
        userName: doc.data().userName || '',
        email: doc.data().email,
        avatar: doc.data().avatar,
        role: doc.data().role,
        department: doc.data().department,
        location: doc.data().location,
        phone: doc.data().phone,
        createdAt: doc.data().createdAt?.toMillis() || 0,
        updatedAt: doc.data().updatedAt?.toMillis() || 0,
      })) as RealtimeUser[];

      // Filter by online/offline if needed
      const filteredUsers = includeOffline
        ? realtimeUsers
        : realtimeUsers.filter(user => user.location !== 'offline');

      setUsers(filteredUsers);
      setLoading(false);
    }, (error) => {
      console.error('Error in users subscription:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [firmId, includeOffline, role, department, searchQuery, includeOffline]);

  // Track online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Combine initial data with real-time data
  useEffect(() => {
    if (initialUsers && !initialLoading) {
      const filtered = includeOffline
        ? initialUsers
        : initialUsers.filter(user => user.location !== 'offline');
      setUsers(filtered);
    }
  }, [initialUsers, initialLoading, includeOffline]);

  // Calculate counts
  const onlineCount = users.filter(user => user.location !== 'offline').length;
  const offlineCount = users.filter(user => user.location === 'offline').length;

  // Refetch function
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Invalidate function
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['realtime-users', firmId, role, department, searchQuery] });
  }, [queryClient, firmId, role, department, searchQuery]);

  return {
    users,
    loading: loading || initialLoading,
    error: initialError,
    isOnline,
    onlineCount,
    offlineCount,
    refetch,
    invalidate,
  };
}
