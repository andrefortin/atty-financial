/**
 * Real-time Service
 *
 * Manages real-time subscriptions to Firestore.
 * Provides connection status tracking and subscription lifecycle management.
 *
 * @module services/firebase/realtime.service
 */

import { onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import {
  query,
  where,
  orderBy,
  QueryConstraint,
  collection,
} from 'firebase/firestore';
import type { FirestoreDocument } from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Real-time subscription options
 */
export interface RealtimeSubscriptionOptions {
  /**
   * Whether to include metadata (default: true)
   */
  includeMetadata?: boolean;

  /**
   * Callback for subscription errors
   */
  onError?: (error: Error, collection: string) => void;

  /**
   * Callback for successful subscription
   */
  onSubscribe?: (collection: string) => void;

  /**
   * Callback for unsubscription
   */
  onUnsubscribe?: (collection: string) => void;

  /**
   * Whether to auto-subscribe on mount (default: true)
   */
  autoSubscribe?: boolean;
}

/**
 * Subscription status
 */
export interface SubscriptionStatus {
  isSubscribed: boolean;
  lastUpdated: number;
  collection: string;
  subscriptionId: string;
}

/**
 * Real-time query options
 */
export interface RealtimeQueryOptions {
  /**
   * Query filters
   */
  filters?: QueryConstraint[];

  /**
   * Order by clause
   */
  orderBy?: QueryConstraint[];

  /**
   * Limit (default: 100)
   */
  limit?: number;

  /**
   * Start after document (for pagination)
   */
  startAfter?: {
    value: any;
    collection: string;
  };
}

/**
 * Real-time collection options
 */
export interface RealtimeCollectionOptions extends RealtimeSubscriptionOptions {
  /**
   * Whether to listen to the entire collection
   */
  listenToCollection?: boolean;

  /**
   * Query options
   */
  query?: RealtimeQueryOptions;
}

// ============================================
// Subscription Registry
// ============================================

/**
 * Active subscriptions registry
 */
class SubscriptionRegistry {
  private subscriptions: Map<string, {
    unsubscribe: Unsubscribe;
    options: RealtimeSubscriptionOptions;
    lastUpdate: number;
  }>;
  private subscriptionIdCounter: number;

  constructor() {
    this.subscriptions = new Map();
    this.subscriptionIdCounter = 0;
  }

  /**
   * Register a new subscription
   */
  registerSubscription(
    key: string,
    unsubscribe: Unsubscribe,
    options: RealtimeSubscriptionOptions
  ): string {
    const subscriptionId = `sub-${this.subscriptionIdCounter++}`;

    this.subscriptions.set(key, {
      unsubscribe,
      options,
      lastUpdate: Date.now(),
    });

    options.onSubscribe?.(key);

    return subscriptionId;
  }

  /**
   * Get subscription by key
   */
  getSubscription(key: string): SubscriptionStatus | undefined {
    const subscription = this.subscriptions.get(key);

    if (!subscription) {
      return undefined;
    }

    return {
      isSubscribed: true,
      lastUpdated: subscription.lastUpdate,
      collection: key,
      subscriptionId: key,
    };
  }

  /**
   * Update subscription timestamp
   */
  updateTimestamp(key: string): void {
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      subscription.lastUpdate = Date.now();
    }
  }

  /**
   * Unsubscribe and remove from registry
   */
  async unsubscribe(key: string): Promise<void> {
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      subscription.options.onUnsubscribe?.(key);

      try {
        await subscription.unsubscribe();
      } catch (error) {
        console.error(`Error unsubscribing from ${key}:`, error);
      }
    }

    this.subscriptions.delete(key);
    }
  }

  /**
   * Unsubscribe all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.entries()).map(
      async ([key, subscription]) => {
        subscription.options.onUnsubscribe?.(key);

        try {
          await subscription.unsubscribe();
        } catch (error) {
          console.error(`Error unsubscribing from ${key}:`, error);
        }
      }
    }
  );

    await Promise.all(unsubscribePromises);
    this.subscriptions.clear();
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): SubscriptionStatus[] {
    return Array.from(this.subscriptions.entries()).map(([key, subscription]) => ({
      isSubscribed: true,
      lastUpdated: subscription.lastUpdate,
      collection: key,
      subscriptionId: key,
    }));
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if subscription exists
   */
  hasSubscription(key: string): boolean {
    return this.subscriptions.has(key);
  }
}

// ============================================
// Real-time Service
// ============================================

/**
 * Real-time subscription manager
 */
export class RealtimeService {
  private registry: SubscriptionRegistry;

  constructor() {
    this.registry = new SubscriptionRegistry();
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Subscribe to a document
   *
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param onUpdate - Callback for document updates
   * @param options - Subscription options
   * @returns Unsubscribe function
   */
  subscribeToDocument<T>(
    collection: string,
    documentId: string,
    onUpdate: (doc: FirestoreDocument<T> | null) => void,
    options?: RealtimeSubscriptionOptions
  ): () => Promise<void> {
    const { doc } = import('firebase/firestore');
    const db = import('@/lib/firebase').getFirestore();

    const docRef = doc(db, collection, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = {
              id: snapshot.id,
              data: snapshot.data() as T,
            } as FirestoreDocument<T>;

            this.registry.updateTimestamp(collection);

            if (options?.includeMetadata !== false) {
              data.metadata = {
                source: 'realtime',
                lastUpdated: snapshot.metadata?.lastUpdated,
              };
            }

            onUpdate(data);
          } else {
            onUpdate(null);
          }
        } catch (error) {
          options?.onError?.(error as Error, collection);
        }
      },
      (error) => {
        options?.onError?.(error as Error, collection);
      }
    );

    return this.createCleanupFunction(collection, unsubscribe, options);
  }

  /**
   * Subscribe to a collection
   *
   * @param collection - Collection name
   * @param onUpdate - Callback for collection updates
   * @param options - Subscription options
   * @returns Unsubscribe function
   */
  subscribeToCollection<T>(
    collection: string,
    onUpdate: (docs: FirestoreDocument<T>[]) => void,
    options?: RealtimeCollectionOptions
  ): () => Promise<void> {
    const { collection: col } = import('firebase/firestore');
    const db = import('@/lib/firebase').getFirestore();
    const { listenToCollection, query: q, orderBy: ord, where: w } = this;

    let queryRef: Query | null = null;

    if (options?.query?.filters || options?.query?.orderBy) {
      const filters = options.query.filters || [];
      const orderBys = options.query.orderBy || [];

      // Build query from filters and order by clauses
      queryRef = col(db);
      filters.forEach((filter) => queryRef = w(queryRef, filter.field as string, filter.operator, filter.value));
      orderBys.forEach((orderBy) => queryRef = ord(queryRef, orderBy.field as string, orderBy.direction));
    } else if (options?.query?.startAfter) {
      const { value, collection: colName } = options.query.startAfter;
      queryRef = col(db);
      queryRef = w(queryRef, 'documentId', '==', value);
    }

    const unsubscribe = onSnapshot(
      options?.listenToCollection !== false ? queryRef || col(db) : queryRef || col(db),
      (snapshot) => {
        try {
          const docs: FirestoreDocument<T>[] = [];
          let hasChanges = false;

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as T;

            docs.push({
              id: change.doc.id,
              data,
              metadata: options?.includeMetadata !== false ? {
                source: 'realtime',
                changeType: change.type,
                lastUpdated: new Timestamp(change.doc.metadata?.lastUpdated || Date.now()),
              } : undefined,
            } as FirestoreDocument<T>);

            hasChanges = true;
          });

          if (hasChanges) {
            this.registry.updateTimestamp(collection);
            onUpdate(docs);
          }
        } catch (error) {
          options?.onError?.(error as Error, collection);
        }
      },
      (error) => {
        options?.onError?.(error as Error, collection);
      }
    );

    return this.createCleanupFunction(collection, unsubscribe, options);
  }

  /**
   * Subscribe to a query
   *
   * @param collection - Collection name
   * @param onUpdate - Callback for query results
   * @param queryOptions - Query options
   * @param options - Subscription options
   * @returns Unsubscribe function
   */
  subscribeToQuery<T>(
    collection: string,
    onUpdate: (docs: FirestoreDocument<T>[]) => void,
    queryOptions: RealtimeQueryOptions,
    options?: RealtimeSubscriptionOptions
  ): () => Promise<void> {
    const { collection: col, query: q, orderBy: ord, where: w } = this;
    const db = import('@/lib/firebase').getFirestore();

    let queryRef: Query | null = null;

    // Build query from filters and order by clauses
    queryRef = col(db);
    if (queryOptions.filters) {
      queryOptions.filters.forEach((filter) => {
        queryRef = w(queryRef, filter.field as string, filter.operator, filter.value);
      });
    }
    if (queryOptions.orderBy) {
      queryOptions.orderBy.forEach((orderBy) => {
        queryRef = ord(queryRef, orderBy.field as string, orderBy.direction);
      });
    }

    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        try {
          const docs: FirestoreDocument<T>[] = [];
          let hasChanges = false;

          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as T;

            docs.push({
              id: change.doc.id,
              data,
              metadata: options?.includeMetadata !== false ? {
                source: 'realtime',
                changeType: change.type,
                lastUpdated: new Timestamp(change.doc.metadata?.lastUpdated || Date.now()),
              } : undefined,
            } as FirestoreDocument<T>);

            hasChanges = true;
          });

          if (hasChanges) {
            this.registry.updateTimestamp(collection);
            onUpdate(docs);
          }
        } catch (error) {
          options?.onError?.(error as Error, collection);
        }
      },
      (error) => {
        options?.onError?.(error as Error, collection);
      }
    );

    return this.createCleanupFunction(collection, unsubscribe, options);
  }

  // ============================================
  // Registry Management
  // ============================================

  /**
   * Get subscription status
   *
   * @param collection - Collection name
   * @returns Subscription status
   */
  getSubscriptionStatus(collection: string): SubscriptionStatus | undefined {
    return this.registry.getSubscription(collection);
  }

  /**
   * Get all active subscriptions
   *
   * @returns Array of active subscription statuses
   */
  getAllActiveSubscriptions(): SubscriptionStatus[] {
    return this.registry.getActiveSubscriptions();
  }

  /**
   * Get subscription count
   *
   * @returns Number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.registry.getSubscriptionCount();
  }

  /**
   * Check if subscription exists
   *
   * @param collection - Collection name
   * @returns Whether subscription exists
   */
  hasSubscription(collection: string): boolean {
    return this.registry.hasSubscription(collection);
  }

  /**
   * Unsubscribe from a collection
   *
   * @param collection - Collection name
   * @returns Promise that resolves when unsubscribed
   */
  async unsubscribe(collection: string): Promise<void> {
    return this.registry.unsubscribe(collection);
  }

  /**
   * Unsubscribe from all collections
   *
   * @returns Promise that resolves when all unsubscribed
   */
  async unsubscribeAll(): Promise<void> {
    return this.registry.unsubscribeAll();
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Create cleanup function for subscriptions
   */
  private createCleanupFunction(
    collection: string,
    unsubscribe: Unsubscribe,
    options?: RealtimeSubscriptionOptions
  ): () => Promise<void> {
    return async () => {
      try {
        await unsubscribe();
      } catch (error) {
        console.error(`Error in cleanup for ${collection}:`, error);
      } finally {
        options?.onUnsubscribe?.(collection);
      }
    };
  }

  /**
   * Batch subscribe to multiple collections
   */
  async subscribeBatch<T>(
    subscriptions: Array<{
      collection: string;
      documentId?: string;
      queryOptions?: RealtimeQueryOptions;
      options?: RealtimeSubscriptionOptions;
      callback: (docs: FirestoreDocument<T> | FirestoreDocument<T>[] | null) => void;
    }>
  ): Promise<() => Promise<void>> {
    const unsubs = await Promise.all(
      subscriptions.map((sub) => {
        if (sub.documentId) {
          return this.subscribeToDocument(
            sub.collection,
            sub.documentId,
            sub.callback as (doc: FirestoreDocument<T> | null) => void,
            sub.options
          );
        } else {
          return this.subscribeToQuery(
            sub.collection,
            sub.callback as (docs: FirestoreDocument<T>[]) => void,
            sub.queryOptions || {},
            sub.options
          );
        }
      })
    );

    return async () => {
      for (const unsub of unsubs) {
        await unsub();
      }
    };
  }

  /**
   * Get subscription IDs for debugging
   */
  getSubscriptionIds(): string[] {
    const statuses = this.registry.getActiveSubscriptions();
    return statuses.map((s) => s.subscriptionId);
  }

  /**
   * Clear all subscriptions (for testing)
   */
  clearAllSubscriptions(): void {
    this.registry = new SubscriptionRegistry();
  }
}

// ============================================
// Singleton Instance
// ============================================

let realtimeServiceInstance: RealtimeService | null = null;

/**
 * Get realtime service singleton instance
 */
export function getRealtimeService(): RealtimeService {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new RealtimeService();
  }
  return realtimeServiceInstance;
}

/**
 * Reset realtime service singleton (for testing)
 */
export function resetRealtimeService(): void {
  realtimeServiceInstance = null;
}
