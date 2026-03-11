# Presence Service

The Presence Service manages user presence information including online/offline status, typing indicators, and real-time presence updates using Firebase Firestore.

## Features

- **User Presence Management**: Set online, offline, and update presence status
- **Presence Queries**: Get user presence, firm presences, online users, and statistics
- **Real-time Subscriptions**: Subscribe to user and firm presence updates
- **Typing Indicators**: Set and manage typing indicators for real-time collaboration
- **Connection Status Tracking**: Mark connections as active/inactive automatically
- **Presence Cleanup**: Automatic cleanup of stale presence data
- **Activity Monitoring**: Auto-detect user activity and update presence status
- **Firebase Integration**: Uses Firestore for reliable presence storage
- **Event Emitter Integration**: Emits presence events for application-wide consumption

## Basic Usage

### Creating a Presence Service

```typescript
import { PresenceService, createPresenceService } from '@/services/realtime';

// Using factory function
const presenceService = createPresenceService({
  awayTimeout: 300000,        // 5 minutes
  offlineTimeout: 900000,      // 15 minutes
  cleanupInterval: 60000,       // 1 minute
  typingTimeout: 30000,       // 30 seconds
  debug: true,
});

// Or using class directly
const presenceService = new PresenceService({
  debug: true,
});
```

### Initializing Presence

```typescript
// Initialize for current user
await presenceService.initialize(
  'user-123',
  'firm-456',
  'John Doe'
);

// User is now online with presence document in Firestore
```

### Setting Presence Status

```typescript
// Set user online
await presenceService.setOnline();

// Set user offline
await presenceService.setOffline();

// Update presence with custom status
await presenceService.updatePresence(PresenceStatus.BUSY, {
  currentView: '/matters/matter-789',
  device: {
    type: 'desktop',
    browser: 'Chrome',
  },
});

// Mark connection as active (updates to online)
presenceService.markConnectionActive();

// Mark connection as inactive (updates to away)
presenceService.markConnectionInactive();
```

### Querying Presence

```typescript
// Get specific user presence
const presence = await presenceService.getUserPresence('user-123');
console.log('User status:', presence?.data.status);
console.log('Last seen:', presence?.data.lastSeen);

// Get all presences for a firm
const firmPresences = await presenceService.getFirmPresences('firm-456');
console.log('Firm users:', firmPresences.length);

// Get only online users
const onlineUsers = await presenceService.getOnlineUsers('firm-456');
console.log('Online users:', onlineUsers.map(u => u.data.userName));

// Get presence statistics
const stats = await presenceService.getPresenceStats('firm-456');
console.log('Total users:', stats.totalUsers);
console.log('Online users:', stats.onlineUsers);
console.log('Away users:', stats.awayUsers);
```

## Typing Indicators

### Setting Typing Status

```typescript
// Set user as typing in a matter
await presenceService.setTyping('matter-789', 'matter');

// Set user as typing in a chat
await presenceService.setTyping('chat-123', 'chat');

// Clear typing indicator
await presenceService.clearTyping('matter-789');

// Get users typing in a matter
const typingUsers = await presenceService.getTypingUsers('matter-789');
console.log('Typing users:', typingUsers.map(t => t.userName));
```

### Real-time Typing Subscriptions

```typescript
// Subscribe to typing updates for a matter
const unsubscribe = presenceService.subscribeToTyping(
  'matter-789',
  (typingUsers) => {
    // Update UI with typing users
    console.log('Currently typing:', typingUsers);

    if (typingUsers.length > 0) {
      const names = typingUsers.map(t => t.userName).join(', ');
      showTypingIndicator(`${names} is typing...`);
    } else {
      hideTypingIndicator();
    }
  }
);

// Unsubscribe when done
unsubscribe();
```

## Real-time Subscriptions

### Subscribe to User Presence

```typescript
// Subscribe to specific user's presence
const unsubscribe = presenceService.subscribeToUserPresence(
  'user-123',
  (presence) => {
    console.log('User presence updated:', presence.data.status);
    
    // Update UI based on status
    updateStatusIndicator(presence.data.status);
  }
);

// Unsubscribe when done
unsubscribe();
```

### Subscribe to Firm Presences

```typescript
// Subscribe to all presences for a firm
const unsubscribe = presenceService.subscribeToFirmPresences(
  'firm-456',
  (presences) => {
    console.log('Firm presences updated:', presences.length);
    
    // Update user list in UI
    updateUserList(presences);
  }
);

// Unsubscribe when done
unsubscribe();
```

## React Integration

### Custom Hook

```typescript
import { useEffect, useState } from 'react';
import { PresenceService, Presence } from '@/services/realtime';

function usePresence(presenceService: PresenceService, userId: string) {
  const [presence, setPresence] = useState<Presence | null>(null);

  useEffect(() => {
    const unsubscribe = presenceService.subscribeToUserPresence(
      userId,
      setPresence
    );

    return unsubscribe;
  }, [presenceService, userId]);

  return presence;
}

function useFirmPresences(presenceService: PresenceService, firmId: string) {
  const [presences, setPresences] = useState<Presence[]>([]);

  useEffect(() => {
    const unsubscribe = presenceService.subscribeToFirmPresences(
      firmId,
      setPresences
    );

    return unsubscribe;
  }, [presenceService, firmId]);

  return presences;
}

function useTypingUsers(presenceService: PresenceService, targetId: string) {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  useEffect(() => {
    const unsubscribe = presenceService.subscribeToTyping(
      targetId,
      setTypingUsers
    );

    return unsubscribe;
  }, [presenceService, targetId]);

  return typingUsers;
}

// Usage in component
function MatterDetail({ matterId, presenceService }: { matterId: string; presenceService: PresenceService }) {
  const typingUsers = useTypingUsers(presenceService, matterId);

  return (
    <div>
      <h2>Matter Details</h2>
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.map(t => t.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}
    </div>
  );
}
```

### Status Indicator Component

```typescript
function UserPresenceIndicator({ userId, presenceService }: { userId: string; presenceService: PresenceService }) {
  const presence = usePresence(presenceService, userId);

  if (!presence) {
    return null;
  }

  const statusColors = {
    [PresenceStatus.ONLINE]: 'green',
    [PresenceStatus.AWAY]: 'yellow',
    [PresenceStatus.OFFLINE]: 'gray',
    [PresenceStatus.BUSY]: 'red',
  };

  return (
    <div className="presence-indicator">
      <div
        className={`status-dot ${statusColors[presence.data.status]}`}
        title={presence.data.status}
      />
      <span className="user-name">{presence.data.userName}</span>
    </div>
  );
}
```

## Typing Input Component

```typescript
function TypingInput({ 
  matterId, 
  presenceService,
  onSend 
}: { 
  matterId: string; 
  presenceService: PresenceService;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState('');
  let typingTimer: number | null = null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Set typing indicator
    presenceService.setTyping(matterId, 'matter');

    // Clear existing timer
    if (typingTimer !== null) {
      clearTimeout(typingTimer);
    }

    // Clear typing after 3 seconds of no activity
    typingTimer = window.setTimeout(() => {
      presenceService.clearTyping(matterId);
    }, 3000);
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
      presenceService.clearTyping(matterId);
    }
  };

  return (
    <div className="typing-input">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## Configuration Options

```typescript
interface PresenceServiceConfig {
  // Collection names
  collectionName?: string;              // Default: 'presence'
  typingCollectionName?: string;         // Default: 'typing'
  
  // Timeouts
  awayTimeout?: number;                // Default: 300000 (5 minutes)
  offlineTimeout?: number;              // Default: 900000 (15 minutes)
  cleanupInterval?: number;             // Default: 60000 (1 minute)
  typingTimeout?: number;               // Default: 30000 (30 seconds)
  
  // Behavior
  autoStatusUpdates?: boolean;          // Default: true
  cleanupOnDisconnect?: boolean;        // Default: true
  
  // Integration
  eventEmitter?: RealtimeEventEmitter;
  
  // Debugging
  debug?: boolean;                      // Default: false
}
```

## Presence Status Values

| Status | Description | Color |
|--------|-------------|--------|
| `ONLINE` | User is online and active | Green |
| `AWAY` | User is away/inactive | Yellow |
| `OFFLINE` | User is offline | Gray |
| `BUSY` | User is busy | Red |

## Firestore Schema

### Presence Collection

```
presence/
  {userId}_{sessionId}/
    userId: string
    firmId: string
    userName: string
    status: 'online' | 'away' | 'offline' | 'busy'
    lastSeen: number (timestamp)
    currentView?: string
    device?: {
      type: 'desktop' | 'mobile' | 'tablet'
      os?: string
      browser?: string
    }
    sessionId: string
    connectionId: string
```

### Typing Collection

```
typing/
  {userId}_{targetId}/
    userId: string
    userName: string
    targetId: string
    targetType: 'matter' | 'chat' | 'comment' | 'other'
    startedAt: number (timestamp)
    timeout: number
```

## Best Practices

1. **Initialize Early**: Initialize presence service early in your app lifecycle
2. **Cleanup Properly**: Always call `destroy()` when component unmounts
3. **Handle Disconnections**: Use `cleanupOnDisconnect` for reliable cleanup
4. **Activity Monitoring**: Let the service handle activity detection
5. **Typing Timeouts**: Use appropriate typing timeouts (default: 30s)
6. **Subscription Cleanup**: Always unsubscribe from presence subscriptions
7. **Error Handling**: Handle initialization and method errors gracefully
8. **Status Updates**: Use `markConnectionActive()` for manual updates
9. **Statistics**: Use presence statistics for analytics and insights
10. **Debugging**: Enable debug logging during development

## Common Patterns

### Firm-wide Online User List

```typescript
function OnlineUsersList({ firmId, presenceService }: { firmId: string; presenceService: PresenceService }) {
  const [onlineUsers, setOnlineUsers] = useState<Presence[]>([]);

  useEffect(() => {
    // Get initial online users
    presenceService.getOnlineUsers(firmId).then(setOnlineUsers);

    // Subscribe to firm presences
    const unsubscribe = presenceService.subscribeToFirmPresences(
      firmId,
      (presences) => {
        const online = presences.filter(p => p.data.status === PresenceStatus.ONLINE);
        setOnlineUsers(online);
      }
    );

    return unsubscribe;
  }, [firmId, presenceService]);

  return (
    <div className="online-users">
      <h3>Online Users ({onlineUsers.length})</h3>
      <ul>
        {onlineUsers.map(user => (
          <li key={user.id}>
            <span className="status-dot online" />
            {user.data.userName}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Collaborative Editing with Typing

```typescript
function CollaborativeEditor({ 
  matterId, 
  presenceService,
  onSave 
}: { 
  matterId: string; 
  presenceService: PresenceService;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  useEffect(() => {
    // Subscribe to typing updates
    const unsubscribe = presenceService.subscribeToTyping(
      matterId,
      setTypingUsers
    );

    return unsubscribe;
  }, [matterId, presenceService]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    presenceService.setTyping(matterId, 'matter');
  };

  return (
    <div className="collaborative-editor">
      {typingUsers.length > 0 && (
        <div className="typing-banner">
          {typingUsers.map(t => t.userName).join(', ')} editing...
        </div>
      )}
      <textarea
        value={content}
        onChange={handleChange}
        onBlur={() => presenceService.clearTyping(matterId)}
      />
      <button onClick={() => onSave(content)}>Save</button>
    </div>
  );
}
```

### User Status Dropdown

```typescript
function UserStatusDropdown({ 
  presenceService 
}: { 
  presenceService: PresenceService 
}) {
  const [status, setStatus] = useState<PresenceStatus>(PresenceStatus.ONLINE);

  const handleStatusChange = async (newStatus: PresenceStatus) => {
    setStatus(newStatus);
    await presenceService.updatePresence(newStatus);
  };

  return (
    <select
      value={status}
      onChange={(e) => handleStatusChange(e.target.value as PresenceStatus)}
    >
      <option value={PresenceStatus.ONLINE}>🟢 Online</option>
      <option value={PresenceStatus.AWAY}>🟡 Away</option>
      <option value={PresenceStatus.BUSY}>🔴 Busy</option>
      <option value={PresenceStatus.OFFLINE}>⚫ Offline</option>
    </select>
  );
}
```

## Event Integration

### Presence Events with Event Emitter

```typescript
import { RealtimeEventEmitter, EventType } from '@/services/realtime';

// Create event emitter
const eventEmitter = new RealtimeEventEmitter();

// Initialize presence service with event emitter
const presenceService = new PresenceService({
  eventEmitter,
  debug: true,
});

// Listen to presence events
eventEmitter.on('presence:online', (data) => {
  console.log('User came online:', data);
  showNotification(`${data.userName} is now online`);
});

eventEmitter.on('presence:offline', (data) => {
  console.log('User went offline:', data);
  showNotification(`${data.userName} went offline`);
});

eventEmitter.on('presence:typing:started', (data) => {
  console.log('User started typing:', data);
});

eventEmitter.on('presence:typing:stopped', (data) => {
  console.log('User stopped typing:', data);
});
```

## Error Handling

```typescript
try {
  await presenceService.initialize('user-123', 'firm-456', 'John Doe');
} catch (error) {
  console.error('Failed to initialize presence:', error);
  showErrorMessage('Could not set up presence tracking');
}

try {
  await presenceService.setOnline();
} catch (error) {
  console.error('Failed to set online:', error);
}
```

## Statistics and Monitoring

```typescript
// Get presence statistics
const stats = await presenceService.getPresenceStats('firm-456');

console.log('Presence Statistics:');
console.log(`- Total Users: ${stats.totalUsers}`);
console.log(`- Online: ${stats.onlineUsers}`);
console.log(`- Away: ${stats.awayUsers}`);
console.log(`- Busy: ${stats.busyUsers}`);
console.log(`- Offline: ${stats.offlineUsers}`);
console.log(`- Typing: ${stats.typingUsers}`);
console.log(`- Active Sessions: ${stats.activeSessions}`);
```

## Cleanup

```typescript
// When component unmounts or user logs out
useEffect(() => {
  return () => {
    // Set offline
    presenceService.setOffline().catch(() => {});

    // Destroy service
    presenceService.destroy();
  };
}, []);
```

## Advanced Usage

### Multi-Tab Presence

```typescript
// The presence service automatically handles multiple tabs
// by using unique session IDs

// Tab 1: Creates presence document with session-1
await presenceService.initialize('user-123', 'firm-456', 'John Doe');

// Tab 2: Creates presence document with session-2
await presenceService.initialize('user-123', 'firm-456', 'John Doe');

// Both tabs maintain separate presence documents
// Querying will show both as active sessions
```

### Custom Presence Data

```typescript
// Update presence with custom metadata
await presenceService.updatePresence(PresenceStatus.ONLINE, {
  currentView: '/matters/matter-789',
  device: {
    type: 'desktop',
    os: 'macOS',
    browser: 'Chrome',
  },
  // Add custom fields
  department: 'Legal',
  role: 'Attorney',
});
```

### Manual Activity Tracking

```typescript
// If autoStatusUpdates is disabled, manually track activity
presenceService = new PresenceService({
  autoStatusUpdates: false,
});

// Track custom activity events
document.addEventListener('custom-activity', () => {
  presenceService.markConnectionActive();
});
```

## License

MIT
