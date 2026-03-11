/**
 * WebSocket Manager Tests
 *
 * Unit tests for WebSocketManager class
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebSocketManager,
  createWebSocketManager,
  WebSocketError,
  ConnectionStatus,
  type WebSocketMessage,
  type ConnectionState,
  type WebSocketOptions,
} from '../webSocketManager';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  protocols?: string | string[];

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private sentMessages: string[] = [];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;

    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
  }

  // Test helpers
  simulateMessage(data: any): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateClose(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason, wasClean: true }));
  }

  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  getLastSentMessage(): any {
    const last = this.sentMessages[this.sentMessages.length - 1];
    return last ? JSON.parse(last) : null;
  }

  getAllSentMessages(): any[] {
    return this.sentMessages.map(msg => JSON.parse(msg));
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketManager', () => {
  let manager: WebSocketManager;
  const testUrl = 'ws://localhost:8080';

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new WebSocketManager({
      url: testUrl,
      debug: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    manager.destroy();
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected status', () => {
      const state = manager.getState();
      expect(state.status).toBe(ConnectionStatus.DISCONNECTED);
      expect(state.url).toBe(testUrl);
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should connect successfully', async () => {
      await manager.connect();

      const state = manager.getState();
      expect(state.status).toBe(ConnectionStatus.HANDSHAKE);
      expect(manager.isConnected()).toBe(false); // WebSocket OPEN but status HANDSHAKE
    });

    it('should update status to CONNECTED after handshake', async () => {
      await manager.connect();

      // Simulate receiving a message to complete handshake
      const ws = (manager as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: 'handshake',
        type: 'handshake',
        payload: { connectionId: 'conn-123' },
        timestamp: Date.now(),
      });

      const state = manager.getState();
      expect(state.status).toBe(ConnectionStatus.CONNECTED);
    });

    it('should disconnect', async () => {
      await manager.connect();
      manager.disconnect(1000, 'Test disconnect');

      const state = manager.getState();
      expect(state.status).toBe(ConnectionStatus.CLOSED);
    });

    it('should handle connection timeout', async () => {
      const timeoutManager = new WebSocketManager({
        url: testUrl,
        connectionTimeout: 100,
        debug: false,
      });

      // Make WebSocket never open
      (global.WebSocket as any).mockImplementation(() => ({
        readyState: MockWebSocket.CONNECTING,
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        send: vi.fn(),
        close: vi.fn(),
      }));

      await expect(timeoutManager.connect()).rejects.toThrow('Connection timeout');

      timeoutManager.destroy();
    });

    it('should call onConnect callback', async () => {
      const onConnect = vi.fn();
      const testManager = new WebSocketManager({
        url: testUrl,
        onConnect,
        debug: false,
      });

      await testManager.connect();

      // Simulate handshake complete
      const ws = (testManager as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: 'handshake',
        type: 'handshake',
        payload: {},
        timestamp: Date.now(),
      });

      expect(onConnect).toHaveBeenCalled();

      testManager.destroy();
    });
  });

  describe('Message Handling', () => {
    it('should send message', async () => {
      await manager.connect();

      const sent = manager.send('test:message', { data: 'hello' });
      expect(sent).toBe(true);

      const ws = (manager as any).ws as MockWebSocket;
      const sentMsg = ws.getLastSentMessage();

      expect(sentMsg.type).toBe('test:message');
      expect(sentMsg.payload).toEqual({ data: 'hello' });
      expect(sentMsg.id).toBeDefined();
      expect(sentMsg.timestamp).toBeDefined();
    });

    it('should not send when disconnected', () => {
      const sent = manager.send('test:message', { data: 'hello' });
      expect(sent).toBe(false);
    });

    it('should send with acknowledgment', async () => {
      await manager.connect();

      const promise = manager.sendWithAck({
        type: 'test:request',
        payload: { action: 'ping' },
        timeout: 5000,
      });

      const ws = (manager as any).ws as MockWebSocket;
      const sentMsg = ws.getLastSentMessage();

      expect(sentMsg.requiresAck).toBe(true);

      // Simulate acknowledgment
      ws.simulateMessage({
        id: 'ack-1',
        type: 'ack',
        payload: {
          messageId: sentMsg.id,
          success: true,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });

      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('should handle acknowledgment timeout', async () => {
      await manager.connect();

      const promise = manager.sendWithAck({
        type: 'test:request',
        payload: { action: 'ping' },
        timeout: 100,
      });

      // Advance time past timeout
      vi.advanceTimersByTime(150);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Acknowledgment timeout');
    });

    it('should route messages to subscribers', async () => {
      const callback = vi.fn();

      await manager.connect();
      manager.subscribe('test:message', callback);

      const ws = (manager as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: 'msg-1',
        type: 'test:message',
        payload: { data: 'hello' },
        timestamp: Date.now(),
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        id: 'msg-1',
        type: 'test:message',
        payload: { data: 'hello' },
      }));
    });

    it('should route wildcard messages', async () => {
      const callback = vi.fn();

      await manager.connect();
      manager.subscribe('test:*', callback);

      const ws = (manager as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: 'msg-1',
        type: 'test:message',
        payload: {},
        timestamp: Date.now(),
      });

      ws.simulateMessage({
        id: 'msg-2',
        type: 'test:event',
        payload: {},
        timestamp: Date.now(),
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should send acknowledgment for messages that require it', async () => {
      await manager.connect();

      const ws = (manager as any).ws as MockWebSocket;
      ws.simulateMessage({
        id: 'msg-1',
        type: 'test:message',
        payload: {},
        timestamp: Date.now(),
        requiresAck: true,
      });

      const ackMsg = ws.getLastSentMessage();
      expect(ackMsg.type).toBe('ack');
      expect(ackMsg.payload.messageId).toBe('msg-1');
      expect(ackMsg.payload.success).toBe(true);
    });
  });

  describe('Subscription Management', () => {
    it('should add subscription', () => {
      const callback = vi.fn();
      const unsubscribe = manager.subscribe('test:message', callback);

      expect(typeof unsubscribe).toBe('function');

      const stats = manager.getSubscriptionStats();
      expect(stats.websocketSubscriptions).toBe(1);
    });

    it('should remove subscription', () => {
      const callback = vi.fn();
      const unsubscribe = manager.subscribe('test:message', callback);

      unsubscribe();

      const stats = manager.getSubscriptionStats();
      expect(stats.websocketSubscriptions).toBe(0);
    });

    it('should unsubscribe all', () => {
      manager.subscribe('test:1', vi.fn());
      manager.subscribe('test:2', vi.fn());
      manager.subscribe('test:3', vi.fn());

      manager.unsubscribeAll();

      const stats = manager.getSubscriptionStats();
      expect(stats.websocketSubscriptions).toBe(0);
    });
  });

  describe('Heartbeat Mechanism', () => {
    it('should send ping messages', async () => {
      const testManager = new WebSocketManager({
        url: testUrl,
        heartbeatInterval: 1000,
        debug: false,
      });

      await testManager.connect();

      const ws = (testManager as any).ws as MockWebSocket;

      // Clear initial state
      ws.sentMessages = [];

      // Advance time
      vi.advanceTimersByTime(1000);

      const sentMsg = ws.getLastSentMessage();
      expect(sentMsg.type).toBe('ping');

      testManager.destroy();
    });

    it('should handle pong and update latency', async () => {
      const testManager = new WebSocketManager({
        url: testUrl,
        heartbeatInterval: 1000,
        debug: false,
      });

      await testManager.connect();

      const ws = (testManager as any).ws as MockWebSocket;

      // Send pong in response to ping
      ws.simulateMessage({
        id: 'pong-1',
        type: 'pong',
        payload: { timestamp: Date.now() - 50 },
        timestamp: Date.now(),
      });

      const state = testManager.getState();
      expect(state.latency).toBeGreaterThan(0);

      testManager.destroy();
    });

    it('should stop heartbeat on disconnect', async () => {
      const testManager = new WebSocketManager({
        url: testUrl,
        heartbeatInterval: 1000,
        debug: false,
      });

      await testManager.connect();
      testManager.disconnect();

      const ws = (testManager as any).ws as MockWebSocket;
      ws.sentMessages = [];

      // Advance time - no ping should be sent
      vi.advanceTimersByTime(2000);

      expect(ws.sentMessages.length).toBe(0);

      testManager.destroy();
    });
  });

  describe('Auto-Reconnect', () => {
    it('should schedule reconnection on disconnect', async () => {
      const testManager = new WebSocketManager({
        url: testUrl,
        autoReconnect: true,
        reconnectDelay: 1000,
        debug: false,
      });

      await testManager.connect();

      const ws = (testManager as any).ws as MockWebSocket;
      ws.simulateClose(1006, 'Connection lost');

      const state = testManager.getState();
      expect(state.status).toBe(ConnectionStatus.RECONNECTING);

      testManager.destroy();
    });

    it('should not reconnect when disabled', async () => {
      const testManager = new WebSocketManager({
        url: testUrl,
        autoReconnect: false,
        debug: false,
      });

      await testManager.connect();

      const ws = (testManager as any).ws as MockWebSocket;
      ws.simulateClose(1006, 'Connection lost');

      const state = testManager.getState();
      expect(state.status).toBe(ConnectionStatus.DISCONNECTED);

      testManager.destroy();
    });

    it('should not reconnect on intentional disconnect', async () => {
      const testManager = new WebSocketManager({
        url: testUrl,
        autoReconnect: true,
        debug: false,
      });

      await testManager.connect();
      testManager.disconnect(1000, 'User logged out');

      const state = testManager.getState();
      expect(state.status).toBe(ConnectionStatus.CLOSED);

      testManager.destroy();
    });

    it('should respect max reconnect attempts', async () => {
      const testManager = new WebSocketManager({
        url: testUrl,
        autoReconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 100,
        debug: false,
      });

      await testManager.connect();

      const ws = (testManager as any).ws as MockWebSocket;

      // Simulate multiple failed reconnection attempts
      for (let i = 0; i < 5; i++) {
        ws.simulateClose(1006, 'Connection lost');
        vi.advanceTimersByTime(200);
      }

      const state = testManager.getState();
      expect(state.status).toBe(ConnectionStatus.CLOSED);
      expect(state.reconnectAttempts).toBeGreaterThan(3);

      testManager.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors', () => {
      const onError = vi.fn();
      const testManager = new WebSocketManager({
        url: testUrl,
        onError,
        debug: false,
      });

      testManager.connect();

      const ws = (testManager as any).ws as MockWebSocket;
      ws.simulateError();

      expect(onError).toHaveBeenCalled();

      testManager.destroy();
    });

    it('should handle parse errors', async () => {
      const onError = vi.fn();
      const testManager = new WebSocketManager({
        url: testUrl,
        onError,
        debug: false,
      });

      await testManager.connect();

      const ws = (testManager as any).ws as MockWebSocket;
      ws.onmessage?.(new MessageEvent('message', { data: 'invalid json' }));

      // Should not crash, error should be handled
      const state = testManager.getState();
      expect(state.status).toBe(ConnectionStatus.HANDSHAKE);

      testManager.destroy();
    });

    it('should reject pending acks on disconnect', async () => {
      await manager.connect();

      const promise = manager.sendWithAck({
        type: 'test:request',
        payload: {},
        timeout: 5000,
      });

      manager.disconnect(1000, 'Test');

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection closed');
    });
  });

  describe('State Management', () => {
    it('should return connection state', () => {
      const state = manager.getState();

      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('url');
      expect(state).toHaveProperty('reconnectAttempts');
    });

    it('should check connection status', () => {
      expect(manager.isConnected()).toBe(false);
      expect(manager.isConnecting()).toBe(false);
    });

    it('should call onStatusChange callback', () => {
      const onStatusChange = vi.fn();
      const testManager = new WebSocketManager({
        url: testUrl,
        onStatusChange,
        debug: false,
      });

      testManager.connect();

      expect(onStatusChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ConnectionStatus.CONNECTING,
        })
      );

      testManager.destroy();
    });
  });

  describe('Factory Functions', () => {
    it('should create manager with factory function', () => {
      const testManager = createWebSocketManager(testUrl, {
        debug: false,
      });

      expect(testManager).toBeInstanceOf(WebSocketManager);
      expect(testManager.getState().url).toBe(testUrl);

      testManager.destroy();
    });
  });

  describe('Statistics', () => {
    it('should return subscription statistics', () => {
      manager.subscribe('test:1', vi.fn());
      manager.subscribe('test:2', vi.fn());

      const stats = manager.getSubscriptionStats();

      expect(stats.websocketSubscriptions).toBe(2);
      expect(stats.firebaseSubscriptions).toBe(0);
      expect(stats.pendingAcks).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should destroy manager properly', async () => {
      await manager.connect();
      manager.subscribe('test:1', vi.fn());

      manager.destroy();

      const state = manager.getState();
      expect(state.status).toBe(ConnectionStatus.CLOSED);

      const stats = manager.getSubscriptionStats();
      expect(stats.websocketSubscriptions).toBe(0);
    });
  });

  describe('URL Building', () => {
    it('should add auth token to URL', () => {
      const testManager = new WebSocketManager({
        url: 'ws://localhost:8080',
        authToken: 'test-token',
        debug: false,
      });

      const state = testManager.getState();
      expect(state.url).toContain('token=test-token');

      testManager.destroy();
    });

    it('should add query parameters to URL', () => {
      const testManager = new WebSocketManager({
        url: 'ws://localhost:8080',
        queryParams: {
          clientId: 'client-123',
          room: 'general',
        },
        debug: false,
      });

      const state = testManager.getState();
      expect(state.url).toContain('clientId=client-123');
      expect(state.url).toContain('room=general');

      testManager.destroy();
    });
  });
});
