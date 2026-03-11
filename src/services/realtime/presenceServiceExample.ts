/**
 * Presence Service Example Usage
 *
 * Demonstrates common use cases for PresenceService class
 */

import {
  PresenceService,
  createPresenceService,
  PresenceStatus,
  type Presence,
  type TypingIndicator,
  type PresenceStats,
} from './presenceService';

// ============================================
// Example 1: Basic Initialization
// ============================================

async function basicInitializationExample() {
  const presenceService = createPresenceService({
    awayTimeout: 300000,        // 5 minutes
    offlineTimeout: 900000,      // 15 minutes
    cleanupInterval: 60000,       // 1 minute
    typingTimeout: 30000,       // 30 seconds
    debug: true,
  });

  // Initialize for current user
  await presenceService.initialize(
    'user-123',
    'firm-456',
    'John Doe'
  );

  console.log('User is now online!');
  console.log('Session ID:', presenceService.getSessionId());
  console.log('User ID:', presenceService.getCurrentUserId());

  presenceService.destroy();
}

// ============================================
// Example 2: Presence Status Management
// ============================================

async function presenceStatusExample() {
  const presenceService = createPresenceService();
  await presenceService.initialize('user-123', 'firm-456', 'John Doe');

  // Set user online
  await presenceService.setOnline();
  console.log('Status: Online');

  // Set user offline
  await presenceService.setOffline();
  console.log('Status: Offline');

  // Update with custom status
  await presenceService.updatePresence(PresenceStatus.BUSY, {
    currentView: '/matters/matter-789',
  });
  console.log('Status: Busy');

  // Mark connection as active
  presenceService.markConnectionActive();
  console.log('Connection marked as active');

  // Mark connection as inactive
  presenceService.markConnectionInactive();
  console.log('Connection marked as inactive');

  presenceService.destroy();
}

// ============================================
// Example 3: Querying Presence
// ============================================

async function queryPresenceExample() {
  const presenceService = createPresenceService();
  await presenceService.initialize('user-123', 'firm-456', 'John Doe');

  // Get specific user presence
  const userPresence = await presenceService.getUserPresence('user-123');
  if (userPresence) {
    console.log('User status:', userPresence.data.status);
    console.log('Last seen:', new Date(userPresence.data.lastSeen));
  }

  // Get all firm presences
  const firmPresences = await presenceService.getFirmPresences('firm-456');
  console.log('Firm users:', firmPresences.length);
  firmPresences.forEach(p => {
    console.log(`- ${p.data.userName}: ${p.data.status}`);
  });

  // Get only online users
  const onlineUsers = await presenceService.getOnlineUsers('firm-456');
  console.log('Online users:', onlineUsers.map(u => u.data.userName));

  // Get presence statistics
  const stats = await presenceService.getPresenceStats('firm-456');
  console.log('Presence Statistics:', stats);

  presenceService.destroy();
}

// ============================================
// Example 4: Typing Indicators
// ============================================

async function typingIndicatorsExample() {
  const presenceService = createPresenceService();
  await presenceService.initialize('user-123', 'firm-456', 'John Doe');

  // Set user as typing in a matter
  await presenceService.setTyping('matter-789', 'matter');
  console.log('Typing in matter-789');

  // Set user as typing in a chat
  await presenceService.setTyping('chat-123', 'chat');
  console.log('Typing in chat-123');

  // Clear typing indicator
  await presenceService.clearTyping('matter-789');
  console.log('Stopped typing in matter-789');

  // Get users typing in a matter
  const typingUsers = await presenceService.getTypingUsers('matter-789');
  console.log('Typing users:', typingUsers.map(t => t.userName));

  presenceService.destroy();
}

// ============================================
// Example 5: Real-time Subscriptions
// ============================================

async function realtimeSubscriptionsExample() {
  const presenceService = createPresenceService();
  await presenceService.initialize('user-456', 'firm-456', 'Jane Smith');

  // Subscribe to user presence
  const unsubscribeUser = presenceService.subscribeToUserPresence(
    'user-123',
    (presence) => {
      console.log('User presence updated:', presence.data.status);
      updateStatusIndicator(presence.data.status);
    }
  );

  // Subscribe to firm presences
  const unsubscribeFirm = presenceService.subscribeToFirmPresences(
    'firm-456',
    (presences) => {
      console.log('Firm presences updated:', presences.length);
      updateUserList(presences);
    }
  );

  // Subscribe to typing updates
  const unsubscribeTyping = presenceService.subscribeToTyping(
    'matter-789',
    (typingUsers) => {
      console.log('Typing users:', typingUsers);
      if (typingUsers.length > 0) {
        const names = typingUsers.map(t => t.userName).join(', ');
        showTypingIndicator(`${names} is typing...`);
      } else {
        hideTypingIndicator();
      }
    }
  );

  // Unsubscribe when done
  // unsubscribeUser();
  // unsubscribeFirm();
  // unsubscribeTyping();

  presenceService.destroy();
}

// Helper functions for examples
function updateStatusIndicator(status: PresenceStatus) {
  console.log('Updating status indicator:', status);
}

function updateUserList(presences: Presence[]) {
  console.log('Updating user list with', presences.length, 'users');
}

function showTypingIndicator(message: string) {
  console.log('Showing typing indicator:', message);
}

function hideTypingIndicator() {
  console.log('Hiding typing indicator');
}

// ============================================
// Example 6: Presence Cleanup
// ============================================

async function presenceCleanupExample() {
  const presenceService = createPresenceService();

  // Clean up old presence documents (older than 15 minutes)
  const cleanupCount = await presenceService.cleanupOldPresence(900000);
  console.log('Cleaned up', cleanupCount, 'old presence documents');

  // Remove specific user presence
  await presenceService.removePresence('user-123');
  console.log('Removed user-123 presence');

  // Remove all typing indicators for a user
  await presenceService.removeUserTyping('user-123');
  console.log('Removed user-123 typing indicators');

  presenceService.destroy();
}

// ============================================
// Example 7: Status Dropdown Component
// ============================================

/*
// React component for status dropdown
import { useState, useEffect } from 'react';

function UserStatusDropdown({ presenceService }: { presenceService: PresenceService }) {
  const [status, setStatus] = useState<PresenceStatus>(PresenceStatus.ONLINE);

  const handleStatusChange = async (newStatus: PresenceStatus) => {
    setStatus(newStatus);
    await presenceService.updatePresence(newStatus);
  };

  return (
    <div className="status-dropdown">
      <label>Set Status:</label>
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as PresenceStatus)}
      >
        <option value={PresenceStatus.ONLINE}>🟢 Online</option>
        <option value={PresenceStatus.AWAY}>🟡 Away</option>
        <option value={PresenceStatus.BUSY}>🔴 Busy</option>
        <option value={PresenceStatus.OFFLINE}>⚫ Offline</option>
      </select>
    </div>
  );
}
*/

// ============================================
// Example 8: Online Users List
// ============================================

/*
// React component for online users list
import { useState, useEffect } from 'react';

function OnlineUsersList({ 
  firmId, 
  presenceService 
}: { 
  firmId: string; 
  presenceService: PresenceService 
}) {
  const [onlineUsers, setOnlineUsers] = useState<Presence[]>([]);
  const [allUsers, setAllUsers] = useState<Presence[]>([]);

  useEffect(() => {
    // Get initial data
    presenceService.getOnlineUsers(firmId).then(setOnlineUsers);
    presenceService.getFirmPresences(firmId).then(setAllUsers);

    // Subscribe to firm presences
    const unsubscribe = presenceService.subscribeToFirmPresences(
      firmId,
      (presences) => {
        const online = presences.filter(p => p.data.status === PresenceStatus.ONLINE);
        setAllUsers(presences);
        setOnlineUsers(online);
      }
    );

    return unsubscribe;
  }, [firmId, presenceService]);

  const statusColors = {
    [PresenceStatus.ONLINE]: 'green',
    [PresenceStatus.AWAY]: 'yellow',
    [PresenceStatus.BUSY]: 'red',
    [PresenceStatus.OFFLINE]: 'gray',
  };

  return (
    <div className="online-users">
      <h3>Users ({onlineUsers.length}/{allUsers.length} online)</h3>
      <ul>
        {allUsers.map(user => (
          <li key={user.id}>
            <span
              className={`status-dot ${statusColors[user.data.status]}`}
              title={user.data.status}
            />
            {user.data.userName}
            {user.data.currentView && (
              <span className="view">on {user.data.currentView}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
*/

// ============================================
// Example 9: Collaborative Editing
// ============================================

/*
// React component for collaborative editing with typing
import { useState, useEffect } from 'react';

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

  const handleBlur = () => {
    presenceService.clearTyping(matterId);
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
        onBlur={handleBlur}
        placeholder="Start typing..."
      />
      <button onClick={() => onSave(content)}>Save</button>
    </div>
  );
}
*/

// ============================================
// Example 10: Typing Input Component
// ============================================

/*
// React component for typing input with presence
import { useState, useEffect } from 'react';

function TypingInput({ 
  targetId,
  targetType = 'matter',
  presenceService,
  onSend 
}: { 
  targetId: string;
  targetType?: 'matter' | 'chat' | 'comment' | 'other';
  presenceService: PresenceService;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState('');
  let typingTimer: number | null = null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Set typing indicator
    presenceService.setTyping(targetId, targetType);

    // Clear existing timer
    if (typingTimer !== null) {
      clearTimeout(typingTimer);
    }

    // Clear typing after 3 seconds of no activity
    typingTimer = window.setTimeout(() => {
      presenceService.clearTyping(targetId);
    }, 3000);
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
      presenceService.clearTyping(targetId);
    }
  };

  const handleBlur = () => {
    presenceService.clearTyping(targetId);
  };

  return (
    <div className="typing-input">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
*/

// ============================================
// Example 11: User Presence Card
// ============================================

/*
// React component for user presence card
import { useState, useEffect } from 'react';

function UserPresenceCard({ 
  userId,
  presenceService 
}: { 
  userId: string;
  presenceService: PresenceService;
}) {
  const [presence, setPresence] = useState<Presence | null>(null);

  useEffect(() => {
    const unsubscribe = presenceService.subscribeToUserPresence(
      userId,
      setPresence
    );

    return unsubscribe;
  }, [userId, presenceService]);

  if (!presence) {
    return null;
  }

  const statusColors = {
    [PresenceStatus.ONLINE]: 'green',
    [PresenceStatus.AWAY]: 'yellow',
    [PresenceStatus.OFFLINE]: 'gray',
    [PresenceStatus.BUSY]: 'red',
  };

  const statusIcons = {
    [PresenceStatus.ONLINE]: '🟢',
    [PresenceStatus.AWAY]: '🟡',
    [PresenceStatus.OFFLINE]: '⚫',
    [PresenceStatus.BUSY]: '🔴',
  };

  return (
    <div className="presence-card">
      <div className="presence-header">
        <span className="status-icon">{statusIcons[presence.data.status]}</span>
        <h3>{presence.data.userName}</h3>
      </div>
      <div className="presence-info">
        <p>Status: <span className={statusColors[presence.data.status]}">{presence.data.status}</span></p>
        <p>Last seen: {new Date(presence.data.lastSeen).toLocaleString()}</p>
        {presence.data.currentView && (
          <p>Viewing: {presence.data.currentView}</p>
        )}
        {presence.data.device && (
          <p>Device: {presence.data.device.type}</p>
        )}
      </div>
    </div>
  );
}
*/

// ============================================
// Example 12: Presence Statistics Dashboard
// ============================================

async function presenceStatisticsExample() {
  const presenceService = createPresenceService();

  // Get presence statistics for firm
  const stats = await presenceService.getPresenceStats('firm-456');

  console.log('📊 Presence Statistics Dashboard');
  console.log('================================');
  console.log(`Total Users: ${stats.totalUsers}`);
  console.log(`🟢 Online: ${stats.onlineUsers} (${((stats.onlineUsers / stats.totalUsers) * 100).toFixed(1)}%)`);
  console.log(`🟡 Away: ${stats.awayUsers} (${((stats.awayUsers / stats.totalUsers) * 100).toFixed(1)}%)`);
  console.log(`🔴 Busy: ${stats.busyUsers} (${((stats.busyUsers / stats.totalUsers) * 100).toFixed(1)}%)`);
  console.log(`⚫ Offline: ${stats.offlineUsers} (${((stats.offlineUsers / stats.totalUsers) * 100).toFixed(1)}%)`);
  console.log(`💬 Typing: ${stats.typingUsers}`);
  console.log(`🔄 Active Sessions: ${stats.activeSessions}`);
  console.log(`⏱️  Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}`);

  presenceService.destroy();
}

// ============================================
// Example 13: App Initialization
// ============================================

async function appInitializationExample() {
  // Create presence service
  const presenceService = createPresenceService({
    awayTimeout: 300000,
    offlineTimeout: 900000,
    cleanupInterval: 60000,
    typingTimeout: 30000,
    debug: process.env.NODE_ENV === 'development',
  });

  // Get current user from auth
  const currentUser = {
    uid: 'user-123',
    displayName: 'John Doe',
    firmId: 'firm-456',
  };

  // Initialize presence
  await presenceService.initialize(
    currentUser.uid,
    currentUser.firmId,
    currentUser.displayName
  );

  console.log('App initialized with presence tracking');

  // Make presence service available globally
  // window.presenceService = presenceService;

  return presenceService;
}

// ============================================
// Example 14: Logout Cleanup
// ============================================

async function logoutCleanupExample(presenceService: PresenceService) {
  console.log('Logging out...');

  // Set user offline
  await presenceService.setOffline();

  // Remove presence data
  await presenceService.removePresence(presenceService.getCurrentUserId()!);

  // Clear all typing indicators
  await presenceService.removeUserTyping(presenceService.getCurrentUserId()!);

  // Destroy service
  await presenceService.destroy();

  console.log('Presence cleanup complete');
}

// ============================================
// Example 15: Custom Presence Data
// ============================================

async function customPresenceDataExample() {
  const presenceService = createPresenceService();
  await presenceService.initialize('user-123', 'firm-456', 'John Doe');

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
    location: 'New York Office',
  });

  presenceService.destroy();
}

// ============================================
// Example 16: Multi-Tab Presence
// ============================================

/*
// The presence service automatically handles multiple tabs
// Each tab gets a unique session ID

// Tab 1
const presenceService1 = createPresenceService();
await presenceService1.initialize('user-123', 'firm-456', 'John Doe');

// Tab 2
const presenceService2 = createPresenceService();
await presenceService2.initialize('user-123', 'firm-456', 'John Doe');

// Both tabs maintain separate presence documents
// Querying firm presences will show both as active sessions
*/

// ============================================
// Example 17: Error Handling
// ============================================

async function errorHandlingExample() {
  const presenceService = createPresenceService();

  try {
    // Initialize presence
    await presenceService.initialize('user-123', 'firm-456', 'John Doe');
  } catch (error) {
    console.error('Failed to initialize presence:', error);
    showErrorMessage('Could not set up presence tracking');
    return;
  }

  try {
    // Set online status
    await presenceService.setOnline();
  } catch (error) {
    console.error('Failed to set online:', error);
  }

  try {
    // Query presence
    const presence = await presenceService.getUserPresence('user-123');
    if (presence) {
      console.log('User presence:', presence.data.status);
    }
  } catch (error) {
    console.error('Failed to query presence:', error);
  }

  presenceService.destroy();
}

function showErrorMessage(message: string) {
  console.error('Error:', message);
}

// Export examples
export {
  basicInitializationExample,
  presenceStatusExample,
  queryPresenceExample,
  typingIndicatorsExample,
  realtimeSubscriptionsExample,
  presenceCleanupExample,
  presenceStatisticsExample,
  appInitializationExample,
  logoutCleanupExample,
  customPresenceDataExample,
  errorHandlingExample,
};
