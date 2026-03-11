/**
 * Monitoring and Alerts Configuration
 *
 * Firebase Performance Monitoring, Firebase Crashlytics,
 * and Sentry integration for comprehensive monitoring.
 *
 * @module lib/monitoring
 */

// ============================================
// Types
// ============================================

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
  sentryDsn?: string;
  firebasePerformanceEnabled: boolean;
  firebaseCrashlyticsEnabled: boolean;
  customTracesEnabled: boolean;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  enabled: boolean;
  errorRateThreshold: number; // errors per minute
  errorRateWindowMs: number; // time window in ms
  performanceDegradationThreshold: number; // response time in ms
  apiFailureThreshold: number; // consecutive API failures
  webhookUrl?: string; // webhook for alerts
  slackWebhookUrl?: string; // Slack webhook for alerts
  emailRecipients?: string[]; // email recipients for alerts
}

/**
 * Performance trace
 */
export interface PerformanceTrace {
  name: string;
  startTime: number;
  attributes?: Record<string, string | number>;
}

/**
 * Error tracking data
 */
export interface ErrorData {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  tags?: Record<string, string>;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Monitoring metrics
 */
export interface MonitoringMetrics {
  errorCount: number;
  apiFailureCount: number;
  averageResponseTime: number;
  slowRequestCount: number;
  lastErrorTime: number | null;
  lastApiFailureTime: number | null;
}

// ============================================
// Monitoring Configuration
// ============================================

/**
 * Get monitoring configuration from environment
 */
export function getMonitoringConfig(): MonitoringConfig {
  const env = import.meta.env;

  return {
    enabled: env.VITE_MONITORING_ENABLED === 'true',
    environment: (env.VITE_APP_ENV as any) || 'development',
    sentryDsn: env.VITE_SENTRY_DSN,
    firebasePerformanceEnabled: env.VITE_FIREBASE_ANALYTICS_ENABLED === 'true',
    firebaseCrashlyticsEnabled: env.VITE_FIREBASE_ANALYTICS_ENABLED === 'true',
    customTracesEnabled: env.VITE_CUSTOM_TRACES_ENABLED === 'true',
  };
}

/**
 * Get alert configuration from environment
 */
export function getAlertConfig(): AlertConfig {
  const env = import.meta.env;

  return {
    enabled: env.VITE_ALERTING_ENABLED === 'true',
    errorRateThreshold: parseInt(env.VITE_ERROR_RATE_THRESHOLD || '10'),
    errorRateWindowMs: parseInt(env.VITE_ERROR_RATE_WINDOW_MS || '60000'), // 1 minute
    performanceDegradationThreshold: parseInt(env.VITE_PERFORMANCE_THRESHOLD_MS || '3000'), // 3 seconds
    apiFailureThreshold: parseInt(env.VITE_API_FAILURE_THRESHOLD || '3'),
    webhookUrl: env.VITE_WEBHOOK_URL,
    slackWebhookUrl: env.VITE_SLACK_WEBHOOK_URL,
    emailRecipients: env.VITE_EMAIL_RECIPIENTS?.split(',').map((e: string) => e.trim()),
  };
}

// ============================================
// Error Tracking
// ============================================

/**
 * Initialize error tracking (Sentry)
 */
export async function initializeErrorTracking(): Promise<void> {
  const config = getMonitoringConfig();

  if (!config.enabled) {
    console.info('Monitoring is disabled');
    return;
  }

  // Load Sentry SDK dynamically
  if (config.sentryDsn && import.meta.env.PROD) {
    try {
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: config.sentryDsn,
        environment: config.environment,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
          new Sentry.Feedback(),
        ],
        
        // Set sample rate for errors (only report 10% of errors in staging)
        tracesSampleRate: config.environment === 'production' ? 1.0 : 0.1,
        
        // Set session sample rate for replays
        replaysSessionSampleRate: config.environment === 'production' ? 0.1 : 0,
        
        // Enable performance monitoring
        beforeSend(event, hint) {
          // Don't send sensitive data
          if (event.request?.url) {
            const url = new URL(event.request.url);
            // Remove query parameters with sensitive data
            url.searchParams.forEach((value, key) => {
              if (key.toLowerCase().includes('token') ||
                  key.toLowerCase().includes('password') ||
                  key.toLowerCase().includes('secret')) {
                url.searchParams.delete(key);
              }
            });
            event.request.url = url.toString();
          }
          
          // Don't send in development
          if (config.environment === 'development') {
            return null;
          }
          
          return event;
        },
        
        // Filter out errors
        ignoreErrors: [
          // Ignore Axios errors (handled by application)
          /axios/i,
          // Ignore network errors (handled by application)
          /network/i,
          // Ignore 404 errors (expected in some cases)
          /404/i,
        ],
        
        // Environment-specific settings
        debug: config.environment === 'development',
        
        // User context
        initialScope: {
          tags: {
            environment: config.environment,
          },
        },
      });

      console.log('Sentry initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  } else {
    console.warn('Sentry DSN is not configured. Error tracking will use Firebase Crashlytics only.');
  }
}

/**
 * Track error
 */
export async function trackError(error: Error | unknown, context?: Record<string, any>): Promise<void> {
  const config = getMonitoringConfig();

  if (!config.enabled) {
    return;
  }

  const errorData: ErrorData = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: context || {},
    tags: {
      environment: config.environment,
    },
    level: getErrorLevel(error),
  };

  // Log error to console
  console.error('Error tracked:', errorData);

  // Send to Sentry
  if (config.sentryDsn && import.meta.env.PROD) {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureException(error, {
        contexts: { ...context },
        tags: errorData.tags,
        level: errorData.level,
      });
    } catch (error) {
      console.error('Failed to send error to Sentry:', error);
    }
  }

  // Increment error count
  incrementErrorCount();
}

/**
 * Track error with level
 */
export async function trackErrorWithLevel(
  error: Error | unknown,
  level: ErrorData['level'],
  context?: Record<string, any>
): Promise<void> {
  const config = getMonitoringConfig();

  if (!config.enabled) {
    return;
  }

  const errorData: ErrorData = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: context || {},
    tags: {
      environment: config.environment,
      level: level,
    },
    level: level,
  };

  // Log error to console
  console.error('Error tracked:', errorData);

  // Send to Sentry
  if (config.sentryDsn && import.meta.env.PROD) {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureException(error, {
        contexts: { ...context },
        tags: errorData.tags,
        level: level,
      });
    } catch (error) {
      console.error('Failed to send error to Sentry:', error);
    }
  }

  // Increment error count
  incrementErrorCount();
}

/**
 * Track warning
 */
export async function trackWarning(message: string, context?: Record<string, any>): Promise<void> {
  const config = getMonitoringConfig();

  if (!config.enabled) {
    return;
  }

  const errorData: ErrorData = {
    message: message,
    context: context || {},
    tags: {
      environment: config.environment,
      type: 'warning',
    },
    level: 'warning',
  };

  console.warn('Warning tracked:', errorData);

  if (config.sentryDsn && import.meta.env.PROD) {
    try {
      const Sentry = await import('@sentry/react');
      Sentry.captureMessage(message, {
        level: 'warning',
        contexts: { ...context },
        tags: errorData.tags,
      });
    } catch (error) {
      console.error('Failed to send warning to Sentry:', error);
    }
  }
}

/**
 * Get error level
 */
function getErrorLevel(error: unknown): ErrorData['level'] {
  // Fatal errors (should cause app to crash)
  if (error instanceof Error && isFatalError(error)) {
    return 'fatal';
  }

  // Error objects (most errors)
  if (error instanceof Error) {
    return 'error';
  }

  // Non-error objects (warnings)
  return 'warning';
}

/**
 * Check if error is fatal
 */
function isFatalError(error: Error): boolean {
  const fatalPatterns = [
    /quota/i,
    /limit/i,
    /forbidden/i,
    /permission/i,
    /authentication/i,
    /authorization/i,
  ];

  return fatalPatterns.some(pattern => pattern.test(error.message));
}

/**
 * Increment error count
 */
function incrementErrorCount(): void {
  // In-memory error count (for local alerts)
  const now = Date.now();
  const key = `errorCount_${Math.floor(now / 60000)}`; // Per minute
  
  const currentCount = parseInt(localStorage.getItem(key) || '0');
  localStorage.setItem(key, String(currentCount + 1));
}

/**
 * Get error count
 */
export function getErrorCount(): number {
  const now = Date.now();
  const key = `errorCount_${Math.floor(now / 60000)}`; // Current minute
  
  return parseInt(localStorage.getItem(key) || '0');
}

// ============================================
// Performance Monitoring
// ============================================

/**
 * Initialize Firebase Performance Monitoring
 */
export async function initializePerformanceMonitoring(): Promise<void> {
  const config = getMonitoringConfig();

  if (!config.enabled || !config.firebasePerformanceEnabled) {
    return;
  }

  try {
    const { getPerformance } = await import('firebase/performance');
    const perf = getPerformance();

    console.log('Firebase Performance initialized');
    return perf;
  } catch (error) {
    console.error('Failed to initialize Firebase Performance:', error);
  }
}

/**
 * Initialize Firebase Crashlytics
 */
export async function initializeCrashlytics(): Promise<void> {
  const config = getMonitoringConfig();

  if (!config.enabled || !config.firebaseCrashlyticsEnabled) {
    return;
  }

  try {
    const { getAnalytics } = await import('firebase/analytics');
    const analytics = getAnalytics();

    // Enable Crashlytics
    analytics.setAnalyticsCollectionEnabled(true);
    analytics.setUserIdEnabled(true);
    analytics.setSessionIdEnabled(true);

    console.log('Firebase Crashlytics initialized');
    return analytics;
  } catch (error) {
    console.error('Failed to initialize Firebase Crashlytics:', error);
  }
}

/**
 * Start performance trace
 */
export async function startPerformanceTrace(
  name: string,
  attributes?: Record<string, string | number>
): Promise<PerformanceTrace> {
  const config = getMonitoringConfig();

  if (!config.enabled || !config.customTracesEnabled) {
    return {
      name,
      startTime: Date.now(),
      attributes: attributes || {},
    };
  }

  try {
    const { getPerformance } = await import('firebase/performance');
    const perf = getPerformance();

    const trace = perf.trace(name);

    if (attributes) {
      trace.putAttribute('screen', window.location.pathname);
      Object.entries(attributes).forEach(([key, value]) => {
        trace.putAttribute(key, String(value));
      });
    }

    trace.start();

    return {
      name,
      startTime: Date.now(),
      attributes,
      trace,
    };
  } catch (error) {
    console.error('Failed to start performance trace:', error);

    return {
      name,
      startTime: Date.now(),
      attributes: attributes || {},
    };
  }
}

/**
 * Stop performance trace
 */
export async function stopPerformanceTrace(
  perfTrace: PerformanceTrace
): Promise<number> {
  if (!perfTrace.trace) {
    return Date.now() - perfTrace.startTime;
  }

  try {
    perfTrace.trace.stop();

    const duration = Date.now() - perfTrace.startTime;

    // Check if trace is slow
    const config = getAlertConfig();
    if (config.enabled && duration > config.performanceDegradationThreshold) {
      trackWarning(`Slow request: ${perfTrace.name} (${duration}ms)`, {
        duration,
        threshold: config.performanceDegradationThreshold,
        performanceTrace: perfTrace.name,
      });

      await checkPerformanceDegradation(duration);
    }

    return duration;
  } catch (error) {
    console.error('Failed to stop performance trace:', error);
    return Date.now() - perfTrace.startTime;
  }
}

/**
 * Record performance metric
 */
export async function recordPerformanceMetric(
  name: string,
  value: number,
  attributes?: Record<string, string | number>
): Promise<void> {
  const config = getMonitoringConfig();

  if (!config.enabled || !config.firebasePerformanceEnabled) {
    return;
  }

  try {
    const { getPerformance } = await import('firebase/performance');
    const perf = getPerformance();

    const metric = perf.newMetric(name, 'duration');

    if (attributes) {
      metric.putMetadata(attributes);
    }

    metric.record(value);

    console.log(`Performance metric recorded: ${name} = ${value}ms`);
  } catch (error) {
    console.error('Failed to record performance metric:', error);
  }
}

/**
 * Track API call performance
 */
export async function trackApiCall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const perfTrace = await startPerformanceTrace(`api_${apiName}`, {
    api: apiName,
  });

  try {
    const result = await apiCall();
    const duration = await stopPerformanceTrace(perfTrace);

    // Record performance metric
    await recordPerformanceMetric(apiName, duration, {
      success: true,
    });

    return result;
  } catch (error) {
    const duration = await stopPerformanceTrace(perfTrace);

    // Track error
    await trackError(error, {
      api: apiName,
      duration,
      performanceTrace: perfTrace.name,
    });

    // Record performance metric
    await recordPerformanceMetric(apiName, duration, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

// ============================================
// Alerts Configuration
// ============================================

/**
 * Initialize alerts
 */
export async function initializeAlerts(): Promise<void> {
  const config = getAlertConfig();

  if (!config.enabled) {
    return;
  }

  // Set up error rate monitoring
  startErrorRateMonitoring();

  // Set up API failure monitoring
  startApiFailureMonitoring();

  // Set up performance degradation monitoring
  startPerformanceMonitoring();

  console.log('Alerts initialized');
}

/**
 * Start error rate monitoring
 */
function startErrorRateMonitoring(): void {
  const config = getAlertConfig();

  if (!config.enabled) {
    return;
  }

  // Check error rate every 10 seconds
  setInterval(async () => {
    const errorCount = getErrorCount();
    const alertConfig = getAlertConfig();

    if (errorCount >= alertConfig.errorRateThreshold) {
      await sendAlert('error_rate_exceeded', {
        errorCount,
        threshold: alertConfig.errorRateThreshold,
        window: alertConfig.errorRateWindowMs,
      });

      trackWarning(`Error rate exceeded: ${errorCount}/${alertConfig.errorRateThreshold} errors/minute`, {
        errorCount,
        threshold: alertConfig.errorRateThreshold,
      });
    }
  }, 10000);
}

/**
 * Start API failure monitoring
 */
function startApiFailureMonitoring(): void {
  const config = getAlertConfig();

  if (!config.enabled) {
    return;
  }

  // Reset API failure count every minute
  setInterval(() => {
    localStorage.setItem('apiFailureCount', '0');
  }, 60000);
}

/**
 * Track API failure
 */
export async function trackApiFailure(apiName: string, error: Error): Promise<void> {
  const config = getAlertConfig();

  if (!config.enabled) {
    return;
  }

  // Increment API failure count
  const failureCount = parseInt(localStorage.getItem('apiFailureCount') || '0') + 1;
  localStorage.setItem('apiFailureCount', String(failureCount));

  // Track error
  await trackError(error, {
    api: apiName,
    failureCount,
  });

  // Check if threshold exceeded
  if (failureCount >= config.apiFailureThreshold) {
    await sendAlert('api_failure_threshold_exceeded', {
      api: apiName,
      failureCount,
      threshold: config.apiFailureThreshold,
    });

    trackWarning(`API failure threshold exceeded: ${apiName} (${failureCount}/${config.apiFailureThreshold})`, {
      api: apiName,
      failureCount,
      threshold: config.apiFailureThreshold,
    });

    // Check for performance degradation
    await checkPerformanceDegradation(config.performanceDegradationThreshold);
  }
}

/**
 * Start performance monitoring
 */
function startPerformanceMonitoring(): void {
  const config = getAlertConfig();

  if (!config.enabled) {
    return;
  }

  // Check for slow requests every 30 seconds
  setInterval(async () => {
    const slowRequestCount = getSlowRequestCount();

    if (slowRequestCount > 5) {
      await sendAlert('performance_degradation', {
        slowRequestCount,
      message: 'Multiple slow requests detected',
      });
    }
  }, 30000);
}

/**
 * Check for performance degradation
 */
async function checkPerformanceDegradation(threshold: number): Promise<void> {
  const config = getAlertConfig();

  if (!config.enabled) {
    return;
  }

  const slowRequestCount = getSlowRequestCount();
  const errorCount = getErrorCount();

  // Determine if performance is degraded
  const isDegraded = slowRequestCount > 3 || errorCount > 10;

  if (isDegraded) {
    await sendAlert('performance_degradation', {
      slowRequestCount,
      errorCount,
      threshold,
      isDegraded,
    });
  }
}

/**
 * Track slow request
 */
export function trackSlowRequest(duration: number, threshold: number): void {
  if (duration > threshold) {
    const now = Date.now();
    const key = `slowRequests_${Math.floor(now / 60000)}`; // Per minute

    const currentCount = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(currentCount + 1));

    console.warn(`Slow request detected: ${duration}ms (threshold: ${threshold}ms)`);
  }
}

/**
 * Get slow request count
 */
export function getSlowRequestCount(): number {
  const now = Date.now();
  const key = `slowRequests_${Math.floor(now / 60000)}`; // Current minute

  return parseInt(localStorage.getItem(key) || '0');
}

// ============================================
// Alert Sending
// ============================================

/**
 * Send alert
 */
async function sendAlert(
  type: string,
  data: Record<string, any>
): Promise<void> {
  const config = getAlertConfig();

  if (!config.enabled) {
    return;
  }

  // Send webhook alert
  if (config.webhookUrl) {
    await sendWebhookAlert(config.webhookUrl, type, data);
  }

  // Send Slack alert
  if (config.slackWebhookUrl) {
    await sendSlackAlert(config.slackWebhookUrl, type, data);
  }

  // Send email alert
  if (config.emailRecipients && config.emailRecipients.length > 0) {
    await sendEmailAlert(config.emailRecipients, type, data);
  }
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(
  url: string,
  type: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        environment: import.meta.env.VITE_APP_ENV,
        timestamp: new Date().toISOString(),
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook alert failed: ${response.statusText}`);
    }

    console.log('Webhook alert sent successfully');
  } catch (error) {
    console.error('Failed to send webhook alert:', error);
  }
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(
  webhookUrl: string,
  type: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const message = formatSlackMessage(type, data);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack alert failed: ${response.statusText}`);
    }

    console.log('Slack alert sent successfully');
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

/**
 * Format Slack message
 */
function formatSlackMessage(
  type: string,
  data: Record<string, any>
): any {
  const colors = {
    error: '#FF0000',
    warning: '#FFA500',
    info: '#36A64B',
    success: '#008000',
  };

  const emoji = {
    error: '🔴',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
  };

  const typeColor = colors[type] || colors.info;
  const typeEmoji = emoji[type] || emoji.info;

  return {
    text: `${typeEmoji} *${type.toUpperCase()}* Alert`,
    blocks: [
      {
        type: 'header',
        text: `ATTY Financial - ${import.meta.env.VITE_APP_ENV.toUpperCase()} Environment`,
      },
      {
        type: 'section',
        text: `*${type.toUpperCase()}* Alert`,
        fields: [
          {
            type: 'mrkdwn',
            text: 'Environment:',
          },
          {
            type: 'plain_text',
            text: import.meta.env.VITE_APP_ENV,
          },
          {
            type: 'mrkdwn',
            text: 'Timestamp:',
          },
          {
            type: 'plain_text',
            text: new Date().toISOString(),
          },
        ],
      },
      {
        type: 'section',
        fields: Object.entries(data).map(([key, value]) => ({
          type: 'mrkdwn',
          text: `${key}:`,
        })),
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Dashboard',
            },
            url: `${import.meta.env.VITE_DASHBOARD_URL || 'https://attyfinancial.com'}/dashboard`,
            style: 'primary',
          },
        ],
      },
    ],
    attachments: [
      {
        color: typeColor,
      },
    ],
  };
}

/**
 * Send email alert
 */
async function sendEmailAlert(
  recipients: string[],
  type: string,
  data: Record<string, any>
): Promise<void> {
  // Note: Email alerts would require a backend service
  // For now, we'll log the alert
  console.log('Email alert (not sent - backend required):', {
    recipients,
    type,
    environment: import.meta.env.VITE_APP_ENV,
    timestamp: new Date().toISOString(),
    data,
  });
}

// ============================================
// Metrics Collection
// ============================================

/**
 * Get monitoring metrics
 */
export function getMonitoringMetrics(): MonitoringMetrics {
  const errorCount = getErrorCount();
  const apiFailureCount = parseInt(localStorage.getItem('apiFailureCount') || '0');
  const slowRequestCount = getSlowRequestCount();
  const lastErrorTime = parseInt(localStorage.getItem('lastErrorTime') || '0');
  const lastApiFailureTime = parseInt(localStorage.getItem('lastApiFailureTime') || '0');

  // Calculate average response time (simplified)
  const responseTimes = getRecentResponseTimes();
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0;

  return {
    errorCount,
    apiFailureCount,
    averageResponseTime,
    slowRequestCount,
    lastErrorTime: lastErrorTime || null,
    lastApiFailureTime: lastApiFailureTime || null,
  };
}

/**
 * Get recent response times
 */
function getRecentResponseTimes(): number[] {
  const times: number[] = [];

  // Get response times from last 10 minutes
  for (let i = 0; i < 10; i++) {
    const key = `responseTimes_${Math.floor((Date.now() - i * 60000) / 60000)}`;
    const time = parseFloat(localStorage.getItem(key) || '0');
    if (time > 0) {
      times.push(time);
    }
  }

  return times;
}

/**
 * Record response time
 */
export function recordResponseTime(duration: number): void {
  const now = Date.now();
  const key = `responseTimes_${Math.floor(now / 60000)}`; // Current minute

  localStorage.setItem(key, String(duration));
}

/**
 * Reset monitoring metrics
 */
export function resetMonitoringMetrics(): void {
  // Clear localStorage metrics
  const keys = Object.keys(localStorage).filter(key => 
    key.startsWith('errorCount_') ||
    key.startsWith('apiFailureCount') ||
    key.startsWith('slowRequests_') ||
    key.startsWith('responseTimes_')
  );

  keys.forEach(key => localStorage.removeItem(key));

  console.log('Monitoring metrics reset');
}

// ============================================
// Dashboard Integration
// ============================================

/**
 * Get dashboard URL
 */
export function getDashboardUrl(): string {
  return import.meta.env.VITE_DASHBOARD_URL || 'https://attyfinancial.com/dashboard';
}

/**
 * Open dashboard in new tab
 */
export function openDashboard(): void {
  window.open(getDashboardUrl(), '_blank');
}

// ============================================
// Exports
// ============================================

export {
  // Types
  MonitoringConfig,
  AlertConfig,
  PerformanceTrace,
  ErrorData,
  MonitoringMetrics,

  // Monitoring configuration
  getMonitoringConfig,
  getAlertConfig,

  // Error tracking
  initializeErrorTracking,
  trackError,
  trackErrorWithLevel,
  trackWarning,
  getErrorCount,
  resetMonitoringMetrics,

  // Performance monitoring
  initializePerformanceMonitoring,
  initializeCrashlytics,
  startPerformanceTrace,
  stopPerformanceTrace,
  recordPerformanceMetric,
  trackApiCall,
  trackSlowRequest,
  getSlowRequestCount,
  recordResponseTime,

  // Alerts
  initializeAlerts,
  trackApiFailure,
  checkPerformanceDegradation,

  // Metrics
  getMonitoringMetrics,
  getRecentResponseTimes,

  // Dashboard
  getDashboardUrl,
  openDashboard,

  // Default export
  default {
    getMonitoringConfig,
    trackError,
    trackApiCall,
    initializeErrorTracking,
    initializePerformanceMonitoring,
    initializeCrashlytics,
    initializeAlerts,
  },
};
