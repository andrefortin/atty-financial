/**
 * Real-time Presence Hook
 *
 * Tracks user presence state using TanStack Query.
 * Integrates with PresenceService for real-time updates.
 *
 * @module hooks/realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PresenceService, PresenceStatus, PresenceData } from '@/services/realtime';

// ============================================
// Types
// ============================================

/**
 * User presence state
 */
export interface UserPresence {
  userId: string;
  userName: string;
  email?: string;
  avatar?: string;
  role?: string;
  status: PresenceStatus;
  currentView?: string;
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };
  lastSeen: number;
  sessionId: string;
  firmId: string;
  location?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Use presence hook parameters
 */
export interface UsePresenceParams {
  /** Current user ID */
  userId: string;
  /** Current user firm ID */
  firmId: string;
  /** Whether to track location (default: true) */
  trackLocation?: boolean;
  /** Update interval in ms (default: 30000) */
  updateInterval?: number;
}

/**
 * Use presence hook return value
 */
export interface UsePresenceResult {
  /** Current user presence */
  presence: UserPresence | null;
  /** All users in firm with presence */
  firmUsers: UserPresence[];
  /** Online users count */
  onlineCount: number;
  /** Away users count */
  awayCount: number;
  /** Offline users count */
  offlineCount: number;
  /** Busy users count */
  busyCount: number;
  /** Loading state */
  loading: boolean;
  /** Error object if present */
  error: Error | null;
  /** Update function */
  update: (updates: Partial<UserPresence>) => void;
  /** Set online function */
  setOnline: () => void;
  /** Set offline function */
  setOffline: () => void;
  /** Set away function */
  setAway: () => void;
  /** Set busy function */
  setBusy: () => void;
  /** Set current view */
  setCurrentView: (view: string) => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Real-time Presence Hook
 *
 * Tracks user presence state with real-time updates.
 * Provides presence management methods and presence statistics.
 * Integrates with PresenceService for server-side presence.
 */
export function usePresence(params: UsePresenceParams): UsePresenceResult {
  const {
    userId,
    firmId,
    trackLocation = true,
    updateInterval = 30000,
  } = params;

  const queryClient = useQueryClient();
  const [currentUserPresence, setCurrentUserPresence] = useState<UserPresence | null>(null);
  const [firmUsers, setFirmUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get presence service
  const presenceService = window.__presenceService as PresenceService | null;

  // TanStack Query for initial firm users data
  const {
    data: initialUsers,
    isLoading: initialLoading,
    error: initialError,
  } = useQuery<UserPresence[]>({
    queryKey: ['presence-firm-users', firmId],
    queryFn: async () => {
      if (!firmId) {
        return [];
      }

      const q = query(
        collection(db, 'users'),
        where('firmId', '==', firmId),
        orderBy('lastSeen', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        userId: doc.data().userId || doc.id,
        userName: doc.data().userName || '',
        email: doc.data().email,
        avatar: doc.data().avatar,
        role: doc.data().role,
        status: doc.data().status || PresenceStatus.OFFLINE,
        currentView: doc.data().currentView,
        device: doc.data().device,
        lastSeen: doc.data().lastSeen?.toMillis() || 0,
        sessionId: doc.data().sessionId || '',
        firmId: doc.data().firmId || '',
        location: doc.data().location,
        phone: doc.data().phone,
        metadata: doc.data().metadata || {},
      })) as UserPresence[];
    },
    staleTime: 60000, // 1 minute
    enabled: !!firmId,
  });

  // TanStack Query for current user presence
  const {
    data: initialCurrentPresence,
    isLoading: isCurrentLoading,
    error: isCurrentError,
  } = useQuery<UserPresence | null>({
    queryKey: ['presence-current', userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      const docRef = doc(db, 'users', userId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        userId: snapshot.data().userId || userId,
        userName: snapshot.data().userName || '',
        email: snapshot.data().email,
        avatar: snapshot.data().avatar,
        role: snapshot.data().role,
        status: snapshot.data().status || PresenceStatus.OFFLINE,
        currentView: snapshot.data().currentView,
        device: snapshot.data().device,
        lastSeen: snapshot.data().lastSeen?.toMillis() || 0,
        sessionId: snapshot.data().sessionId || '',
        firmId: snapshot.data().firmId || '',
        location: snapshot.data().location,
        phone: snapshot.data().phone,
        metadata: snapshot.data().metadata || {},
      } as UserPresence;
    },
    staleTime: 30000, // 30 seconds
    enabled: !!userId,
  });

  // Real-time subscription to firm users
  useEffect(() => {
    if (!firmId) {
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('firmId', '==', firmId),
      orderBy('lastSeen', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realtimeUsers = snapshot.docs.map(doc => ({
        userId: doc.data().userId || doc.id,
        userName: doc.data().userName || '',
        email: doc.data().email,
        avatar: doc.data().avatar,
        role: doc.data().role,
        status: doc.data().status || PresenceStatus.OFFLINE,
        currentView: doc.data().currentView,
        device: doc.data().device,
        lastSeen: doc.data().lastSeen?.toMillis() || 0,
        sessionId: doc.data().sessionId || '',
        firmId: doc.data().firmId || '',
        location: doc.data().location,
        phone: doc.data().phone,
        metadata: doc.data().metadata || {},
      })) as UserPresence[];

      setFirmUsers(realtimeUsers);
      setLoading(false);
    }, (error) => {
      console.error('Error in firm users presence subscription:', error);
      setError(error as Error);
      setLoading(false);
    });

    return unsubscribe;
  }, [firmId]);

  // Real-time subscription to current user presence
  useEffect(() => {
    if (!userId) {
      return;
    }

    const docRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }

      const presence = {
        userId: snapshot.data().userId || userId,
        userName: snapshot.data().userName || '',
        email: snapshot.data().email,
        avatar: snapshot.data().avatar,
        role: snapshot.data().role,
        status: snapshot.data().status || PresenceStatus.OFFLINE,
        currentView: snapshot.data().currentView,
        device: snapshot.data().device,
        lastSeen: snapshot.data().lastSeen?.toMillis() || 0,
        sessionId: snapshot.data().sessionId || '',
        firmId: snapshot.data().firmId || '',
        location: snapshot.data().location,
        phone: snapshot.data().phone,
        metadata: snapshot.data().metadata || {},
      } as UserPresence;

      setCurrentUserPresence(presence);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('Error in user presence subscription:', error);
      setError(error as Error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  // Update current user presence via PresenceService
  const update = useCallback(async (updates: Partial<UserPresence>) => {
    if (!presenceService) {
      return;
    }

    try {
      const presenceData: PresenceData = {
        userId,
        userName: currentUserPresence?.userName || '',
        currentView: updates.currentView,
        device: updates.device,
        metadata: updates.metadata,
      };

      switch (updates.status) {
        case PresenceStatus.ONLINE:
          await presenceService.setOnline();
          break;
        case PresenceStatus.AWAY:
          await presenceService.updatePresence(PresenceStatus.AWAY, presenceData);
          break;
        case PresenceStatus.OFFLINE:
          await presenceService.setOffline();
          break;
        case PresenceStatus.BUSY:
          await presenceService.updatePresence(PresenceStatus.BUSY, presenceData);
          break;
      }

      setCurrentUserPresence(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [userId, presenceService, currentUserPresence]);

  // Set online
  const setOnline = useCallback(async () => {
    if (!presenceService) {
      return;
    }

    await presenceService.setOnline();

    setCurrentUserPresence(prev => prev ? ({ ...prev, status: PresenceStatus.ONLINE }) : null);
  }, [presenceService, setCurrentUserPresence]);

  // Set offline
  const setOffline = useCallback(async () => {
    if (!presenceService) {
      return;
    }

    await presenceService.setOffline();

    setCurrentUserPresence(prev => prev ? ({ ...prev, status: PresenceStatus.OFFLINE }) : null);
  }, [presenceService, setCurrentUserPresence]);

  // Set away
  const setAway = useCallback(async () => {
    if (!presenceService) {
      return;
    }

    await presenceService.updatePresence(PresenceStatus.AWAY, {
      userId,
      userName: currentUserPresence?.userName || '',
    });

    setCurrentUserPresence(prev => prev ? ({ ...prev, status: PresenceStatus.AWAY }) : null);
  }, [presenceService, setCurrentUserPresence, currentUserPresence, userId]);

  // Set busy
  const setBusy = useCallback(async () => {
    if (!presenceService) {
      return;
    }

    await presenceService.updatePresence(PresenceStatus.BUSY, {
      userId,
      userName: currentUserPresence?.userName || '',
    });

    setCurrentUserPresence(prev => prev ? ({ ...prev, status: PresenceStatus.BUSY }) : null);
  }, [presenceService, setCurrentUserPresence, currentUserPresence, userId]);

  // Set current view
  const setCurrentView = useCallback(async (view: string) => {
    if (!presenceService) {
      return;
    }

    await presenceService.updatePresence(PresenceStatus.ONLINE, {
      userId,
      userName: currentUserPresence?.userName || '',
      currentView: view,
    });

    setCurrentUserPresence(prev => prev ? ({ ...prev, currentView: view }) : null);
  }, [presenceService, setCurrentUserPresence, currentUserPresence, userId]);

  // Handle loading state
  useEffect(() => {
    setLoading(initialLoading || isCurrentLoading);
  }, [initialLoading, isCurrentLoading]);

  // Handle error state
  useEffect(() => {
    setError(initialError || isCurrentError);
  }, [initialError, isCurrentError]);

  // Combine initial data with real-time data
  useEffect(() => {
    if (initialUsers && !initialLoading) {
      setFirmUsers(initialUsers);
    }
  }, [initialUsers, initialLoading]);

  // Calculate counts
  const counts = useMemo(() => {
    return {
      onlineCount: firmUsers.filter(u => u.status === PresenceStatus.ONLINE).length,
      awayCount: firmUsers.filter(u => u.status === PresenceStatus.AWAY).length,
      offlineCount: firmUsers.filter(u => u.status === PresenceStatus.OFFLINE).length,
      busyCount: firmUsers.filter(u => u.status === PresenceStatus.BUSY).length,
    };
  }, [firmUsers]);

  return {
    presence: currentUserPresence,
    firmUsers,
    loading: loading || initialLoading,
    error: error || initialError,
    ...counts,
    update,
    setOnline,
    setOffline,
    setAway,
    setBusy,
    setCurrentView,
  };
}
