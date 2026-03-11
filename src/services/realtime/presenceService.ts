/**
 * Presence Service
 *
 * Manages user presence information including online/offline status,
 * typing indicators, and real-time presence updates.
 * Uses Firebase Firestore for presence storage with automatic cleanup.
 *
 * @module services/realtime/presenceService
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RealtimeEventEmitter, EventType } from './eventEmitter';

// ============================================
// Presence Status Enum
// ============================================

/**
 * User presence status
 */
export enum PresenceStatus {
  /** User is online and active */
  ONLINE = 'online',
  /** User is away/inactive */
  AWAY = 'away',
  /** User is offline */
  OFFLINE = 'offline',
  /** User is busy */
  BUSY = 'busy',
}

// ============================================
// Core Types
// ============================================

/**
 * Presence data structure
 */
export interface PresenceData {
  /** User ID */
  userId: string;
  /** Firm ID */
  firmId: string;
  /** User name */
  userName: string;
  /** Current presence status */
  status: PresenceStatus;
  /** Last activity timestamp */
  lastSeen: number;
  /** Current page/view */
  currentView?: string;
  /** Browser info */
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };
  /** Session ID */
  sessionId: string;
  /** Connection ID for this session */
  connectionId?: string;
}

/**
 * Complete presence information
 */
export interface Presence {
  /** Presence data */
  data: PresenceData;
  /** Document ID */
  id: string;
  /** Whether this is current user's presence */
  isCurrentUser: boolean;
  /** Document reference */
  ref?: DocumentReference;
}

/**
 * Typing indicator data
 */
export interface TypingIndicator {
  /** User ID */
  userId: string;
  /** User name */
  userName: string;
  /** Matter or thread ID where typing */
  targetId: string;
  /** Target type (matter, chat, etc.) */
  targetType: 'matter' | 'chat' | 'comment' | 'other';
  /** Timestamp when typing started */
  startedAt: number;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Presence statistics
 */
export interface PresenceStats {
  /** Total users in firm */
  totalUsers: number;
  /** Currently online users */
  onlineUsers: number;
  /** Away users */
  awayUsers: number;
  /** Busy users */
  busyUsers: number;
  /** Offline users */
  offlineUsers: number;
  /** Users currently typing */
  typingUsers: number;
  /** Total active sessions */
  activeSessions: number;
  /** Average session duration (ms) */
  averageSessionDuration?: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Presence service configuration
 */
export interface PresenceServiceConfig {
  /** Collection name for presence documents (default: 'presence') */
  collectionName?: string;
  /** Collection name for typing indicators (default: 'typing') */
  typingCollectionName?: string;
  /** Away timeout in milliseconds (default: 300000 = 5 minutes) */
  awayTimeout?: number;
  /** Offline timeout in milliseconds (default: 900000 = 15 minutes) */
  offlineTimeout?: number;
  /** Cleanup interval in milliseconds (default: 60000 = 1 minute) */
  cleanupInterval?: number;
  /** Typing indicator timeout (default: 30000 = 30 seconds) */
  typingTimeout?: number;
  /** Whether to enable automatic status updates (default: true) */
  autoStatusUpdates?: boolean;
  /** Whether to enable cleanup on disconnect (default: true) */
  cleanupOnDisconnect?: boolean;
  /** Custom event emitter for presence events */
  eventEmitter?: RealtimeEventEmitter;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Presence subscription callback
 */
export type PresenceCallback = (presence: Presence) => void;

/**
 * Presence list callback
 */
export type PresenceListCallback = (presences: Presence[]) => void;

/**
 * Typing callback
 */
export type TypingCallback = (typing: TypingIndicator) => void;

/**
 * Typing list callback
 */
export type TypingListCallback = (typingUsers: TypingIndicator[]) => void;

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: Required<Omit<PresenceServiceConfig, 'eventEmitter'>> = {
  collectionName: 'presence',
  typingCollectionName: 'typing',
  awayTimeout: 300000, // 5 minutes
  offlineTimeout: 900000, // 15 minutes
  cleanupInterval: 60000, // 1 minute
  typingTimeout: 30000, // 30 seconds
  autoStatusUpdates: true,
  cleanupOnDisconnect: true,
  debug: false,
};

const PRESENCE_DOCUMENTS_COLLECTION = 'presence';
const TYPING_DOCUMENTS_COLLECTION = 'typing';

// ============================================
// Presence Service Class
// ============================================

/**
 * Presence Service
 *
 * Manages user presence with Firebase Firestore storage.
 * Provides real-time presence updates, typing indicators,
 * and automatic cleanup of stale presence data.
 */
export class PresenceService {
  private config: Required<PresenceServiceConfig>;
  private currentUserId: string | null = null;
  private currentFirmId: string | null = null;
  private currentUserName: string | null = null;
  private sessionId: string;
  private connectionId: string;
  private presenceRef: DocumentReference | null = null;
  private subscriptions: Map<string, () => void>;
  private typingTimeouts: Map<string, number>;
  private cleanupTimer: number | null = null;
  private activityTimer: number | null = null;
  private lastActivityTime: number;
  private isOnline: boolean = false;

  constructor(config: PresenceServiceConfig = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Initialize session
    this.sessionId = this.generateId('session-');
    this.connectionId = this.generateId('conn-');

    // Initialize storage
    this.subscriptions = new Map();
    this.typingTimeouts = new Map();

    // Track activity
    this.lastActivityTime = Date.now();

    this.debug('PresenceService initialized');
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize presence service for current user
   *
   * @param userId - Current user ID
   * @param firmId - Current firm ID
   * @param userName - Current user name
   */
  async initialize(
    userId: string,
    firmId: string,
    userName: string
  ): Promise<void> {
    this.currentUserId = userId;
    this.currentFirmId = firmId;
    this.currentUserName = userName;

    // Create presence document reference
    const presenceId = `${userId}_${this.sessionId}`;
    this.presenceRef = doc(db, this.config.collectionName, presenceId);

    // Set initial presence
    await this.setPresence(PresenceStatus.ONLINE);

    // Start activity monitoring
    if (this.config.autoStatusUpdates) {
      this.startActivityMonitoring();
    }

    // Start cleanup timer
    this.startCleanupTimer();

    // Setup disconnect handlers
    if (this.config.cleanupOnDisconnect) {
      this.setupDisconnectHandlers();
    }

    this.isOnline = true;
    this.emitPresenceEvent(EventType.CONNECTION_CONNECTED, {
      userId,
      userName,
      status: PresenceStatus.ONLINE,
    });

    this.debug('Presence initialized', { userId, firmId, userName });
  }

  /**
   * Set user online
   */
  async setOnline(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Presence service not initialized');
    }

    await this.setPresence(PresenceStatus.ONLINE);
    this.isOnline = true;
  }

  /**
   * Set user offline
   */
  async setOffline(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Presence service not initialized');
    }

    await this.setPresence(PresenceStatus.OFFLINE);
    this.isOnline = false;

    // Remove presence document
    if (this.presenceRef) {
      await deleteDoc(this.presenceRef);
    }
  }

  /**
   * Update presence data
   *
   * @param status - New presence status
   * @param updates - Additional presence data updates
   */
  async updatePresence(
    status: PresenceStatus,
    updates?: Partial<PresenceData>
  ): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('Presence service not initialized');
    }

    await this.setPresence(status, updates);
  }

  // ============================================
  // Presence Management
  // ============================================

  /**
   * Set presence status
   */
  private async setPresence(
    status: PresenceStatus,
    updates: Partial<PresenceData> = {}
  ): Promise<void> {
    if (!this.currentUserId || !this.currentFirmId || !this.currentUserName) {
      throw new Error('Presence service not initialized');
    }

    const now = Date.now();

    const presenceData: PresenceData = {
      userId: this.currentUserId,
      firmId: this.currentFirmId,
      userName: this.currentUserName,
      status,
      lastSeen: now,
      sessionId: this.sessionId,
      connectionId: this.connectionId,
      ...updates,
    };

    if (this.presenceRef) {
      await setDoc(this.presenceRef, presenceData, { merge: true });
    }

    this.emitPresenceEvent(`presence:${status}`, presenceData);
  }

  /**
   * Mark connection as active
   */
  markConnectionActive(): void {
    this.lastActivityTime = Date.now();

    if (this.isOnline) {
      this.setPresence(PresenceStatus.ONLINE).catch((error) => {
        this.debug('Error marking connection active', { error });
      });
    }
  }

  /**
   * Mark connection as inactive
   */
  markConnectionInactive(): void {
    this.setPresence(PresenceStatus.AWAY).catch((error) => {
      this.debug('Error marking connection inactive', { error });
    });
  }

  // ============================================
  // Presence Queries
  // ============================================

  /**
   * Get user presence
   *
   * @param userId - User ID to query
   * @returns User presence or null
   */
  async getUserPresence(userId: string): Promise<Presence | null> {
    try {
      // Get all presence documents for user
      const presenceQuery = await getDoc(doc(db, this.config.collectionName, userId));

      if (!presenceQuery.exists()) {
        return null;
      }

      const data = presenceQuery.data() as PresenceData;

      return {
        data,
        id: presenceQuery.id,
        isCurrentUser: data.userId === this.currentUserId,
        ref: presenceQuery.ref,
      };
    } catch (error) {
      this.debug('Error getting user presence', { userId, error });
      return null;
    }
  }

  /**
   * Get all presences for a firm
   *
   * @param firmId - Firm ID to query
   * @returns Array of firm presences
   */
  async getFirmPresences(firmId: string): Promise<Presence[]> {
    try {
      // Query all presence documents for firm
      const snapshot = await getDoc(doc(db, this.config.collectionName, firmId));

      if (!snapshot.exists()) {
        return [];
      }

      const presences: Presence[] = [];
      const data = snapshot.data() as Record<string, PresenceData>;

      for (const [id, presenceData] of Object.entries(data)) {
        presences.push({
          data: presenceData,
          id,
          isCurrentUser: presenceData.userId === this.currentUserId,
        });
      }

      return presences;
    } catch (error) {
      this.debug('Error getting firm presences', { firmId, error });
      return [];
    }
  }

  /**
   * Get online users for a firm
   *
   * @param firmId - Firm ID to query
   * @returns Array of online user presences
   */
  async getOnlineUsers(firmId: string): Promise<Presence[]> {
    const presences = await this.getFirmPresences(firmId);

    return presences.filter(
      (presence) => presence.data.status === PresenceStatus.ONLINE
    );
  }

  /**
   * Get presence statistics for a firm
   *
   * @param firmId - Firm ID to query
   * @returns Presence statistics
   */
  async getPresenceStats(firmId: string): Promise<PresenceStats> {
    const presences = await this.getFirmPresences(firmId);

    const stats: PresenceStats = {
      totalUsers: presences.length,
      onlineUsers: 0,
      awayUsers: 0,
      busyUsers: 0,
      offlineUsers: 0,
      typingUsers: this.typingTimeouts.size,
      activeSessions: presences.length,
      lastUpdated: Date.now(),
    };

    for (const presence of presences) {
      switch (presence.data.status) {
        case PresenceStatus.ONLINE:
          stats.onlineUsers++;
          break;
        case PresenceStatus.AWAY:
          stats.awayUsers++;
          break;
        case PresenceStatus.BUSY:
          stats.busyUsers++;
          break;
        case PresenceStatus.OFFLINE:
          stats.offlineUsers++;
          break;
      }
    }

    return stats;
  }

  // ============================================
  // Typing Indicators
  // ============================================

  /**
   * Set user as typing
   *
   * @param targetId - Target ID (matter, chat, etc.)
   * @param targetType - Target type
   */
  async setTyping(targetId: string, targetType: 'matter' | 'chat' | 'comment' | 'other' = 'matter'): Promise<void> {
    if (!this.currentUserId || !this.currentUserName) {
      throw new Error('Presence service not initialized');
    }

    const now = Date.now();
    const typingId = `${this.currentUserId}_${targetId}`;

    const typingData: TypingIndicator = {
      userId: this.currentUserId,
      userName: this.currentUserName,
      targetId,
      targetType,
      startedAt: now,
      timeout: this.config.typingTimeout,
    };

    // Set typing document
    const typingRef = doc(db, this.config.typingCollectionName, typingId);
    await setDoc(typingRef, typingData);

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(typingId);
    if (existingTimeout !== undefined) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to clear typing
    const timeout = window.setTimeout(async () => {
      await deleteDoc(typingRef);
      this.typingTimeouts.delete(typingId);
    }, this.config.typingTimeout);

    this.typingTimeouts.set(typingId, timeout);

    this.emitPresenceEvent('presence:typing:started', typingData);
  }

  /**
   * Clear typing indicator
   *
   * @param targetId - Target ID
   */
  async clearTyping(targetId: string): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    const typingId = `${this.currentUserId}_${targetId}`;
    const typingRef = doc(db, this.config.typingCollectionName, typingId);

    await deleteDoc(typingRef);

    // Clear timeout
    const timeout = this.typingTimeouts.get(typingId);
    if (timeout !== undefined) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(typingId);
    }

    this.emitPresenceEvent('presence:typing:stopped', {
      userId: this.currentUserId,
      targetId,
    });
  }

  /**
   * Get users typing for a target
   *
   * @param targetId - Target ID
   * @returns Array of typing indicators
   */
  async getTypingUsers(targetId: string): Promise<TypingIndicator[]> {
    try {
      const typingRef = doc(db, this.config.typingCollectionName, targetId);
      const snapshot = await getDoc(typingRef);

      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.data() as Record<string, TypingIndicator>;
      const now = Date.now();

      // Filter out expired typing indicators
      return Object.values(data).filter(
        (typing) =>
          typing.startedAt + (typing.timeout || this.config.typingTimeout) > now
      );
    } catch (error) {
      this.debug('Error getting typing users', { targetId, error });
      return [];
    }
  }

  // ============================================
  // Real-time Subscriptions
  // ============================================

  /**
   * Subscribe to user presence updates
   *
   * @param userId - User ID to subscribe to
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribeToUserPresence(
    userId: string,
    callback: PresenceCallback
  ): () => void {
    const subscriptionId = `user-presence-${userId}`;

    const unsubscribe = onSnapshot(
      doc(db, this.config.collectionName, userId),
      (snapshot) => {
        if (!snapshot.exists()) {
          callback({
            data: {} as PresenceData,
            id: snapshot.id,
            isCurrentUser: false,
          });
          return;
        }

        const data = snapshot.data() as PresenceData;

        callback({
          data,
          id: snapshot.id,
          isCurrentUser: data.userId === this.currentUserId,
          ref: snapshot.ref,
        });
      },
      (error) => {
        this.debug('Error in user presence subscription', { userId, error });
      }
    );

    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * Subscribe to all presences for a firm
   *
   * @param firmId - Firm ID to subscribe to
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribeToFirmPresences(
    firmId: string,
    callback: PresenceListCallback
  ): () => void {
    const subscriptionId = `firm-presences-${firmId}`;

    const unsubscribe = onSnapshot(
      doc(db, this.config.collectionName, firmId),
      (snapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const presences: Presence[] = [];
        const data = snapshot.data() as Record<string, PresenceData>;

        for (const [id, presenceData] of Object.entries(data)) {
          presences.push({
            data: presenceData,
            id,
            isCurrentUser: presenceData.userId === this.currentUserId,
          });
        }

        callback(presences);
      },
      (error) => {
        this.debug('Error in firm presences subscription', { firmId, error });
      }
    );

    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * Subscribe to typing indicators for a target
   *
   * @param targetId - Target ID to subscribe to
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribeToTyping(
    targetId: string,
    callback: TypingListCallback
  ): () => void {
    const subscriptionId = `typing-${targetId}`;

    const unsubscribe = onSnapshot(
      doc(db, this.config.typingCollectionName, targetId),
      (snapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const data = snapshot.data() as Record<string, TypingIndicator>;
        const now = Date.now();

        // Filter out expired typing indicators
        const typingUsers = Object.values(data).filter(
          (typing) =>
            typing.startedAt + (typing.timeout || this.config.typingTimeout) > now
        );

        callback(typingUsers);
      },
      (error) => {
        this.debug('Error in typing subscription', { targetId, error });
      }
    );

    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  // ============================================
  // Presence Cleanup
  // ============================================

  /**
   * Cleanup old presence documents
   *
   * @param olderThan - Remove presences older than this time (ms)
   * @returns Number of presences cleaned up
   */
  async cleanupOldPresence(olderThan: number = this.config.offlineTimeout): Promise<number> {
    try {
      const now = Date.now();
      const cutoffTime = now - olderThan;

      // Query old presence documents
      const snapshot = await getDoc(doc(db, this.config.collectionName, 'cleanup'));

      if (!snapshot.exists()) {
        return 0;
      }

      const data = snapshot.data() as Record<string, PresenceData>;
      const batch = writeBatch(db);
      let cleanupCount = 0;

      for (const [id, presence] of Object.entries(data)) {
        if (presence.lastSeen < cutoffTime) {
          const ref = doc(db, this.config.collectionName, id);
          batch.delete(ref);
          cleanupCount++;
        }
      }

      if (cleanupCount > 0) {
        await batch.commit();
      }

      this.debug('Cleaned up old presence', { count: cleanupCount });
      return cleanupCount;
    } catch (error) {
      this.debug('Error cleaning up old presence', { error });
      return 0;
    }
  }

  /**
   * Remove user presence
   *
   * @param userId - User ID to remove presence for
   */
  async removePresence(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.config.collectionName, userId));
      this.debug('Removed user presence', { userId });
    } catch (error) {
      this.debug('Error removing user presence', { userId, error });
    }
  }

  /**
   * Remove all typing indicators for a user
   *
   * @param userId - User ID
   */
  async removeUserTyping(userId: string): Promise<void> {
    try {
      const typingRef = doc(db, this.config.typingCollectionName, userId);
      await deleteDoc(typingRef);

      // Clear local timeouts
      for (const [typingId, timeout] of this.typingTimeouts.entries()) {
        if (typingId.startsWith(userId)) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(typingId);
        }
      }

      this.debug('Removed user typing indicators', { userId });
    } catch (error) {
      this.debug('Error removing user typing indicators', { userId, error });
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get current firm ID
   */
  getCurrentFirmId(): string | null {
    return this.currentFirmId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start activity monitoring
   */
  private startActivityMonitoring(): void {
    // Update last activity on user interaction
    const updateActivity = () => {
      this.lastActivityTime = Date.now();

      // If user was away, set back to online
      if (this.isOnline && this.presenceRef) {
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivityTime;

        if (timeSinceActivity < this.config.awayTimeout) {
          this.setPresence(PresenceStatus.ONLINE).catch(() => {});
        }
      }
    };

    // Listen to various events
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Check for inactivity periodically
    this.activityTimer = window.setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivityTime;

      if (timeSinceActivity >= this.config.awayTimeout && this.isOnline) {
        this.markConnectionInactive();
      }
    }, this.config.awayTimeout / 2); // Check twice per away timeout period
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = window.setInterval(() => {
      if (this.currentFirmId) {
        this.cleanupOldPresence();
      }
    }, this.config.cleanupInterval);
  }

  /**
   * Setup disconnect handlers
   */
  private setupDisconnectHandlers(): void {
    // Handle page unload
    window.addEventListener('beforeunload', async () => {
      if (this.presenceRef) {
        // Use sendBeacon for reliable cleanup on page unload
        const data = {
          userId: this.currentUserId,
          sessionId: this.sessionId,
          status: PresenceStatus.OFFLINE,
          lastSeen: Date.now(),
        };

        navigator.sendBeacon('/api/presence/disconnect', JSON.stringify(data));
      }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        this.markConnectionInactive();
      } else {
        this.markConnectionActive();
      }
    });
  }

  /**
   * Emit presence event
   */
  private emitPresenceEvent(type: string, data: any): void {
    if (this.config.eventEmitter) {
      this.config.eventEmitter.emit(type, data, {
        source: 'local',
        metadata: { userId: this.currentUserId },
      });
    }
  }

  /**
   * Debug logging
   */
  private debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[PresenceService] ${message}`, data || '');
    }
  }

  /**
   * Cleanup and destroy
   */
  async destroy(): Promise<void> {
    // Stop timers
    if (this.activityTimer !== null) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Clear typing timeouts
    for (const [typingId, timeout] of this.typingTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.typingTimeouts.clear();

    // Remove presence
    if (this.presenceRef && this.config.cleanupOnDisconnect) {
      await deleteDoc(this.presenceRef);
    }

    // Unsubscribe from all subscriptions
    for (const [id, unsubscribe] of this.subscriptions.entries()) {
      try {
        unsubscribe();
      } catch (error) {
        this.debug('Error unsubscribing', { id, error });
      }
    }
    this.subscriptions.clear();

    this.isOnline = false;
    this.presenceRef = null;

    this.debug('PresenceService destroyed');
  }
}

// ============================================
// Factory Functions
// ============================================

let defaultPresenceService: PresenceService | null = null;

/**
 * Create a new presence service instance
 */
export function createPresenceService(config?: PresenceServiceConfig): PresenceService {
  return new PresenceService(config);
}

/**
 * Get default presence service instance
 */
export function getDefaultPresenceService(): PresenceService | null {
  return defaultPresenceService;
}

/**
 * Set default presence service instance
 */
export function setDefaultPresenceService(service: PresenceService): void {
  defaultPresenceService = service;
}

/**
 * Reset default presence service instance
 */
export function resetDefaultPresenceService(): void {
  if (defaultPresenceService) {
    defaultPresenceService.destroy();
    defaultPresenceService = null;
  }
}
