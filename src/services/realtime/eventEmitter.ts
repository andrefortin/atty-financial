/**
 * Real-time Event Emitter Service
 *
 * Provides a centralized event system for real-time application events.
 * Supports event publishing, subscription, wildcard matching, history tracking,
 * filtering, debouncing, throttling, and middleware support.
 *
 * Integrates with Firebase Firestore onSnapshot callbacks and WebSocket Manager
 * for unified real-time event handling.
 *
 * @module services/realtime/eventEmitter
 */

import { WebSocketManager, type WebSocketMessage } from './webSocketManager';

// ============================================
// Event Types Enum
// ============================================

/**
 * Enumeration of all real-time event types
 */
export enum EventType {
  // ============================================
  // Collection Events (Firestore)
  // ============================================
  /** Document created in any collection */
  DOCUMENT_CREATED = 'document:created',
  /** Document updated in any collection */
  DOCUMENT_UPDATED = 'document:updated',
  /** Document deleted from any collection */
  DOCUMENT_DELETED = 'document:deleted',
  /** Batch of documents changed */
  DOCUMENT_BATCH_CHANGED = 'document:batch:changed',

  // ============================================
  // Matter Events
  // ============================================
  /** New matter created */
  MATTER_CREATED = 'matter:created',
  /** Matter details updated */
  MATTER_UPDATED = 'matter:updated',
  /** Matter status changed */
  MATTER_STATUS_CHANGED = 'matter:status:changed',
  /** Matter balance changed */
  MATTER_BALANCE_CHANGED = 'matter:balance:changed',
  /** Matter archived/closed */
  MATTER_CLOSED = 'matter:closed',
  /** Matter reopened */
  MATTER_REOPENED = 'matter:reopened',

  // ============================================
  // Transaction Events
  // ============================================
  /** Transaction created/imported */
  TRANSACTION_CREATED = 'transaction:created',
  /** Transaction updated */
  TRANSACTION_UPDATED = 'transaction:updated',
  /** Transaction status changed */
  TRANSACTION_STATUS_CHANGED = 'transaction:status:changed',
  /** Transaction assigned to matter */
  TRANSACTION_ASSIGNED = 'transaction:assigned',
  /** Transaction unassigned from matter */
  TRANSACTION_UNASSIGNED = 'transaction:unassigned',
  /** Transaction matched (auto or manual) */
  TRANSACTION_MATCHED = 'transaction:matched',
  /** Batch transactions imported */
  TRANSACTION_BATCH_IMPORTED = 'transaction:batch:imported',

  // ============================================
  // Allocation Events
  // ============================================
  /** Interest allocation executed */
  ALLOCATION_EXECUTED = 'allocation:executed',
  /** Allocation calculation started */
  ALLOCATION_STARTED = 'allocation:started',
  /** Allocation calculation completed */
  ALLOCATION_COMPLETED = 'allocation:completed',
  /** Allocation failed */
  ALLOCATION_FAILED = 'allocation:failed',
  /** Carry forward amount created */
  ALLOCATION_CARRY_FORWARD = 'allocation:carry:forward',

  // ============================================
  // Interest Events
  // ============================================
  /** Daily interest calculated */
  INTEREST_CALCULATED = 'interest:calculated',
  /** Interest rate changed */
  INTEREST_RATE_CHANGED = 'interest:rate:changed',
  /** Interest posted/accrued */
  INTEREST_ACCRUED = 'interest:accrued',
  /** Interest paid */
  INTEREST_PAID = 'interest:paid',

  // ============================================
  // Report Events
  // ============================================
  /** Report generated */
  REPORT_GENERATED = 'report:generated',
  /** Report exported */
  REPORT_EXPORTED = 'report:exported',
  /** Report scheduled */
  REPORT_SCHEDULED = 'report:scheduled',

  // ============================================
  // User Events
  // ============================================
  /** User logged in */
  USER_LOGGED_IN = 'user:logged:in',
  /** User logged out */
  USER_LOGGED_OUT = 'user:logged:out',
  /** User permissions changed */
  USER_PERMISSIONS_CHANGED = 'user:permissions:changed',

  // ============================================
  // Connection Events
  // ============================================
  /** WebSocket connected */
  CONNECTION_CONNECTED = 'connection:connected',
  /** WebSocket disconnected */
  CONNECTION_DISCONNECTED = 'connection:disconnected',
  /** Connection error */
  CONNECTION_ERROR = 'connection:error',
  /** Connection reconnecting */
  CONNECTION_RECONNECTING = 'connection:reconnecting',
  /** Firestore subscription active */
  FIRESTORE_SUBSCRIPTION_ACTIVE = 'firestore:subscription:active',
  /** Firestore subscription error */
  FIRESTORE_SUBSCRIPTION_ERROR = 'firestore:subscription:error',

  // ============================================
  // System Events
  // ============================================
  /** Application initialized */
  SYSTEM_INITIALIZED = 'system:initialized',
  /** System error occurred */
  SYSTEM_ERROR = 'system:error',
  /** Configuration changed */
  CONFIG_CHANGED = 'config:changed',
  /** Cache cleared */
  CACHE_CLEARED = 'cache:cleared',
  /** Data sync started */
  DATA_SYNC_STARTED = 'data:sync:started',
  /** Data sync completed */
  DATA_SYNC_COMPLETED = 'data:sync:completed',
  /** Data sync failed */
  DATA_SYNC_FAILED = 'data:sync:failed',

  // ============================================
  // Debug Events
  // ============================================
  /** Debug message logged */
  DEBUG_LOG = 'debug:log',
  /** Debug state captured */
  DEBUG_STATE = 'debug:state',
}

// ============================================
// Core Types
// ============================================

/**
 * Real-time event structure
 */
export interface RealtimeEvent<T = unknown> {
  /** Unique event ID */
  id: string;
  /** Event type from EventType enum */
  type: EventType | string;
  /** Event payload */
  payload: T;
  /** Timestamp when event was created */
  timestamp: number;
  /** Event source (local, remote, firestore, websocket) */
  source: 'local' | 'remote' | 'firestore' | 'websocket';
  /** Optional correlation ID for related events */
  correlationId?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Whether event has been processed */
  processed?: boolean;
  /** Event version for schema evolution */
  version?: number;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void | Promise<void>;

/**
 * Wildcard event handler that receives all events
 */
export type WildcardEventHandler = (event: RealtimeEvent) => void | Promise<void>;

/**
 * Event filter predicate
 */
export type EventFilter = (event: RealtimeEvent) => boolean;

/**
 * Event middleware function
 * Can modify, transform, or block events
 */
export type EventMiddleware = (
  event: RealtimeEvent,
  next: (event: RealtimeEvent) => void
) => void;

/**
 * Event subscription information
 */
export interface EventSubscription {
  /** Unique subscription ID */
  id: string;
  /** Event type to listen to (supports wildcards) */
  eventType: string;
  /** Event handler function */
  handler: EventHandler | WildcardEventHandler;
  /** Whether this is a one-time subscription */
  once: boolean;
  /** Optional filter for this subscription */
  filter?: EventFilter;
  /** Timestamp when subscription was created */
  createdAt: number;
  /** Number of times handler was called */
  callCount: number;
}

/**
 * Event history entry
 */
export interface EventHistoryEntry {
  event: RealtimeEvent;
  timestamp: number;
}

/**
 * Debounce options
 */
export interface DebounceOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Whether to execute immediately on first event */
  immediate?: boolean;
}

/**
 * Throttle options
 */
export interface ThrottleOptions {
  /** Minimum time between executions in milliseconds */
  delay: number;
  /** Whether to execute immediately on first event */
  immediate?: boolean;
  /** Whether to execute on trailing edge */
  trailing?: boolean;
}

/**
 * Event emitter configuration
 */
export interface EventEmitterConfig {
  /** Maximum events to keep in history (default: 1000) */
  maxHistorySize?: number;
  /** Whether to track event history (default: true) */
  trackHistory?: boolean;
  /** Whether to enable debug logging (default: false) */
  debug?: boolean;
  /** Optional event source prefix for all events */
  sourcePrefix?: string;
  /** Optional correlation ID generator */
  generateCorrelationId?: () => string;
}

/**
 * Event statistics
 */
export interface EventStatistics {
  /** Total events emitted */
  totalEmitted: number;
  /** Total events processed */
  totalProcessed: number;
  /** Total events filtered */
  totalFiltered: number;
  /** Current number of subscriptions */
  activeSubscriptions: number;
  /** Current history size */
  historySize: number;
  /** Events by type */
  eventsByType: Record<string, number>;
  /** Events by source */
  eventsBySource: Record<string, number>;
}

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: Required<Omit<EventEmitterConfig, 'sourcePrefix' | 'generateCorrelationId'>> = {
  maxHistorySize: 1000,
  trackHistory: true,
  debug: false,
};

const WILDCARD = '*';

// ============================================
// Realtime Event Emitter Class
// ============================================

/**
 * Real-time Event Emitter
 *
 * Centralized event system with subscription management, history tracking,
 * filtering, and middleware support.
 */
export class RealtimeEventEmitter {
  private subscriptions: Map<string, EventSubscription>;
  private wildcardSubscriptions: Map<string, EventSubscription>;
  private history: EventHistoryEntry[];
  private middleware: EventMiddleware[];
  private config: Required<EventEmitterConfig>;
  private eventIdCounter: number;
  private subscriptionIdCounter: number;
  private statistics: EventStatistics;
  private wsManager: WebSocketManager | null;
  private wsSubscription: (() => void) | null;

  constructor(config: EventEmitterConfig = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      sourcePrefix: config.sourcePrefix || '',
      generateCorrelationId: config.generateCorrelationId || (() => this.generateId('corr-')),
    };

    // Initialize storage
    this.subscriptions = new Map();
    this.wildcardSubscriptions = new Map();
    this.history = [];
    this.middleware = [];

    // Initialize counters
    this.eventIdCounter = 0;
    this.subscriptionIdCounter = 0;

    // Initialize statistics
    this.statistics = {
      totalEmitted: 0,
      totalProcessed: 0,
      totalFiltered: 0,
      activeSubscriptions: 0,
      historySize: 0,
      eventsByType: {},
      eventsBySource: {},
    };

    // WebSocket manager integration
    this.wsManager = null;
    this.wsSubscription = null;

    this.debug('RealtimeEventEmitter initialized');
  }

  // ============================================
  // Event Publishing
  // ============================================

  /**
   * Emit a single event
   *
   * @param type - Event type
   * @param payload - Event payload
   * @param options - Optional event options
   * @returns Event ID
   */
  emit<T = unknown>(
    type: EventType | string,
    payload: T,
    options?: {
      source?: RealtimeEvent<T>['source'];
      correlationId?: string;
      metadata?: Record<string, unknown>;
    }
  ): string {
    const event: RealtimeEvent<T> = {
      id: this.generateId('evt-'),
      type,
      payload,
      timestamp: Date.now(),
      source: options?.source || 'local',
      correlationId: options?.correlationId || this.config.generateCorrelationId(),
      metadata: options?.metadata,
      processed: false,
    };

    return this.emitEvent(event);
  }

  /**
   * Emit a batch of events
   *
   * @param events - Array of events to emit
   * @returns Array of event IDs
   */
  emitBatch<T = unknown>(events: Array<{
    type: EventType | string;
    payload: T;
    source?: RealtimeEvent<T>['source'];
    correlationId?: string;
  }>): string[] {
    const eventIds: string[] = [];

    for (const eventData of events) {
      const eventId = this.emit(eventData.type, eventData.payload, {
        source: eventData.source,
        correlationId: eventData.correlationId,
      });
      eventIds.push(eventId);
    }

    return eventIds;
  }

  /**
   * Emit a pre-built event object
   *
   * @param event - Event object to emit
   * @returns Event ID
   */
  private emitEvent<T>(event: RealtimeEvent<T>): string {
    // Update statistics
    this.statistics.totalEmitted++;
    this.statistics.eventsByType[event.type] = (this.statistics.eventsByType[event.type] || 0) + 1;
    this.statistics.eventsBySource[event.source] = (this.statistics.eventsBySource[event.source] || 0) + 1;

    this.debug('Event emitted', { type: event.type, id: event.id });

    // Apply middleware
    let processedEvent = event;
    for (const middleware of this.middleware) {
      try {
        middleware(processedEvent, (modifiedEvent) => {
          processedEvent = modifiedEvent;
        });
      } catch (error) {
        this.debug('Middleware error', { error });
        this.emit(EventType.SYSTEM_ERROR, { originalEvent: event, error: String(error) }, { source: 'local' });
      }
    }

    // Add to history if tracking enabled
    if (this.config.trackHistory) {
      this.addToHistory(processedEvent);
    }

    // Process event
    this.processEvent(processedEvent);

    return processedEvent.id;
  }

  /**
   * Process an event by notifying subscribers
   */
  private processEvent<T>(event: RealtimeEvent<T>): void {
    // Get matching subscriptions
    const subscriptions = this.getMatchingSubscriptions(event);

    // Notify each subscription
    for (const subscription of subscriptions) {
      // Apply subscription filter if present
      if (subscription.filter && !subscription.filter(event)) {
        this.statistics.totalFiltered++;
        continue;
      }

      // Mark event as processed
      event.processed = true;

      // Increment call count
      subscription.callCount++;

      // Call handler
      try {
        const result = subscription.handler(event);

        // Handle async handlers
        if (result instanceof Promise) {
          result.catch((error) => {
            this.debug('Async handler error', { subscriptionId: subscription.id, error });
          });
        }

        // Remove once subscriptions
        if (subscription.once) {
          this.off(subscription.id);
        }
      } catch (error) {
        this.debug('Handler error', { subscriptionId: subscription.id, error });
      }
    }

    this.statistics.totalProcessed++;
  }

  // ============================================
  // Event Subscription
  // ============================================

  /**
   * Subscribe to events of a specific type
   *
   * @param eventType - Event type to subscribe to (supports wildcards)
   * @param handler - Event handler function
   * @param options - Optional subscription options
   * @returns Unsubscribe function
   */
  on<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    options?: {
      once?: boolean;
      filter?: EventFilter;
    }
  ): () => void {
    const subscription: EventSubscription = {
      id: this.generateId('sub-'),
      eventType,
      handler,
      once: options?.once || false,
      filter: options?.filter,
      createdAt: Date.now(),
      callCount: 0,
    };

    // Store in appropriate map based on wildcard
    const isWildcard = eventType.includes(WILDCARD);
    const map = isWildcard ? this.wildcardSubscriptions : this.subscriptions;
    map.set(subscription.id, subscription);

    this.updateSubscriptionStats();

    this.debug('Subscription added', { id: subscription.id, eventType, wildcard: isWildcard });

    // Return unsubscribe function
    return () => this.off(subscription.id);
  }

  /**
   * Subscribe to an event exactly once
   *
   * @param eventType - Event type to subscribe to
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  once<T = unknown>(
    eventType: string,
    handler: EventHandler<T>
  ): () => void {
    return this.on(eventType, handler, { once: true });
  }

  /**
   * Subscribe to all events (wildcard)
   *
   * @param handler - Wildcard handler function
   * @param options - Optional subscription options
   * @returns Unsubscribe function
   */
  onAny(
    handler: WildcardEventHandler,
    options?: {
      once?: boolean;
      filter?: EventFilter;
    }
  ): () => void {
    return this.on('*', handler, options);
  }

  /**
   * Unsubscribe from an event
   *
   * @param subscriptionId - Subscription ID to remove
   */
  off(subscriptionId: string): void {
    const removed = this.subscriptions.delete(subscriptionId) ||
                    this.wildcardSubscriptions.delete(subscriptionId);

    if (removed) {
      this.updateSubscriptionStats();
      this.debug('Subscription removed', { id: subscriptionId });
    }
  }

  /**
   * Unsubscribe all handlers for an event type
   *
   * @param eventType - Event type to clear subscriptions for
   */
  offAll(eventType: string): void {
    let removed = 0;

    // Remove from regular subscriptions
    for (const [id, subscription] of this.subscriptions.entries()) {
      if (subscription.eventType === eventType) {
        this.subscriptions.delete(id);
        removed++;
      }
    }

    // Remove from wildcard subscriptions
    for (const [id, subscription] of this.wildcardSubscriptions.entries()) {
      if (this.isEventTypeMatch(eventType, subscription.eventType)) {
        this.wildcardSubscriptions.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.updateSubscriptionStats();
      this.debug('Subscriptions removed', { eventType, count: removed });
    }
  }

  /**
   * Remove all subscriptions
   */
  removeAll(): void {
    const count = this.subscriptions.size + this.wildcardSubscriptions.size;
    this.subscriptions.clear();
    this.wildcardSubscriptions.clear();
    this.updateSubscriptionStats();
    this.debug('All subscriptions removed', { count });
  }

  // ============================================
  // Event History
  // ============================================

  /**
   * Get event history
   *
   * @param filter - Optional filter function
   * @param limit - Maximum number of events to return
   * @returns Array of history entries
   */
  getHistory(filter?: EventFilter, limit?: number): EventHistoryEntry[] {
    let history = this.history;

    // Apply filter
    if (filter) {
      history = history.filter(entry => filter(entry.event));
    }

    // Apply limit
    if (limit && limit < history.length) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Get history for a specific event type
   *
   * @param eventType - Event type to filter by
   * @param limit - Maximum number of events to return
   * @returns Array of history entries
   */
  getHistoryByType(eventType: string, limit?: number): EventHistoryEntry[] {
    return this.getHistory(
      event => this.isEventTypeMatch(event.type, eventType),
      limit
    );
  }

  /**
   * Get history within a time range
   *
   * @param startTime - Start timestamp
   * @param endTime - End timestamp
   * @returns Array of history entries
   */
  getHistoryByTime(startTime: number, endTime: number): EventHistoryEntry[] {
    return this.getHistory(
      entry => entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    const size = this.history.length;
    this.history = [];
    this.updateHistoryStats();
    this.debug('History cleared', { size });
  }

  /**
   * Replay events from history
   *
   * @param filter - Optional filter function
   * @param limit - Maximum number of events to replay
   * @returns Number of events replayed
   */
  replayHistory(filter?: EventFilter, limit?: number): number {
    let history = this.getHistory(filter, limit);
    let replayed = 0;

    for (const entry of history) {
      // Create a new event with replay metadata
      const replayEvent: RealtimeEvent = {
        ...entry.event,
        id: this.generateId('replay-'),
        timestamp: Date.now(),
        source: 'local',
        metadata: {
          ...entry.event.metadata,
          replayed: true,
          originalEventId: entry.event.id,
          originalTimestamp: entry.event.timestamp,
        },
      };

      this.emitEvent(replayEvent);
      replayed++;
    }

    this.debug('History replayed', { count: replayed });
    return replayed;
  }

  // ============================================
  // Event Filtering
  // ============================================

  /**
   * Create a debounced event handler
   *
   * @param handler - Handler to debounce
   * @param options - Debounce options
   * @returns Debounced handler
   */
  debounce<T = unknown>(
    handler: EventHandler<T>,
    options: DebounceOptions
  ): EventHandler<T> {
    let timeoutId: number | null = null;
    let lastArgs: [RealtimeEvent<T>] | null = null;

    return (event: RealtimeEvent<T>) => {
      lastArgs = [event];

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      if (options.immediate && timeoutId === null) {
        handler(event);
        timeoutId = null;
      } else {
        timeoutId = window.setTimeout(() => {
          if (lastArgs) {
            handler(lastArgs[0]);
          }
          timeoutId = null;
        }, options.delay);
      }
    };
  }

  /**
   * Create a throttled event handler
   *
   * @param handler - Handler to throttle
   * @param options - Throttle options
   * @returns Throttled handler
   */
  throttle<T = unknown>(
    handler: EventHandler<T>,
    options: ThrottleOptions
  ): EventHandler<T> {
    let timeoutId: number | null = null;
    let lastExecuted = 0;
    let lastArgs: [RealtimeEvent<T>] | null = null;

    return (event: RealtimeEvent<T>) => {
      const now = Date.now();
      const timeSinceLastExecution = now - lastExecuted;

      lastArgs = [event];

      if (timeSinceLastExecution >= options.delay) {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        lastExecuted = now;
        handler(event);
      } else if (options.trailing && timeoutId === null) {
        timeoutId = window.setTimeout(() => {
          if (lastArgs) {
            lastExecuted = Date.now();
            handler(lastArgs[0]);
          }
          timeoutId = null;
        }, options.delay - timeSinceLastExecution);
      }
    };
  }

  /**
   * Create a filtered event handler
   *
   * @param handler - Handler to wrap
   * @param filter - Filter predicate
   * @returns Filtered handler
   */
  filter<T = unknown>(
    handler: EventHandler<T>,
    filter: EventFilter
  ): EventHandler<T> {
    return (event: RealtimeEvent<T>) => {
      if (filter(event)) {
        handler(event);
      }
    };
  }

  // ============================================
  // Event Middleware
  // ============================================

  /**
   * Add event middleware
   *
   * @param middleware - Middleware function
   */
  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
    this.debug('Middleware added', { count: this.middleware.length });
  }

  /**
   * Remove event middleware
   *
   * @param middleware - Middleware function to remove
   */
  removeMiddleware(middleware: EventMiddleware): void {
    const index = this.middleware.indexOf(middleware);
    if (index > -1) {
      this.middleware.splice(index, 1);
      this.debug('Middleware removed', { count: this.middleware.length });
    }
  }

  /**
   * Remove all middleware
   */
  clearMiddleware(): void {
    const count = this.middleware.length;
    this.middleware = [];
    this.debug('Middleware cleared', { count });
  }

  // ============================================
  // WebSocket Integration
  // ============================================

  /**
   * Connect to WebSocket Manager for remote events
   *
   * @param wsManager - WebSocket manager instance
   */
  connectWebSocket(wsManager: WebSocketManager): void {
    if (this.wsManager === wsManager) {
      return;
    }

    // Disconnect existing
    this.disconnectWebSocket();

    // Store reference
    this.wsManager = wsManager;

    // Subscribe to all messages
    this.wsSubscription = wsManager.subscribe('*', (message) => {
      this.emitFromWebSocket(message);
    });

    this.debug('WebSocket connected');
  }

  /**
   * Disconnect from WebSocket Manager
   */
  disconnectWebSocket(): void {
    if (this.wsSubscription) {
      this.wsSubscription();
      this.wsSubscription = null;
    }
    this.wsManager = null;
    this.debug('WebSocket disconnected');
  }

  /**
   * Emit event from WebSocket message
   */
  private emitFromWebSocket(message: WebSocketMessage): void {
    const event: RealtimeEvent = {
      id: message.id,
      type: message.type,
      payload: message.payload,
      timestamp: message.timestamp,
      source: 'websocket',
      correlationId: message.correlationId,
      metadata: message.requiresAck ? { requiresAck: true } : undefined,
    };

    this.emitEvent(event);
  }

  // ============================================
  // Firestore Integration
  // ============================================

  /**
   * Create event from Firestore document change
   *
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param changeType - Type of change (added, modified, removed)
   * @param data - Document data
   * @returns Event ID
   */
  emitFirestoreEvent<T = unknown>(
    collection: string,
    documentId: string,
    changeType: 'added' | 'modified' | 'removed',
    data: T | null
  ): string {
    let eventType: EventType;

    switch (changeType) {
      case 'added':
        eventType = EventType.DOCUMENT_CREATED;
        break;
      case 'modified':
        eventType = EventType.DOCUMENT_UPDATED;
        break;
      case 'removed':
        eventType = EventType.DOCUMENT_DELETED;
        break;
    }

    return this.emit(eventType, {
      collection,
      documentId,
      changeType,
      data,
    }, { source: 'firestore' });
  }

  /**
   * Wrap a Firestore onSnapshot callback to emit events
   *
   * @param callback - Original onSnapshot callback
   * @returns Wrapped callback that emits events
   */
  wrapFirestoreCallback<T = unknown>(
    callback: (doc: { id: string; data: T | null } | null) => void,
    collection: string
  ): (doc: { id: string; data: T | null } | null) => void {
    return (doc) => {
      // Determine change type based on whether doc exists
      let changeType: 'added' | 'modified' | 'removed' = 'added';

      // Check history for previous state
      const historyEntry = this.history.find(
        entry =>
          entry.event.type === EventType.DOCUMENT_CREATED ||
          entry.event.type === EventType.DOCUMENT_UPDATED ||
          entry.event.type === EventType.DOCUMENT_DELETED
      );

      if (historyEntry && !doc) {
        changeType = 'removed';
      } else if (historyEntry && doc) {
        changeType = 'modified';
      }

      // Emit Firestore event
      if (doc) {
        this.emitFirestoreEvent(collection, doc.id, changeType, doc.data);
      }

      // Call original callback
      callback(doc);
    };
  }

  // ============================================
  // Statistics and Monitoring
  // ============================================

  /**
   * Get current statistics
   *
   * @returns Event statistics
   */
  getStatistics(): EventStatistics {
    return {
      ...this.statistics,
      activeSubscriptions: this.subscriptions.size + this.wildcardSubscriptions.size,
      historySize: this.history.length,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      totalEmitted: 0,
      totalProcessed: 0,
      totalFiltered: 0,
      activeSubscriptions: this.subscriptions.size + this.wildcardSubscriptions.size,
      historySize: this.history.length,
      eventsByType: {},
      eventsBySource: {},
    };
    this.debug('Statistics reset');
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get subscriptions by event type
   */
  getSubscriptions(eventType: string): EventSubscription[] {
    const results: EventSubscription[] = [];

    // Check regular subscriptions
    for (const subscription of this.subscriptions.values()) {
      if (subscription.eventType === eventType) {
        results.push(subscription);
      }
    }

    // Check wildcard subscriptions
    for (const subscription of this.wildcardSubscriptions.values()) {
      if (this.isEventTypeMatch(eventType, subscription.eventType)) {
        results.push(subscription);
      }
    }

    return results;
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions(): EventSubscription[] {
    return [
      ...Array.from(this.subscriptions.values()),
      ...Array.from(this.wildcardSubscriptions.values()),
    ];
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}${Date.now()}-${++this.eventIdCounter}`;
  }

  /**
   * Check if event type matches subscription pattern
   */
  private isEventTypeMatch(eventType: string, pattern: string): boolean {
    if (pattern === '*') {
      return true;
    }

    if (pattern.includes('*')) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return regex.test(eventType);
    }

    return eventType === pattern;
  }

  /**
   * Get all subscriptions that match an event
   */
  private getMatchingSubscriptions(event: RealtimeEvent): EventSubscription[] {
    const matching: EventSubscription[] = [];

    // Check regular subscriptions
    for (const subscription of this.subscriptions.values()) {
      if (this.isEventTypeMatch(event.type, subscription.eventType)) {
        matching.push(subscription);
      }
    }

    // Check wildcard subscriptions
    for (const subscription of this.wildcardSubscriptions.values()) {
      if (this.isEventTypeMatch(event.type, subscription.eventType)) {
        matching.push(subscription);
      }
    }

    return matching;
  }

  /**
   * Add event to history
   */
  private addToHistory(event: RealtimeEvent): void {
    this.history.push({
      event,
      timestamp: Date.now(),
    });

    // Trim history if needed
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }

    this.updateHistoryStats();
  }

  /**
   * Update history statistics
   */
  private updateHistoryStats(): void {
    this.statistics.historySize = this.history.length;
  }

  /**
   * Update subscription statistics
   */
  private updateSubscriptionStats(): void {
    this.statistics.activeSubscriptions = this.subscriptions.size + this.wildcardSubscriptions.size;
  }

  /**
   * Debug logging
   */
  private debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[EventEmitter] ${message}`, data || '');
    }
  }

  /**
   * Destroy the event emitter
   */
  destroy(): void {
    this.removeAll();
    this.clearHistory();
    this.clearMiddleware();
    this.disconnectWebSocket();
    this.debug('EventEmitter destroyed');
  }
}

// ============================================
// Factory Functions
// ============================================

let defaultEmitter: RealtimeEventEmitter | null = null;

/**
 * Create a new event emitter instance
 */
export function createEventEmitter(config?: EventEmitterConfig): RealtimeEventEmitter {
  return new RealtimeEventEmitter(config);
}

/**
 * Get the default event emitter instance
 */
export function getDefaultEventEmitter(): RealtimeEventEmitter {
  if (!defaultEmitter) {
    defaultEmitter = new RealtimeEventEmitter();
  }
  return defaultEmitter;
}

/**
 * Set the default event emitter instance
 */
export function setDefaultEventEmitter(emitter: RealtimeEventEmitter): void {
  defaultEmitter = emitter;
}

/**
 * Reset the default event emitter instance
 */
export function resetDefaultEventEmitter(): void {
  if (defaultEmitter) {
    defaultEmitter.destroy();
    defaultEmitter = null;
  }
}
