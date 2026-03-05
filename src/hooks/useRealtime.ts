/**
 * Real-time Hook
 *
 * Custom hook for managing real-time subscriptions.
 *
 * @module hooks/useRealtime
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { getRealtimeService, type RealtimeSubscriptionOptions, type RealtimeQueryOptions, type SubscriptionStatus } from '@/services/firebase/realtime.service';

// ============================================
// Types
// ============================================

export interface UseRealtimeOptions {
  /**
   * Whether to auto-subscribe on mount (default: true)
   */
  autoSubscribe?: boolean;

  /**
   * Whether to include metadata (default: true)
   */
  includeMetadata?: boolean;

  /**
   * Callback for subscription errors
   */
  onError?: (error: Error) => void;

  /**
   * Callback for subscription status changes
   */
  onStatusChange?: (status: 'online' | 'offline' | 'connecting' | 'disconnected') => void;
}

export interface UseRealtimeDocumentOptions {
  collection: string;
  documentId: string;
  options?: UseRealtimeOptions;
}

export interface UseRealtimeCollectionOptions {
  collection: string;
  queryOptions?: RealtimeQueryOptions;
  options?: UseRealtimeOptions;
}

export interface UseRealtimeResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  subscriptionStatus: SubscriptionStatus | null;
  connectionStatus: 'online' | 'offline' | 'connecting' | 'disconnected';
}

// ============================================
// Real-time Hook
// ============================================

/**
 * Hook for real-time document subscriptions
 *
 * @param options - Subscription options
 * @returns Real-time query result
 */
export function useRealtimeDocument<T>(
  options: UseRealtimeDocumentOptions
): UseRealtimeResult<T> {
  const { collection, documentId } = options;
  const service = useMemo(() => getRealtimeService(), []);
  const autoSubscribe = options.options?.autoSubscribe !== false;
  const includeMetadata = options.options?.includeMetadata !== false;

  // State
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<
    'online' | 'offline' | 'connecting' | 'disconnected'
  >('connecting');

  // Track subscription
  const subscriptionRef = React.useRef<(() => Promise<void>) | null>(null);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (subscriptionRef.current) {
      try {
        await subscriptionRef.current();
        subscriptionRef.current = null;
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  }, []);

  // Subscribe to document
  useEffect(() => {
    if (!autoSubscribe || !collection || !documentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setConnectionStatus('connecting');

    // Subscribe to document
    const unsubscribe = await service.subscribeToDocument<T>(
      collection,
      documentId,
      (newData) => {
        setData(newData);
        setLoading(false);
        setError(null);
        setConnectionStatus('online');
        options.options?.onSubscribe?.(collection);
      },
      (err) => {
        setError(err);
        setLoading(false);
        options.options?.onError?.(err, collection);
      }
    );

    // Update connection status
    setConnectionStatus('online');
    subscriptionRef.current = unsubscribe;

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [collection, documentId, autoSubscribe]);

  return {
    data,
    loading,
    error,
    subscriptionStatus: service.getSubscriptionStatus(collection),
    connectionStatus,
  };
}

/**
 * Hook for real-time collection subscriptions
 *
 * @param options - Subscription options
 * @returns Real-time query result
 */
export function useRealtimeCollection<T>(
  options: UseRealtimeCollectionOptions
): UseRealtimeResult<T[]> {
  const { collection, queryOptions, options: realtimeOptions } = options;
  const service = useMemo(() => getRealtimeService(), []);
  const autoSubscribe = realtimeOptions?.autoSubscribe !== false;
  const includeMetadata = realtimeOptions?.includeMetadata !== false;

  // State
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<
    'online' | 'offline' | 'connecting' | 'disconnected'
  >('connecting');

  // Track subscription
  const subscriptionRef = React.useRef<(() => Promise<void>) | null>(null);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (subscriptionRef.current) {
      try {
        await subscriptionRef.current();
        subscriptionRef.current = null;
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  }, []);

  // Subscribe to collection
  useEffect(() => {
    if (!autoSubscribe || !collection) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setConnectionStatus('connecting');

    // Build subscription options
    const subOptions: RealtimeSubscriptionOptions = {
      includeMetadata,
      onSubscribe: collection,
      onUnsubscribe: collection,
      onError: realtimeOptions?.onError,
    };

    // Subscribe to collection
    const unsubscribe = service.subscribeToCollection<T>(
      collection,
      subOptions,
      (newData) => {
        setData(newData);
        setLoading(false);
        setError(null);
        setConnectionStatus('online');
        realtimeOptions?.onSubscribe?.(collection);
      },
      (err) => {
        setError(err);
        setLoading(false);
        realtimeOptions?.onError?.(err, collection);
      }
    );

    // Update connection status
    setConnectionStatus('online');
    subscriptionRef.current = unsubscribe;

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [collection, autoSubscribe]);

  return {
    data,
    loading,
    error,
    subscriptionStatus: service.getSubscriptionStatus(collection),
    connectionStatus,
  };
}

/**
 * Hook for real-time query subscriptions
 *
 * @param options - Subscription options
 * @returns Real-time query result
 */
export function useRealtimeQuery<T>(
  options: UseRealtimeCollectionOptions
): UseRealtimeResult<T[]> {
  const { collection, queryOptions, options: realtimeOptions } = options;
  const service = useMemo(() => getRealtimeService(), []);
  const autoSubscribe = realtimeOptions?.autoSubscribe !== false;
  const includeMetadata = realtimeOptions?.includeMetadata !== false;

  // State
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<
    'online' | 'offline' | 'connecting' | 'disconnected'
  >('connecting');

  // Track subscription
  const subscriptionRef = React.useRef<(() => Promise<void>) | null>(null);

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (subscriptionRef.current) {
      try {
        await subscriptionRef.current();
        subscriptionRef.current = null;
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  }, []);

  // Subscribe to query
  useEffect(() => {
    if (!autoSubscribe || !collection) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setConnectionStatus('connecting');

    // Build subscription options
    const subOptions: RealtimeSubscriptionOptions = {
      includeMetadata,
      onSubscribe: collection,
      onUnsubscribe: collection,
      onError: realtimeOptions?.onError,
    };

    // Subscribe to query
    const unsubscribe = service.subscribeToQuery<T>(
      collection,
      subOptions,
      (newData) => {
        setData(newData);
        setLoading(false);
        setError(null);
        setConnectionStatus('online');
        realtimeOptions?.onSubscribe?.(collection);
      },
      (err) => {
        setError(err);
        setLoading(false);
        realtimeOptions?.onError?.(err, collection);
      }
    );

    // Update connection status
    setConnectionStatus('online');
    subscriptionRef.current = unsubscribe;

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [collection, autoSubscribe, JSON.stringify(queryOptions)]);

  return {
    data,
    loading,
    error,
    subscriptionStatus: service.getSubscriptionStatus(collection),
    connectionStatus,
  };
}

/**
 * Hook for connection status
 *
 * @param callback - Callback for connection status changes
 * @returns Current connection status
 */
export function useRealtimeConnection(
  callback: (status: 'online' | 'offline' | 'connecting' | 'disconnected') => void
): 'online' | 'offline' | 'connecting' | 'disconnected' {
  const service = useMemo(() => getRealtimeService(), []);

  const [status, setStatus] = React.useState<
    'online' | 'offline' | 'connecting' | 'disconnected'
  >('connecting');

  // Poll connection status
  useEffect(() => {
    const interval = setInterval(() => {
      // Get all active subscriptions
      const subscriptions = service.getAllActiveSubscriptions();

      // If we have active subscriptions, we're connected
      if (subscriptions.length > 0) {
        if (status !== 'online') {
          setStatus('online');
          callback('online');
        }
      } else {
        setStatus('offline');
        callback('offline');
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(interval);
    };
  }, [callback]);

  return status;
}

/**
 * Hook for subscription count
 *
 * @returns Number of active subscriptions
 */
export function useSubscriptionCount(): number {
  const service = useMemo(() => getRealtimeService(), []);
  const [count, setCount] = React.useState(0);

  // Poll subscription count
  useEffect(() => {
    const interval = setInterval(() => {
      const currentCount = service.getSubscriptionCount();

      if (currentCount !== count) {
        setCount(currentCount);
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(interval);
    };
  }, [count]);

  return count;
}

/**
 * Hook for subscription status
 *
 * @param collection - Collection name
 * @returns Subscription status
 */
export function useSubscriptionStatus(
  collection: string
): SubscriptionStatus | null {
  const service = useMemo(() => getRealtimeService(), []);

  return service.getSubscriptionStatus(collection);
}

/**
 * Hook to force refresh all subscriptions
 *
 * @returns Function to refresh all subscriptions
 */
export function useRealtimeRefresh(): {
  refresh: () => void;
  isRefreshing: boolean;
} {
  const service = useMemo(() => getRealtimeService(), []);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);

      // Unsubscribe all
      await service.unsubscribeAll();

      // Small delay to allow cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
      setIsRefreshing(false);
      throw error;
    }
  }, [isRefreshing]);

  return {
    refresh,
    isRefreshing,
  };
}

/**
 * Hook to force unsubscribe all subscriptions
 *
 * @returns Function to unsubscribe all
 */
export function useRealtimeUnsubscribeAll(): {
  unsubscribeAll: () => Promise<void>;
  isUnsubscribing: boolean;
} {
  const service = useMemo(() => getRealtimeService(), []);
  const [isUnsubscribing, setIsUnsubscribing] = React.useState(false);

  const unsubscribeAll = useCallback(async () => {
    if (isUnsubscribing) {
      return;
    }

    try {
      setIsUnsubscribing(true);

      // Unsubscribe all
      await service.unsubscribeAll();

      setIsUnsubscribing(false);
    } catch (error) {
      console.error('Error unsubscribing all:', error);
      setIsUnsubscribing(false);
      throw error;
    }
  }, [isUnsubscribing]);

  return {
    unsubscribeAll,
    isUnsubscribing,
  };
}

/**
 * Hook to get all subscription statuses
 *
 * @returns Array of subscription statuses
 */
export function useAllSubscriptionStatuses(): SubscriptionStatus[] {
  const service = useMemo(() => getRealtimeService(), []);
  const [statuses, setStatuses] = React.useState<SubscriptionStatus[]>([]);

  // Poll subscription statuses
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatuses = service.getAllActiveSubscriptions();

      setStatuses(currentStatuses);
    }, 1000); // Check every second

    return () => {
      clearInterval(interval);
    };
  }, []);

  return statuses;
}
