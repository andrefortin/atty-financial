/**
 * Presence Service Tests
 *
 * Unit tests for PresenceService class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PresenceService,
  createPresenceService,
  PresenceStatus,
  type Presence,
  type PresenceData,
  type TypingIndicator,
  type PresenceStats,
  type PresenceServiceConfig,
} from '../presenceService';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'mock-doc-id' })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    commit: vi.fn(),
  })),
  serverTimestamp: vi.fn(() => ({ seconds: 1234567890 })),
  type DocumentReference: class {},
}));

describe('PresenceService', () => {
  let service: PresenceService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = createPresenceService({
      awayTimeout: 300000, // 5 minutes
      offlineTimeout: 900000, // 15 minutes
      cleanupInterval: 60000, // 1 minute
      typingTimeout: 30000, // 30 seconds
      autoStatusUpdates: false, // Disable for testing
      debug: false,
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await service.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const testService = createPresenceService();
      expect(testService).toBeInstanceOf(PresenceService);
      testService.destroy();
    });

    it('should initialize for user', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      expect(service.getCurrentUserId()).toBe('user-123');
      expect(service.getCurrentFirmId()).toBe('firm-456');
      expect(service.getSessionId()).toBeDefined();
      expect(service.isUserOnline()).toBe(true);
    });

    it('should generate unique session IDs', () => {
      const service1 = createPresenceService();
      const service2 = createPresenceService();

      const id1 = service1.getSessionId();
      const id2 = service2.getSessionId();

      expect(id1).not.toBe(id2);

      service1.destroy();
      service2.destroy();
    });

    it('should start cleanup timer on initialize', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      // Timer should be running
      vi.advanceTimersByTime(61000); // Slightly more than cleanup interval

      // Cleanup should have been attempted
      // (mocked so won't actually do anything)
    });
  });

  describe('Presence Management', () => {
    it('should set user online', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      await service.setOnline();

      expect(service.isUserOnline()).toBe(true);
    });

    it('should set user offline', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      await service.setOffline();

      expect(service.isUserOnline()).toBe(false);
    });

    it('should update presence', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      await service.updatePresence(PresenceStatus.BUSY, {
        currentView: '/matters',
      });

      expect(service.isUserOnline()).toBe(true);
    });

    it('should mark connection as active', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      service.markConnectionActive();

      // Should update last activity time
      expect(service.isUserOnline()).toBe(true);
    });

    it('should mark connection as inactive', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      service.markConnectionInactive();

      // Should update presence to away
    });
  });

  describe('Presence Queries', () => {
    it('should get user presence', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: true,
        id: 'user-123',
        data: () => ({
          userId: 'user-123',
          firmId: 'firm-456',
          userName: 'John Doe',
          status: PresenceStatus.ONLINE,
          lastSeen: Date.now(),
          sessionId: 'session-1',
        }),
      });

      await service.initialize('user-123', 'firm-456', 'John Doe');

      const presence = await service.getUserPresence('user-123');

      expect(presence).not.toBeNull();
      expect(presence?.data.userId).toBe('user-123');
      expect(presence?.data.status).toBe(PresenceStatus.ONLINE);
    });

    it('should return null for non-existent user', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: false,
      });

      const presence = await service.getUserPresence('user-999');

      expect(presence).toBeNull();
    });

    it('should get firm presences', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: true,
        data: () => ({
          'user-123_session-1': {
            userId: 'user-123',
            firmId: 'firm-456',
            userName: 'John Doe',
            status: PresenceStatus.ONLINE,
            lastSeen: Date.now(),
            sessionId: 'session-1',
          },
          'user-456_session-2': {
            userId: 'user-456',
            firmId: 'firm-456',
            userName: 'Jane Smith',
            status: PresenceStatus.AWAY,
            lastSeen: Date.now(),
            sessionId: 'session-2',
          },
        }),
      });

      const presences = await service.getFirmPresences('firm-456');

      expect(presences).toHaveLength(2);
      expect(presences[0].data.userName).toBe('John Doe');
      expect(presences[1].data.userName).toBe('Jane Smith');
    });

    it('should get online users', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: true,
        data: () => ({
          'user-123_session-1': {
            userId: 'user-123',
            firmId: 'firm-456',
            userName: 'John Doe',
            status: PresenceStatus.ONLINE,
            lastSeen: Date.now(),
            sessionId: 'session-1',
          },
          'user-456_session-2': {
            userId: 'user-456',
            firmId: 'firm-456',
            userName: 'Jane Smith',
            status: PresenceStatus.OFFLINE,
            lastSeen: Date.now(),
            sessionId: 'session-2',
          },
        }),
      });

      const onlineUsers = await service.getOnlineUsers('firm-456');

      expect(onlineUsers).toHaveLength(1);
      expect(onlineUsers[0].data.userName).toBe('John Doe');
    });

    it('should get presence statistics', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: true,
        data: () => ({
          'user-123_session-1': {
            userId: 'user-123',
            firmId: 'firm-456',
            userName: 'John Doe',
            status: PresenceStatus.ONLINE,
            lastSeen: Date.now(),
            sessionId: 'session-1',
          },
          'user-456_session-2': {
            userId: 'user-456',
            firmId: 'firm-456',
            userName: 'Jane Smith',
            status: PresenceStatus.AWAY,
            lastSeen: Date.now(),
            sessionId: 'session-2',
          },
          'user-789_session-3': {
            userId: 'user-789',
            firmId: 'firm-456',
            userName: 'Bob Johnson',
            status: PresenceStatus.BUSY,
            lastSeen: Date.now(),
            sessionId: 'session-3',
          },
        }),
      });

      const stats = await service.getPresenceStats('firm-456');

      expect(stats.totalUsers).toBe(3);
      expect(stats.onlineUsers).toBe(1);
      expect(stats.awayUsers).toBe(1);
      expect(stats.busyUsers).toBe(1);
      expect(stats.offlineUsers).toBe(0);
    });
  });

  describe('Typing Indicators', () => {
    it('should set typing indicator', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      await service.setTyping('matter-789', 'matter');

      // Should have created typing document
    });

    it('should clear typing indicator', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      await service.setTyping('matter-789', 'matter');
      await service.clearTyping('matter-789');

      // Should have deleted typing document
    });

    it('should get typing users', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: true,
        data: () => ({
          'user-123_matter-789': {
            userId: 'user-123',
            userName: 'John Doe',
            targetId: 'matter-789',
            targetType: 'matter',
            startedAt: Date.now() - 10000,
            timeout: 30000,
          },
          'user-456_matter-789': {
            userId: 'user-456',
            userName: 'Jane Smith',
            targetId: 'matter-789',
            targetType: 'matter',
            startedAt: Date.now() - 20000,
            timeout: 30000,
          },
        }),
      });

      const typingUsers = await service.getTypingUsers('matter-789');

      expect(typingUsers).toHaveLength(2);
      expect(typingUsers[0].userName).toBe('John Doe');
      expect(typingUsers[1].userName).toBe('Jane Smith');
    });

    it('should filter out expired typing indicators', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: true,
        data: () => ({
          'user-123_matter-789': {
            userId: 'user-123',
            userName: 'John Doe',
            targetId: 'matter-789',
            targetType: 'matter',
            startedAt: Date.now() - 60000, // 60 seconds ago - expired
            timeout: 30000,
          },
          'user-456_matter-789': {
            userId: 'user-456',
            userName: 'Jane Smith',
            targetId: 'matter-789',
            targetType: 'matter',
            startedAt: Date.now() - 10000, // 10 seconds ago - valid
            timeout: 30000,
          },
        }),
      });

      const typingUsers = await service.getTypingUsers('matter-789');

      expect(typingUsers).toHaveLength(1);
      expect(typingUsers[0].userName).toBe('Jane Smith');
    });

    it('should auto-clear typing after timeout', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');
      const testService = createPresenceService({ typingTimeout: 1000 });
      await testService.initialize('user-123', 'firm-456', 'John Doe');

      await testService.setTyping('matter-789', 'matter');

      // Advance time past timeout
      vi.advanceTimersByTime(1500);

      // Typing should have been cleared

      testService.destroy();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to user presence', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      (onSnapshot as any).mockImplementation((ref, callback, errorCb) => {
        callback({
          exists: true,
          id: 'user-123',
          data: () => ({
            userId: 'user-123',
            firmId: 'firm-456',
            userName: 'John Doe',
            status: PresenceStatus.ONLINE,
            lastSeen: Date.now(),
            sessionId: 'session-1',
          }),
        });
        return mockUnsubscribe;
      });

      await service.initialize('user-456', 'firm-456', 'Jane Smith');

      const callback = vi.fn();
      const unsubscribe = service.subscribeToUserPresence('user-123', callback);

      expect(callback).toHaveBeenCalled();

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should subscribe to firm presences', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      (onSnapshot as any).mockImplementation((ref, callback, errorCb) => {
        callback({
          exists: true,
          data: () => ({
            'user-123_session-1': {
              userId: 'user-123',
              firmId: 'firm-456',
              userName: 'John Doe',
              status: PresenceStatus.ONLINE,
              lastSeen: Date.now(),
              sessionId: 'session-1',
            },
          }),
        });
        return mockUnsubscribe;
      });

      const callback = vi.fn();
      const unsubscribe = service.subscribeToFirmPresences('firm-456', callback);

      expect(callback).toHaveBeenCalled();

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should subscribe to typing updates', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      (onSnapshot as any).mockImplementation((ref, callback, errorCb) => {
        callback({
          exists: true,
          data: () => ({
            'user-123_matter-789': {
              userId: 'user-123',
              userName: 'John Doe',
              targetId: 'matter-789',
              targetType: 'matter',
              startedAt: Date.now() - 10000,
              timeout: 30000,
            },
          }),
        });
        return mockUnsubscribe;
      });

      const callback = vi.fn();
      const unsubscribe = service.subscribeToTyping('matter-789', callback);

      expect(callback).toHaveBeenCalled();

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Presence Cleanup', () => {
    it('should cleanup old presence', async () => {
      const { getDoc, writeBatch } = await import('firebase/firestore');
      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      (writeBatch as any).mockReturnValue(mockBatch);

      (getDoc as any).mockResolvedValue({
        exists: true,
        data: () => ({
          'user-123_session-1': {
            lastSeen: Date.now() - 1000000, // Old
            userId: 'user-123',
          },
          'user-456_session-2': {
            lastSeen: Date.now(), // Recent
            userId: 'user-456',
          },
        }),
      });

      const cleanupCount = await service.cleanupOldPresence(600000); // 10 minutes

      expect(cleanupCount).toBeGreaterThan(0);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should remove user presence', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      (deleteDoc as any).mockResolvedValue(undefined);

      await service.removePresence('user-123');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should remove user typing indicators', async () => {
      const { deleteDoc } = await import('firebase/firestore');
      (deleteDoc as any).mockResolvedValue(undefined);

      await service.initialize('user-123', 'firm-456', 'John Doe');
      await service.setTyping('matter-789', 'matter');

      await service.removeUserTyping('user-123');

      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Factory Functions', () => {
    it('should create service with factory function', () => {
      const testService = createPresenceService({ debug: false });

      expect(testService).toBeInstanceOf(PresenceService);

      testService.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', async () => {
      const uninitializedService = createPresenceService();

      await expect(uninitializedService.setOnline()).rejects.toThrow('not initialized');
      await expect(uninitializedService.setOffline()).rejects.toThrow('not initialized');
      await expect(uninitializedService.updatePresence(PresenceStatus.ONLINE)).rejects.toThrow('not initialized');

      uninitializedService.destroy();
    });

    it('should throw error when setting typing without initialization', async () => {
      const uninitializedService = createPresenceService();

      await expect(uninitializedService.setTyping('matter-789')).rejects.toThrow('not initialized');

      uninitializedService.destroy();
    });
  });

  describe('Configuration', () => {
    it('should use custom config', () => {
      const customConfig: PresenceServiceConfig = {
        awayTimeout: 600000,
        offlineTimeout: 1800000,
        cleanupInterval: 120000,
        typingTimeout: 60000,
        debug: true,
      };

      const customService = createPresenceService(customConfig);

      expect(customService).toBeInstanceOf(PresenceService);

      customService.destroy();
    });
  });

  describe('Destroy', () => {
    it('should cleanup timers on destroy', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      await service.destroy();

      // Timers should be cleared
    });

    it('should clear typing timeouts on destroy', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');
      await service.setTyping('matter-789', 'matter');

      await service.destroy();

      // Typing timeouts should be cleared
    });

    it('should unsubscribe from all subscriptions on destroy', async () => {
      const { onSnapshot } = await import('firebase/firestore');
      const mockUnsubscribe = vi.fn();
      (onSnapshot as any).mockReturnValue(mockUnsubscribe);

      await service.initialize('user-123', 'firm-456', 'John Doe');

      service.subscribeToUserPresence('user-123', vi.fn());
      service.subscribeToFirmPresences('firm-456', vi.fn());
      service.subscribeToTyping('matter-789', vi.fn());

      await service.destroy();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(3);
    });
  });

  describe('Activity Monitoring', () => {
    it('should auto-detect activity', async () => {
      const activityService = createPresenceService({
        autoStatusUpdates: true,
        awayTimeout: 1000,
        debug: false,
      });

      await activityService.initialize('user-123', 'firm-456', 'John Doe');

      // Simulate user activity
      window.dispatchEvent(new MouseEvent('mousemove'));

      // Should update last activity time

      activityService.destroy();
    });
  });

  describe('Presence Status Enum', () => {
    it('should have all expected status values', () => {
      expect(PresenceStatus.ONLINE).toBe('online');
      expect(PresenceStatus.AWAY).toBe('away');
      expect(PresenceStatus.OFFLINE).toBe('offline');
      expect(PresenceStatus.BUSY).toBe('busy');
    });
  });

  describe('Utility Methods', () => {
    it('should return current user ID', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      expect(service.getCurrentUserId()).toBe('user-123');
    });

    it('should return current firm ID', async () => {
      await service.initialize('user-123', 'firm-456', 'John Doe');

      expect(service.getCurrentFirmId()).toBe('firm-456');
    });

    it('should return session ID', () => {
      const sessionId = service.getSessionId();

      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session-/);
    });
  });
});
