# Optimistic Update Helper

The Optimistic Update Helper manages optimistic updates with rollback support, conflict detection, and retry logic for Firebase operations.

## Features

- **Optimistic Update Execution**: Execute single or batch optimistic updates
- **Rollback Management**: Rollback updates on conflict or failure
- **Pending Updates Tracking**: Track all pending and failed updates
- **Update Tags**: Group related updates with tags
- **Conflict Detection**: Detect version conflicts and merge conflicts
- **Conflict Resolution**: Custom conflict resolver support
- **Retry Logic**: Configurable retry with exponential backoff
- **Update Queue**: Queue management for sequential processing
- **Statistics**: Comprehensive update statistics and analytics

## Basic Usage

### Creating a Helper

```typescript
import { OptimisticUpdateHelper, createOptimisticUpdateHelper } from '@/services/realtime';

const helper = createOptimisticUpdateHelper({
  maxRetries: 3,
  retryDelay: 1000,
  autoRollback: true,
  emitEvents: true,
});
```

### Setting Event Emitter

```typescript
import { RealtimeEventEmitter } from '@/services/realtime';

const emitter = new RealtimeEventEmitter();
helper.setEventEmitter(emitter);

// Listen to update events
emitter.on('optimisticUpdate:confirmed', (update) => {
  console.log('Update confirmed:', update.id);
});

emitter.on('optimisticUpdate:rolledBack', (update) => {
  console.log('Update rolled back:', update.id);
});
```

## Optimistic Update Execution

### Single Update

```typescript
// Execute a single optimistic update
const result = await helper.execute(
  'matters',
  'update',
  matterData,
  async (update) => {
    // Update Firestore
    const docRef = doc(db, 'matters', matterData.id);
    await updateDoc(docRef, {
      ...update.updatedData,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      data: update.updatedData,
    };
  }
);

console.log('Update result:', result.success);
```

### Batch Update

```typescript
// Execute multiple optimistic updates in batch
const results = await helper.executeBatch([
  {
    collection: 'matters',
    operation: 'update',
    data: matterData1,
    executor: async (update) => {
      const docRef = doc(db, 'matters', update.documentId);
      await updateDoc(docRef, update.updatedData);
      return { success: true, data: update.updatedData };
    },
  },
  {
    collection: 'transactions',
    operation: 'create',
    data: transactionData,
    executor: async (update) => {
      const colRef = collection(db, 'transactions');
      const docRef = await addDoc(colRef, update.updatedData);
      return { success: true, data: { ...update.updatedData, id: docRef.id } };
    },
  },
]);

console.log('Batch results:', results);
```

## Rollback Management

### Rollback Single Update

```typescript
// Rollback a specific update
await helper.rollback('update-123');

console.log('Update rolled back');
```

### Rollback All Pending

```typescript
// Rollback all pending updates
const count = await helper.rollbackAll();

console.log('Rolled back', count, 'updates');
```

### Rollback by Tag

```typescript
// Rollback updates with specific tag
await helper.rollbackByTag('batch-123');

console.log('Updates with tag rolled back');
```

### Custom Rollback Function

```typescript
// Use custom rollback function
await helper.rollback('update-123', {
  customRollback: async (update) => {
    // Custom rollback logic
    await restoreOriginalState(update.originalData);
    await showRollbackUI(update);
  },
});
```

## Pending Updates Tracking

### Get Pending Updates

```typescript
// Get all pending updates
const pending = helper.getPendingUpdates();
console.log('Pending updates:', pending.length);

// Get pending by tag
const batchPending = helper.getPendingUpdatesByTag('batch-123');
console.log('Batch pending:', batchPending.length);

// Get pending count
const count = helper.getPendingCount();
console.log('Pending count:', count);

// Get specific update
const update = helper.getUpdate('update-123');
console.log('Update status:', update?.status);

// Get updates by status
const failed = helper.getUpdatesByStatus(OptimisticUpdateStatus.FAILED);
console.log('Failed updates:', failed.length);
```

## Update Queue Management

```typescript
// Add update to queue
helper.queueUpdate('update-123', () => {
  console.log('Update cancelled');
});

// Remove from queue
helper.dequeueUpdate('update-123');

// Clear entire queue
helper.clearQueue();

// Get queue size
const queueSize = helper.getQueueSize();
console.log('Queue size:', queueSize);
```

## Conflict Detection and Resolution

### Auto-Rollback on Conflict

```typescript
const helper = createOptimisticUpdateHelper({
  autoRollback: true,
  conflictThreshold: 0, // Strict conflict detection
});

// Helper will automatically rollback on conflict detection
```

### Custom Conflict Resolver

```typescript
const helper = createOptimisticUpdateHelper({
  customConflictResolver: (local, server) => {
    // Resolve conflict by merging data
    return {
      ...server,
      ...local,
      // Custom merge logic
      lastModified: Math.max(local.lastModified, server.lastModified),
    };
  },
});
```

### Version Conflict Handling

```typescript
// Document with version field
interface VersionedDocument {
  id: string;
  data: any;
  version: number;
}

const result = await helper.execute(
  'matters',
  'update',
  {
    id: 'matter-123',
    data: { clientName: 'Updated Name' },
    version: 2, // Client version
    original: { version: 1, clientName: 'Original Name' },
  },
  async (update) => {
    const docRef = doc(db, 'matters', update.documentId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const serverData = snapshot.data() as VersionedDocument;
      
      // Check version
      if (serverData.version > (update.updatedData as any).version) {
        // Conflict detected
        throw new Error('Version conflict');
      }

      // Update with version increment
      await updateDoc(docRef, {
        ...update.updatedData,
        version: serverData.version + 1,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        data: { ...update.updatedData, version: serverData.version + 1 },
      };
    }

    return { success: false, error: new Error('Document not found') };
  }
);
```

## Retry Logic

### Configure Retry Options

```typescript
const helper = createOptimisticUpdateHelper({
  maxRetries: 5,              // Maximum retry attempts
  retryDelay: 2000,            // Initial delay
  backoffMultiplier: 2,       // Exponential backoff
});

// Retry delays:
// Attempt 1: immediate
// Attempt 2: 2000ms
// Attempt 3: 4000ms
// Attempt 4: 8000ms
// Attempt 5: 16000ms
```

### Retry Behavior

```typescript
const result = await helper.execute(
  'matters',
  'update',
  data,
  async (update) => {
    // This may fail
    const docRef = doc(db, 'matters', update.documentId);
    await updateDoc(docRef, update.updatedData);
    return { success: true, data: update.updatedData };
  }
);

console.log('Retry count:', result.retryCount);
console.log('Success:', result.success);
console.log('Rolled back:', result.rolledBack);
```

## Statistics

### Get Statistics

```typescript
const stats = helper.getStats();

console.log('Optimistic Update Statistics:');
console.log(`Total updates: ${stats.totalUpdates}`);
console.log(`Pending: ${stats.pendingUpdates}`);
console.log(`Confirmed: ${stats.confirmedUpdates}`);
console.log(`Failed: ${stats.failedUpdates}`);
console.log(`Rolled back: ${stats.rolledBackUpdates}`);
console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
console.log(`Average retries: ${stats.averageRetries.toFixed(2)}`);
console.log('By operation:', stats.byOperation);
console.log('By status:', stats.byStatus);
console.log(`Last updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
```

### Reset Statistics

```typescript
helper.resetStats();
console.log('Statistics reset');
```

## React Integration

### Custom Hook for Optimistic Updates

```typescript
import { useState, useCallback } from 'react';
import { OptimisticUpdateHelper, OptimisticUpdateStatus } from '@/services/realtime';

function useOptimisticUpdate(helper: OptimisticUpdateHelper) {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(helper.getPendingCount());
      setFailedCount(helper.getUpdatesByStatus(OptimisticUpdateStatus.FAILED).length);
    }, 1000);

    return () => clearInterval(interval);
  }, [helper]);

  const executeUpdate = useCallback(async (
    collection: string,
    operation: 'create' | 'update' | 'delete',
    data: any,
    executor: (update: any) => Promise<any>
  ) => {
    return await helper.execute(collection, operation, data, executor);
  }, [helper]);

  const rollback = useCallback(async (updateId: string) => {
    return await helper.rollback(updateId);
  }, [helper]);

  const rollbackAll = useCallback(async () => {
    return await helper.rollbackAll();
  }, [helper]);

  return {
    pendingCount,
    failedCount,
    executeUpdate,
    rollback,
    rollbackAll,
    stats: helper.getStats(),
  };
}
```

### React Component with Optimistic Updates

```typescript
function MatterForm({ helper, initialData }: { helper: OptimisticUpdateHelper; initialData: any }) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setHasError(false);

    try {
      // Create optimistic update
      const result = await helper.execute(
        'matters',
        'update',
        {
          ...data,
          original: initialData,
        },
        async (update) => {
          // Optimistically update UI
          setData(update.updatedData);

          // Execute server update
          const docRef = doc(db, 'matters', update.documentId);
          await updateDoc(docRef, update.updatedData);

          return { success: true, data: update.updatedData };
        }
      );

      if (result.success) {
        console.log('Update successful');
      } else if (result.rolledBack) {
        console.log('Update rolled back due to conflict');
        setData(initialData); // Restore original data
      } else {
        console.error('Update failed:', result.error);
        setHasError(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={data.clientName}
        onChange={(e) => setData({ ...data, clientName: e.target.value })}
      />
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </button>
      {hasError && <div className="error">Update failed. Please try again.</div>}
    </form>
  );
}
```

### Batch Updates Component

```typescript
function BatchUpdates({ helper, updates }: { helper: OptimisticUpdateHelper; updates: any[] }) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handleBatchUpdate = async () => {
    setStatus('processing');

    try {
      const results = await helper.executeBatch(
        updates.map(u => ({
          collection: u.collection,
          operation: u.operation,
          data: {
            ...u.data,
            original: u.original,
          },
          executor: u.executor,
        }))
      );

      const allSuccessful = results.every(r => r.success);
      const anyRolledBack = results.some(r => r.rolledBack);

      if (allSuccessful) {
        setStatus('success');
      } else if (anyRolledBack) {
        setStatus('error');
        alert('Some updates were rolled back due to conflicts');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
      console.error('Batch update failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleBatchUpdate} disabled={status === 'processing'}>
        {status === 'processing' ? 'Processing...' : 'Process Batch'}
      </button>
      {status === 'success' && <div className="success">All updates successful!</div>}
      {status === 'error' && <div className="error">Some updates failed.</div>}
    </div>
  );
}
```

## Configuration Options

```typescript
interface OptimisticUpdateOptions {
  // Retry settings
  maxRetries?: number;              // Default: 3
  retryDelay?: number;               // Default: 1000ms
  backoffMultiplier?: number;         // Default: 2
  
  // Rollback settings
  autoRollback?: boolean;           // Default: true
  conflictThreshold?: number;        // Default: 0 (strict)
  customRollback?: (update) => Promise<void>;
  customConflictResolver?: (local, server) => any;
  
  // Event settings
  emitEvents?: boolean;              // Default: true
}
```

## Update Events

The helper emits the following events when event emitter is configured:

| Event | Description |
|-------|-------------|
| `optimisticUpdate:created` | Update created and pending |
| `optimisticUpdate:confirmed` | Update confirmed by server |
| `optimisticUpdate:failed` | Update failed after retries |
| `optimisticUpdate:rolledBack` | Update rolled back due to conflict |
| `optimisticUpdate:batchCreated` | Batch of updates created |
| `optimisticUpdate:batchConfirmed` | Batch confirmed by server |
| `optimisticUpdate:batchFailed` | Batch failed |
| `optimisticUpdate:rolledBackAll` | All pending updates rolled back |
| `optimisticUpdate:rolledBackByTag` | Updates with tag rolled back |
| `optimisticUpdate:optimisticApplied` | Optimistic update applied to UI |
| `optimisticUpdate:rollbackFailed` | Rollback operation failed |

## Best Practices

1. **Use Tags for Batches**: Tag related updates to manage them as a group
2. **Provide Original Data**: Always include original data for rollback
3. **Handle Errors Gracefully**: Check `rolledBack` flag in results
4. **Monitor Pending Updates**: Use `getPendingCount()` to show loading state
5. **Configure Retries**: Adjust retry settings based on network conditions
6. **Use Conflict Resolvers**: Implement custom resolvers for complex merge logic
7. **Track Statistics**: Use statistics to monitor update performance
8. **Clean Up**: Call `destroy()` when done
9. **Version Your Documents**: Use version fields to detect conflicts
10. **Test Rollback**: Test rollback logic thoroughly

## Integration with TanStack Query

```typescript
import { useQueryClient } from '@tanstack/react-query';

function useOptisticMutation<T>(
  helper: OptimisticUpdateHelper,
  collection: string,
  operation: 'create' | 'update' | 'delete',
  mutationFn: (data: T) => Promise<any>
) {
  const queryClient = useQueryClient();

  const optimisticMutation = useMutation({
    mutationFn: async (data: T) => {
      // Store original data for rollback
      const originalData = queryClient.getQueryData([collection, data.id]);

      // Execute optimistic update
      return await helper.execute(
        collection,
        operation,
        {
          ...data,
          original: originalData,
        },
        async (update) => {
          // Optimistically update cache
          queryClient.setQueryData([collection, data.id], update.updatedData);
          
          // Execute server mutation
          try {
            const result = await mutationFn(data);
            return { success: true, data: result };
          } catch (error) {
            return { success: false, error: error as Error };
          }
        }
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: [collection] });
      } else if (result.rolledBack) {
        // Rollback cache
        queryClient.setQueryData([collection, result.updateId], result.data?.original);
      }
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
    },
  });

  return optimisticMutation;
}

// Usage
function UpdateMatterForm({ helper, initialData }: { helper: OptimisticUpdateHelper; initialData: Matter }) {
  const queryClient = useQueryClient();
  
  const updateMutation = useOptisticMutation(helper, 'matters', 'update', async (data) => {
    const docRef = doc(db, 'matters', data.id);
    await updateDoc(docRef, data);
    return data;
  });

  const handleSubmit = async (data: Matter) => {
    await updateMutation.mutateAsync(data);
  };

  return (
    <MatterForm initialData={initialData} onSubmit={handleSubmit} />
  );
}
```

## License

MIT
