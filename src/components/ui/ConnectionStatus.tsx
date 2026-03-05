/**
 * Connection Status Component
 *
 * Visual indicator for real-time connection status.
 * Shows online/offline/pending states with toast notifications.
 *
 * @module components/ui/ConnectionStatus
 */

import React, { useEffect, useState } from 'react';
import { getRealtimeService } from '@/services/firebase/realtime.service';
import { useRealtimeConnection } from '@/hooks/useRealtime';
import { useToast } from '@/hooks/useToast';

// ============================================
// Types
// ============================================

type ConnectionStatus = 'online' | 'offline' | 'pending' | 'disconnected';

interface ConnectionStatusProps {
  /**
   * Position of the indicator
   * @default 'top-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /**
   * Size of the indicator
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether to show toast notifications
   * @default true
   */
  showToasts?: boolean;

  /**
   * Whether to show status text
   * @default true
   */
  showText?: boolean;
}

interface ConnectionStatusState {
  status: ConnectionStatus;
  lastChanged: number;
}

// ============================================
// Constants
// ============================================

const CONNECTION_STATUS_MESSAGES: Record<ConnectionStatus, string> = {
  online: 'Connected',
  offline: 'Offline',
  pending: 'Connecting...',
  disconnected: 'Disconnected',
};

const CONNECTION_STATUS_ICONS: Record<ConnectionStatus, string> = {
  online: '✅',
  offline: '🔴',
  pending: '⏳',
  disconnected: '🔌',
};

const CONNECTION_STATUS_COLORS: Record<ConnectionStatus, string> = {
  online: 'var(--color-success-green)',
  offline: 'var(--color-error-red)',
  pending: 'var(--color-warning-yellow)',
  disconnected: 'var(--color-warning-yellow)',
};

const SIZE_STYLES = {
  small: {
    width: '16px',
    height: '16px',
    fontSize: '12px',
  },
  medium: {
    width: '20px',
    height: '20px',
    fontSize: '14px',
  },
  large: {
    width: '24px',
    height: '24px',
    fontSize: '16px',
  },
};

const POSITION_STYLES = {
  'top-left': {
    top: '16px',
    left: '16px',
  },
  'top-right': {
    top: '16px',
    right: '16px',
  },
  'bottom-left': {
    bottom: '16px',
    left: '16px',
  },
  'bottom-right': {
    bottom: '16px',
    right: '16px',
  },
};

// ============================================
// Component
// ============================================

export function ConnectionStatus({
  position = 'top-right',
  size = 'medium',
  showToasts = true,
  showText = true,
}: ConnectionStatusProps): React.JSX.Element | null {
  const { toast } = useToast();

  // Get connection status
  const connectionStatus = useRealtimeConnection((status) => {
    // Connection status change notification
    if (showToasts && status === 'online') {
      toast.success('Connection restored', 'You are now online');
    } else if (showToasts && status === 'offline') {
      toast.warning('Connection lost', 'You are now offline. Changes will be saved locally.');
    } else if (showToasts && status === 'disconnected') {
      toast.error('Connection lost', 'You have been disconnected. Please check your internet connection.');
    }
  });

  return (
    <div
      className="connection-status"
      style={{
        position: 'fixed',
        ...POSITION_STYLES[position],
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
      }}
    >
      <div
        className="connection-indicator"
        style={{
          ...SIZE_STYLES[size],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: CONNECTION_STATUS_COLORS[connectionStatus],
          color: 'white',
        }}
      >
        {CONNECTION_STATUS_ICONS[connectionStatus]}
      </div>

      {showText && (
        <div
          className="connection-text"
          style={{
            fontSize: SIZE_STYLES[size].fontSize,
            fontWeight: '500',
            color: CONNECTION_STATUS_COLORS[connectionStatus],
          }}
        >
          {CONNECTION_STATUS_MESSAGES[connectionStatus]}
        </div>
      )}
    </div>
  );
}

/**
 * Simplified connection status indicator (no text)
 */
export function ConnectionIndicator({
  position = 'top-right',
  size = 'small',
}: Pick<ConnectionStatusProps, 'position' | 'size'>): React.JSX.Element | null {
  const connectionStatus = useRealtimeConnection();

  return (
    <div
      className="connection-indicator"
      style={{
        position: 'fixed',
        ...POSITION_STYLES[position],
        ...SIZE_STYLES[size],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: CONNECTION_STATUS_COLORS[connectionStatus],
        color: 'white',
        zIndex: 9999,
      }}
    >
      {CONNECTION_STATUS_ICONS[connectionStatus]}
    </div>
  );
}

/**
 * Full connection status bar (with text)
 */
export function ConnectionStatusBar({
  position = 'top-right',
  size = 'medium',
}: Pick<ConnectionStatusProps, 'position' | 'size'>): React.JSX.Element | null {
  const connectionStatus = useRealtimeConnection();

  return (
    <div
      className="connection-status-bar"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 0,
        ...POSITION_STYLES[position],
        padding: '8px 16px',
        backgroundColor: CONNECTION_STATUS_COLORS[connectionStatus],
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
      }}
    >
      <div
        className="connection-status-bar-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {CONNECTION_STATUS_ICONS[connectionStatus]}
        <span
          className="connection-status-text"
          style={{
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {CONNECTION_STATUS_MESSAGES[connectionStatus]}
        </span>
      </div>

      <div
        className="connection-status-bar-right"
        style={{
          fontSize: '12px',
          opacity: 0.8,
        }}
      >
        {connectionStatus}
      </div>
    </div>
  );
}

export default ConnectionStatus;

// ============================================
// Styles (CSS-in-JS)
// ============================================

const styles = `
  .connection-status {
    transition: all 0.3s ease-in-out;
  }

  .connection-indicator {
    transition: all 0.3s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .connection-indicator:hover {
    transform: scale(1.1);
  }

  .connection-text {
    transition: all 0.3s ease-in-out;
  }

  .connection-status-bar {
    transition: all 0.3s ease-in-out;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .connection-status-bar-left {
    transition: all 0.3s ease-in-out;
  }

  .connection-status-bar-right {
    transition: all 0.3s ease-in-out;
    text-transform: uppercase;
    font-weight: '500';
  }

  @media (max-width: 768px) {
    .connection-status-bar {
      padding: 4px 8px;
      font-size: 12px;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
