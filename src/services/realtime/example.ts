/**
 * WebSocket Manager Example Usage
 *
 * Demonstrates common use cases for the WebSocketManager class
 */

import {
  WebSocketManager,
  createWebSocketManager,
  ConnectionStatus,
  type WebSocketMessage,
} from './webSocketManager';

// ============================================
// Example 1: Basic Connection
// ============================================

async function basicConnectionExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws', {
    debug: true,
  });

  try {
    await wsManager.connect();
    console.log('Connected!');

    // Send a simple message
    wsManager.send('chat:hello', { user: 'Alice', message: 'Hi everyone!' });

    // Disconnect when done
    wsManager.disconnect();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

// ============================================
// Example 2: Connection with Callbacks
// ============================================

async function connectionWithCallbacksExample() {
  const wsManager = new WebSocketManager({
    url: 'wss://api.example.com/ws',
    debug: true,
    onConnect: (connectionId) => {
      console.log('Connected with ID:', connectionId);
    },
    onDisconnect: (reason) => {
      console.log('Disconnected:', reason);
    },
    onError: (error) => {
      console.error('Error:', error.message, error.code);
    },
    onStatusChange: (state) => {
      console.log('Status:', state.status);
    },
    onMessage: (message) => {
      console.log('Received message:', message.type, message.payload);
    },
  });

  await wsManager.connect();
}

// ============================================
// Example 3: Subscriptions
// ============================================

async function subscriptionExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');
  await wsManager.connect();

  // Subscribe to chat messages
  const unsubscribeChat = wsManager.subscribe('chat:message', (message) => {
    console.log('New chat message:', message.payload);
  });

  // Subscribe to user events with wildcard
  const unsubscribeUser = wsManager.subscribe('user:*', (message) => {
    console.log('User event:', message.type, message.payload);
  });

  // Later, unsubscribe
  // unsubscribeChat();
  // unsubscribeUser();
}

// ============================================
// Example 4: Send with Acknowledgment
// ============================================

async function sendWithAckExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');
  await wsManager.connect();

  // Send request and wait for acknowledgment
  const result = await wsManager.sendWithAck({
    type: 'api:getUser',
    payload: { userId: '123' },
    timeout: 5000,
  });

  if (result.success) {
    console.log('User data:', result.data);
  } else {
    console.error('Request failed:', result.error);
  }
}

// ============================================
// Example 5: Monitor Connection State
// ============================================

async function monitorConnectionExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');

  // Check connection status
  console.log('Is connected:', wsManager.isConnected());
  console.log('Is connecting:', wsManager.isConnecting());
  console.log('Status:', wsManager.getStatus());

  // Get full state
  const state = wsManager.getState();
  console.log('Connection state:', state);

  await wsManager.connect();

  // Monitor latency
  setInterval(() => {
    const currentState = wsManager.getState();
    console.log('Latency:', currentState.latency, 'ms');
  }, 5000);
}

// ============================================
// Example 6: Auto-Reconnect Configuration
// ============================================

async function autoReconnectExample() {
  const wsManager = new WebSocketManager({
    url: 'wss://api.example.com/ws',
    autoReconnect: true,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    backoffMultiplier: 2,
    maxReconnectAttempts: 10,
    onStatusChange: (state) => {
      if (state.status === ConnectionStatus.RECONNECTING) {
        console.log(`Reconnecting in ${state.timeUntilReconnect}ms...`);
        console.log(`Attempt ${state.reconnectAttempts}`);
      }
    },
  });

  await wsManager.connect();
}

// ============================================
// Example 7: Firebase Integration
// ============================================

async function firebaseIntegrationExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');
  await wsManager.connect();

  // Subscribe to Firestore document
  const unsubscribeDoc = wsManager.subscribeToFirestoreDocument(
    'users',
    'user123',
    (doc) => {
      if (doc) {
        console.log('User updated:', doc.data);
      } else {
        console.log('User deleted');
      }
    }
  );

  // Subscribe to Firestore query
  const unsubscribeQuery = wsManager.subscribeToFirestoreQuery(
    'transactions',
    (docs) => {
      console.log('Transactions updated:', docs.length);
    },
    {
      where: [{ field: 'status', operator: '==', value: 'active' }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 50,
    }
  );

  // Cleanup
  // unsubscribeDoc();
  // unsubscribeQuery();
  // wsManager.unsubscribeAllFirestore();
}

// ============================================
// Example 8: Authentication
// ============================================

async function authenticatedConnectionExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws', {
    authToken: 'your-jwt-token-here',
    queryParams: {
      clientId: 'client-123',
      version: '1.0.0',
    },
  });

  await wsManager.connect();
}

// ============================================
// Example 9: React Hook Integration
// ============================================

/*
// Example React hook for using WebSocket Manager

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager, ConnectionStatus } from '@/services/realtime';

function useWebSocket(url: string, options = {}) {
  const wsRef = useRef<WebSocketManager | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    wsRef.current = new WebSocketManager({
      url,
      ...options,
      onStatusChange: (state) => setStatus(state.status),
      onMessage: (message) => {
        setMessages(prev => [...prev, message]);
      },
    });

    wsRef.current.connect();

    return () => {
      wsRef.current?.destroy();
    };
  }, [url]);

  const send = useCallback((type: string, payload: any) => {
    return wsRef.current?.send(type, payload);
  }, []);

  const subscribe = useCallback((messageType: string, callback: (msg: any) => void) => {
    return wsRef.current?.subscribe(messageType, callback);
  }, []);

  return { status, messages, send, subscribe, manager: wsRef.current };
}

// Usage in component:
function ChatRoom({ roomId }: { roomId: string }) {
  const { status, messages, send, subscribe } = useWebSocket(
    `wss://api.example.com/rooms/${roomId}`
  );

  useEffect(() => {
    const unsubscribe = subscribe('chat:message', (message) => {
      console.log('New message:', message.payload);
    });
    return unsubscribe;
  }, [subscribe]);

  const handleSendMessage = (text: string) => {
    send('chat:message', { text, user: 'me' });
  };

  return (
    <div>
      <div>Status: {status}</div>
      <div>Messages: {messages.length}</div>
    </div>
  );
}
*/

// ============================================
// Example 10: Error Handling
// ============================================

async function errorHandlingExample() {
  const wsManager = new WebSocketManager({
    url: 'wss://api.example.com/ws',
    onError: (error) => {
      switch (error.code) {
        case 'TIMEOUT':
          console.error('Connection timeout. Please check your network.');
          break;
        case 'AUTH_FAILED':
          console.error('Authentication failed. Please log in again.');
          break;
        case 'CLOSED':
          console.error('Connection closed unexpectedly.');
          break;
        default:
          console.error('An error occurred:', error.message);
      }
    },
    onStatusChange: (state) => {
      if (state.status === ConnectionStatus.ERROR) {
        console.log('Connection in error state. Attempting to recover...');
      }
    },
  });

  await wsManager.connect();
}

// ============================================
// Example 11: Statistics and Monitoring
// ============================================

async function statisticsExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');
  await wsManager.connect();

  // Add some subscriptions
  wsManager.subscribe('event:1', () => {});
  wsManager.subscribe('event:2', () => {});
  wsManager.subscribe('event:3', () => {});

  // Get statistics
  const stats = wsManager.getSubscriptionStats();
  console.log('Statistics:', stats);
  // Output:
  // {
  //   websocketSubscriptions: 3,
  //   firebaseSubscriptions: 0,
  //   pendingAcks: 0
  // }
}

// ============================================
// Example 12: Cleanup
// ============================================

async function cleanupExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');
  await wsManager.connect();

  // ... use the manager ...

  // Proper cleanup
  wsManager.unsubscribeAll();
  wsManager.unsubscribeAllFirestore();
  wsManager.disconnect();

  // Or destroy everything in one call
  wsManager.destroy();
}

// ============================================
// Example 13: Reconnection
// ============================================

async function reconnectionExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');
  await wsManager.connect();

  // Check if connected
  if (wsManager.isConnected()) {
    console.log('Connected');
  } else {
    console.log('Not connected');
  }

  // Force reconnection
  await wsManager.reconnect();
}

// ============================================
// Example 14: Custom Message Types
// ============================================

interface ChatMessage {
  user: string;
  text: string;
  timestamp: number;
}

interface UserEvent {
  userId: string;
  event: 'joined' | 'left' | 'updated';
  data?: any;
}

async function customMessageTypesExample() {
  const wsManager = createWebSocketManager('wss://api.example.com/ws');
  await wsManager.connect();

  // Send typed message
  wsManager.send<ChatMessage>('chat:message', {
    user: 'Alice',
    text: 'Hello!',
    timestamp: Date.now(),
  });

  // Subscribe with typed callback
  wsManager.subscribe<ChatMessage>('chat:message', (message) => {
    const { user, text, timestamp } = message.payload;
    console.log(`${user} at ${new Date(timestamp)}: ${text}`);
  });

  // Send with acknowledgment
  const result = await wsManager.sendWithAck<ChatMessage, UserEvent>({
    type: 'user:get',
    payload: { userId: '123', event: 'updated' },
    timeout: 5000,
  });

  if (result.success) {
    console.log('User event:', result.data);
  }
}

// Export examples
export {
  basicConnectionExample,
  connectionWithCallbacksExample,
  subscriptionExample,
  sendWithAckExample,
  monitorConnectionExample,
  autoReconnectExample,
  firebaseIntegrationExample,
  authenticatedConnectionExample,
  errorHandlingExample,
  statisticsExample,
  cleanupExample,
  reconnectionExample,
  customMessageTypesExample,
};
