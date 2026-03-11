/**
 * Event Emitter Example Usage
 *
 * Demonstrates common use cases for the RealtimeEventEmitter class
 */

import {
  RealtimeEventEmitter,
  createEventEmitter,
  EventType,
  type RealtimeEvent,
} from './eventEmitter';

// ============================================
// Example 1: Basic Event Emission
// ============================================

function basicEventEmissionExample() {
  const emitter = createEventEmitter({ debug: true });

  // Emit a simple event
  emitter.emit(EventType.MATTER_CREATED, {
    matterId: 'matter-123',
    clientName: 'John Doe',
    status: 'Active',
  });

  // Emit with options
  emitter.emit(
    EventType.TRANSACTION_UPDATED,
    { transactionId: 'txn-456', status: 'assigned' },
    {
      source: 'firestore',
      correlationId: 'batch-789',
      metadata: { userId: 'user-abc' },
    }
  );

  emitter.destroy();
}

// ============================================
// Example 2: Event Subscription
// ============================================

function eventSubscriptionExample() {
  const emitter = createEventEmitter();

  // Subscribe to specific event
  const unsubscribe = emitter.on(EventType.MATTER_CREATED, (event) => {
    console.log('New matter created:', event.payload);
  });

  // Subscribe with wildcard
  const unsubscribeWildcard = emitter.on('matter:*', (event) => {
    console.log('Matter event:', event.type);
  });

  // Subscribe to all events
  const unsubscribeAll = emitter.onAny((event) => {
    console.log('Event occurred:', event.type);
  });

  // Unsubscribe later
  // unsubscribe();
  // unsubscribeWildcard();
  // unsubscribeAll();

  emitter.destroy();
}

// ============================================
// Example 3: One-Time Subscriptions
// ============================================

function oneTimeSubscriptionExample() {
  const emitter = createEventEmitter();

  // Subscribe once - handler fires only once
  emitter.once(EventType.ALLOCATION_COMPLETED, (event) => {
    console.log('Allocation completed:', event.payload);
    // This will only be called once, then automatically unsubscribed
  });

  // Emit twice, but handler only fires once
  emitter.emit(EventType.ALLOCATION_COMPLETED, { id: 1 });
  emitter.emit(EventType.ALLOCATION_COMPLETED, { id: 2 });

  emitter.destroy();
}

// ============================================
// Example 4: Event History
// ============================================

function eventHistoryExample() {
  const emitter = createEventEmitter({ maxHistorySize: 1000 });

  // Emit some events
  for (let i = 0; i < 5; i++) {
    emitter.emit(EventType.TRANSACTION_CREATED, { id: i, amount: i * 100 });
  }

  // Get all history
  const allHistory = emitter.getHistory();
  console.log('Total events:', allHistory.length);

  // Get filtered history
  const filtered = emitter.getHistory(
    (event) => {
      const payload = event.payload as { amount: number };
      return payload.amount > 200;
    }
  );
  console.log('Events with amount > 200:', filtered.length);

  // Get history by type
  const matterEvents = emitter.getHistoryByType('matter:*');
  console.log('Matter events:', matterEvents.length);

  // Get history by time range
  const oneHourAgo = Date.now() - 3600000;
  const recent = emitter.getHistoryByTime(oneHourAgo, Date.now());
  console.log('Recent events:', recent.length);

  // Replay events
  const handler = emitter.on(EventType.TRANSACTION_CREATED, (event) => {
    console.log('Transaction:', event.payload);
  });

  const replayed = emitter.replayHistory((e) => e.type === EventType.TRANSACTION_CREATED);
  console.log('Replayed events:', replayed);

  // Clear history
  emitter.clearHistory();

  emitter.destroy();
}

// ============================================
// Example 5: Debounce and Throttle
// ============================================

function debounceThrottleExample() {
  const emitter = createEventEmitter();

  // Debounce rapid events
  const debouncedHandler = emitter.debounce(
    (event: RealtimeEvent) => {
      console.log('Debounced handler:', event.payload);
    },
    { delay: 1000, immediate: false }
  );

  emitter.on(EventType.INTEREST_CALCULATED, debouncedHandler);

  // Emit multiple times rapidly - handler only called once after delay
  for (let i = 0; i < 10; i++) {
    emitter.emit(EventType.INTEREST_CALCULATED, { id: i });
  }

  // Throttle to at most once per second
  const throttledHandler = emitter.throttle(
    (event: RealtimeEvent) => {
      console.log('Throttled handler:', event.payload);
    },
    { delay: 1000, immediate: true, trailing: true }
  );

  emitter.on(EventType.INTEREST_ACCRUED, throttledHandler);

  // Emit multiple times - handler called immediately, then throttled
  for (let i = 0; i < 10; i++) {
    emitter.emit(EventType.INTEREST_ACCRUED, { id: i });
  }

  emitter.destroy();
}

// ============================================
// Example 6: Event Filtering
// ============================================

function eventFilteringExample() {
  const emitter = createEventEmitter();

  // Filter in subscription
  emitter.on(
    EventType.TRANSACTION_CREATED,
    (event) => {
      console.log('Large transaction:', event.payload);
    },
    {
      filter: (event) => {
        const payload = event.payload as { amount: number };
        return payload.amount > 1000;
      },
    }
  );

  // Using filter utility
  const largeTransactionHandler = emitter.filter(
    (event: RealtimeEvent) => {
      console.log('Another large transaction:', event.payload);
    },
    (event) => {
      const payload = event.payload as { amount: number };
      return payload.amount > 1000;
    }
  );

  emitter.on(EventType.TRANSACTION_CREATED, largeTransactionHandler);

  // Emit transactions
  emitter.emit(EventType.TRANSACTION_CREATED, { id: 1, amount: 500 });
  emitter.emit(EventType.TRANSACTION_CREATED, { id: 2, amount: 1500 });
  emitter.emit(EventType.TRANSACTION_CREATED, { id: 3, amount: 2000 });

  emitter.destroy();
}

// ============================================
// Example 7: Middleware
// ============================================

function middlewareExample() {
  const emitter = createEventEmitter();

  // Add logging middleware
  emitter.use((event, next) => {
    console.log(`[Middleware] ${event.type}:`, event.payload);
    next(event);
  });

  // Add transformation middleware
  emitter.use((event, next) => {
    event.metadata = {
      ...event.metadata,
      processedAt: Date.now(),
      userId: 'current-user',
      environment: 'production',
    };
    next(event);
  });

  // Add blocking middleware
  emitter.use((event, next) => {
    if (event.type === EventType.DEBUG_LOG && process.env.NODE_ENV === 'production') {
      console.log('Blocking debug event in production');
      return; // Don't call next, event is blocked
    }
    next(event);
  });

  // Add validation middleware
  emitter.use((event, next) => {
    if (!event.payload) {
      console.warn('Event has no payload:', event.type);
      return;
    }
    next(event);
  });

  // Emit events
  emitter.emit(EventType.MATTER_CREATED, { id: 1 });
  emitter.emit(EventType.DEBUG_LOG, { message: 'Debug info' });

  emitter.destroy();
}

// ============================================
// Example 8: Event Correlation
// ============================================

function eventCorrelationExample() {
  const emitter = createEventEmitter();

  // Start an operation with correlation ID
  const correlationId = emitter.emit(
    EventType.ALLOCATION_STARTED,
    { autodraftId: 'auto-123' },
    { metadata: { operation: 'interest-allocation' } }
  );

  // Emit related events with same correlation ID
  emitter.emit(
    EventType.ALLOCATION_EXECUTED,
    { allocationId: 'alloc-456', results: {} },
    { correlationId }
  );

  emitter.emit(
    EventType.ALLOCATION_COMPLETED,
    { allocationId: 'alloc-456' },
    { correlationId }
  );

  // Query related events
  const relatedEvents = emitter.getHistory(
    (event) => event.correlationId === correlationId
  );

  console.log('Related events:', relatedEvents.length);
  console.log('Operation flow:', relatedEvents.map((e) => e.event.type));

  emitter.destroy();
}

// ============================================
// Example 9: Statistics
// ============================================

function statisticsExample() {
  const emitter = createEventEmitter();

  // Emit various events
  emitter.emit(EventType.MATTER_CREATED, {});
  emitter.emit(EventType.TRANSACTION_CREATED, {});
  emitter.emit(EventType.MATTER_CREATED, {});
  emitter.emit(EventType.ALLOCATION_EXECUTED, {});

  // Get statistics
  const stats = emitter.getStatistics();
  console.log('Total events emitted:', stats.totalEmitted);
  console.log('Total events processed:', stats.totalProcessed);
  console.log('Events by type:', stats.eventsByType);
  console.log('Events by source:', stats.eventsBySource);

  // Reset statistics
  emitter.resetStatistics();

  emitter.destroy();
}

// ============================================
// Example 10: Firestore Integration
// ============================================

function firestoreIntegrationExample() {
  const emitter = createEventEmitter();

  // Emit Firestore events
  emitter.emitFirestoreEvent(
    'matters',
    'matter-123',
    'added',
    { clientName: 'John Doe', status: 'Active' }
  );

  // Subscribe to Firestore events
  emitter.on(EventType.DOCUMENT_CREATED, (event) => {
    console.log('Document created:', event.payload);
  });

  // Wrap Firestore callback
  const originalCallback = (doc: any) => {
    console.log('Firestore callback:', doc);
  };

  const wrappedCallback = emitter.wrapFirestoreCallback(originalCallback, 'matters');

  // Use wrapped callback with Firestore subscription
  // subscribeToDocument('matters', 'matter-123', wrappedCallback);

  emitter.destroy();
}

// ============================================
// Example 11: Cross-Component Communication
// ============================================

// Component A - emits events
function ComponentA(emitter: RealtimeEventEmitter) {
  function createMatter() {
    emitter.emit(EventType.MATTER_CREATED, {
      matterId: 'matter-123',
      clientName: 'John Doe',
    });
  }

  return { createMatter };
}

// Component B - listens to events
function ComponentB(emitter: RealtimeEventEmitter) {
  const matters: any[] = [];

  emitter.on(EventType.MATTER_CREATED, (event) => {
    matters.push(event.payload);
    console.log('New matter received:', event.payload);
  });

  return { matters };
}

function crossComponentCommunicationExample() {
  const emitter = createEventEmitter();

  const componentA = ComponentA(emitter);
  const componentB = ComponentB(emitter);

  // Component A emits event
  componentA.createMatter();

  // Component B automatically receives it
  console.log('Component B matters:', componentB.matters);

  emitter.destroy();
}

// ============================================
// Example 12: Error Handling
// ============================================

function errorHandlingExample() {
  const emitter = createEventEmitter();

  // Subscribe to error events
  emitter.on(EventType.SYSTEM_ERROR, (event) => {
    console.error('System error:', event.payload);
    // Show error to user
    alert(`Error: ${(event.payload as any).message}`);
  });

  emitter.on(EventType.FIRESTORE_SUBSCRIPTION_ERROR, (event) => {
    console.error('Firestore error:', event.payload);
    // Attempt to reconnect
    // retrySubscription();
  });

  emitter.on(EventType.CONNECTION_ERROR, (event) => {
    console.error('Connection error:', event.payload);
    // Show connection status
    // showConnectionError();
  });

  // Simulate an error
  emitter.emit(EventType.SYSTEM_ERROR, {
    message: 'Something went wrong',
    code: 'INTERNAL_ERROR',
  });

  emitter.destroy();
}

// ============================================
// Example 13: React Hook
// ============================================

/*
// Custom React hook for using event emitter
import { useEffect, useRef } from 'react';

function useEventEmitter<T>(
  emitter: RealtimeEventEmitter,
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
  }, [emitter, eventType, ...deps]);
}

// Usage in component
function MatterList({ emitter }: { emitter: RealtimeEventEmitter }) {
  const [matters, setMatters] = useState<any[]>([]);

  useEventEmitter(emitter, EventType.MATTER_CREATED, (event) => {
    setMatters((prev) => [...prev, event.payload]);
  });

  useEventEmitter(emitter, EventType.MATTER_UPDATED, (event) => {
    setMatters((prev) =>
      prev.map((m) => (m.id === event.payload.id ? event.payload : m))
    );
  });

  return (
    <div>
      {matters.map((matter) => (
        <div key={matter.id}>{matter.clientName}</div>
      ))}
    </div>
  );
}
*/

// ============================================
// Example 14: Event Sourcing Pattern
// ============================================

function eventSourcingExample() {
  const emitter = createEventEmitter();

  // Define event handlers to build state
  const handlers = {
    [EventType.MATTER_CREATED]: (state: any, event: RealtimeEvent) => {
      return {
        ...state,
        matters: [...state.matters, event.payload],
      };
    },
    [EventType.MATTER_UPDATED]: (state: any, event: RealtimeEvent) => {
      return {
        ...state,
        matters: state.matters.map((m: any) =>
          m.id === (event.payload as any).id ? event.payload : m
        ),
      };
    },
    [EventType.MATTER_DELETED]: (state: any, event: RealtimeEvent) => {
      return {
        ...state,
        matters: state.matters.filter(
          (m: any) => m.id !== (event.payload as any).id
        ),
      };
    },
  };

  // Emit events
  emitter.emit(EventType.MATTER_CREATED, { id: 1, clientName: 'John' });
  emitter.emit(EventType.MATTER_CREATED, { id: 2, clientName: 'Jane' });
  emitter.emit(EventType.MATTER_UPDATED, { id: 1, status: 'Closed' });

  // Rebuild state from event history
  const history = emitter.getHistory();
  const initialState = { matters: [] };

  const finalState = history.reduce((state, entry) => {
    const handler = (handlers as any)[entry.event.type];
    return handler ? handler(state, entry.event) : state;
  }, initialState);

  console.log('Final state:', finalState);
  console.log('Matters:', finalState.matters);

  emitter.destroy();
}

// ============================================
// Example 15: Batch Processing
// ============================================

function batchProcessingExample() {
  const emitter = createEventEmitter();

  // Collect events in a batch
  const batch: Array<{ type: string; payload: any }> = [];

  // Process batch every second
  const debouncedProcessor = emitter.debounce(
    () => {
      console.log('Processing batch:', batch.length, 'events');
      // Process batch
      batch.length = 0;
    },
    { delay: 1000 }
  );

  // Add debounced listener that adds to batch
  emitter.on('transaction:*', (event) => {
    batch.push({ type: event.type, payload: event.payload });
    debouncedProcessor(event);
  });

  // Emit multiple events rapidly
  for (let i = 0; i < 100; i++) {
    emitter.emit(EventType.TRANSACTION_CREATED, { id: i });
  }

  emitter.destroy();
}

// Export examples
export {
  basicEventEmissionExample,
  eventSubscriptionExample,
  oneTimeSubscriptionExample,
  eventHistoryExample,
  debounceThrottleExample,
  eventFilteringExample,
  middlewareExample,
  eventCorrelationExample,
  statisticsExample,
  firestoreIntegrationExample,
  crossComponentCommunicationExample,
  errorHandlingExample,
  eventSourcingExample,
  batchProcessingExample,
};
