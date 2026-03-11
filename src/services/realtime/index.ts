/**
 * Real-time Services
 *
 * Exports WebSocket manager, event emitter, presence service, notification service,
 * optimistic update helper, offline conflict resolver, sync queue, and related real-time services.
 *
 * @module services/realtime
 */

export * from './webSocketManager';
export * from './eventEmitter';
export * from './presenceService';
export * from './notificationService';
export * from './optimisticUpdateHelper';
export * from './offline/conflictResolver';
export * from './offline/syncQueue';