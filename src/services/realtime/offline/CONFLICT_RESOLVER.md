# Conflict Resolver

The Conflict Resolver manages conflict detection and resolution for offline-first applications with multiple update sources, automatic conflict resolution, and comprehensive conflict reporting.

## Features

- **Conflict Detection**: Detect version conflicts, data conflicts, validation conflicts, and merge conflicts
- **Resolution Strategies**: Last write wins, first write wins, merge, custom, and manual resolution
- **Automatic Resolution**: Configurable strategy selection with automatic conflict resolution
- **Conflict History**: Track all conflicts with timestamps and resolution details
- **Custom Strategies**: Register custom resolution strategies for complex merge logic
- **Conflict Reporting**: Generate detailed conflict reports with field-level information
- **Integration**: Works with Firestore, optimistic updates, and event emitters

## Basic Usage

### Creating a Conflict Resolver

```typescript
import { ConflictResolver, createConflictResolver } from '@/services/realtime/offline';

// Using factory function
const resolver = createConflictResolver({
  defaultStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
  autoResolve: true,
  debug: true,
});

// Or using class directly
const resolver = new ConflictResolver({
  debug: false,
});
```

### Setting Event Emitter

```typescript
import { RealtimeEventEmitter } from '@/services/realtime';

const emitter = new RealtimeEventEmitter();
resolver.setEventEmitter(emitter);

// Listen to conflict events
emitter.on('conflict:detected', (event) => {
  console.log('Conflict detected:', event.payload);
});

emitter.on('conflict:resolved', (event) => {
  console.log('Conflict resolved:', event.payload);
});

emitter.on('conflict:rolledBack', (event) => {
  console.log('Conflict rolled back:', event.payload);
});
```

## Conflict Detection

### Detect Single Conflict

```typescript
// Detect conflict between local and remote data
const conflict = await resolver.detectConflict(
  'matters',
  'matter-123',
  localData,  // Client data
  remoteData,  // Server data
);

if (conflict) {
  console.log('Conflict detected:', conflict.type);
  console.log('Conflicting fields:', conflict.conflictingFields);
}
```

### Detect All Conflicts

```typescript
// Detect conflicts for an optimistic update
const conflicts = await resolver.detectAllConflicts(update);

console.log('Found', conflicts.length, 'conflicts');
conflicts.forEach(conflict => {
  console.log('  Type:', conflict.type);
  console.log('  Fields:', conflict.conflictingFields);
});
```

## Conflict Resolution

### Automatic Conflict Resolution

```typescript
// Let resolver automatically resolve conflicts
const result = await resolver.resolveConflict(
  conflict,
  {
    strategy: ConflictResolutionStrategy.MERGE,
  }
);

if (result.success) {
  console.log('Conflict resolved with strategy:', result.strategy);
  console.log('Resolved data:', result.resolvedData);
} else {
  console.error('Resolution failed:', result.error);
}
```

### Last Write Wins

```typescript
// Configure resolver to use last write wins
const resolver = createConflictResolver({
  defaultStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
});

const result = await resolver.resolveConflict(conflict);

console.log('Resolved data:', result.resolvedData);
// Returns most recent server data
```

### First Write Wins

```typescript
// Configure resolver to use first write wins
const resolver = createConflictResolver({
  defaultStrategy: ConflictResolutionStrategy.FIRST_WRITE_WINS,
});

const result = await resolver.resolveConflict(conflict);

console.log('Resolved data:', result.resolvedData);
// Returns original client data
```

### Merge Strategy

```typescript
// Configure resolver to use merge strategy
const resolver = createConflictResolver({
  defaultStrategy: ConflictResolutionStrategy.MERGE,
});

const result = await resolver.resolveConflict(conflict);

console.log('Resolved data:', result.resolvedData);
// Intelligently merges local and remote data
```

### Custom Conflict Resolver

```typescript
// Register custom conflict resolver
resolver.registerStrategy('customMerge', (local, remote, conflict) => {
  // Custom merge logic
  const resolved = {
    ...remote,
    // Add local values that are more recent
    lastModified: Math.max(local.lastModified, remote.lastModified),
    // Merge arrays
    tags: [...new Set([...local.tags, ...remote.tags])],
  };

  return resolved;
});

// Use custom strategy
const result = await resolver.resolveConflict(conflict, {
  strategyName: 'customMerge',
});

console.log('Resolved with custom strategy:', result.resolvedData);
```

## Manual Conflict Resolution

### Manual Resolution

```typescript
// Resolve conflict manually with custom data
const result = await resolver.resolveManually(
  'conflict-123',
  {
    title: 'Updated Matter',
    description: 'Client matter description',
    clientName: 'Updated Client Name',
  },
  ConflictResolutionStrategy.MANUAL
);

if (result.success) {
  console.log('Manually resolved:', result.resolvedData);
}
```

## Rollback Management

### Rollback Single Update

```typescript
// Rollback a specific update
await resolver.rollback('update-123');

console.log('Update rolled back');
```

### Rollback All Updates

```typescript
// Rollback all pending updates
const count = await resolver.rollbackAll();

console.log('Rolled back', count, 'updates');
```

### Rollback by Tag

```typescript
// Rollback updates with specific tag
const count = await resolver.rollbackByTag('batch-123');

console.log('Rolled back', count, 'batched updates');
```

### Custom Rollback

```typescript
// Use custom rollback function
await resolver.rollback('update-123', {
  customRollback: async (update) => {
    // Custom rollback logic
    await restoreOriginalUI(update.originalData);
    await showRollbackNotification(update);
  },
});

console.log('Custom rollback completed');
```

## Conflict History

### Get All Conflicts

```typescript
// Get all conflicts in history
const conflicts = resolver.getAllConflicts();

console.log('Total conflicts:', conflicts.length);
conflicts.forEach(conflict => {
  console.log('  Type:', conflict.type);
  console.log('  Status:', conflict.status);
  console.log('  Detected at:', new Date(conflict.detectedAt).toLocaleString());
});
```

### Get Conflicts by Type

```typescript
// Get conflicts by type
const versionConflicts = resolver.getConflictsByType(ConflictType.VERSION_CONFLICT);
const dataConflicts = resolver.getConflictsByType(ConflictType.DATA_CONFLICT);

console.log('Version conflicts:', versionConflicts.length);
console.log('Data conflicts:', dataConflicts.length);
```

### Get Specific Conflict

```typescript
// Get specific conflict by ID
const conflict = resolver.getConflict('conflict-123');

if (conflict) {
  console.log('Conflict:', conflict.type);
  console.log('Fields:', conflict.conflictingFields);
  console.log('Strategy:', conflict.resolutionStrategy);
  console.log('Resolved:', conflict.resolvedAt ? new Date(conflict.resolvedAt).toLocaleString() : 'Pending');
}
```

### Generate Conflict Report

```typescript
// Generate detailed conflict report
const report = resolver.generateReport('conflict-123');

if (report) {
  console.log('Conflict Summary:', report.summary);
  console.log('Conflicting Fields:', report.details.conflictingFields);
  console.log('Local Timestamp:', new Date(report.details.localTimestamp).toLocaleString());
  console.log('Remote Timestamp:', report.details.remoteTimestamp ? new Date(report.details.remoteTimestamp).toLocaleString() : 'N/A');
  console.log('Resolution:', report.details.resolvedAt ? new Date(report.details.resolvedAt).toLocaleString() : 'Pending');
  console.log('Auto-Resolved:', report.details.autoResolved);
}
```

### Conflict Statistics

```typescript
// Get conflict statistics
const stats = resolver.getStats();

console.log('Conflict Statistics:');
console.log(`Total conflicts: ${stats.totalConflicts}`);
console.log(`Auto-resolved: ${stats.autoResolved}`);
console.log(`Manually resolved: ${stats.manuallyResolved}`);
console.log(`Unresolved: ${stats.unresolved}`);
console.log(`Resolution rate: ${stats.resolutionRate.toFixed(2)}%`);
console.log('By type:', stats.byType);
console.log(`By strategy:`, stats.byStrategy);
console.log(`Last updated: ${new Date(stats.lastUpdated).toLocaleString()}`);
```

## Version Conflicts

### Detecting Version Conflicts

```typescript
// Documents with version field
interface VersionedDocument {
  id: string;
  data: any;
  version: number;
}

const localVersion = (localData as VersionedDocument).version;
const remoteVersion = (remoteData as VersionedDocument).version;

if (remoteVersion > localVersion) {
  console.log('Version conflict detected');
  console.log('Local version:', localVersion);
  console.log('Remote version:', remoteVersion);
}
```

### Handling Version Conflicts

```typescript
// Conflict detected for version mismatch
if (conflict.type === ConflictType.VERSION_CONFLICT) {
  // Determine strategy based on business rules
  if (localVersion < remoteVersion) {
    // Server has newer version - use server data
    await resolver.resolveConflict(conflict, {
      strategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
    });
  } else {
    // Local has newer version - force local data
    await resolver.resolveConflict(conflict, {
      strategy: ConflictResolutionStrategy.FIRST_WRITE_WINS,
    });
  }
}
```

## Data Conflicts

### Detecting Data Conflicts

```typescript
// Conflict detected for data mismatch
if (conflict.type === ConflictType.DATA_CONFLICT) {
  console.log('Data conflict in fields:', conflict.conflictingFields);

  // Merge strategy handles this intelligently
  await resolver.resolveConflict(conflict, {
    strategy: ConflictResolutionStrategy.MERGE,
  });
}
```

### Handling Data Conflicts

```typescript
// Merge strategy for data conflicts
resolver.registerStrategy('smartMerge', (local, remote, conflict) => {
  const resolved = {};

  for (const field of Object.keys(local.data)) {
    if (conflict.conflictingFields.includes(field)) {
      // Field-level merge logic
      const localValue = local.data[field];
      const remoteValue = remote.data[field];

      if (typeof localValue === 'string' && typeof remoteValue === 'string') {
        // String concatenation
        resolved[field] = `${localValue} ${remoteValue}`;
      } else if (typeof localValue === 'number' && typeof remoteValue === 'number') {
        // Average numbers
        resolved[field] = (localValue + remoteValue) / 2;
      } else {
        // Use remote value for non-mergeable types
        resolved[field] = remoteValue;
      }
    } else {
      resolved[field] = localValue;
    }
  }

  return resolved;
});

await resolver.resolveConflict(conflict, {
  strategyName: 'smartMerge',
});
```

## Validation Conflicts

### Detecting Validation Conflicts

```typescript
// Documents with validation
interface ValidatedDocument {
  data: {
    email: string;
    phone: string;
    // Other fields...
  };
}

const localData = localDocument.data;
const remoteData = remoteDocument.data;

// Email validation conflict
if (localData.email !== remoteData.email && localData.email) {
  console.log('Email conflict: local vs remote');
}

// Phone validation conflict
if (localData.phone !== remoteData.phone) {
  console.log('Phone conflict: local vs remote');
}
```

### Handling Validation Conflicts

```typescript
// Register validation conflict resolver
resolver.registerStrategy('validationMerge', (local, remote, conflict) => {
  const resolved = { ...remote };

  // For validation conflicts, usually keep server data
  // But preserve client-only fields if needed
  if (local.data.clientOnlyField) {
    resolved.clientOnlyField = local.data.clientOnlyField;
  }

  return resolved;
});
```

## React Integration

### Conflict Resolution Modal

```typescript
import { useState, useCallback } from 'react';

function ConflictResolutionModal({ 
  resolver,
  conflictId 
}: { 
  resolver: ConflictResolver;
  conflictId: string;
}) {
  const [show, setShow] = useState(false);
  const [strategy, setStrategy] = useState<ConflictResolutionStrategy>(ConflictResolutionStrategy.MANUAL);
  const [customData, setCustomData] = useState<any>(null);

  const conflict = resolver.getConflict(conflictId);

  const handleResolve = useCallback(async (resolutionStrategy: ConflictResolutionStrategy, data?: any) => {
    const result = await resolver.resolveManually(conflictId, data, resolutionStrategy);

    if (result.success) {
      setShow(false);
      setCustomData(null);
    }
  }, [resolver, conflictId]);

  const handleCancel = useCallback(() => {
    setShow(false);
    setCustomData(null);
  }, []);

  if (!conflict || conflict.autoResolved) {
    return null;
  }

  return (
    <>
      {conflict.relatedUpdateId && (
        <div className="conflict-indicator">
          ⚠️ Conflict pending update: {conflict.relatedUpdateId}
        </div>
      )}

      {show && (
        <Modal isOpen={show} onClose={handleCancel}>
          <h2>Resolve Conflict</h2>
          <p>Document: {conflict.documentId}</p>
          <p>Type: {conflict.type}</p>
          <p>Fields: {conflict.conflictingFields.join(', ')}</p>

          <div className="resolution-strategies">
            <button onClick={() => setStrategy(ConflictResolutionStrategy.LAST_WRITE_WINS)}>
              Last Write Wins
            </button>
            <button onClick={() => setStrategy(ConflictResolutionStrategy.FIRST_WRITE_WINS)}>
              First Write Wins
            </button>
            <button onClick={() => setStrategy(ConflictResolutionStrategy.MERGE)}>
              Merge
            </button>
          </div>

          {strategy === ConflictResolutionStrategy.MANUAL && (
            <ManualResolutionForm
              local={conflict.local}
              remote={conflict.remote}
              onResolve={(data) => handleResolve(strategy, data)}
            />
          )}

          <div className="actions">
            <button onClick={() => handleResolve(strategy)}>
              Resolve
            </button>
            <button onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ManualResolutionForm({ 
  local, 
  remote, 
  onResolve 
}: { 
  local: Record<string, unknown>;
  remote: Record<string, unknown>;
  onResolve: (data: any) => void;
}) {
  const [resolvedData, setResolvedData] = useState<any>({ ...remote });

  const handleFieldChange = useCallback((field: string, value: any) => {
    setResolvedData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="manual-resolution-form">
      <h3>Manual Resolution</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Local</th>
            <th>Remote</th>
            <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(local.data).map(field => (
            <tr key={field}>
              <td>{field}</td>
              <td>{String(local.data[field])}</td>
              <td>{String(remote.data[field])}</td>
              <td>
                <input
                  type="text"
                  value={String(resolvedData[field])}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => onResolve(resolvedData)}>
        Apply Resolution
      </button>
    </div>
  );
}
```

### Conflict Status Component

```typescript
function ConflictStatus({ resolver }: { resolver: ConflictResolver }) {
  const [stats, setStats] = useState(resolver.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(resolver.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [resolver]);

  return (
    <div className="conflict-status">
      <h3>Conflict Statistics</h3>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalConflicts}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.autoResolved}</div>
          <div className="stat-label">Auto-Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.manuallyResolved}</div>
          <div className="stat-label">Manually</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.unresolved}</div>
          <div className="stat-label">Unresolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.resolutionRate.toFixed(1)}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
      </div>
      <div className="by-type">
        <h4>By Type</h4>
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="type-stat">
            <span>{type}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
      <div className="by-strategy">
        <h4>By Strategy</h4>
        {Object.entries(stats.byStrategy).map(([strategy, count]) => (
          <div key={strategy} className="strategy-stat">
            <span>{strategy}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Configuration Options

```typescript
interface ConflictResolverConfig {
  // Strategy Selection
  defaultStrategy?: ConflictResolutionStrategy;
  strategySelection?: 'auto' | 'manual';
  
  // Behavior
  autoResolve?: boolean;              // Default: true
  conflictTimeout?: number;          // Default: 300000 (5 minutes)
  
  // History
  maxHistorySize?: number;           // Default: 100
  emitEvents?: boolean;              // Default: true
  debug?: boolean;                     // Default: false
  
  // Custom Strategies
  customStrategies?: Map<string, ResolutionStrategy>;
}
```

## Best Practices

1. **Version Your Documents**: Use version fields to detect conflicts
2. **Use Appropriate Strategy**: Choose strategy based on business logic
3. **Provide UI Feedback**: Show conflicts to users for manual resolution
4. **Track Statistics**: Monitor conflict rates and resolution patterns
5. **Implement Custom Resolvers**: Handle complex merge logic with custom strategies
6. **Use Conflicts Grouping**: Use tags for related updates
7. **Handle Delete Conflicts**: Special handling for documents deleted during editing
8. **Test Rollback Logic**: Thoroughly test rollback functionality
9. **Monitor Resolution Time**: Track and optimize resolution performance
10. **Provide Context**: Include useful information in conflict reports

## License

MIT
