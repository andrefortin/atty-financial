# WebSocket Manager Service

The WebSocket Manager provides robust real-time communication with automatic reconnection, message acknowledgment, subscription management, and Firebase Firestore integration.

## Features

- **Connection Management**: Connect, disconnect, and reconnect with configurable options
- **State Tracking**: Real-time connection status monitoring
- **Message Handling**: Send messages with or without acknowledgment
- **Subscription Management**: Subscribe to specific message types with callbacks
- **Heartbeat/Ping-Pong**: Automatic connection health monitoring
- **Error Handling**: Comprehensive error handling with custom error types
- **Auto-Reconnect**: Exponential backoff reconnection strategy
- **Firebase Integration**: Unified interface for Firestore real-time listeners

## Basic Usage

### Creating a WebSocket Manager

```typescript
import { WebSocketManager, createWebSocketManager } from '@/services/realtime';

// Using factory function
const wsManager = createWebSocketManager('wss://api.example.com/ws', {
  autoReconnect: true,
  heartbeatInterval: 30000,
  debug: true,
});

// Or using class directly
const wsManager = new WebSocketManager({
  url: 'wss://api.example.com/ws',
  autoReconnect: true,
  heartbeatInterval: 30000,
});
```

### Connecting

```typescript
// Connect to server
await wsManager.connect();

// With callbacks
const wsManager = new WebSocketManager({
  url: 'wss://api.example.com/ws',
  onConnect: (connectionId) => {
    console.log('Connected!', connectionId);
  },
  onDisconnect: (reason) => {
    console.log('Disconnected:', reason);
  },
  onError: (error) => {
    console.error('WebSocket error:', error);
  },
  onStatusChange: (state) => {
    console.log('Status changed:', state.status);
  },
});

await wsManager.connect();
```

### Sending Messages

```typescript
// Send without acknowledgment
wsManager.send('chat:message', {
  user: 'john',
  text: 'Hello world',
});

// Send with acknowledgment
const result = await wsManager.sendWithAck({
  type: 'api:request',
  payload: { action: 'getUser', userId: '123' },
  timeout: 5000,
});

if (result.success) {
  console.log('Response:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Subscriptions

```typescript
// Subscribe to specific message types
const unsubscribe = wsManager.subscribe('chat:message', (message) => {
  console.log('New chat message:', message.payload);
});

// Unsubscribe later
unsubscribe();

// Use wildcard patterns
wsManager.subscribe('user:*', (message) => {
  console.log('User event:', message.type);
});
```

### Connection State

```typescript
// Check connection status
if (wsManager.isConnected()) {
  console.log('Connected');
}

// Get current state
const state = wsManager.getState();
console.log('Status:', state.status);
console.log('Latency:', state.latency);
console.log('Reconnect attempts:', state.reconnectAttempts);
```

### Disconnecting

```typescript
// Normal disconnect
wsManager.disconnect();

// With custom code and reason
wsManager.disconnect(1000, 'User logged out');

// Force reconnection
await wsManager.reconnect();
```

## Configuration Options

```typescript
interface WebSocketOptions {
  // Required
  url: string;

  // Connection settings
  connectionTimeout?: number;        // Default: 10000ms
  heartbeatInterval?: number;         // Default: 30000ms
  maxReconnectAttempts?: number;     // Default: Infinity
  reconnectDelay?: number;            // Default: 1000ms
  maxReconnectDelay?: number;        // Default: 30000ms
  backoffMultiplier?: number;        // Default: 2

  // Behavior
  autoReconnect?: boolean;            // Default: true

  // WebSocket settings
  protocols?: string | string[];     // Optional subprotocols
  headers?: Record<string, string>;   // Optional headers

  // Authentication
  authToken?: string;                // Added as query param
  queryParams?: Record<string, string>;

  // Callbacks
  onStatusChange?: (state: ConnectionState) => void;
  onConnect?: (connectionId?: string) => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: WebSocketError) => void;
  onMessage?: (message: WebSocketMessage) => void;

  // Debugging
  debug?: boolean;                   // Default: false
}
```

## Firebase Integration

The WebSocket Manager integrates with Firebase Firestore real-time listeners for unified real-time data management.

### Subscribe to Firestore Document

```typescript
// Subscribe to a document
const unsubscribe = wsManager.subscribeToFirestoreDocument<User>(
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

// Unsubscribe later
unsubscribe();
```

### Subscribe to Firestore Query

```typescript
// Subscribe to query results
const unsubscribe = wsManager.subscribeToFirestoreQuery<Transaction>(
  'transactions',
  (docs) => {
    console.log('Transactions updated:', docs);
  },
  {
    where: [
      { field: 'status', operator: '==', value: 'active' }
    ],
    orderBy: [
      { field: 'createdAt', direction: 'desc' }
    ],
    limit: 50
  }
);

// Unsubscribe later
unsubscribe();
```

### Unsubscribe All Firestore

```typescript
// Unsubscribe all Firestore subscriptions
wsManager.unsubscribeAllFirestore();
```

## Advanced Usage

### Custom Error Handling

```typescript
const wsManager = new WebSocketManager({
  url: 'wss://api.example.com/ws',
  onError: (error) => {
    switch (error.code) {
      case 'TIMEOUT':
        console.error('Connection timeout');
        break;
      case 'CLOSED':
        console.error('Connection closed');
        break;
      case 'AUTH_FAILED':
        console.error('Authentication failed');
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  },
});
```

### Custom Authentication

```typescript
// Add auth token to URL
const wsManager = new WebSocketManager({
  url: 'wss://api.example.com/ws',
  authToken: 'your-jwt-token',
});

// Or add custom query parameters
const wsManager = new WebSocketManager({
  url: 'wss://api.example.com/ws',
  queryParams: {
    token: 'your-token',
    clientId: 'client-123',
  },
});
```

### Statistics and Monitoring

```typescript
// Get subscription statistics
const stats = wsManager.getSubscriptionStats();
console.log('WebSocket subscriptions:', stats.websocketSubscriptions);
console.log('Firebase subscriptions:', stats.firebaseSubscriptions);
console.log('Pending acknowledgments:', stats.pendingAcks);
```

### Cleanup

```typescript
// Proper cleanup when done
wsManager.disconnect();
wsManager.unsubscribeAll();
wsManager.unsubscribeAllFirestore();

// Or destroy everything
wsManager.destroy();
```

## Message Format

### Request Message

```typescript
interface WebSocketMessage<T = unknown> {
  id: string;              // Unique message ID
  type: string;            // Message type for routing
  payload: T;              // Message payload
  timestamp: number;       // Unix timestamp
  correlationId?: string;  // For request/response pattern
  requiresAck?: boolean;   // Whether acknowledgment is required
}
```

### Acknowledgment Message

```typescript
interface WebSocketAck {
  messageId: string;       // ID of acknowledged message
  success: boolean;        // Whether processing succeeded
  error?: string;          // Error message if failed
  timestamp: number;       // Acknowledgment timestamp
}
```

### Connection State

```typescript
enum ConnectionStatus {
  DISCONNECTED,    // Connection is closed
  CONNECTING,      // Currently connecting
  CONNECTED,       // Successfully connected
  HANDSHAKE,       // Waiting for handshake
  RECONNECTING,    // Will attempt to reconnect
  CLOSED,          // Intentionally closed
  ERROR,           // Error occurred
}

interface ConnectionState {
  status: ConnectionStatus;
  url: string;
  connectionId?: string;
  connectedAt?: number;
  disconnectedAt?: number;
  reconnectAttempts: number;
  timeUntilReconnect?: number;
  latency?: number;
  lastPongAt?: number;
}
```

## React Integration Example

```typescript
import { useEffect, useState, useRef } from 'react';
import { WebSocketManager } from '@/services/realtime';

function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    // Create WebSocket manager
    wsRef.current = new WebSocketManager({
      url: `wss://api.example.com/rooms/${roomId}`,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onMessage: (message) => {
        if (message.type === 'chat:message') {
          setMessages(prev => [...prev, message.payload]);
        }
      },
    });

    // Connect
    wsRef.current.connect();

    // Subscribe to messages
    const unsubscribe = wsRef.current.subscribe('chat:message', (message) => {
      setMessages(prev => [...prev, message.payload]);
    });

    // Cleanup
    return () => {
      unsubscribe();
      wsRef.current?.destroy();
    };
  }, [roomId]);

  const sendMessage = (text: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send('chat:message', { text, user: 'me' });
    }
  };

  return (
    <div>
      <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg.user}: {msg.text}</div>
        ))}
      </div>
      <input onSubmit={(e) => {
        e.preventDefault();
        sendMessage(e.currentTarget.elements.text.value);
      }}>
        <input name="text" />
        <button type="submit">Send</button>
      </input>
    </div>
  );
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `TIMEOUT` | Connection timeout |
| `CLOSED` | Connection closed |
| `WEBSOCKET_ERROR` | WebSocket error occurred |
| `SEND_ERROR` | Failed to send message |
| `PARSE_ERROR` | Failed to parse message |
| `ACK_FAILED` | Acknowledgment failed |
| `FIRESTORE_ERROR` | Firestore subscription error |
| `ERROR` | Generic error |

## Best Practices

1. **Always cleanup**: Unsubscribe and disconnect when component unmounts
2. **Use acknowledgments** for important messages to ensure delivery
3. **Implement reconnection** handling in your UI
4. **Monitor connection state** for better UX
5. **Use wildcards** for related message types
6. **Set reasonable timeouts** for acknowledgments
7. **Enable debug logging** during development
8. **Handle errors gracefully** with user feedback

## License

MIT
