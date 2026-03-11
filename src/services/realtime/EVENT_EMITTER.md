# Event Emitter Service

The Event Emitter provides a centralized, type-safe event system for real-time application events with subscription management, history tracking, filtering, and middleware support.

## Features

- **Event Publishing**: Emit single events or batches with metadata
- **Flexible Subscription**: Subscribe to specific types, wildcards, or all events
- **One-Time Subscriptions**: Subscribe to events that fire only once
- **Event History**: Track events with configurable limits for debugging and replay
- **Event Filtering**: Filter events by type, time, or custom predicates
- **Debounce & Throttle**: Built-in utilities for rate-limiting handlers
- **Middleware Support**: Transform or intercept events before processing
- **WebSocket Integration**: Connect to WebSocket Manager for remote events
- **Firebase Integration**: Wrap Firestore onSnapshot callbacks
- **Statistics**: Track event metrics and subscription counts

## Basic Usage

### Creating an Event Emitter

```typescript
import { RealtimeEventEmitter, createEventEmitter } from '@/services/realtime';

// Using factory function
const emitter = createEventEmitter({
  maxHistorySize: 1000,
  trackHistory: true,
  debug: true,
});

// Or using class directly
const emitter = new RealtimeEventEmitter({
  maxHistorySize: 500,
  debug: false,
});
```

### Emitting Events

```typescript
import { EventType } from '@/services/realtime';

// Emit a simple event
const eventId = emitter.emit(
  EventType.MATTER_CREATED,
  { matterId: '123', clientName: 'John Doe' }
);

// Emit with options
const eventId = emitter.emit(
  EventType.TRANSACTION_UPDATED,
  { transactionId: '456', status: 'assigned' },
  {
    source: 'firestore',
    correlationId: 'batch-123',
    metadata: { userId: 'user-789' }
  }
);

// Emit a batch of events
const eventIds = emitter.emitBatch([
  { type: EventType.TRANSACTION_CREATED, payload: { id: '1' } },
  { type: EventType.TRANSACTION_CREATED, payload: { id: '2' } },
  { type: EventType.TRANSACTION_CREATED, payload: { id: '3' } },
]);
```

### Subscribing to Events

```typescript
// Subscribe to specific event type
const unsubscribe = emitter.on(EventType.MATTER_CREATED, (event) => {
  console.log('New matter:', event.payload);
});

// Subscribe with wildcard
const unsubscribe = emitter.on('matter:*', (event) => {
  console.log('Matter event:', event.type);
});

// Subscribe to all events
const unsubscribe = emitter.onAny((event) => {
  console.log('All events:', event.type, event.payload);
});

// Unsubscribe
unsubscribe();
```

### One-Time Subscriptions

```typescript
// Subscribe once - handler fires only once
emitter.once(EventType.ALLOCATION_COMPLETED, (event) => {
  console.log('Allocation completed:', event.payload);
});

// Unsubscribe after first event automatically
```

### Unsubscribing

```typescript
// Unsubscribe specific subscription
const unsubscribe = emitter.on(EventType.MATTER_UPDATED, handler);
unsubscribe();

// Unsubscribe all handlers for an event type
emitter.offAll('matter:*');

// Remove all subscriptions
emitter.removeAll();
```

## Event History

### Getting History

```typescript
// Get all history
const history = emitter.getHistory();

// Get filtered history
const filteredHistory = emitter.getHistory(
  event => event.type === EventType.MATTER_CREATED,
  100 // limit
);

// Get history by type
const matterHistory = emitter.getHistoryByType(
  EventType.MATTER_CREATED,
  50
);

// Get history by time range
const recentHistory = emitter.getHistoryByTime(
  Date.now() - 3600000, // 1 hour ago
  Date.now()
);

// Clear history
emitter.clearHistory();
```

### Replay Events

```typescript
// Replay all history
const count = emitter.replayHistory();

// Replay filtered events
const count = emitter.replayHistory(
  event => event.type === EventType.MATTER_CREATED,
  10 // limit
);

console.log(`Replayed ${count} events`);
```

## Event Filtering

### Debounce Handlers

```typescript
// Debounce rapid events
const debouncedHandler = emitter.debounce(
  (event) => {
    console.log('Debounced:', event.payload);
  },
  { delay: 1000, immediate: false }
);

emitter.on(EventType.TRANSACTION_UPDATED, debouncedHandler);
```

### Throttle Handlers

```typescript
// Throttle to at most once per second
const throttledHandler = emitter.throttle(
  (event) => {
    console.log('Throttled:', event.payload);
  },
  { delay: 1000, immediate: true, trailing: true }
);

emitter.on(EventType.INTEREST_CALCULATED, throttledHandler);
```

### Custom Filters

```typescript
// Create filtered handler
const filteredHandler = emitter.filter(
  (event) => {
    const payload = event.payload as { amount: number };
    return payload.amount > 1000;
  },
  handler
);

// Or use filter in subscription
emitter.on(
  EventType.TRANSACTION_CREATED,
  (event) => {
    console.log('Large transaction:', event.payload);
  },
  {
    filter: (event) => {
      const payload = event.payload as { amount: number };
      return payload.amount > 1000;
    }
  }
);
```

## Middleware

### Adding Middleware

```typescript
// Add logging middleware
emitter.use((event, next) => {
  console.log(`[Middleware] ${event.type}:`, event.payload);
  next(event); // Continue processing
});

// Add transformation middleware
emitter.use((event, next) => {
  // Add timestamp to all events
  event.metadata = {
    ...event.metadata,
    processedAt: Date.now(),
    userId: 'current-user',
  };
  next(event);
});

// Add blocking middleware
emitter.use((event, next) => {
  if (event.type === EventType.DEBUG_LOG && !isDebugMode) {
    return; // Don't process debug events in production
  }
  next(event);
});

// Clear all middleware
emitter.clearMiddleware();
```

## WebSocket Integration

### Connecting to WebSocket Manager

```typescript
import { WebSocketManager } from '@/services/realtime';

// Create WebSocket manager
const wsManager = new WebSocketManager({
  url: 'wss://api.example.com/ws',
});

await wsManager.connect();

// Connect event emitter to WebSocket
emitter.connectWebSocket(wsManager);

// Now all WebSocket messages are emitted as events
emitter.on('chat:message', (event) => {
  console.log('Chat message from WebSocket:', event.payload);
});

// Disconnect
emitter.disconnectWebSocket();
```

## Firebase Integration

### Emitting Firestore Events

```typescript
// Emit Firestore document change
const eventId = emitter.emitFirestoreEvent(
  'matters',
  'matter-123',
  'added', // or 'modified', 'removed'
  { clientName: 'John Doe', status: 'Active' }
);

// Event is emitted with source: 'firestore'
```

### Wrapping Firestore Callbacks

```typescript
import { subscribeToDocument } from '@/services/firebase/firestore.service';

// Original callback
const handleDocumentUpdate = (doc) => {
  console.log('Document updated:', doc);
};

// Wrap with event emitter
const wrappedCallback = emitter.wrapFirestoreCallback(
  handleDocumentUpdate,
  'matters'
);

// Use wrapped callback with Firestore
subscribeToDocument('matters', 'matter-123', wrappedCallback);

// Events are automatically emitted for document changes
emitter.on(EventType.DOCUMENT_CREATED, (event) => {
  console.log('Document created:', event.payload);
});

emitter.on(EventType.DOCUMENT_UPDATED, (event) => {
  console.log('Document updated:', event.payload);
});
```

## Statistics

### Getting Statistics

```typescript
const stats = emitter.getStatistics();
console.log('Statistics:', stats);
// {
//   totalEmitted: 1250,
//   totalProcessed: 1200,
//   totalFiltered: 50,
//   activeSubscriptions: 15,
//   historySize: 450,
//   eventsByType: {
//     'matter:created': 100,
//     'transaction:updated': 200,
//     ...
//   },
//   eventsBySource: {
//     'local': 800,
//     'firestore': 400,
//     'websocket': 50
//   }
// }

// Reset statistics
emitter.resetStatistics();
```

## React Integration

### Custom Hook

```typescript
import { useEffect, useRef } from 'react';
import { RealtimeEventEmitter, EventType } from '@/services/realtime';

function useEventEmitter<T>(
  eventType: string,
  handler: (event: RealtimeEvent<T>) => void,
  deps: any[] = []
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = emitter.on(eventType, (event) => {
      handlerRef.current(event);
    });

    return unsubscribe;
  }, [eventType, ...deps]);
}

// Usage in component
function MatterList() {
  const [matters, setMatters] = useState([]);

  useEventEmitter(EventType.MATTER_CREATED, (event) => {
    setMatters(prev => [...prev, event.payload]);
  });

  useEventEmitter(EventType.MATTER_UPDATED, (event) => {
    setMatters(prev =>
      prev.map(m =>
        m.id === event.payload.id ? event.payload : m
      )
    );
  });

  return (
    <div>
      {matters.map(matter => (
        <div key={matter.id}>{matter.clientName}</div>
      ))}
    </div>
  );
}
```

### useEventEmitter Hook with Statistics

```typescript
function useEventEmitterStats() {
  const [stats, setStats] = useState(emitter.getStatistics());

  useEffect(() => {
    const unsubscribe = emitter.onAny((event) => {
      setStats(emitter.getStatistics());
    });

    return unsubscribe;
  }, []);

  return stats;
}
```

## Common Event Types

### Matter Events

```typescript
emitter.emit(EventType.MATTER_CREATED, { matterId, clientName });
emitter.emit(EventType.MATTER_UPDATED, { matterId, changes });
emitter.emit(EventType.MATTER_STATUS_CHANGED, { matterId, oldStatus, newStatus });
emitter.emit(EventType.MATTER_BALANCE_CHANGED, { matterId, oldBalance, newBalance });
emitter.emit(EventType.MATTER_CLOSED, { matterId, closedAt });
```

### Transaction Events

```typescript
emitter.emit(EventType.TRANSACTION_CREATED, { transactionId, amount, type });
emitter.emit(EventType.TRANSACTION_UPDATED, { transactionId, changes });
emitter.emit(EventType.TRANSACTION_STATUS_CHANGED, { transactionId, status });
emitter.emit(EventType.TRANSACTION_ASSIGNED, { transactionId, matterId });
emitter.emit(EventType.TRANSACTION_MATCHED, { transactionId, matchId });
```

### Allocation Events

```typescript
emitter.emit(EventType.ALLOCATION_STARTED, { autodraftId });
emitter.emit(EventType.ALLOCATION_EXECUTED, { allocationId, results });
emitter.emit(EventType.ALLOCATION_COMPLETED, { allocationId });
emitter.emit(EventType.ALLOCATION_FAILED, { allocationId, error });
```

### Interest Events

```typescript
emitter.emit(EventType.INTEREST_CALCULATED, { matterId, amount, rate });
emitter.emit(EventType.INTEREST_ACCRUED, { matterId, amount, date });
emitter.emit(EventType.INTEREST_RATE_CHANGED, { oldRate, newRate });
```

### Connection Events

```typescript
emitter.emit(EventType.CONNECTION_CONNECTED, { connectionId });
emitter.emit(EventType.CONNECTION_DISCONNECTED, { reason });
emitter.emit(EventType.CONNECTION_ERROR, { error });
```

## Advanced Patterns

### Event Correlation

```typescript
// Create correlated events
const correlationId = emitter.emit(
  EventType.ALLOCATION_STARTED,
  { autodraftId: 'auto-123' }
);

// Use correlation ID in related events
emitter.emit(
  EventType.ALLOCATION_EXECUTED,
  { allocationId: 'alloc-456' },
  { correlationId }
);

emitter.emit(
  EventType.ALLOCATION_COMPLETED,
  { allocationId: 'alloc-456' },
  { correlationId }
);

// Track related events
const relatedEvents = emitter.getHistory(
  event => event.correlationId === correlationId
);
```

### Event Sourcing

```typescript
// Store all events for replay/reconstruction
const allEvents = emitter.getHistory();

// Replay to rebuild state
function rebuildState() {
  const state = initialState;

  for (const entry of allEvents) {
    state = applyEvent(state, entry.event);
  }

  return state;
}
```

### Cross-Component Communication

```typescript
// Component A emits event
function ComponentA() {
  const handleClick = () => {
    emitter.emit(EventType.MATTER_CREATED, matterData);
  };

  return <button onClick={handleClick}>Create Matter</button>;
}

// Component B listens to event
function ComponentB() {
  useEventEmitter(EventType.MATTER_CREATED, (event) => {
    // Update UI
    console.log('New matter:', event.payload);
  });

  return <div>...</div>;
}
```

### Error Handling

```typescript
emitter.on(EventType.SYSTEM_ERROR, (event) => {
  console.error('System error:', event.payload);
  // Show error to user
  showErrorToast(event.payload.message);
});

emitter.on(EventType.FIRESTORE_SUBSCRIPTION_ERROR, (event) => {
  console.error('Firestore error:', event.payload);
  // Attempt to reconnect
  retrySubscription();
});
```

## Best Practices

1. **Use Type-Specific Events**: Subscribe to specific types when possible
2. **Clean Up Subscriptions**: Always unsubscribe in useEffect cleanup
3. **Limit History Size**: Set appropriate maxHistorySize for production
4. **Use Wildcards Sparingly**: Prefer specific types over wildcards
5. **Filter Early**: Use subscription filters instead of filtering in handlers
6. **Debounce Rapid Events**: Use debounce for high-frequency events
7. **Handle Errors**: Subscribe to error events for monitoring
8. **Use Correlation IDs**: Track related operations
9. **Monitor Statistics**: Check statistics for performance issues
10. **Test Event Flows**: Test event emission and handling

## Configuration Options

```typescript
interface EventEmitterConfig {
  maxHistorySize?: number;           // Default: 1000
  trackHistory?: boolean;             // Default: true
  debug?: boolean;                    // Default: false
  sourcePrefix?: string;              // Optional prefix for sources
  generateCorrelationId?: () => string; // Custom ID generator
}
```

## Event Structure

```typescript
interface RealtimeEvent<T = unknown> {
  id: string;                    // Unique event ID
  type: EventType | string;       // Event type
  payload: T;                    // Event data
  timestamp: number;              // Unix timestamp
  source: 'local' | 'remote' | 'firestore' | 'websocket';
  correlationId?: string;         // Related events ID
  metadata?: Record<string, unknown>;
  processed?: boolean;           // Whether processed
  version?: number;              // Schema version
}
```

## License

MIT
