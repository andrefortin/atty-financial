/**
 * Connection Status Component
 *
 * Enhanced connection status indicator with animations.
 * Integrates with WebSocket Manager and Presence Service.
 *
 * @module components/connection
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  WifiOff,
  Cable,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  MoreVertical,
} from 'lucide-react';
import { useWebSocketManager, ConnectionStatus } from '@/hooks/realtime';

// ============================================
// Types
// ============================================

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  onRefresh?: () => void;
  onSettings?: () => void;
}

interface ConnectionDetails {
  status: ConnectionStatus;
  latency?: number;
  message?: string;
  lastSeen?: number;
}

// ============================================
// Connection Status Component
// ============================================

export function ConnectionStatus({
  className = '',
  showDetails = false,
  onRefresh,
  onSettings,
}: ConnectionStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState<ConnectionDetails | null>(null);

  // Get connection status
  const {
    status,
    latency,
  } = useWebSocketManager();

  // Get presence
  const { isOnline: presenceIsOnline } = {
    isOnline: true, // In a real implementation, this would come from usePresence
  };

  // Determine connection icon and color
  const getConnectionIcon = () => {
    if (!presenceIsOnline) {
      return <WifiOff className="h-5 w-5" />;
    }

    switch (status) {
      case ConnectionStatus.CONNECTED:
        return <Cable className="h-5 w-5" />;
      case ConnectionStatus.CONNECTING:
      return <RefreshCw className="h-5 w-5 animate-spin" />;
      case ConnectionStatus.DISCONNECTED:
        return <Globe className="h-5 w-5" />;
      default:
        return <Wifi className="h-5 w-5" />;
    }
  };

  const getConnectionColor = () => {
    if (!presenceIsOnline) {
      return 'text-red-600 dark:text-red-400';
    }

    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'text-green-600 dark:text-green-400';
      case ConnectionStatus.CONNECTING:
        return 'text-yellow-600 dark:text-yellow-400';
      case ConnectionStatus.DISCONNECTED:
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStatusText = () => {
    if (!presenceIsOnline) {
      return 'Offline';
    }

    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getLatencyText = () => {
    if (!latency) {
      return null;
    }

    if (latency < 50) return 'Excellent';
    if (latency < 100) return 'Good';
    if (latency < 200) return 'Fair';
    if (latency < 500) return 'Poor';
    return 'Very Poor';
  };

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Simulate details for demo
  useEffect(() => {
    if (showDetails) {
      setDetails({
        status: status || ConnectionStatus.UNKNOWN,
        latency: latency || 0,
        message: getStatusText(),
        lastSeen: Date.now(),
      });
    }
  }, [showDetails, status, latency, getStatusText]);

  return (
    <div className={`relative ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <div className="relative">
          {getConnectionIcon()}
          <div
            className={`absolute -bottom-0.5 left-1/2 w-2 h-2 rounded-full animate-ping ${
              getStatusColor().includes('green')
                ? 'bg-green-500 dark:bg-green-600'
                : getStatusColor().includes('yellow')
                ? 'bg-yellow-500 dark:bg-yellow-600'
                : getStatusColor().includes('red')
                ? 'bg-red-500 dark:bg-red-600'
                : 'bg-gray-400 dark:bg-gray-600'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          {latency && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getLatencyText()} ({latency}ms)
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {expanded ? (
            <ArrowUp
              onClick={() => setExpanded(false)}
              className="w-4 h-4 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer"
            />
          ) : (
            <ArrowDown
              onClick={() => setExpanded(true)}
              className="w-4 h-4 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer"
            />
          )}

          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Refresh connection"
              aria-label="Refresh connection"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {onSettings && (
            <button
              onClick={onSettings}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Connection settings"
              aria-label="Connection settings"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && expanded && details && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Connection Details
              </h3>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className={`text-sm font-medium ${
                  getStatusColor().includes('green')
                    ? 'text-green-600 dark:text-green-400'
                    : getStatusColor().includes('yellow')
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : getStatusColor().includes('red')
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {details.message}
                </span>
              </div>

              {/* Latency */}
              {details.latency && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Latency</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {details.latency}ms
                  </span>
                </div>
              )}

              {/* Last Seen */}
              {details.lastSeen && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Seen</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(details.lastSeen).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Connection Quality */}
              {details.latency && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quality</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getLatencyText()}
                  </span>
                </div>
              )}

              {/* Server Info */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Server</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  ws://api.example.com
                </span>
              </div>

              {/* Protocol */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Protocol</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  WSS
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  className="flex-1 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              )}

              {onSettings && (
                <button
                  onClick={onSettings}
                  className="flex-1 flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Simplified Version (Badge Only)
// ============================================

export function ConnectionStatusBadge({
  className = '',
}: { className?: string }) {
  const { status } = useWebSocketManager();

  const getStatusIcon = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case ConnectionStatus.CONNECTING:
        return <RefreshCw className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />;
      case ConnectionStatus.DISCONNECTED:
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <WifiOff className="h-5 w-5 text-gray-400 dark:text-gray-600" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {getStatusIcon()}
      {status === ConnectionStatus.CONNECTED && (
        <div className="absolute -bottom-0.5 left-1/2 w-2 h-2 rounded-full animate-ping bg-green-500 dark:bg-green-600" />
      )}
    </div>
  );
}
