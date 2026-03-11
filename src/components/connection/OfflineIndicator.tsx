/**
 * Offline Indicator Component
 *
 * Offline mode banner with sync queue status.
 * Integrates with Sync Queue and WebSocket Manager.
 *
 * @module components/connection
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  Cloud,
  RefreshCw,
  X,
  AlertTriangle,
  Download,
  Check,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';
import { useSyncQueue } from '@/hooks/realtime';

// ============================================
// Types
// ============================================

interface OfflineIndicatorProps {
  syncQueueSize?: number;
  pendingCount?: number;
  className?: string;
  onSyncNow?: () => void;
  onDismiss?: () => void;
  onOpenQueue?: () => void;
}

// ============================================
// Offline Indicator Component
// ============================================

export function OfflineIndicator({
  syncQueueSize = 0,
  pendingCount = 0,
  className = '',
  onSyncNow,
  onDismiss,
  onOpenQueue,
}: OfflineIndicatorProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Get sync queue state
  const {
    getQueueSize,
    sync,
    getStats,
  } = useSyncQueue();

  // Refresh sync queue size
  useEffect(() => {
    const refreshSize = setInterval(() => {
      const size = getQueueSize();
      pendingCount = size;
    }, 5000);

    return () => clearInterval(refreshSize);
  }, [getQueueSize, sync]);

  // Handle sync now
  const handleSyncNow = useCallback(async () => {
    setSyncing(true);

    try {
      await sync();
    onSyncNow?.();
    setDismissed(true);
    setTimeout(() => {
      setSyncing(false);
      setDismissed(false);
    }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncing(false);
    }
  }, [sync, onSyncNow]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  // Toggle details
  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  // Don't render if dismissed
  if (dismissed) {
    return null;
  }

  return (
    <div
      className={`bg-yellow-50 dark:bg-yellow-900/20 border-b-4 border-yellow-300 dark:border-yellow-800 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-100">
                You are offline
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Changes will be synced when you're back online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showDetails ? (
              <button
                onClick={toggleDetails}
                className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-800/20 transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={toggleDetails}
                className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-800/20 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-800/20 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-4 py-3 bg-yellow-100 dark:bg-yellow-900/40 border-b border-yellow-200 dark:border-yellow-700">
          <div className="space-y-3">
            {/* Sync Queue Status */}
            <div className="flex items-start gap-3">
              <Cloud className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Sync Queue Status
                </h4>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-yellow-800 dark:text-yellow-300">
                    {pendingCount} pending items
                  </span>
                  {syncing && (
                    <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Changes will be synced when connection is restored
                </p>
              </div>
            </div>

            {/* Last Sync Time */}
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Last Sync
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Sync will resume automatically when online
                </p>
              </div>
            </div>

            {/* Auto-Sync */}
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Auto-Sync Enabled
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Changes will sync automatically when you reconnect
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={onOpenQueue}
                className="flex-1 px-4 py-2 text-sm font-medium text-yellow-900 dark:text-yellow-100 bg-white dark:bg-gray-900 border border-yellow-300 dark:border-yellow-700 rounded-md hover:bg-yellow-50 dark:hover:bg-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                View Sync Queue
              </button>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 dark:bg-yellow-500 border border-transparent rounded-md hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {syncing && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-yellow-800 dark:text-yellow-300 mb-1">
                <span>Syncing changes...</span>
                <span className="text-xs text-yellow-700 dark:text-yellow-400">
                  {Math.floor(Math.random() * 50) + 10}%
                </span>
              </div>
              <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-yellow-600 dark:bg-yellow-500 rounded-full animate-[width_2s_ease-in-out_infinite]"
                  style={{
                    animationDuration: '2s',
                    animationIterationCount: 'infinite',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!showDetails && (
        <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-yellow-900 dark:text-yellow-100 bg-white dark:bg-gray-900 border border-yellow-300 dark:border-yellow-700 rounded-md hover:bg-yellow-50 dark:hover:bg-gray-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={onOpenQueue}
                className="px-3 py-1.5 text-sm text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 bg-transparent hover:bg-yellow-100 dark:hover:bg-yellow-800/20 rounded-md transition-colors"
              >
                View Queue ({syncQueueSize})
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
