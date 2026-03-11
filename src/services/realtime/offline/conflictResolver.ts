/**
 * Conflict Resolver
 *
 * Manages conflict detection and resolution for offline-first
 * applications with multiple update sources.
 *
 * @module services/realtime/offline/conflictResolver
 */

import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentSnapshot,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RealtimeEventEmitter } from '../eventEmitter';
import { OptimisticUpdateHelper, OptimisticUpdate } from '../optimisticUpdateHelper';

// ============================================
// Conflict Type Enum
// ============================================

/**
 * Type of conflict that occurred
 */
export enum ConflictType {
  /** Version conflict - document version mismatch */
  VERSION_CONFLICT = 'version_conflict',
  /** Data conflict - different values for same field */
  DATA_CONFLICT = 'data_conflict',
  /** Validation conflict - document fails validation rules */
  VALIDATION_CONFLICT = 'validation_conflict',
  /** Permission conflict - user lacks permission */
  PERMISSION_CONFLICT = 'permission_conflict',
  /** Merge conflict - automatic merge failed */
  MERGE_CONFLICT = 'merge_conflict',
  /** Delete conflict - document deleted while editing */
  DELETE_CONFLICT = 'delete_conflict',
  /** Unknown conflict type */
  UNKNOWN_CONFLICT = 'unknown_conflict',
}

// ============================================
// Conflict Resolution Strategy Enum
// ============================================

/**
 * Conflict resolution strategy
 */
export enum ConflictResolutionStrategy {
  /** Last write wins - use most recent server data */
  LAST_WRITE_WINS = 'last_write_wins',
  /** First write wins - use first client data */
  FIRST_WRITE_WINS = 'first_write_wins',
  /** Merge conflicts - combine data intelligently */
  MERGE = 'merge',
  /** Custom strategy - user-defined resolution */
  CUSTOM = 'custom',
  /** Manual resolution - prompt user to resolve */
  MANUAL = 'manual',
}

// ============================================
// Core Types
// ============================================

/**
 * Conflict information
 */
export interface Conflict {
  /** Unique conflict ID */
  id: string;
  /** Type of conflict */
  type: ConflictType;
  /** Document ID where conflict occurred */
  documentId: string;
  /** Collection name */
  collection: string;
  /** Local changes (client data) */
  local: {
    data: Record<string, unknown>;
    version: number | null;
    timestamp: number;
    userId?: string;
  };
  /** Remote changes (server data) */
  remote: {
    data: Record<string, unknown>;
    version: number | null;
    timestamp: Timestamp | null;
    userId?: string;
  };
  /** Fields that are in conflict */
  conflictingFields: string[];
  /** Resolution strategy used */
  resolutionStrategy: ConflictResolutionStrategy;
  /** Resolved data */
  resolvedData?: Record<string, unknown>;
  /** Timestamp when conflict was detected */
  detectedAt: number;
  /** Timestamp when conflict was resolved */
  resolvedAt?: number;
  /** Whether conflict was auto-resolved */
  autoResolved: boolean;
  /** Error if resolution failed */
  error?: Error;
  /** Metadata */
  metadata?: Record<string, unknown>;
  /** Related optimistic update */
  relatedUpdateId?: string;
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  /** Whether resolution was successful */
  success: boolean;
  /** Conflict ID */
  conflictId: string;
  /** Resolved data */
  resolvedData?: Record<string, unknown>;
  /** Strategy used */
  strategy: ConflictResolutionStrategy;
  /** Whether user intervention was required */
  requiresManualResolution: boolean;
  /** Error if resolution failed */
  error?: Error;
  /** Timestamp when resolved */
  resolvedAt: number;
}

/**
 * Conflict resolver configuration
 */
export interface ConflictResolverConfig {
  /** Default resolution strategy */
  defaultStrategy?: ConflictResolutionStrategy;
  /** Strategy selection mode (auto/manual) */
  strategySelection?: 'auto' | 'manual';
  /** Enable automatic resolution (default: true) */
  autoResolve?: boolean;
  /** Maximum conflicts to store in history (default: 100) */
  maxHistorySize?: number;
  /** Conflict timeout in ms (default: 300000 = 5 minutes) */
  conflictTimeout?: number;
  /** Enable event emission (default: true) */
  emitEvents?: boolean;
  /** Custom strategy registry */
  customStrategies?: Map<string, ResolutionStrategy>;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Conflict statistics
 */
export interface ConflictStats {
  /** Total conflicts detected */
  totalConflicts: number;
  /** Auto-resolved conflicts */
  autoResolved: number;
  /** Manually resolved conflicts */
  manuallyResolved: number;
  /** Unresolved conflicts */
  unresolved: number;
  /** Conflicts by type */
  byType: Record<ConflictType, number>;
  /** Conflicts by strategy */
  byStrategy: Record<ConflictResolutionStrategy, number>;
  /** Resolution rate percentage */
  resolutionRate: number;
  /** Average resolution time (ms) */
  averageResolutionTime: number;
  /** Last updated timestamp */
  lastUpdated: number;
}

/**
 * Resolution strategy function type
 */
export type ResolutionStrategy = (
  local: Record<string, unknown>,
  remote: Record<string, unknown>,
  conflict: Conflict
) => Record<string, unknown> | Promise<Record<string, unknown>>;

// ============================================
// Constants
// ============================================

const DEFAULT_CONFIG: Required<Omit<ConflictResolverConfig, 'customStrategies' | 'strategySelection'>> = {
  defaultStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
  strategySelection: 'auto',
  autoResolve: true,
  maxHistorySize: 100,
  conflictTimeout: 300000,
  emitEvents: true,
  debug: false,
};

const VERSION_FIELD = '__version';
const UPDATED_AT_FIELD = 'updatedAt';
const CREATED_AT_FIELD = 'createdAt';
const DELETED_AT_FIELD = 'deletedAt';

// ============================================
// Conflict Resolver Class
// ============================================

/**
 * Conflict Resolver
 *
 * Manages conflict detection and resolution for offline-first
 * applications with support for multiple resolution strategies.
 */
export class ConflictResolver {
  private config: Required<ConflictResolverConfig>;
  private conflicts: Map<string, Conflict>;
  private customStrategies: Map<string, ResolutionStrategy>;
  private stats: ConflictStats;
  private eventEmitter: RealtimeEventEmitter | null;
  private optimisticHelper: OptimisticUpdateHelper | null;
  private conflictIdCounter: number;
  private resolutionTimeouts: Map<string, number>;

  constructor(config: ConflictResolverConfig = {}) {
    // Merge config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      customStrategies: config.customStrategies || new Map(),
    };

    // Initialize storage
    this.conflicts = new Map();
    this.customStrategies = new Map();
    this.resolutionTimeouts = new Map();

    // Initialize counters
    this.conflictIdCounter = 0;

    // Initialize statistics
    this.stats = this.initializeStats();

    // Initialize integrations
    this.eventEmitter = null;
    this.optimisticHelper = null;

    this.debug('ConflictResolver initialized');
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Set event emitter for conflict events
   *
   * @param emitter - Event emitter instance
   */
  setEventEmitter(emitter: RealtimeEventEmitter): void {
    this.eventEmitter = emitter;
    if (this.optimisticHelper) {
      this.optimisticHelper.setEventEmitter(emitter);
    }
  }

  /**
   * Set optimistic update helper
   *
   * @param helper - Optimistic update helper instance
   */
  setOptimisticHelper(helper: OptimisticUpdateHelper): void {
    this.optimisticHelper = helper;
    if (this.eventEmitter) {
      helper.setEventEmitter(this.eventEmitter);
    }
  }

  // ============================================
  // Conflict Detection
  // ============================================

  /**
   * Detect conflict between local and remote data
   *
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param localData - Local/client data
   * @param remoteData - Remote/server data
   * @returns Conflict or null
   */
  async detectConflict(
    collection: string,
    documentId: string,
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>
  ): Promise<Conflict | null> {
    const now = Date.now();

    // Get current server data
    const docRef = doc(db, collection, documentId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      // Document was deleted - create delete conflict
      const conflict = this.createDeleteConflict({
        documentId,
        collection,
        localData,
        remoteData,
        detectedAt: now,
      });
      this.conflicts.set(conflict.id, conflict);
      this.updateStats(conflict, 'detected');

      this.debug('Conflict detected', {
        conflictId: conflict.id,
        type: conflict.type,
        fields: conflict.conflictingFields,
      });

      return conflict;
    }

    const serverData = snapshot.data() as Record<string, unknown>;

    // Detect conflict with resolver
    const conflict = this.detectConflictData(
      collection,
      documentId,
      localData,
      serverData
    );

    if (conflict) {
      this.conflicts.set(conflict.id, conflict);
      this.updateStats(conflict, 'detected');

      this.debug('Conflict detected', {
        conflictId: conflict.id,
        type: conflict.type,
        fields: conflict.conflictingFields,
      });

      return conflict;
    }

    this.debug('No conflict detected', {
      documentId,
      collection,
    });

    return null;
  }

  /**
   * Detect conflict in data (helper method)
   *
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param localData - Local/client data
   * @param serverData - Remote/server data
   * @returns Conflict or null
   */
  private detectConflictData(
    collection: string,
    documentId: string,
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>
  ): Conflict | null {
    const now = Date.now();

    // Get timestamps
    const localTimestamp = this.extractTimestamp(localData);
    const serverTimestamp = this.extractTimestamp(serverData);
    const localVersion = localData[VERSION_FIELD] as number | null;
    const serverVersion = serverData[VERSION_FIELD] as number | null;

    // Check if documents are equal (no conflict)
    if (this.isDataEqual(localData, serverData)) {
      return null;
    }

    // Detect conflict type
    const conflictType = this.determineConflictType(
      localData,
      serverData,
      localVersion,
      serverVersion
    );

    // Find conflicting fields
    const conflictingFields = this.findConflictingFields(
      localData,
      serverData,
      conflictType
    );

    const conflict: Conflict = {
      id: this.generateId('conflict-'),
      type: conflictType,
      documentId,
      collection,
      local: {
        data: localData,
        version: localVersion,
        timestamp: localTimestamp,
        userId: serverData.userId as string | undefined,
      },
      remote: {
        data: serverData,
        version: serverVersion,
        timestamp: serverTimestamp,
        userId: serverData.userId as string | undefined,
      },
      conflictingFields,
      resolutionStrategy: ConflictResolutionStrategy.MANUAL,
      detectedAt: now,
      autoResolved: false,
      metadata: {},
    };

    this.conflicts.set(conflict.id, conflict);
    this.updateStats(conflict, 'detected');

    this.debug('Conflict detected', {
      conflictId: conflict.id,
      type: conflictType,
      fields: conflictingFields,
    });

    return conflict;
  }

  // ============================================
  // Conflict Resolution Strategies
  // ============================================

  /**
   * Last write wins - use most recent server data
   *
   * @param local - Local data
   * @param remote - Remote data
   * @param conflict - Conflict info
   * @returns Resolved data
   */
  lastWriteWins(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    conflict: Conflict
  ): Record<string, unknown> {
    this.debug('Applying last write wins strategy', { conflictId: conflict.id });

    return { ...remote };
  }

  /**
   * First write wins - use local data
   *
   * @param local - Local data
   * @param remote - Remote data
   * @param conflict - Conflict info
   * @returns Resolved data
   */
  firstWriteWins(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    conflict: Conflict
  ): Record<string, unknown> {
    this.debug('Applying first write wins strategy', { conflictId: conflict.id });

    return { ...local };
  }

  /**
   * Merge conflicts - combine data intelligently
   *
   * @param local - Local data
   * @param remote - Remote data
   * @param conflict - Conflict info
   * @returns Resolved data
   */
  merge(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    conflict: Conflict
  ): Record<string, unknown> {
    this.debug('Applying merge strategy', { conflictId: conflict.id });

    const merged: Record<string, unknown> = { ...local };

    // For each conflicting field, choose the most recent value
    for (const field of conflict.conflictingFields) {
      const localValue = local[field];
      const remoteValue = remote[field];

      // Skip null/undefined values
      if (remoteValue === null || remoteValue === undefined) {
        continue;
      }

      // Use field-specific merge logic
      if (field === UPDATED_AT_FIELD || field === 'lastModified') {
        // For timestamp fields, use most recent
        const localTime = this.extractTimestamp(local);
        const remoteTime = this.extractTimestamp(remote);

        if (remoteTime && localTime) {
          merged[field] = remoteTime > localTime ? remoteValue : localValue;
        }
      } else if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
        // For arrays, concatenate unique values
        const combined = [...new Set([...localValue, ...remoteValue])];
        merged[field] = combined;
      } else if (typeof localValue === 'object' && typeof remoteValue === 'object' &&
                 localValue !== null && remoteValue !== null &&
                 !Array.isArray(localValue) && !Array.isArray(remoteValue)) {
        // For nested objects, deep merge
        merged[field] = this.deepMerge(localValue, remoteValue);
      } else {
        // For scalar values, use remote (last write)
        merged[field] = remoteValue;
      }
    }

    // Update version if present
    if (remote[VERSION_FIELD]) {
      merged[VERSION_FIELD] = remote[VERSION_FIELD];
    }

    return merged;
  }

  /**
   * Custom strategy - use registered custom strategy
   *
   * @param local - Local data
   * @param remote - Remote data
   * @param conflict - Conflict info
   * @returns Resolved data or Promise
   */
  custom(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    conflict: Conflict
  ): Record<string, unknown> | Promise<Record<string, unknown>> {
    const strategyName = conflict.metadata.strategyName as string;

    if (!strategyName || !this.customStrategies.has(strategyName)) {
      this.debug('Custom strategy not found', { strategyName });
      return this.lastWriteWins(local, remote, conflict);
    }

    const strategy = this.customStrategies.get(strategyName);

    this.debug('Applying custom strategy', { strategyName, conflictId: conflict.id });

    return strategy(local, remote, conflict);
  }

  // ============================================
  // Automatic Conflict Resolution
  // ============================================

  /**
   * Resolve conflict automatically based on strategy
   *
   * @param conflict - Conflict to resolve
   * @param options - Resolution options
   * @returns Resolution result
   */
  async resolveConflict(
    conflict: Conflict,
    options?: {
      strategy?: ConflictResolutionStrategy;
      strategyName?: string;
      timeout?: number;
    }
  ): Promise<ConflictResolution> {
    const startTime = Date.now();
    const mergedOptions = {
      strategy: options?.strategy || this.config.defaultStrategy,
      timeout: options?.timeout || this.config.conflictTimeout,
      ...options,
    };

    // Set resolution strategy
    conflict.resolutionStrategy = mergedOptions.strategy;

    // Check for manual resolution
    if (mergedOptions.strategy === ConflictResolutionStrategy.MANUAL) {
      const result: ConflictResolution = {
        success: false,
        conflictId: conflict.id,
        requiresManualResolution: true,
        resolvedAt: Date.now(),
      };

      this.updateStats(conflict, 'manually_resolved');
      this.emitConflictEvent('manualResolutionRequired', { conflict, result });

      return result;
    }

    try {
      // Apply strategy with timeout
      const resolvedData = await this.resolveWithTimeout(
        conflict,
        mergedOptions
      );

      // Update conflict
      conflict.resolvedData = resolvedData;
      conflict.resolvedAt = Date.now();
      conflict.autoResolved = true;

      this.updateStats(conflict, 'auto_resolved');
      this.emitConflictEvent('resolved', { conflict, resolvedData });

      const result: ConflictResolution = {
        success: true,
        conflictId: conflict.id,
        resolvedData,
        strategy: mergedOptions.strategy,
        requiresManualResolution: false,
        resolvedAt: Date.now(),
      };

      return result;

    } catch (error) {
      const result: ConflictResolution = {
        success: false,
        conflictId: conflict.id,
        requiresManualResolution: false,
        error: error as Error,
        resolvedAt: Date.now(),
      };

      this.updateStats(conflict, 'resolution_failed');
      this.emitConflictEvent('resolutionFailed', { conflict, error });

      return result;
    }
  }

  /**
   * Resolve conflict with timeout
   *
   * @param conflict - Conflict to resolve
   * @param options - Resolution options
   * @returns Promise resolving to resolution result
   */
  private async resolveWithTimeout(
    conflict: Conflict,
    options: { strategy: ConflictResolutionStrategy; timeout: number; }
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Resolution timeout after ${options.timeout}ms`));
      }, options.timeout);

      this.executeStrategy(options.strategy, conflict)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Execute resolution strategy
   *
   * @param strategy - Resolution strategy to use
   * @param conflict - Conflict to resolve
   * @returns Promise resolving to resolution result
   */
  private async executeStrategy(
    strategy: ConflictResolutionStrategy,
    conflict: Conflict
  ): Promise<Record<string, unknown>> {
    const { local, remote } = conflict;

    switch (strategy) {
      case ConflictResolutionStrategy.LAST_WRITE_WINS:
        return Promise.resolve(this.lastWriteWins(local, remote, conflict));

      case ConflictResolutionStrategy.FIRST_WRITE_WINS:
        return Promise.resolve(this.firstWriteWins(local, remote, conflict));

      case ConflictResolutionStrategy.MERGE:
        return Promise.resolve(this.merge(local, remote, conflict));

      case ConflictResolutionStrategy.CUSTOM:
        const result = this.custom(local, remote, conflict);
        return Promise.resolve(result);

      default:
        return Promise.resolve(this.lastWriteWins(local, remote, conflict));
    }
  }

  // ============================================
  // Manual Conflict Resolution
  // ============================================

  /**
   * Manually resolve a conflict
   *
   * @param conflictId - Conflict ID to resolve
   * @param resolvedData - Resolved data to apply
   * @param strategy - Strategy used
   * @returns Resolution result
   */
  async resolveManually(
    conflictId: string,
    resolvedData: Record<string, unknown>,
    strategy: ConflictResolutionStrategy
  ): Promise<ConflictResolution> {
    const conflict = this.conflicts.get(conflictId);

    if (!conflict) {
      return {
        success: false,
        conflictId,
        error: new Error('Conflict not found'),
        resolvedAt: Date.now(),
      };
    }

    this.debug('Resolving conflict manually', { conflictId, strategy });

    try {
      // Write resolved data to Firestore
      if (conflict.collection && conflict.documentId) {
        const docRef = doc(db, conflict.collection, conflict.documentId);

        // Update with version increment
        const dataWithVersion = {
          ...resolvedData,
          [VERSION_FIELD]: (conflict.remote.version || 0) + 1,
          [UPDATED_AT_FIELD]: Timestamp.now(),
        };

        await setDoc(docRef, dataWithVersion);
      }

      // Update conflict
      conflict.resolvedData = resolvedData;
      conflict.resolvedAt = Date.now();
      conflict.resolutionStrategy = strategy;
      conflict.autoResolved = false;

      this.updateStats(conflict, 'manually_resolved');
      this.emitConflictEvent('manuallyResolved', { conflict, resolvedData, strategy });

      const result: ConflictResolution = {
        success: true,
        conflictId,
        resolvedData,
        strategy,
        requiresManualResolution: false,
        resolvedAt: Date.now(),
      };

      return result;

    } catch (error) {
      const result: ConflictResolution = {
        success: false,
        conflictId,
        error: error as Error,
        resolvedAt: Date.now(),
      };

      this.updateStats(conflict, 'resolution_failed');
      this.emitConflictEvent('resolutionFailed', { conflict, error });

      return result;
    }
  }

  /**
   * Get conflicts awaiting manual resolution
   *
   * @returns Array of unresolved conflicts
   */
  getUnresolvedConflicts(): Conflict[] {
    return Array.from(this.conflicts.values()).filter(
      conflict => conflict.resolutionStrategy === ConflictResolutionStrategy.MANUAL &&
                 !conflict.resolvedAt
    );
  }

  // ============================================
  // Conflict History Tracking
  // ============================================

  /**
   * Get conflict by ID
   *
   * @param conflictId - Conflict ID
   * @returns Conflict or null
   */
  getConflict(conflictId: string): Conflict | null {
    return this.conflicts.get(conflictId);
  }

  /**
   * Get all conflicts
   *
   * @param filter - Optional filter function
   * @returns Array of conflicts
   */
  getAllConflicts(filter?: (conflict: Conflict) => boolean): Conflict[] {
    let conflicts = Array.from(this.conflicts.values());

    if (filter) {
      conflicts = conflicts.filter(filter);
    }

    // Sort by detected time (newest first)
    conflicts.sort((a, b) => b.detectedAt - a.detectedAt);

    return conflicts;
  }

  /**
   * Get conflicts by type
   *
   * @param type - Conflict type
   * @returns Array of conflicts
   */
  getConflictsByType(type: ConflictType): Conflict[] {
    return Array.from(this.conflicts.values()).filter(
      conflict => conflict.type === type
    );
  }

  /**
   * Get conflicts by strategy
   *
   * @param strategy - Resolution strategy
   * @returns Array of conflicts
   */
  getConflictsByStrategy(strategy: ConflictResolutionStrategy): Conflict[] {
    return Array.from(this.conflicts.values()).filter(
      conflict => conflict.resolutionStrategy === strategy
    );
  }

  /**
   * Clear conflict history
   */
  clearConflicts(): void {
    const count = this.conflicts.size;
    this.conflicts.clear();

    this.debug('Conflicts cleared', { count });
    this.emitConflictEvent('cleared', { count });
  }

  /**
   * Remove conflict from history
   *
   * @param conflictId - Conflict ID to remove
   */
  removeConflict(conflictId: string): void {
    this.conflicts.delete(conflictId);
    this.debug('Conflict removed', { conflictId });
  }

  // ============================================
  // Conflict Reporting
  // ============================================

  /**
   * Generate conflict report
   *
   * @param conflictId - Conflict ID
   * @returns Conflict report object
   */
  generateReport(conflictId: string): {
    conflict: Conflict;
    summary: string;
    details: Record<string, unknown>;
  } | null {
    const conflict = this.conflicts.get(conflictId);

    if (!conflict) {
      return null;
    }

    const summary = this.generateConflictSummary(conflict);

    return {
      conflict,
      summary,
      details: {
        conflictingFields: conflict.conflictingFields,
        localTimestamp: new Date(conflict.local.timestamp).toISOString(),
        remoteTimestamp: conflict.remote.timestamp?.toDate?.toISOString() || null,
        localVersion: conflict.local.version,
        remoteVersion: conflict.remote.version,
        detectedAt: new Date(conflict.detectedAt).toISOString(),
        resolvedAt: conflict.resolvedAt ? new Date(conflict.resolvedAt).toISOString() : null,
        autoResolved: conflict.autoResolved,
        strategy: conflict.resolutionStrategy,
      },
    };
  }

  /**
   * Generate conflict summary
   */
  private generateConflictSummary(conflict: Conflict): string {
    switch (conflict.type) {
      case ConflictType.VERSION_CONFLICT:
        return `Version conflict: Local version ${conflict.local.version} vs Remote version ${conflict.remote.version}`;

      case ConflictType.DATA_CONFLICT:
        return `Data conflict in ${conflict.conflictingFields.length} fields: ${conflict.conflictingFields.join(', ')}`;

      case ConflictType.VALIDATION_CONFLICT:
        return 'Validation conflict: Local data fails validation rules';

      case ConflictType.PERMISSION_CONFLICT:
        return 'Permission conflict: User lacks permission to update document';

      case ConflictType.DELETE_CONFLICT:
        return 'Delete conflict: Document was deleted while editing';

      case ConflictType.MERGE_CONFLICT:
        return 'Merge conflict: Unable to automatically merge changes';

      default:
        return 'Unknown conflict type';
    }
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get conflict statistics
   *
   * @returns Current statistics
   */
  getStats(): ConflictStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initializeStats();
  }

  /**
   * Update statistics for conflict
   */
  private updateStats(conflict: Conflict, status: 'detected' | 'auto_resolved' | 'manually_resolved' | 'resolution_failed'): void {
    switch (status) {
      case 'detected':
        this.stats.totalConflicts++;
        break;

      case 'auto_resolved':
        this.stats.autoResolved++;
        this.stats.byStrategy[conflict.resolutionStrategy]++;
        break;

      case 'manually_resolved':
        this.stats.manuallyResolved++;
        this.stats.byStrategy[conflict.resolutionStrategy]++;
        break;

      case 'resolution_failed':
        this.stats.unresolved++;
        break;
    }

    // Update by type
    this.stats.byType[conflict.type]++;

    // Update resolution rate
    const total = this.stats.totalConflicts;
    const resolved = this.stats.autoResolved + this.stats.manuallyResolved;
    this.stats.resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

    this.stats.lastUpdated = Date.now();
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): ConflictStats {
    const byType: Record<ConflictType, number> = {} as any;
    const byStrategy: Record<ConflictResolutionStrategy, number> = {} as any;

    Object.values(ConflictType).forEach(type => byType[type] = 0);
    Object.values(ConflictResolutionStrategy).forEach(strategy => byStrategy[strategy] = 0);

    return {
      totalConflicts: 0,
      autoResolved: 0,
      manuallyResolved: 0,
      unresolved: 0,
      byType,
      byStrategy,
      resolutionRate: 0,
      averageResolutionTime: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Emit conflict event
   *
   * @param eventType - Event type
   * @param data - Event data
   */
  private emitConflictEvent(eventType: string, data: any): void {
    if (this.eventEmitter && this.config.emitEvents) {
      this.eventEmitter.emit(`conflict:${eventType}`, data, {
        source: 'local',
        metadata: { conflictId: data.conflict?.id },
      });
    }
  }

  /**
   * Debug logging
   */
  private debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[ConflictResolver] ${message}`, data || '');
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Extract timestamp from data
   */
  private extractTimestamp(data: Record<string, unknown>): number {
    const timestamp = data[UPDATED_AT_FIELD] as Timestamp | null;
    return timestamp ? timestamp.toMillis() : Date.now();
  }

  /**
   * Check if two data objects are equal
   */
  private isDataEqual(
    a: Record<string, unknown>,
    b: Record<string, unknown>
  ): boolean {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key of aKeys) {
      if (a[key] !== b[key]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find conflicting fields
   */
  private findConflictingFields(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    conflictType: ConflictType
  ): string[] {
    const conflicts: string[] = [];
    const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of keys) {
      const localValue = local[key];
      const remoteValue = remote[key];

      // Skip if values are equal
      if (localValue === remoteValue) {
        continue;
      }

      // Check based on conflict type
      switch (conflictType) {
        case ConflictType.VERSION_CONFLICT:
          // All fields are in conflict due to version mismatch
          conflicts.push(key);
          break;

        case ConflictType.DATA_CONFLICT:
          // Different values for same field
          conflicts.push(key);
          break;

        case ConflictType.VALIDATION_CONFLICT:
          // Only fields that fail validation
          if (this.isValidConflict(key, localValue, remoteValue)) {
            conflicts.push(key);
          }
          break;

        default:
          // Assume all non-equal fields are conflicts
          conflicts.push(key);
      }
    }

    return conflicts;
  }

  /**
   * Check if field has validation conflict
   */
  private isValidConflict(
    key: string,
    localValue: unknown,
    remoteValue: unknown
  ): boolean {
    // Simple validation logic - can be extended
    if (remoteValue === null && localValue !== null) {
      // Remote value was deleted (local value became invalid)
      return true;
    }

    if (typeof remoteValue === 'boolean' && typeof localValue === 'boolean') {
      return true; // Boolean conflicts are always conflicts
    }

    if (Array.isArray(remoteValue) && Array.isArray(localValue)) {
      return true; // Array conflicts
    }

    return false;
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    localVersion: number | null,
    remoteVersion: number | null
  ): ConflictType {
    // Check for version conflict
    if (localVersion !== null && remoteVersion !== null && remoteVersion > localVersion) {
      return ConflictType.VERSION_CONFLICT;
    }

    // Check for delete conflict
    if (remote[DELETED_AT_FIELD]) {
      return ConflictType.DELETE_CONFLICT;
    }

    // Check for validation conflict
    if (this.hasValidationError(remote)) {
      return ConflictType.VALIDATION_CONFLICT;
    }

    // Default to data conflict
    return ConflictType.DATA_CONFLICT;
  }

  /**
   * Check for validation error in data
   */
  private hasValidationError(data: Record<string, unknown>): boolean {
    // Simple validation - can be extended
    if (data.__validationError) {
      return true;
    }

    if (data.__conflictError) {
      return true;
    }

    return false;
  }

  /**
   * Create delete conflict
   */
  private createDeleteConflict(update: OptimisticUpdate): Conflict {
    const now = Date.now();

    return {
      id: this.generateId('conflict-'),
      type: ConflictType.DELETE_CONFLICT,
      documentId: update.documentId!,
      collection: update.collection!,
      local: {
        data: update.originalData || {},
        version: (update.originalData as any)[VERSION_FIELD] as number | null,
        timestamp: now,
      },
      remote: {
        data: {} as Record<string, unknown>,
        version: null,
        timestamp: Timestamp.now(),
        userId: undefined,
      },
      conflictingFields: Object.keys(update.originalData || {}),
      resolutionStrategy: ConflictResolutionStrategy.MANUAL,
      detectedAt: now,
      autoResolved: false,
      metadata: {},
      relatedUpdateId: update.id,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}${Date.now()}-${++this.conflictIdCounter}`;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    // Clear all conflicts
    this.conflicts.clear();

    // Clear resolution timeouts
    for (const timeout of this.resolutionTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.resolutionTimeouts.clear();

    // Clear references
    this.eventEmitter = null;
    this.optimisticHelper = null;

    this.debug('ConflictResolver destroyed');
  }
}

// ============================================
// Factory Functions
// ============================================

let defaultConflictResolver: ConflictResolver | null = null;

/**
 * Create a new conflict resolver instance
 */
export function createConflictResolver(config?: ConflictResolverConfig): ConflictResolver {
  return new ConflictResolver(config);
}

/**
 * Get default conflict resolver instance
 */
export function getDefaultConflictResolver(): ConflictResolver | null {
  return defaultConflictResolver;
}

/**
 * Set default conflict resolver instance
 */
export function setDefaultConflictResolver(resolver: ConflictResolver): void {
  defaultConflictResolver = resolver;
}

/**
 * Reset default conflict resolver instance
 */
export function resetDefaultConflictResolver(): void {
  if (defaultConflictResolver) {
    defaultConflictResolver.destroy();
    defaultConflictResolver = null;
  }
}
