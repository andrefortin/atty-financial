/**
 * Session Manager
 *
 * Session timeout tracking and token refresh logic.
 *
 * @module utils/sessionManager
 */

import { useEffect, useState, useRef, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface SessionConfig {
  timeoutMs: number;
  refreshThresholdMs: number;
}

export interface SessionState {
  isActive: boolean;
  lastActivity: number;
  timeoutExpired: boolean;
}

// ============================================
// Constants
// ============================================

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeoutMs: 30 * 60 * 1000, // 30 minutes
  refreshThresholdMs: 5 * 60 * 1000, // 5 minutes before timeout
};

// ============================================
// Session Manager Class
// ============================================

class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = true;
  private config: SessionConfig;
  private onTimeout?: () => void;
  private onActivity?: () => void;

  constructor(config: SessionConfig = DEFAULT_SESSION_CONFIG) {
    this.config = config;
    this.startSession();
  }

  /**
   * Start the session timer
   */
  private startSession = (): void => {
    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout
    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, this.config.timeoutMs);
  };

  /**
   * Handle session timeout
   */
  private handleTimeout = (): void => {
    this.isActive = false;
    this.timeoutExpired = true;

    if (this.onTimeout) {
      this.onTimeout();
    }
  };

  /**
   * Update last activity timestamp
   */
  public updateActivity = (): void => {
    this.lastActivity = Date.now();
    this.isActive = true;
    this.timeoutExpired = false;

    // Restart session timer
    this.startSession();

    if (this.onActivity) {
      this.onActivity();
    }
  };

  /**
   * Check if session is active
   */
  public isActiveSession = (): boolean => {
    return this.isActive;
  };

  /**
   * Check if timeout has expired
   */
  public isTimeoutExpired = (): boolean => {
    return this.timeoutExpired;
  };

  /**
   * Get time until timeout
   */
  public getTimeUntilTimeout = (): number => {
    const timeLeft = this.config.timeoutMs - (Date.now() - this.lastActivity);
    return Math.max(0, timeLeft);
  };

  /**
   * Get time since last activity
   */
  public getTimeSinceLastActivity = (): number => {
    return Date.now() - this.lastActivity;
  };

  /**
   * Check if token should be refreshed
   */
  public shouldRefreshToken = (): boolean => {
    const timeSinceLastActivity = Date.now() - this.lastActivity;
    return timeSinceLastActivity >= this.config.refreshThresholdMs;
  };

  /**
   * Set timeout callback
   */
  public setTimeoutCallback = (callback: () => void): void => {
    this.onTimeout = callback;
  };

  /**
   * Set activity callback
   */
  public setActivityCallback = (callback: () => void): void => {
    this.onActivity = callback;
  };

  /**
   * Reset session
   */
  public resetSession = (): void => {
    this.isActive = true;
    this.timeoutExpired = false;
    this.lastActivity = Date.now();
    this.startSession();
  };

  /**
   * Destroy session
   */
  public destroy = (): void => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = null;
    this.onTimeout = undefined;
    this.onActivity = undefined;
  };
}

// ============================================
// Singleton Instance
// ============================================

let sessionManagerInstance: SessionManager | null = null;

/**
 * Get or create session manager instance
 */
export const getSessionManager = (config?: SessionConfig): SessionManager => {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(config);
  }
  return sessionManagerInstance;
};

/**
 * Reset session manager instance
 */
export const resetSessionManager = (): void => {
  if (sessionManagerInstance) {
    sessionManagerInstance.destroy();
    sessionManagerInstance = null;
  }
};

// ============================================
// React Hook
// ============================================

/**
 * Session timeout hook
 *
 * Tracks user activity and handles session timeout.
 *
 * @param timeoutMs - Timeout in milliseconds (default: 30 minutes)
 * @returns Session state and callbacks
 *
 * @example
 * ```typescript
 * const { isActive, timeoutExpired } = useSessionTimeout(30 * 60 * 1000);
 *
 * useEffect(() => {
 *   const handleActivity = () => {
 *     // User is active
 *   };
 *
 *   window.addEventListener('mousemove', handleActivity);
 *   window.addEventListener('keydown', handleActivity);
 *
 *   return () => {
 *     window.removeEventListener('mousemove', handleActivity);
 *     window.removeEventListener('keydown', handleActivity);
 *   };
 * }, []);
 * ```
 */
export const useSessionTimeout = (
  timeoutMs: number = DEFAULT_SESSION_CONFIG.timeoutMs
): SessionState => {
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: true,
    lastActivity: Date.now(),
    timeoutExpired: false,
  });

  const sessionManager = useRef<SessionManager | null>(null);

  useEffect(() => {
    // Initialize session manager
    if (!sessionManager.current) {
      sessionManager.current = getSessionManager({
        timeoutMs,
      });

      // Set callbacks
      sessionManager.current.setTimeoutCallback(() => {
        setSessionState(prev => ({
          ...prev,
          isActive: false,
          timeoutExpired: true,
        }));
      });

      sessionManager.current.setActivityCallback(() => {
        setSessionState(prev => ({
          ...prev,
          isActive: true,
          timeoutExpired: false,
        }));
      });
    }

    // Track user activity
    const handleActivity = () => {
      sessionManager.current?.updateActivity();
    };

    // Track various user activity events
    const events = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
      'keypress',
    ];

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Update last activity on mount
    sessionManager.current?.updateActivity();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeoutMs]);

  return sessionState;
};

// ============================================
// Token Refresh Hook
// ============================================

/**
 * Token refresh hook
 *
 * Handles automatic token refresh before expiration.
 *
 * @param onRefresh - Callback when token should be refreshed
 * @param thresholdMs - Refresh threshold in milliseconds (default: 5 minutes)
 *
 * @example
 * ```typescript
 * const { shouldRefresh } = useTokenRefresh(async () => {
 *   const newToken = await refreshToken();
 *   return newToken;
 * }, 5 * 60 * 1000);
 * ```
 */
export const useTokenRefresh = (
  onRefresh: () => Promise<string | null>,
  thresholdMs: number = DEFAULT_SESSION_CONFIG.refreshThresholdMs
): { shouldRefresh: boolean; refreshing: boolean } => {
  const [refreshing, setRefreshing] = useState(false);

  const shouldRefresh = useCallback(() => {
    const sessionManager = getSessionManager();
    return sessionManager.shouldRefreshToken();
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      const newToken = await onRefresh();
      if (newToken) {
        // Update session manager with new token
        const sessionManager = getSessionManager();
        sessionManager.resetSession();
      }
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  return {
    shouldRefresh,
    refreshing,
  };
};

// ============================================
// Export
// ============================================

export type { SessionConfig, SessionState };
