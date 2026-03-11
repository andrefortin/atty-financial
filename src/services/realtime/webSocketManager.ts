/**
 * WebSocket Manager Service
 *
 * Manages WebSocket connections with connection state tracking, message handling,
 * subscription management, heartbeat/ping-pong mechanism, error handling, and
 * auto-reconnect with configurable options.
 *
 * Also integrates with Firebase Firestore real-time listeners for unified
 * real-time data management.
 *
 * @module services/realtime/webSocketManager
 */

// ============================================
// Types & Enums
// ============================================

/**
 * Connection status enumeration
 */
export enum ConnectionStatus {
  /** Connection is closed/disconnected */
  DISCONNECTED = 'DISCONNECTED',
  /** Currently attempting to connect */
  CONNECTING = 'CONNECTING',
  /** Successfully connected */
  CONNECTED = 'CONNECTED',
  /** Connection is open but waiting for handshake/acknowledgment */
  HANDSHAKE = 'HANDSHAKE',
  /** Connection lost but will attempt to reconnect */
  RECONNECTING = 'RECONNECTING',
  /** Connection closed intentionally */
  CLOSED = 'CLOSED',
  /** Connection error occurred */
  ERROR = 'ERROR',
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  /** Unique message identifier */
  id: string;
  /** Message type for routing */
  type: string;
  /** Message payload */
  payload: T;
  /** Timestamp when message was sent */
  timestamp: number;
  /** Correlation ID for request/response pattern */
  correlationId?: string;
  /** Whether message requires acknowledgment */
  requiresAck?: boolean;
}

/**
 * WebSocket message acknowledgment
 */
export interface WebSocketAck {
  /** ID of the acknowledged message */
  messageId: string;
  /** Whether the message was successfully processed */
  success: boolean;
  /** Error message if unsuccessful */
  error?: string;
  /** Timestamp of acknowledgment */
  timestamp: number;
}

/**
 * Connection state information
 */
export interface ConnectionState {
  /** Current connection status */
  status: ConnectionStatus;
  /** WebSocket URL */
  url: string;
  /** Connection ID (assigned by server) */
  connectionId?: string;
  /** Last connected timestamp */
  connectedAt?: number;
  /** Last disconnected timestamp */
  disconnectedAt?: number;
  /** Total number of reconnection attempts */
  reconnectAttempts: number;
  /** Time until next reconnection attempt (ms) */
  timeUntilReconnect?: number;
  /** Connection latency (ms) */
  latency?: number;
  /** Last ping/pong timestamp */
  lastPongAt?: number;
}

/**
 * Subscription callback function
 */
export type SubscriptionCallback<T = unknown> = (message: WebSocketMessage<T>) => void;

/**
 * Subscription information
 */
export interface Subscription {
  /** Unique subscription ID */
  id: string;
  /** Message type to subscribe to */
  messageType: string;
  /** Callback function */
  callback: SubscriptionCallback;
  /** Timestamp when subscription was created */
  createdAt: number;
}

/**
 * WebSocket configuration options
 */
export interface WebSocketOptions {
  /** WebSocket server URL */
  url: string;
  /** Connection timeout in milliseconds (default: 10000) */
  connectionTimeout?: number;
  /** Heartbeat/ping interval in milliseconds (default: 30000) */
  heartbeatInterval?: number;
  /** Maximum reconnection attempts (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in milliseconds (default: 1000) */
  reconnectDelay?: number;
  /** Maximum reconnection delay in milliseconds (default: 30000) */
  maxReconnectDelay?: number;
  /** Exponential backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Whether to auto-reconnect on disconnection (default: true) */
  autoReconnect?: boolean;
  /** Protocol subprotocol (optional) */
  protocols?: string | string[];
  /** Connection headers (optional) */
  headers?: Record<string, string>;
  /** Callback when connection status changes */
  onStatusChange?: (state: ConnectionState) => void;
  /** Callback when connection is established */
  onConnect?: (connectionId?: string) => void;
  /** Callback when connection is lost */
  onDisconnect?: (reason: string) => void;
  /** Callback when error occurs */
  onError?: (error: WebSocketError) => void;
  /** Callback when message is received */
  onMessage?: (message: WebSocketMessage) => void;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Authentication token (optional) */
  authToken?: string;
  /** Query parameters to append to URL (optional) */
  queryParams?: Record<string, string>;
}

/**
 * Send with acknowledgment options
 */
export interface SendWithAckOptions<T> {
  /** Message payload */
  payload: T;
  /** Message type */
  type: string;
  /** Timeout for acknowledgment in milliseconds (default: 5000) */
  timeout?: number;
  /** Message ID (auto-generated if not provided) */
  messageId?: string;
}

/**
 * Send with acknowledgment result
 */
export interface SendWithAckResult<T = unknown> {
  /** Whether the send was successful */
  success: boolean;
  /** Acknowledgment data if received */
  data?: T;
  /** Error message if failed */
  error?: string;
}

/**
 * Custom WebSocket error class
 */
export class WebSocketError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}

/**
 * Pending acknowledgment
 */
interface PendingAck {
  resolve: (data: any) => void;
  reject: (error: WebSocketError) => void;
  timeout: number;
  timestamp: number;
}

/**
 * Firebase real-time subscription wrapper
 */
interface FirebaseSubscription {
  unsubscribe: () => void;
  collection: string;
  documentId?: string;
  createdAt: number;
}

// ============================================
// Constants
// ============================================

const DEFAULT_OPTIONS: Required<Omit<WebSocketOptions, 'protocols' | 'headers' | 'onStatusChange' | 'onConnect' | 'onDisconnect' | 'onError' | 'onMessage' | 'authToken' | 'queryParams'>> = {
  url: '',
  connectionTimeout: 10000,
  heartbeatInterval: 30000,
  maxReconnectAttempts: Infinity,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  backoffMultiplier: 2,
  autoReconnect: true,
  debug: false,
};

const PING_MESSAGE_TYPE = 'ping';
const PONG_MESSAGE_TYPE = 'pong';
const ACK_MESSAGE_TYPE = 'ack';

// ============================================
// WebSocket Manager Class
// ============================================

/**
 * WebSocket Manager
 *
 * Manages WebSocket connections with robust connection handling,
 * automatic reconnection, message acknowledgment, and subscription management.
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private options: WebSocketOptions;
  private state: ConnectionState;
  private subscriptions: Map<string, Subscription>;
  private pendingAcks: Map<string, PendingAck>;
  private firebaseSubscriptions: Map<string, FirebaseSubscription>;
  private heartbeatTimer: number | null = null;
  private connectionTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private messageIdCounter: number;
  private subscriptionIdCounter: number;
  private isIntentionalClose: boolean;

  constructor(options: WebSocketOptions) {
    // Merge options with defaults
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Initialize state
    this.state = {
      status: ConnectionStatus.DISCONNECTED,
      url: this.buildWebSocketUrl(),
      reconnectAttempts: 0,
    };

    // Initialize maps
    this.subscriptions = new Map();
    this.pendingAcks = new Map();
    this.firebaseSubscriptions = new Map();

    // Initialize counters
    this.messageIdCounter = 0;
    this.subscriptionIdCounter = 0;
    this.isIntentionalClose = false;

    this.debug('WebSocketManager initialized', { url: this.state.url });
  }

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Connect to WebSocket server
   *
   * @throws {WebSocketError} If connection fails
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already connected or connecting
      if (this.state.status === ConnectionStatus.CONNECTED || this.state.status === ConnectionStatus.CONNECTING) {
        this.debug('Already connected or connecting');
        resolve();
        return;
      }

      this.updateState({ status: ConnectionStatus.CONNECTING });
      this.isIntentionalClose = false;

      try {
        // Create WebSocket connection
        this.ws = new WebSocket(this.state.url, this.options.protocols);

        // Set up connection timeout
        this.connectionTimer = window.setTimeout(() => {
          if (this.state.status === ConnectionStatus.CONNECTING) {
            this.ws?.close();
            this.handleError(new WebSocketError('Connection timeout', 'TIMEOUT'));
            reject(new WebSocketError('Connection timeout', 'TIMEOUT'));
          }
        }, this.options.connectionTimeout);

        // Handle open event
        this.ws.onopen = () => {
          this.clearConnectionTimer();
          this.updateState({
            status: ConnectionStatus.HANDSHAKE,
            connectedAt: Date.now(),
            reconnectAttempts: 0,
          });
          this.debug('WebSocket connection opened');

          // Start heartbeat
          this.startHeartbeat();

          // Resolve connection promise
          resolve();
        };

        // Handle message event
        this.ws.onmessage = (event: MessageEvent) => {
          this.handleMessage(event);
        };

        // Handle close event
        this.ws.onclose = (event) => {
          this.clearConnectionTimer();
          this.handleClose(event);
        };

        // Handle error event
        this.ws.onerror = (error) => {
          this.debug('WebSocket error', error);
          this.handleError(new WebSocketError('WebSocket error occurred', 'WEBSOCKET_ERROR', error));
        };

      } catch (error) {
        this.clearConnectionTimer();
        this.handleError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   *
   * @param code - Close code (default: 1000 - normal closure)
   * @param reason - Close reason
   */
  disconnect(code: number = 1000, reason: string = 'Normal closure'): void {
    this.isIntentionalClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.clearConnectionTimer();

    // Reject all pending acknowledgments
    this.pendingAcks.forEach((ack, messageId) => {
      ack.reject(new WebSocketError('Connection closed', 'CLOSED'));
    });
    this.pendingAcks.clear();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason);
    } else {
      this.updateState({ status: ConnectionStatus.CLOSED, disconnectedAt: Date.now() });
    }

    this.debug('Disconnected', { code, reason });
  }

  /**
   * Force reconnection
   *
   * @returns Promise that resolves when reconnected
   */
  async reconnect(): Promise<void> {
    this.debug('Forcing reconnection');
    this.disconnect(1000, 'Reconnecting');
    return this.connect();
  }

  // ============================================
  // Message Handling
  // ============================================

  /**
   * Send a message without acknowledgment
   *
   * @param type - Message type
   * @param payload - Message payload
   * @returns Whether the message was sent successfully
   */
  send<T = unknown>(type: string, payload: T): boolean {
    if (!this.isConnected()) {
      this.debug('Cannot send: not connected');
      return false;
    }

    const message: WebSocketMessage<T> = {
      id: this.generateMessageId(),
      type,
      payload,
      timestamp: Date.now(),
    };

    return this.sendMessage(message);
  }

  /**
   * Send a message and wait for acknowledgment
   *
   * @param options - Send options including payload, type, and timeout
   * @returns Promise resolving to acknowledgment result
   */
  async sendWithAck<TRequest = unknown, TResponse = unknown>(
    options: SendWithAckOptions<TRequest>
  ): Promise<SendWithAckResult<TResponse>> {
    const { payload, type, timeout = 5000, messageId } = options;

    if (!this.isConnected()) {
      return {
        success: false,
        error: 'Not connected',
      };
    }

    const id = messageId || this.generateMessageId();

    const message: WebSocketMessage<TRequest> = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      requiresAck: true,
    };

    // Create promise for acknowledgment
    return new Promise((resolve) => {
      const ackTimeout = window.setTimeout(() => {
        this.pendingAcks.delete(id);
        resolve({
          success: false,
          error: 'Acknowledgment timeout',
        });
      }, timeout);

      this.pendingAcks.set(id, {
        resolve: (data) => {
          clearTimeout(ackTimeout);
          resolve({
            success: true,
            data,
          });
        },
        reject: (error) => {
          clearTimeout(ackTimeout);
          resolve({
            success: false,
            error: error.message,
          });
        },
        timeout: ackTimeout,
        timestamp: Date.now(),
      });

      // Send message
      const sent = this.sendMessage(message);
      if (!sent) {
        clearTimeout(ackTimeout);
        this.pendingAcks.delete(id);
        resolve({
          success: false,
          error: 'Failed to send message',
        });
      }
    });
  }

  /**
   * Send raw message
   */
  private sendMessage(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const serialized = JSON.stringify(message);
      this.ws.send(serialized);
      this.debug('Message sent', { id: message.id, type: message.type });
      return true;
    } catch (error) {
      this.handleError(new WebSocketError('Failed to send message', 'SEND_ERROR', error));
      return false;
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      const message = data as WebSocketMessage;

      this.debug('Message received', { id: message.id, type: message.type });

      // Handle acknowledgment messages
      if (message.type === ACK_MESSAGE_TYPE) {
        this.handleAck(message as WebSocketMessage<WebSocketAck>);
        return;
      }

      // Handle pong messages
      if (message.type === PONG_MESSAGE_TYPE) {
        this.handlePong(message);
        return;
      }

      // Send acknowledgment if required
      if (message.requiresAck) {
        this.sendAck(message.id);
      }

      // Notify general message callback
      this.options.onMessage?.(message);

      // Route to subscribers
      this.routeToSubscribers(message);

    } catch (error) {
      this.handleError(new WebSocketError('Failed to parse message', 'PARSE_ERROR', error));
    }
  }

  /**
   * Handle acknowledgment message
   */
  private handleAck(message: WebSocketMessage<WebSocketAck>): void {
    const ack = message.payload;
    const pending = this.pendingAcks.get(ack.messageId);

    if (pending) {
      if (ack.success) {
        pending.resolve({ timestamp: ack.timestamp });
      } else {
        pending.reject(new WebSocketError(ack.error || 'Acknowledgment failed', 'ACK_FAILED'));
      }
      this.pendingAcks.delete(ack.messageId);
    }
  }

  /**
   * Handle pong message (heartbeat response)
   */
  private handlePong(message: WebSocketMessage): void {
    const now = Date.now();
    const latency = now - message.timestamp;

    this.updateState({
      latency,
      lastPongAt: now,
      status: ConnectionStatus.CONNECTED,
    });

    this.debug('Pong received', { latency });
  }

  /**
   * Send acknowledgment for a message
   */
  private sendAck(messageId: string, success: boolean = true, error?: string): void {
    const ackMessage: WebSocketMessage<WebSocketAck> = {
      id: this.generateMessageId(),
      type: ACK_MESSAGE_TYPE,
      payload: {
        messageId,
        success,
        error,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.sendMessage(ackMessage);
  }

  // ============================================
  // Subscription Management
  // ============================================

  /**
   * Subscribe to a message type
   *
   * @param messageType - Message type to subscribe to
   * @param callback - Callback function for matching messages
   * @returns Unsubscribe function
   */
  subscribe<T = unknown>(
    messageType: string,
    callback: SubscriptionCallback<T>
  ): () => void {
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      messageType,
      callback: callback as SubscriptionCallback,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscription.id, subscription);
    this.debug('Subscription added', { id: subscription.id, messageType });

    // Return unsubscribe function
    return () => this.unsubscribe(subscription.id);
  }

  /**
   * Unsubscribe by subscription ID
   *
   * @param subscriptionId - Subscription ID to remove
   */
  unsubscribe(subscriptionId: string): void {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      this.debug('Subscription removed', { id: subscriptionId });
    }
  }

  /**
   * Unsubscribe all subscriptions
   */
  unsubscribeAll(): void {
    const count = this.subscriptions.size;
    this.subscriptions.clear();
    this.debug('All subscriptions cleared', { count });
  }

  /**
   * Route message to matching subscribers
   */
  private routeToSubscribers(message: WebSocketMessage): void {
    const subscriptions = Array.from(this.subscriptions.values());
    for (const subscription of subscriptions) {
      if (this.isMessageMatch(message, subscription.messageType)) {
        try {
          subscription.callback(message);
        } catch (error) {
          this.debug('Subscription callback error', { subscriptionId: subscription.id, error });
        }
      }
    }
  }

  /**
   * Check if message matches subscription type
   */
  private isMessageMatch(message: WebSocketMessage, messageType: string): boolean {
    // Support wildcard patterns (e.g., "user:*" matches "user:created", "user:updated")
    if (messageType.includes('*')) {
      const pattern = messageType.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(message.type);
    }

    return message.type === messageType;
  }

  // ============================================
  // Heartbeat Mechanism
  // ============================================

  /**
   * Start heartbeat/ping-pong mechanism
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      } else {
        this.stopHeartbeat();
      }
    }, this.options.heartbeatInterval);

    this.debug('Heartbeat started', { interval: this.options.heartbeatInterval });
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.debug('Heartbeat stopped');
    }
  }

  /**
   * Send ping message
   */
  private sendPing(): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: PING_MESSAGE_TYPE,
      payload: { timestamp: Date.now() },
      timestamp: Date.now(),
    };

    this.sendMessage(message);
    this.debug('Ping sent');
  }

  // ============================================
  // Error Handling & Reconnection
  // ============================================

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    const reason = event.reason || 'Connection closed';
    const code = event.code;

    this.updateState({
      status: ConnectionStatus.DISCONNECTED,
      disconnectedAt: Date.now(),
    });

    this.stopHeartbeat();

    this.options.onDisconnect?.(reason);

    this.debug('Connection closed', { code, reason, wasClean: event.wasClean });

    // Trigger reconnection if not intentional and auto-reconnect is enabled
    if (!this.isIntentionalClose && this.options.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle error
   */
  private handleError(error: WebSocketError | Error): void {
    this.updateState({ status: ConnectionStatus.ERROR });

    this.options.onError?.(error instanceof WebSocketError ? error : new WebSocketError(error.message, 'ERROR', error));

    this.debug('Error handled', { error: error.message, code: error instanceof WebSocketError ? error.code : 'ERROR' });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const maxAttempts = this.options.maxReconnectAttempts;
    const currentAttempt = this.state.reconnectAttempts + 1;

    if (maxAttempts !== Infinity && currentAttempt > maxAttempts) {
      this.debug('Max reconnection attempts reached', { maxAttempts });
      this.updateState({ status: ConnectionStatus.CLOSED });
      return;
    }

    // Calculate delay with exponential backoff
    const baseDelay = this.options.reconnectDelay;
    const maxDelay = this.options.maxReconnectDelay;
    const multiplier = this.options.backoffMultiplier;
    const delay = Math.min(baseDelay * Math.pow(multiplier, currentAttempt - 1), maxDelay);

    this.updateState({
      status: ConnectionStatus.RECONNECTING,
      reconnectAttempts: currentAttempt,
      timeUntilReconnect: delay,
    });

    this.debug('Scheduled reconnection', { attempt: currentAttempt, delay });

    this.reconnectTimer = window.setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // Error already handled in connect()
      }
    }, delay);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear connection timeout timer
   */
  private clearConnectionTimer(): void {
    if (this.connectionTimer !== null) {
      window.clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  // ============================================
  // Firebase Integration
  // ============================================

  /**
   * Subscribe to Firestore document changes
   *
   * This method wraps Firebase's real-time listeners and integrates them
   * with the WebSocket manager for unified real-time data management.
   *
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param onUpdate - Callback for document updates
   * @returns Unsubscribe function
   */
  subscribeToFirestoreDocument<T = unknown>(
    collection: string,
    documentId: string,
    onUpdate: (doc: { id: string; data: T | null } | null) => void
  ): () => void {
    // Dynamic import to avoid circular dependencies
    import('../firebase/firestore.service').then((module) => {
      const subscribeToDocument = module.subscribeToDocument;
      const subscriptionId = `${collection}/${documentId}`;

      const unsubscribe = subscribeToDocument(
        collection,
        documentId,
        (doc) => onUpdate(doc),
        (error: Error) => this.handleError(new WebSocketError(`Firestore subscription error: ${error.message}`, 'FIRESTORE_ERROR', error))
      );

      this.firebaseSubscriptions.set(subscriptionId, {
        unsubscribe,
        collection,
        documentId,
        createdAt: Date.now(),
      });

      this.debug('Firestore document subscription added', { collection, documentId });
    }).catch((error) => {
      this.handleError(new WebSocketError(`Failed to import Firestore service: ${(error as Error).message}`, 'IMPORT_ERROR', error));
    });

    // Return cleanup function
    return () => this.unsubscribeFromFirestoreDocument(collection, documentId);
  }

  /**
   * Subscribe to Firestore query changes
   *
   * @param collection - Collection name
   * @param onUpdate - Callback for query results
   * @param constraints - Query constraints
   * @returns Unsubscribe function
   */
  subscribeToFirestoreQuery<T = unknown>(
    collection: string,
    onUpdate: (docs: { id: string; data: T }[]) => void,
    constraints?: any
  ): () => void {
    import('../firebase/firestore.service').then((module) => {
      const subscribeToQuery = module.subscribeToQuery;
      const subscriptionId = `query:${collection}`;

      const unsubscribe = subscribeToQuery(
        collection,
        constraints,
        (docs) => onUpdate(docs),
        (error: Error) => this.handleError(new WebSocketError(`Firestore query subscription error: ${error.message}`, 'FIRESTORE_ERROR', error))
      );

      this.firebaseSubscriptions.set(subscriptionId, {
        unsubscribe,
        collection,
        createdAt: Date.now(),
      });

      this.debug('Firestore query subscription added', { collection });
    }).catch((error) => {
      this.handleError(new WebSocketError(`Failed to import Firestore service: ${(error as Error).message}`, 'IMPORT_ERROR', error));
    });

    // Return cleanup function
    return () => this.unsubscribeFromFirestoreQuery(collection);
  }

  /**
   * Unsubscribe from Firestore document
   */
  private unsubscribeFromFirestoreDocument(collection: string, documentId: string): void {
    const subscriptionId = `${collection}/${documentId}`;
    const subscription = this.firebaseSubscriptions.get(subscriptionId);

    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        this.debug('Error unsubscribing from Firestore', { error });
      }
      this.firebaseSubscriptions.delete(subscriptionId);
      this.debug('Firestore document subscription removed', { collection, documentId });
    }
  }

  /**
   * Unsubscribe from Firestore query
   */
  private unsubscribeFromFirestoreQuery(collection: string): void {
    const subscriptionId = `query:${collection}`;
    const subscription = this.firebaseSubscriptions.get(subscriptionId);

    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        this.debug('Error unsubscribing from Firestore query', { error });
      }
      this.firebaseSubscriptions.delete(subscriptionId);
      this.debug('Firestore query subscription removed', { collection });
    }
  }

  /**
   * Unsubscribe from all Firestore subscriptions
   */
  unsubscribeAllFirestore(): void {
    this.firebaseSubscriptions.forEach((subscription, id) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        this.debug('Error unsubscribing from Firestore', { id, error });
      }
    });
    this.firebaseSubscriptions.clear();
    this.debug('All Firestore subscriptions cleared');
  }

  // ============================================
  // State Management
  // ============================================

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.status === ConnectionStatus.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Check if connecting
   */
  isConnecting(): boolean {
    return this.state.status === ConnectionStatus.CONNECTING || this.state.status === ConnectionStatus.HANDSHAKE;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.state.status;
  }

  /**
   * Update connection state
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };

    // Notify status change callback
    this.options.onStatusChange?.(this.state);

    // Notify connect callback when transitioning to CONNECTED
    if (updates.status === ConnectionStatus.CONNECTED && !this.state.connectedAt) {
      this.state.connectedAt = Date.now();
      this.options.onConnect?.(this.state.connectionId);
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Build WebSocket URL with query parameters
   */
  private buildWebSocketUrl(): string {
    let url = this.options.url;

    // Add auth token if provided
    if (this.options.authToken) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}token=${encodeURIComponent(this.options.authToken)}`;
    }

    // Add query parameters if provided
    if (this.options.queryParams) {
      const params = new URLSearchParams();
      Object.entries(this.options.queryParams).forEach(([key, value]) => {
        params.set(key, value);
      });

      const paramString = params.toString();
      if (paramString) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}${paramString}`;
      }
    }

    return url;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${++this.messageIdCounter}`;
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub-${Date.now()}-${++this.subscriptionIdCounter}`;
  }

  /**
   * Debug logging
   */
  private debug(message: string, data?: any): void {
    if (this.options.debug) {
      console.log(`[WebSocketManager ${this.state.url}] ${message}`, data || '');
    }
  }

  /**
   * Get statistics about subscriptions
   */
  getSubscriptionStats(): {
    websocketSubscriptions: number;
    firebaseSubscriptions: number;
    pendingAcks: number;
  } {
    return {
      websocketSubscriptions: this.subscriptions.size,
      firebaseSubscriptions: this.firebaseSubscriptions.size,
      pendingAcks: this.pendingAcks.size,
    };
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.disconnect(1000, 'Destroying manager');
    this.unsubscribeAll();
    this.unsubscribeAllFirestore();
    this.debug('WebSocketManager destroyed');
  }
}

// ============================================
// Factory Functions
// ============================================

/**
 * Create a WebSocket manager with default options
 *
 * @param url - WebSocket server URL
 * @param options - Optional configuration options
 * @returns WebSocketManager instance
 */
export function createWebSocketManager(url: string, options?: Partial<WebSocketOptions>): WebSocketManager {
  return new WebSocketManager({
    url,
    ...options,
  });
}

/**
 * Create a WebSocket manager for Firebase Realtime Database
 *
 * @param project - Firebase project ID
 * @param options - Optional configuration options
 * @returns WebSocketManager instance
 */
export function createFirebaseWebSocketManager(project: string, options?: Partial<WebSocketOptions>): WebSocketManager {
  const url = `wss://${project}.firebaseio.com/.ws`;
  return new WebSocketManager({
    url,
    ...options,
  });
}

// ============================================
// Singleton Instance (optional)
// ============================================

let defaultManager: WebSocketManager | null = null;

/**
 * Get default WebSocket manager instance
 */
export function getDefaultWebSocketManager(): WebSocketManager | null {
  return defaultManager;
}

/**
 * Set default WebSocket manager instance
 */
export function setDefaultWebSocketManager(manager: WebSocketManager): void {
  defaultManager = manager;
}

/**
 * Reset default WebSocket manager instance
 */
export function resetDefaultWebSocketManager(): void {
  if (defaultManager) {
    defaultManager.destroy();
    defaultManager = null;
  }
}
