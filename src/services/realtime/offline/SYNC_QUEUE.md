# Sync Queue

The Sync Queue manages synchronization operations for offline-first applications with priority handling, retry logic, conflict resolution, and online/offline detection.

## Features

- **Queue Management**: Add, remove, and clear queue operations with size limits
- **Sync Execution**: Single sync, sync all, and sync by tag with configurable concurrency
- **Priority Handling**: High, normal, and low priority levels with FIFO ordering
- **Batch Operations**: Add and remove multiple items efficiently
- **Retry Logic**: Exponential backoff with configurable retry attempts and delays
- **Sync Status Tracking**: Pending, in progress, completed, failed, permanently failed, cancelled
- **Conflict Detection**: Integrates with Conflict Resolver for automatic conflict handling
- **Online/Offline Detection**: Pauses sync when offline, resumes when online
- **Queue Persistence**: Saves queue to localStorage for recovery after page refresh
- **Statistics**: Comprehensive sync statistics and analytics
- **Event Emitter Integration**: Emits sync lifecycle events

## Basic Usage

### Creating a Sync Queue

```typescript
import { SyncQueue, createSyncQueue, SyncPriority, SyncStatus } from '@/services/realtime/offline';

// Using factory function
const syncQueue = createSyncQueue({
  maxConcurrentOps: 3,
  maxQueueSize: 1000,
  defaultPriority: SyncPriority.NORMAL,
  persistQueue: true,
  syncOnVisibilityChange: true,
  autoRetry: true,
  debug: true,
});

// Or using class directly
const syncQueue = new SyncQueue({
  debug: false,
});
```

### Initialization

```typescript
// Initialize with user ID
await syncQueue.initialize('user-123');

console.log('Sync queue ready!');

// Check online status via statistics
const stats = syncQueue.getStats();
console.log('Is online:', stats.isOnline);
```

## Queue Management

### Add Items

```typescript
// Add single item
const itemId = syncQueue.add({
  operation: 'update',
  collection: 'matters',
  documentId: 'matter-123',
  data: {
    clientName: 'Updated Client',
    status: 'Active',
  },
  priority: SyncPriority.HIGH,
});

console.log('Item added:', itemId);

// Add multiple items
const itemIds = syncQueue.addBatch([
  {
    operation: 'create',
    collection: 'transactions',
    data: { description: 'New transaction' },
  },
  {
    operation: 'update',
    collection: 'matters',
    documentId: 'matter-456',
    data: { clientName: 'Another matter' },
  },
  {
    operation: 'delete',
    collection: 'documents',
    documentId: 'doc-789',
    data: { name: 'Old document' },
  },
]);

console.log('Batch added:', itemIds.length);
```

### Remove Items

```typescript
// Remove single item
const removed = syncQueue.remove('sync-123');

console.log('Item removed:', removed);

// Remove multiple items
const count = syncQueue.removeBatch(['sync-123', 'sync-456', 'sync-789']);

console.log('Batch removed:', count);

// Clear all items
const cleared = syncQueue.clear();

console.log('Queue cleared:', cleared);
```

### Query Queue

```typescript
// Get queue size
const size = syncQueue.getQueueSize();

console.log('Queue size:', size);

// Get pending items
const pending = syncQueue.getPendingItems();

console.log('Pending items:', pending.length);

// Get in-progress items
const inProgressItems = syncQueue.getInProgressItems();

console.log('In progress:', inProgressItems.length);

// Get failed items
const failedItems = syncQueue.getFailedItems();

console.log('Failed items:', failedItems.length);

// Get items by priority
const highPriorityItems = syncQueue.getItemsByPriority(SyncPriority.HIGH);
const normalPriorityItems = syncQueue.getItemsByPriority(SyncPriority.NORMAL);

console.log('High priority:', highPriorityItems.length);
console.log('Normal priority:', normalPriorityItems.length);

// Get items by status
const completedItems = syncQueue.getItemsByStatus(SyncStatus.COMPLETED);
const inProgressItems = syncQueue.getItemsByStatus(SyncStatus.IN_PROGRESS);

console.log('Completed:', completedItems.length);
console.log('In progress:', inProgressItems.length);

// Get items by tag
const taggedItems = syncQueue.getItemsByTag('batch-123');

console.log('Tagged items:', taggedItems.length);

// Get items by operation type
const updateItems = syncQueue.getItemsByOperation('update');

console.log('Update operations:', updateItems.length);
```

## Sync Execution

### Sync All Items

```typescript
// Sync all items in queue
const result = await syncQueue.sync();

console.log('Sync result:', result.allSuccess);
console.log('Total:', result.total);
console.log('Successful:', result.successful);
console.log('Failed:', result.failed);

// Sync with timeout
const resultWithTimeout = await syncQueue.sync({
  timeout: 60000, // 1 minute
});

console.log('Sync result (with timeout):', result);

// Force sync (even when offline)
const forcedResult = await syncQueue.sync({
  force: true,
});
```

### Sync by Tag

```typescript
// Sync items with specific tag
const result = await syncQueue.syncByTag('batch-123');

console.log('Tagged items synced:', result.total);
```

### Sync Single Item

```typescript
// Sync specific item by ID
const result = await syncQueue.syncById('sync-123', {
  force: true, // Force sync even if offline
});

console.log('Item synced:', result.success);
console.log('Data:', result.data);
console.log('Processing time:', result.processingTime);
```

## Priority Handling

### Priority Queue

```typescript
// Add items with different priorities
const highPriorityItem = syncQueue.add({
  operation: 'update',
  collection: 'matters',
  documentId: 'matter-urgent',
  data: { urgent: true },
  priority: SyncPriority.HIGH,
});

const normalPriorityItem = syncQueue.add({
  operation: 'update',
  collection: 'matters',
  documentId: 'matter-normal',
  data: { normal: true },
  priority: SyncPriority.NORMAL,
});

const lowPriorityItem = syncQueue.add({
  operation: 'update',
  collection: 'matters',
  documentId: 'matter-low',
  data: { low: true },
  priority: SyncPriority.LOW,
});

console.log('High priority items:', syncQueue.getItemsByPriority(SyncPriority.HIGH).length);
console.log('Normal priority items:', syncQueue.getItemsByPriority(SyncPriority.NORMAL).length);
console.log('Low priority items:', syncQueue.getItemsByPriority(SyncPriority.LOW).length);
```

### Priority Processing Order

```typescript
// Queue processes items in this order:
// 1. High priority items first (FIFO within high priority)
// 2. Normal priority items (FIFO within normal priority)
// 3. Low priority items last (FIFO within low priority)
```

## Conflict Detection and Resolution

### Conflict Detection

```typescript
// Add item with conflict detection
const itemId = syncQueue.add({
  operation: 'update',
  collection: 'matters',
  documentId: 'matter-123',
  data: { clientName: 'Local value' },
  priority: SyncPriority.NORMAL,
  detectConflict: true, // Enable conflict detection
});

console.log('Item added with conflict detection:', itemId);
```

### Conflict Resolution

```typescript
// Queue automatically resolves conflicts with registered strategies
// High priority items use last-write-wins by default
// Low priority items use merge strategy by default
// Failed items are automatically retried with exponential backoff
```

## Online/Offline Detection

### Automatic Sync Pausing

```typescript
// Sync queue automatically pauses when offline
// Sync resumes automatically when online
// In-progress items are cancelled when going offline
// Pending items remain in queue

// Check current online status via statistics
const stats = syncQueue.getStats();
console.log('Current online status:', stats.isOnline);
```

### Manual Online Check

```typescript
// Online status is tracked internally
// Check via statistics
const stats = syncQueue.getStats();
console.log('Is online:', stats.isOnline);
console.log('Last online change:', new Date(stats.lastOnlineChange).toLocaleString());
```

## Statistics

### Get Statistics

```typescript
// Get comprehensive statistics
const stats = syncQueue.getStats();

console.log('Sync Queue Statistics:');
console.log(`Total items: ${stats.totalItems}`);
console.log(`Queue size: ${stats.queueSize}`);
console.log(`Total syncs: ${stats.totalSyncs}`);
console.log(`Successful syncs: ${stats.successfulSyncs}`);
console.log(`Failed syncs: ${stats.failedSyncs}`);
console.log(`By priority:`, stats.byPriority);
console.log(`By status:`, stats.byStatus);
console.log(`By tag:`, stats.byTag);
console.log(`Conflicts detected: ${stats.conflictsDetected}`);
console.log(`Conflicts resolved: ${stats.conflictsResolved}`);
console.log(`Success rate: ${stats.resolutionRate.toFixed(2)}%`);
console.log(`Average sync time: ${stats.averageSyncTime}ms`);
console.log(`Is online: ${stats.isOnline}`);
console.log(`Last online change: ${new Date(stats.lastOnlineChange).toLocaleString()}`);
console.log(`Last updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
```

### Reset Statistics

```typescript
syncQueue.resetStats();

console.log('Statistics reset');
```

## Retry Failed Items

```typescript
// Retry all failed items
const retriedCount = await syncQueue.retryFailedItems();

console.log('Retried items:', retriedCount);

// The retryFailedItems method:
// - Resets failed items to PENDING status
// - Increments retry count
// - Calculates exponential backoff delay
// - Automatically triggers sync if items were retried
// - Marks items as PERMANENTLY_FAILED if retry limit exceeded
```

## Debugging

### Debug Logging

```typescript
// Enable debug logging when creating queue
const syncQueue = createSyncQueue({
  debug: true,  // Enable debug logging
});

// Debug logs show:
// - Queue operations (add, remove, clear)
// - Sync lifecycle (start, progress, completion)
// - Conflict detection and resolution
// - Online/offline status changes
// - Error conditions
```

### Event Monitoring

```typescript
// Monitor sync queue events via event emitter
if (syncQueue.config.eventEmitter) {
  syncQueue.config.eventEmitter.on('syncQueue:itemAdded', (data) => {
    console.log('Item added:', data.itemId, data.item);
  });

  syncQueue.config.eventEmitter.on('syncQueue:itemRemoved', (data) => {
    console.log('Item removed:', data.itemId);
  });

  syncQueue.config.eventEmitter.on('syncQueue:itemSynced', (data) => {
    console.log('Item synced:', data.itemId, data.result);
  });

  syncQueue.config.eventEmitter.on('syncQueue:itemSyncFailed', (data) => {
    console.error('Item sync failed:', data.itemId, data.error);
  });

  syncQueue.config.eventEmitter.on('syncQueue:syncCompleted', (data) => {
    console.log('Sync completed:', data.results);
  });

  syncQueue.config.eventEmitter.on('syncQueue:syncFailed', (data) => {
    console.error('Sync failed:', data.error);
  });

  syncQueue.config.eventEmitter.on('syncQueue:online', (data) => {
    console.log('Now online - syncing will resume');
  });

  syncQueue.config.eventEmitter.on('syncQueue:offline', (data) => {
    console.log('Now offline - syncing paused');
  });

  syncQueue.config.eventEmitter.on('syncQueue:conflictResolved', (data) => {
    console.log('Conflict resolved:', data.itemId, data.strategy);
  });
}
```

## React Integration

### Custom Hook

```typescript
import { useState, useEffect, useCallback } from 'react';
import { SyncQueue, SyncStatus, SyncPriority } from '@/services/realtime/offline';

function useSyncQueue(syncQueue: SyncQueue, userId: string) {
  const [stats, setStats] = useState(syncQueue.getStats());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Update stats periodically
    const interval = setInterval(() => {
      setStats(syncQueue.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [syncQueue]);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    const result = await syncQueue.sync();
    setIsSyncing(false);

    if (!result.allSuccess) {
      alert(`${result.failed} items failed to sync`);
    }

    return result;
  }, [syncQueue, setIsSyncing]);

  const syncById = useCallback(async (itemId: string) => {
    const result = await syncQueue.syncById(itemId);

    if (!result.success) {
      alert(`Item ${itemId} failed to sync: ${result.error?.message}`);
    }

    return result;
  }, [syncQueue]);

  const addItem = useCallback((
    operation: 'create' | 'update' | 'delete',
    collection: string,
    documentId: string,
    data: any,
    priority?: SyncPriority,
  ) => {
    const itemId = syncQueue.add({
      operation,
      collection,
      documentId,
      data,
      priority,
    });

    return itemId;
  }, [syncQueue]);

  const removeItem = useCallback((itemId: string) => {
    syncQueue.remove(itemId);
  }, [syncQueue]);

  return {
    stats,
    isSyncing,
    sync,
    syncById,
    addItem,
    removeItem,
  };
}
```

### React Component

```typescript
function SyncDashboard({ 
  syncQueue,
  userId 
}: { 
  syncQueue: SyncQueue;
  userId: string;
}) {
  const {
    stats,
    isSyncing,
    sync,
    addItem,
    removeItem,
  } = useSyncQueue(syncQueue, userId);

  return (
    <div className="sync-dashboard">
      <div className="header">
        <h2>Sync Queue</h2>
        <div className="stats">
          <div>Queue Size: {stats.queueSize}</div>
          <div>Total Syncs: {stats.totalSyncs}</div>
          <div>Success Rate: {stats.resolutionRate.toFixed(1)}%</div>
          <div>Online: {stats.isOnline ? 'Yes' : 'No'}</div>
        </div>
        <button onClick={sync} disabled={isSyncing}>
          {isSyncing ? 'Syncing...' : 'Sync All'}
        </button>
      </div>

      <div className="by-priority">
        <h3>By Priority</h3>
        <div className="priority-section">
          <h4>High Priority ({syncQueue.getItemsByPriority(SyncPriority.HIGH).length})</h4>
          {syncQueue.getItemsByPriority(SyncPriority.HIGH).map(item => (
            <SyncItem key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
        <div className="priority-section">
          <h4>Normal Priority ({syncQueue.getItemsByPriority(SyncPriority.NORMAL).length})</h4>
          {syncQueue.getItemsByPriority(SyncPriority.NORMAL).map(item => (
            <SyncItem key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
        <div className="priority-section">
          <h4>Low Priority ({syncQueue.getItemsByPriority(SyncPriority.LOW).length})</h4>
          {syncQueue.getItemsByPriority(SyncPriority.LOW).map(item => (
            <SyncItem key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      </div>

      <div className="by-status">
        <h3>By Status</h3>
        <div className="status-section pending">
          <h4>Pending ({syncQueue.getPendingItems().length})</h4>
          {syncQueue.getPendingItems().map(item => (
            <SyncItem key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
        <div className="status-section in-progress">
          <h4>In Progress ({syncQueue.getInProgressItems().length})</h4>
          {syncQueue.getInProgressItems().map(item => (
            <SyncItem key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
        <div className="status-section failed">
          <h4>Failed ({syncQueue.getFailedItems().length})</h4>
          {syncQueue.getFailedItems().map(item => (
            <SyncItem key={item.id} item={item} onRemove={removeItem} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SyncItem({ 
  item, 
  onRemove 
}: { 
  item: SyncQueueItem;
  onRemove: (id: string) => void;
}) {
  const timeAgo = item.completedAt
    ? getTimeAgo(item.completedAt)
    : 'Queued';

  return (
    <div className={`sync-item ${item.status}`}>
      <div className="item-info">
        <span className="operation">{item.operation}</span>
        <span className="collection">{item.collection}</span>
        <span className="document">{item.documentId || 'N/A'}</span>
        <span className="status">{item.status}</span>
        <span className="time">{timeAgo}</span>
      </div>
      {item.retryCount > 0 && (
        <div className="retry-info">
          Retries: {item.retryCount}
        </div>
      )}
      {item.conflict && (
        <div className="conflict-info">
          ⚠️ Conflict detected
        </div>
      )}
      <button onClick={() => onRemove(item.id)}>Remove</button>
    </div>
  );
}
```

## Configuration Options

```typescript
interface SyncQueueConfig {
  // Queue limits
  maxConcurrentOps?: number;           // Default: 3
  maxQueueSize?: number;              // Default: 1000
  
  // Priority
  defaultPriority?: SyncPriority;    // Default: NORMAL
  
  // Persistence
  persistQueue?: boolean;              // Default: true
  collectionName?: string;             // Default: 'syncQueue'
  
  // Auto-sync
  syncOnVisibilityChange?: boolean;   // Default: true
  autoRetry?: boolean;                // Default: true
  
  // Retry settings
  defaultMaxRetries?: number;         // Default: 3
  defaultRetryDelay?: number;         // Default: 1000ms
  backoffMultiplier?: number;          // Default: 2
  
  // Timeout
  syncTimeout?: number;               // Default: 30000ms
  
  // Conflicts
  enableConflictDetection?: boolean;  // Default: true
  
  // Online/Offline
  enableOnlineDetection?: boolean;   // Default: true
  
  // Event emitter
  eventEmitter?: RealtimeEventEmitter;
  
  // Debugging
  debug?: boolean;                     // Default: false
}
```

## Best Practices

1. **Use Appropriate Priority**: Assign priority based on business importance
2. **Monitor Queue Size**: Use queue size statistics to detect backlogs
3. **Handle Conflicts**: Enable conflict detection for critical operations
4. **Test Retry Logic**: Verify retry behavior with slow network conditions
5. **Clean Up**: Always call `destroy()` when done
6. **Monitor Statistics**: Use statistics to optimize sync performance
7. **Set Timeouts**: Use appropriate sync timeouts to prevent long waits
8. **Persist Queue**: Enable persistence for recovery after refresh
9. **Use Tags**: Group related operations with tags for batch processing
10. **Handle Offline Gracefully**: Cancel in-progress operations when going offline

## API Reference

### Public Methods

#### Queue Management
- `add(item: Omit<SyncQueueItem, 'id' | 'queuedAt' | 'retryCount'>): string` - Add item to queue
- `remove(itemId: string): boolean` - Remove item from queue
- `clear(cancelProcessing?: boolean): number` - Clear all items from queue
- `getQueueSize(): number` - Get current queue size
- `addBatch(items: Array<...>): string[]` - Add multiple items in batch
- `removeBatch(itemIds: string[]): number` - Remove multiple items in batch

#### Query Methods
- `getPendingItems(): SyncQueueItem[]` - Get pending items
- `getInProgressItems(): SyncQueueItem[]` - Get in-progress items
- `getFailedItems(): SyncQueueItem[]` - Get failed items
- `getItemsByStatus(status: SyncStatus): SyncQueueItem[]` - Get items by status
- `getItemsByPriority(priority: SyncPriority): SyncQueueItem[]` - Get items by priority
- `getItemsByTag(tag: string): SyncQueueItem[]` - Get items by tag
- `getItemsByOperation(operation: string): SyncQueueItem[]` - Get items by operation type

#### Sync Methods
- `sync(options?: { force?, timeout? }): Promise<SyncBatchResult>` - Sync all items
- `syncById(itemId: string, options?): Promise<SyncResult>` - Sync specific item
- `syncByTag(tag: string, options?): Promise<SyncBatchResult>` - Sync items by tag
- `retryFailedItems(): Promise<number>` - Retry failed items
- `cancelSync(): void` - Cancel ongoing sync

#### Statistics
- `getStats(): SyncQueueStats` - Get sync statistics
- `resetStats(): void` - Reset statistics

#### Lifecycle
- `initialize(userId: string): Promise<void>` - Initialize sync queue
- `destroy(): void` - Destroy and cleanup

### Private Helper Methods

- `debug(message: string, data?: unknown): void` - Debug logging helper
- `emitQueueEvent(event: string, data?: unknown): void` - Emit queue event
- `initializeStats(): SyncQueueStats` - Initialize statistics object
- `generateId(prefix: string): string` - Generate unique ID
- `syncIfNeeded(): void` - Trigger sync if we have capacity
- `processQueue(timeout?: number): Promise<SyncResult[]>` - Process entire queue
- `getNextItem(): SyncQueueItem | null` - Get next item based on priority
- `handleOnline(): void` - Handle online status
- `handleOffline(): void` - Handle offline status
- `setupOnlineOfflineDetection(): void` - Setup online/offline detection
- `setupVisibilityDetection(): void` - Setup visibility detection
- `startSyncInterval(): void` - Start sync interval
- `executeItemWithTimeout(item, timeout): Promise<SyncResult>` - Execute item with timeout
- `executeItem(item: SyncQueueItem): Promise<SyncResult>` - Execute item and handle conflicts
- `executeFirestoreOperation(item: SyncQueueItem): Promise<SyncResult>` - Execute Firestore operation
- `calculateRetryDelay(retryCount: number): number` - Calculate retry delay with exponential backoff
- `clearRetryTimers(): void` - Clear retry timers
- `updateStats(item, action, count?): void` - Update statistics for item
- `updateAverageSyncTime(item: SyncQueueItem): void` - Update average sync time
- `persistQueueToStorage(): void` - Persist queue to localStorage
- `restoreQueueFromStorage(): Promise<void>` - Restore queue from localStorage

### Events

The sync queue emits events via the configured event emitter:
- `syncQueue:initialized` - Queue initialized
- `syncQueue:itemAdded` - Item added to queue
- `syncQueue:itemRemoved` - Item removed from queue
- `syncQueue:itemSynced` - Item synced successfully
- `syncQueue:itemSyncFailed` - Item sync failed
- `syncQueue:itemRetry` - Item being retried
- `syncQueue:syncCompleted` - Sync batch completed
- `syncQueue:syncFailed` - Sync batch failed
- `syncQueue:queueCleared` - Queue cleared
- `syncQueue:queueFull` - Queue at capacity
- `syncQueue:online` - Now online
- `syncQueue:offline` - Now offline
- `syncQueue:conflictResolved` - Conflict resolved
- `syncQueue:manualResolutionRequired` - Conflict requires manual resolution

## Recent Changes

### Type Definition Fix (March 2026)
Fixed TypeScript syntax error in `SyncExecutor` generic function type definition. Changed from:
```typescript
// ❌ Invalid - duplicate `=` sign
export type SyncExecutor<T> = Record<string, unknown> = (
  item: SyncQueueItem
) => Promise<SyncResult<T>>;
```

To:
```typescript
// ✅ Valid - proper function type
export type SyncExecutor<T> = (
  item: SyncQueueItem
) => Promise<SyncResult<T>>;
```

### API Updates
The following public API changes were made to align with the implementation:

**Removed Methods (never existed in implementation):**
- `getAllConflicts()` - Use `getItemsByStatus(SyncStatus.COMPLETED)` instead
- `getUpdate(id)` - Use `getItemsByStatus()` or `getItemsById()` pattern
- `getPending()` - Use `getPendingItems()` instead
- `getSyncing()` - Use `getInProgressItems()` instead
- `getCompleted()` - Use `getItemsByStatus(SyncStatus.COMPLETED)` instead
- `getFailed()` - Use `getFailedItems()` instead
- `syncAll()` - Use `sync()` instead
- `retryFailed()` - Use `retryFailedItems()` instead

**New Query Methods:**
- `getPendingItems()` - Get items with PENDING status
- `getInProgressItems()` - Get items with IN_PROGRESS status
- `getFailedItems()` - Get items with FAILED status
- `getItemsByTag(tag)` - Get items grouped by tag
- `getItemsByOperation(operation)` - Get items by operation type

**Runtime Fixes:**
- Fixed concurrent operation tracking
- Improved online/offline detection handling
- Enhanced conflict detection and resolution flow
- Better error handling in Firestore operations
- Improved queue persistence and restoration

**Internal Improvements:**
- Added `debug()` method for consistent logging
- Added `emitQueueEvent()` for centralized event emission
- Added `initializeStats()` for proper statistics initialization
- Added `generateId()` for consistent ID generation
- Added `syncIfNeeded()` for smart sync triggering
- Improved `processQueue()` with better timeout handling
- Enhanced `handleOffline()` with proper cleanup

## License

MIT
