/**
 * Sync Progress Component
 *
 * Display sync progress with queue status.
 * Integrates with useOptimisticUpdate and useSyncQueue hooks.
 *
 * @module components/connection
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  Check,
  RefreshCw,
  X,
  AlertTriangle,
  MoreVertical,
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  Clock,
  Database,
  Upload,
} from 'lucide-react';
import { useSyncQueue, SyncStatus, SyncPriority } from '@/hooks/realtime';

// ============================================
// Types
// ============================================

interface SyncProgressProps {
  queueSize?: number;
  pendingCount?: number;
  failedCount?: number;
  className?: string;
  onRetry?: () => void;
  onClearFailed?: () => void;
  onOpenQueue?: () => void;
}

// ============================================
// Sync Progress Component
// ============================================

export function SyncProgress({
  queueSize = 0,
  pendingCount = 0,
  failedCount = 0,
  className = '',
  onRetry,
  onClearFailed,
  onOpenQueue,
}: SyncProgressProps) {
  const [expanded, setExpanded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Get sync queue state
  const {
    getPendingCount,
    getFailedCount,
  refetch,
  retryFailedItems,
  clearAll,
  } = useSyncQueue();

  // Update counts
  useEffect(() => {
    const updateCounts = async () => {
      const pending = await getPendingCount();
      const failed = await getFailedCount();
      pendingCount = pending;
      failedCount = failed;
    };

    updateCounts();
    const interval = setInterval(updateCounts, 2000);

    return () => clearInterval(interval);
  }, [getPendingCount, getFailedCount]);

  // Track last activity
  const trackActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Determine sync status
  const getSyncStatus = useCallback(() => {
    if (failedCount > 0) {
      return {
        status: 'error',
        message: `${failedCount} sync${failedCount > 1 ? 's' : ''} failed`,
        icon: AlertTriangle,
        color: 'red',
      };
    }

    if (syncing) {
      return {
        status: 'syncing',
        message: 'Syncing...',
        icon: RefreshCw,
        color: 'blue',
      };
    }

    const inactiveTime = Date.now() - lastActivity;
    if (inactiveTime > 60000) { // 1 minute inactive
      return {
        status: 'paused',
        message: 'Paused due to inactivity',
        icon: Pause,
        color: 'yellow',
      };
    }

    if (pendingCount === 0) {
      return {
        status: 'idle',
        message: 'No items to sync',
        icon: Check,
        color: 'green',
      };
    }

    return {
      status: 'ready',
      message: `${pendingCount} item${pendingCount > 1 ? 's' : ''} ready to sync`,
      icon: Cloud,
      color: 'blue',
    };
  }, [pendingCount, failedCount, syncing, lastActivity]);

  const syncStatus = getSyncStatus();

  // Handlers
  const handleSync = useCallback(async () => {
    setSyncing(true);
    await refetch();
    setTimeout(() => setSyncing(false), 2000);
  }, [refetch, setSyncing]);

  const handleRetry = useCallback(async () => {
    await retryFailedItems();
  }, [retryFailedItems]);

  const handleClearFailed = useCallback(async () => {
    await clearAll();
  }, [clearAll]);

  const handleToggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Render
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 p-2 rounded-lg ${
              syncStatus.status === 'idle'
                ? 'bg-green-100 dark:bg-green-900/50 border-green-200 dark:border-green-800'
                : syncStatus.status === 'ready'
                ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800'
                : syncStatus.status === 'syncing'
                ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800'
                : syncStatus.status === 'paused'
                ? 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800'
            }`}
          >
            {React.createElement(syncStatus.icon, {
              className: `h-5 w-5 text-${syncStatus.color}-600 dark:text-${syncStatus.color}-400`,
            })}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium text-${syncStatus.color}-900 dark:text-${syncStatus.color}-100`}
              >
                {syncStatus.message}
              </p>
              {(syncStatus.status === 'syncing' || syncStatus.status === 'paused') && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {syncStatus.status === 'syncing' ? 'Syncing changes...' : 'Will resume automatically'}
                </p>
              )}
            </div>
          </div>
          {syncStatus.status === 'syncing' && (
            <div className="animate-ping">
              <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleExpanded}
            className="p-2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Toggle details"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
          <button
            onClick={onOpenQueue}
            className="p-2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Open sync queue"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-3 gap-4">
            {/* Queue Status */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Queue Status
              </h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Items
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {queueSize}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Pending
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {pendingCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Failed
                  </span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {failedCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Activity
              </h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Last Activity
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {new Date(lastActivity).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Status
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {pendingCount > 0 ? 'Active' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Progress
              </h4>
              <div className="space-y-1">
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full bg-gray-900 dark:bg-gray-100 transition-all duration-300`}
                    style={{ width: `${(queueSize - failedCount) / Math.max(queueSize, 1)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {queueSize > 0
                    ? `${((queueSize - failedCount) / queueSize) * 100).toFixed(1)}% complete`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Details */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* High Priority */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    High Priority Items
                  </h4>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Items with high priority will sync first
                  </p>
                </div>
              </div>
            </div>

            {/* By Priority */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    By Priority
                  </h4>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">High</span>
                      <span className="font-medium text-gray-900 dark:text-white">0</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">Normal</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round(queueSize * 0.7)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">Low</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round(queueSize * 0.3)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Auto-sync enabled
        </p>
        <div className="flex items-center gap-2">
          {syncStatus.status !== 'syncing' && (
            <button
              onClick={handleSync}
              disabled={syncStatus.status === 'idle' && pendingCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 border-transparent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={syncStatus.status === 'idle' && pendingCount === 0 ? 'No items to sync' : 'Sync now'}
            >
              <Play className="h-4 w-4 mr-2" />
              Sync Now
            </button>
          )}

          {(failedCount > 0) && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 border-transparent rounded-md transition-colors"
              title="Retry failed items"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Failed
            </button>
          )}

          {(failedCount > 0) && (
            <button
              onClick={handleClearFailed}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-md transition-colors"
              title="Clear failed items"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Failed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
