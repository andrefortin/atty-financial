/**
 * Event Emitter Tests
 *
 * Unit tests for RealtimeEventEmitter class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RealtimeEventEmitter,
  createEventEmitter,
  EventType,
  type RealtimeEvent,
  type EventEmitterConfig,
  type EventMiddleware,
  type EventHandler,
} from '../eventEmitter';

// Mock WebSocket Manager
vi.mock('../webSocketManager', () => ({
  WebSocketManager: class MockWebSocketManager {
    subscribe() {
      return vi.fn();
    }
  },
}));

describe('RealtimeEventEmitter', () => {
  let emitter: RealtimeEventEmitter;

  beforeEach(() => {
    emitter = createEventEmitter({
      maxHistorySize: 100,
      trackHistory: true,
      debug: false,
    });
  });

  afterEach(() => {
    emitter.destroy();
  });

  describe('Event Publishing', () => {
    it('should emit an event', () => {
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      const eventId = emitter.emit(EventType.MATTER_CREATED, { id: '123' });

      expect(eventId).toBeDefined();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: eventId,
          type: EventType.MATTER_CREATED,
          payload: { id: '123' },
        })
      );
    });

    it('should emit a batch of events', () => {
      const handler = vi.fn();
      emitter.on(EventType.TRANSACTION_CREATED, handler);

      const eventIds = emitter.emitBatch([
        { type: EventType.TRANSACTION_CREATED, payload: { id: '1' } },
        { type: EventType.TRANSACTION_CREATED, payload: { id: '2' } },
        { type: EventType.TRANSACTION_CREATED, payload: { id: '3' } },
      ]);

      expect(eventIds).toHaveLength(3);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should assign unique IDs to events', () => {
      const id1 = emitter.emit(EventType.MATTER_CREATED, {});
      const id2 = emitter.emit(EventType.MATTER_CREATED, {});

      expect(id1).not.toBe(id2);
    });

    it('should include correlation ID', () => {
      const correlationId = 'test-corr-123';
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {}, { correlationId });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId,
        })
      );
    });

    it('should set source to local by default', () => {
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'local',
        })
      );
    });

    it('should allow custom source', () => {
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {}, { source: 'firestore' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'firestore',
        })
      );
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to specific event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on(EventType.MATTER_CREATED, handler1);
      emitter.on(EventType.TRANSACTION_CREATED, handler2);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {});
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      emitter.emit(EventType.MATTER_CREATED, {});
      expect(handler).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should support wildcard subscriptions', () => {
      const handler = vi.fn();
      emitter.on('matter:*', handler);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.MATTER_UPDATED, {});
      emitter.emit(EventType.MATTER_CLOSED, {});

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should subscribe to all events with onAny', () => {
      const handler = vi.fn();
      emitter.onAny(handler);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});
      emitter.emit(EventType.ALLOCATION_EXECUTED, {});

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should support one-time subscriptions with once', () => {
      const handler = vi.fn();
      emitter.once(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should remove all subscriptions for an event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      emitter.on(EventType.MATTER_CREATED, handler1);
      emitter.on(EventType.MATTER_CREATED, handler2);
      emitter.on(EventType.TRANSACTION_CREATED, handler3);

      emitter.offAll(EventType.MATTER_CREATED);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should remove all subscriptions', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on(EventType.MATTER_CREATED, handler1);
      emitter.on(EventType.TRANSACTION_CREATED, handler2);

      emitter.removeAll();

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Event History', () => {
    it('should track event history', () => {
      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      const history = emitter.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should limit history size', () => {
      const smallEmitter = createEventEmitter({ maxHistorySize: 3 });

      for (let i = 0; i < 10; i++) {
        smallEmitter.emit(EventType.MATTER_CREATED, { id: i });
      }

      const history = smallEmitter.getHistory();
      expect(history).toHaveLength(3);

      smallEmitter.destroy();
    });

    it('should filter history', () => {
      emitter.emit(EventType.MATTER_CREATED, { type: 'matter' });
      emitter.emit(EventType.TRANSACTION_CREATED, { type: 'transaction' });
      emitter.emit(EventType.MATTER_CREATED, { type: 'matter' });

      const filtered = emitter.getHistory(
        (event) => event.type === EventType.MATTER_CREATED
      );

      expect(filtered).toHaveLength(2);
    });

    it('should limit filtered history', () => {
      emitter.emit(EventType.MATTER_CREATED, { id: 1 });
      emitter.emit(EventType.MATTER_CREATED, { id: 2 });
      emitter.emit(EventType.MATTER_CREATED, { id: 3 });
      emitter.emit(EventType.MATTER_CREATED, { id: 4 });

      const limited = emitter.getHistory(undefined, 2);
      expect(limited).toHaveLength(2);
    });

    it('should get history by type', () => {
      emitter.emit(EventType.MATTER_CREATED, { id: 1 });
      emitter.emit(EventType.TRANSACTION_CREATED, { id: 2 });
      emitter.emit(EventType.MATTER_UPDATED, { id: 3 });

      const matterHistory = emitter.getHistoryByType('matter:*');
      expect(matterHistory).toHaveLength(2);
    });

    it('should get history by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;

      emitter.emit(EventType.MATTER_CREATED, { time: 'now' });

      const history = emitter.getHistoryByTime(oneHourAgo, now);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should clear history', () => {
      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      emitter.clearHistory();

      const history = emitter.getHistory();
      expect(history).toHaveLength(0);
    });

    it('should replay history', () => {
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, { id: 1 });
      emitter.emit(EventType.MATTER_CREATED, { id: 2 });

      const replayed = emitter.replayHistory();

      expect(replayed).toBe(2);
      expect(handler).toHaveBeenCalledTimes(4); // 2 original + 2 replayed
    });

    it('should replay filtered history', () => {
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, { id: 1 });
      emitter.emit(EventType.TRANSACTION_CREATED, { id: 2 });
      emitter.emit(EventType.MATTER_CREATED, { id: 3 });

      const replayed = emitter.replayHistory(
        (event) => event.type === EventType.MATTER_CREATED,
        1
      );

      expect(replayed).toBe(1);
      expect(handler).toHaveBeenCalledTimes(4); // 2 original + 1 replayed + 1 filtered
    });
  });

  describe('Event Filtering', () => {
    it('should debounce handler', () => {
      const handler = vi.fn();
      const debounced = emitter.debounce(handler, { delay: 100 });

      emitter.on(EventType.MATTER_CREATED, debounced);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.MATTER_CREATED, {});

      // Should only be called once after delay
      expect(handler).toHaveBeenCalledTimes(0);

      vi.advanceTimersByTime(150);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should execute immediately with debounce immediate option', () => {
      const handler = vi.fn();
      const debounced = emitter.debounce(handler, { delay: 100, immediate: true });

      emitter.on(EventType.MATTER_CREATED, debounced);

      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should throttle handler', () => {
      const handler = vi.fn();
      const throttled = emitter.throttle(handler, { delay: 100 });

      emitter.on(EventType.MATTER_CREATED, throttled);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);
      emitter.emit(EventType.MATTER_CREATED, {});
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should execute immediately with throttle immediate option', () => {
      const handler = vi.fn();
      const throttled = emitter.throttle(handler, { delay: 100, immediate: true });

      emitter.on(EventType.MATTER_CREATED, throttled);

      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should filter handler', () => {
      const handler = vi.fn();
      const filtered = emitter.filter(
        handler,
        (event) => {
          const payload = event.payload as { amount: number };
          return payload.amount > 100;
        }
      );

      emitter.on(EventType.TRANSACTION_CREATED, filtered);

      emitter.emit(EventType.TRANSACTION_CREATED, { amount: 50 });
      emitter.emit(EventType.TRANSACTION_CREATED, { amount: 150 });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should use subscription filter', () => {
      const handler = vi.fn();

      emitter.on(
        EventType.TRANSACTION_CREATED,
        handler,
        {
          filter: (event) => {
            const payload = event.payload as { amount: number };
            return payload.amount > 100;
          }
        }
      );

      emitter.emit(EventType.TRANSACTION_CREATED, { amount: 50 });
      emitter.emit(EventType.TRANSACTION_CREATED, { amount: 150 });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Middleware', () => {
    it('should apply middleware to events', () => {
      const middleware: EventMiddleware = (event, next) => {
        event.metadata = { ...event.metadata, modified: true };
        next(event);
      };

      emitter.use(middleware);

      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { modified: true },
        })
      );
    });

    it('should support multiple middleware', () => {
      const middleware1: EventMiddleware = (event, next) => {
        event.metadata = { ...event.metadata, m1: true };
        next(event);
      };

      const middleware2: EventMiddleware = (event, next) => {
        event.metadata = { ...event.metadata, m2: true };
        next(event);
      };

      emitter.use(middleware1);
      emitter.use(middleware2);

      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { m1: true, m2: true },
        })
      );
    });

    it('should block events in middleware', () => {
      const blockingMiddleware: EventMiddleware = (event, next) => {
        if (event.type === EventType.DEBUG_LOG) {
          return; // Don't call next
        }
        next(event);
      };

      emitter.use(blockingMiddleware);

      const handler = vi.fn();
      emitter.onAny(handler);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.DEBUG_LOG, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should remove middleware', () => {
      const middleware: EventMiddleware = (event, next) => {
        event.metadata = { ...event.metadata, modified: true };
        next(event);
      };

      emitter.use(middleware);
      emitter.removeMiddleware(middleware);

      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledWith(
        expect.not.objectContaining({
          metadata: { modified: true },
        })
      );
    });

    it('should clear all middleware', () => {
      emitter.use((event, next) => {
        event.metadata = { ...event.metadata, m1: true };
        next(event);
      });

      emitter.clearMiddleware();

      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledWith(
        expect.not.objectContaining({
          metadata: { m1: true },
        })
      );
    });
  });

  describe('Statistics', () => {
    it('should track statistics', () => {
      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});
      emitter.emit(EventType.MATTER_CREATED, {});

      const stats = emitter.getStatistics();

      expect(stats.totalEmitted).toBe(3);
      expect(stats.totalProcessed).toBeGreaterThan(0);
      expect(stats.eventsByType[EventType.MATTER_CREATED]).toBe(2);
      expect(stats.eventsByType[EventType.TRANSACTION_CREATED]).toBe(1);
    });

    it('should track filtered events', () => {
      const handler = vi.fn();

      emitter.on(
        EventType.MATTER_CREATED,
        handler,
        {
          filter: (event) => {
            const payload = event.payload as { id: number };
            return payload.id > 5;
          }
        }
      );

      emitter.emit(EventType.MATTER_CREATED, { id: 1 });
      emitter.emit(EventType.MATTER_CREATED, { id: 10 });

      const stats = emitter.getStatistics();
      expect(stats.totalFiltered).toBe(1);
    });

    it('should track active subscriptions', () => {
      emitter.on(EventType.MATTER_CREATED, vi.fn());
      emitter.on(EventType.TRANSACTION_CREATED, vi.fn());

      const stats = emitter.getStatistics();
      expect(stats.activeSubscriptions).toBe(2);
    });

    it('should track history size', () => {
      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      const stats = emitter.getStatistics();
      expect(stats.historySize).toBe(2);
    });

    it('should track events by source', () => {
      emitter.emit(EventType.MATTER_CREATED, {}, { source: 'local' });
      emitter.emit(EventType.MATTER_CREATED, {}, { source: 'firestore' });

      const stats = emitter.getStatistics();
      expect(stats.eventsBySource.local).toBe(1);
      expect(stats.eventsBySource.firestore).toBe(1);
    });

    it('should reset statistics', () => {
      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      emitter.resetStatistics();

      const stats = emitter.getStatistics();
      expect(stats.totalEmitted).toBe(0);
      expect(stats.totalProcessed).toBe(0);
    });
  });

  describe('Firestore Integration', () => {
    it('should emit Firestore events', () => {
      const handler = vi.fn();
      emitter.on(EventType.DOCUMENT_CREATED, handler);

      const eventId = emitter.emitFirestoreEvent(
        'matters',
        'matter-123',
        'added',
        { clientName: 'John Doe' }
      );

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'firestore',
          payload: {
            collection: 'matters',
            documentId: 'matter-123',
            changeType: 'added',
            data: { clientName: 'John Doe' },
          },
        })
      );
    });

    it('should wrap Firestore callbacks', () => {
      const originalCallback = vi.fn();
      const handler = vi.fn();

      const wrapped = emitter.wrapFirestoreCallback(
        originalCallback,
        'matters'
      );

      emitter.on(EventType.DOCUMENT_CREATED, handler);

      wrapped({ id: 'matter-123', data: { clientName: 'John Doe' } });

      expect(originalCallback).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Wildcard Pattern Matching', () => {
    it('should match single wildcard', () => {
      const handler = vi.fn();
      emitter.on('*', handler);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should match partial wildcards', () => {
      const handler = vi.fn();
      emitter.on('matter:*', handler);

      emitter.emit(EventType.MATTER_CREATED, {});
      emitter.emit(EventType.MATTER_UPDATED, {});
      emitter.emit(EventType.TRANSACTION_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should match multiple level wildcards', () => {
      const handler = vi.fn();
      emitter.on('matter:status:*', handler);

      emitter.emit(EventType.MATTER_STATUS_CHANGED, {});
      emitter.emit(EventType.MATTER_CREATED, {});

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Utility Methods', () => {
    it('should get subscriptions by event type', () => {
      emitter.on(EventType.MATTER_CREATED, vi.fn());
      emitter.on(EventType.MATTER_CREATED, vi.fn());
      emitter.on('matter:*', vi.fn());
      emitter.on(EventType.TRANSACTION_CREATED, vi.fn());

      const subs = emitter.getSubscriptions(EventType.MATTER_CREATED);
      expect(subs).toHaveLength(3); // 2 exact + 1 wildcard
    });

    it('should get all subscriptions', () => {
      emitter.on(EventType.MATTER_CREATED, vi.fn());
      emitter.on('matter:*', vi.fn());
      emitter.on('*', vi.fn());

      const all = emitter.getAllSubscriptions();
      expect(all).toHaveLength(3);
    });

    it('should destroy emitter', () => {
      const unsubscribe = emitter.on(EventType.MATTER_CREATED, vi.fn());

      emitter.destroy();

      emitter.emit(EventType.MATTER_CREATED, {});

      const stats = emitter.getStatistics();
      expect(stats.activeSubscriptions).toBe(0);
      expect(emitter.getHistory()).toHaveLength(0);
    });
  });

  describe('Factory Functions', () => {
    it('should create emitter with factory function', () => {
      const testEmitter = createEventEmitter({ debug: false });

      expect(testEmitter).toBeInstanceOf(RealtimeEventEmitter);

      testEmitter.destroy();
    });

    it('should get default emitter', () => {
      const default1 = createEventEmitter();
      const default2 = createEventEmitter();

      // Different instances unless using singleton
      expect(default1).not.toBe(default2);

      default1.destroy();
      default2.destroy();
    });
  });

  describe('Async Handlers', () => {
    it('should handle async event handlers', async () => {
      const asyncHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      emitter.on(EventType.MATTER_CREATED, asyncHandler);

      emitter.emit(EventType.MATTER_CREATED, {});

      await vi.advanceTimersByTimeAsync(20);

      expect(asyncHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle async handler errors', async () => {
      const asyncHandler = vi.fn(async () => {
        throw new Error('Async error');
      });

      emitter.on(EventType.MATTER_CREATED, asyncHandler);

      // Should not throw
      expect(() => emitter.emit(EventType.MATTER_CREATED, {})).not.toThrow();

      await vi.advanceTimersByTimeAsync(20);

      expect(asyncHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Metadata', () => {
    it('should include metadata', () => {
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(
        EventType.MATTER_CREATED,
        {},
        { metadata: { userId: 'user-123' } }
      );

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { userId: 'user-123' },
        })
      );
    });

    it('should merge metadata', () => {
      const middleware: EventMiddleware = (event, next) => {
        event.metadata = { ...event.metadata, m1: true };
        next(event);
      };

      emitter.use(middleware);

      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(
        EventType.MATTER_CREATED,
        {},
        { metadata: { userId: 'user-123' } }
      );

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user-123',
            m1: true,
          },
        })
      );
    });
  });

  describe('Replay with Metadata', () => {
    it('should add replay metadata to replayed events', () => {
      const handler = vi.fn();
      emitter.on(EventType.MATTER_CREATED, handler);

      emitter.emit(EventType.MATTER_CREATED, { id: 1 });

      emitter.replayHistory();

      const calls = handler.mock.calls;
      const replayedCall = calls[1][0];

      expect(replayedCall.metadata).toHaveProperty('replayed', true);
      expect(replayedCall.metadata).toHaveProperty('originalEventId');
      expect(replayedCall.metadata).toHaveProperty('originalTimestamp');
    });
  });
});
