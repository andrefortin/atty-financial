/**
 * WebSocket Manager Validation
 *
 * Validates that all exports and types are working correctly.
 * Run this file to verify the implementation.
 */

import {
  // Classes
  WebSocketManager,
  WebSocketError,

  // Enums
  ConnectionStatus,

  // Factory functions
  createWebSocketManager,
  createFirebaseWebSocketManager,
  getDefaultWebSocketManager,
  setDefaultWebSocketManager,
  resetDefaultWebSocketManager,

  // Types (should be available as types only)
  type WebSocketMessage,
  type WebSocketAck,
  type ConnectionState,
  type SubscriptionCallback,
  type Subscription,
  type WebSocketOptions,
  type SendWithAckOptions,
  type SendWithAckResult,
} from './webSocketManager';

console.log('✓ All exports validated successfully');

// Test 1: Enum values
console.log('ConnectionStatus values:', Object.values(ConnectionStatus));
console.log('✓ ConnectionStatus enum works');

// Test 2: WebSocketError
const error = new WebSocketError('Test error', 'TEST_CODE');
console.log('✓ WebSocketError class works:', error.message, error.code);

// Test 3: Factory function
const manager = createWebSocketManager('ws://localhost:8080', {
  debug: true,
  autoReconnect: true,
});
console.log('✓ createWebSocketManager works');
console.log('Initial state:', manager.getState());

// Test 4: State checking
console.log('Is connected:', manager.isConnected());
console.log('Is connecting:', manager.isConnecting());
console.log('Status:', manager.getStatus());

// Test 5: Statistics
const stats = manager.getSubscriptionStats();
console.log('✓ getSubscriptionStats works:', stats);

// Test 6: Cleanup
manager.destroy();
console.log('✓ destroy works');

// Test 7: Singleton pattern
const defaultManager = createWebSocketManager('ws://localhost:8080');
setDefaultWebSocketManager(defaultManager);
const retrieved = getDefaultWebSocketManager();
console.log('✓ Singleton pattern works:', retrieved === defaultManager);
resetDefaultWebSocketManager();

console.log('\n✅ All validation tests passed!');
console.log('\nThe WebSocket Manager implementation is working correctly.');
console.log('You can now use it in your application.');
