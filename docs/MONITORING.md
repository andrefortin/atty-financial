# Monitoring and Alerts Setup

This guide covers Firebase Performance Monitoring, Firebase Crashlytics, Sentry integration, and alert configuration for ATTY Financial.

## Table of Contents

- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Firebase Performance Monitoring](#firebase-performancemonitoring)
- [Firebase Crashlytics](#firebase-crashlytics)
- [Sentry Integration](#sentry-integration)
- [Monitoring Configuration](#monitoring-configuration)
- [Alerting Rules](#alerting-rules)
- [Dashboard Setup](#dashboard-setup)
- [Performance Monitoring](#performance-monitoring)
- [Error Tracking](#error-tracking)
- [Alerting](#alerting)
- [Alerting Integration](#alerting-integration)
- [Monitoring Best Practices](#monitoring-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

ATTY Financial uses a comprehensive monitoring stack:

1. **Firebase Performance Monitoring** - Performance traces and metrics
2. **Firebase Crashlytics** - Crash reporting and analytics
3. **Sentry** - Error tracking with source maps
4. **Firebase Analytics** - User behavior and custom events
5. **Custom Monitoring** - Application-specific metrics
6. **Alerting** - Real-time alerts for issues

### Monitoring Goals

- **Performance**: Identify slow requests and bottlenecks
- **Stability**: Track crashes and errors
- **User Experience**: Monitor user interactions
- **Business**: Track key metrics (conversion, retention)
- **Reliability**: Alert on issues in real-time

---

## Monitoring Stack

### Overview

```
┌─────────────────────────────────────────────────────┐
│                  User Interaction                      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                   Application                             │
└──────────────────────┬──────────────────────────┘
                       │
        ┌──────────────┴──────────────┬─────────────────┐
        │                             │                 │
        ▼                             ▼                 ▼
┌──────────────┐              ┌──────────────┐     ┌──────────────┐
│  Firebase    │              │  Firebase    │     │   Sentry    │
│ Performance   │              │ Crashlytics  │     │   Error      │
└──────┬───────┘              └──────┬───────┘     └──────┬───────┘
       │                             │                 │
       ▼                             ▼                 ▼
┌─────────────────────────────────────────────────────┐
│                Monitoring Dashboard                  │
└──────────────────────┬──────────────────────────┘
                       │
              ┌────────┴────────┬────────┐
              │                 │        │
              ▼                 ▼        ▼
       ┌──────────┐    ┌──────────┐  ┌──────────┐
       │   Slack   │    │  Webhook  │  │   Email   │
       │  Alerts   │    │  Alerts   │  │  Alerts   │
       └──────────┘    └──────────┘  └──────────┘
```

### Components

| Component | Purpose | Cost |
|-----------|---------|------|
| **Firebase Performance** | Performance traces and metrics | Free |
| **Firebase Crashlytics** | Crash reporting and analytics | Free |
| **Firebase Analytics** | User behavior and custom events | Free |
| **Sentry** | Error tracking with source maps | Paid (starts at $26/mo) |
| **Firebase Console** | Monitoring dashboard | Free |

---

## Firebase Performance Monitoring

### Setup

1. **Enable Performance Monitoring**:

```bash
# In Firebase Console → Performance → Settings
# Enable: Custom Traces
# Sampling Rate: 10% (production), 100% (staging)
# Max Trace Entries: 50
```

2. **Custom Traces Configuration**:

Define custom traces in `firebase.json`:

```json
{
  "performance": {
    "enabled": true,
    "settings": {
      "maxTraceEntries": 50,
      "traceSamplingRate": 0.1
    },
    "customTraces": [
      {
        "name": "app_load",
        "sampling": 1.0,
        "screens": ["/dashboard", "/matters", "/transactions"]
      },
      {
        "name": "api_call",
        "sampling": 0.25,
        "endpoints": ["/api/matters", "/api/transactions", "/api/allocations"]
      },
      {
        "name": "navigation",
        "sampling": 0.1,
        "pages": ["/dashboard", "/matters", "/transactions", "/reports"]
      },
      {
        "name": "user_interaction",
        "sampling": 0.05,
        "events": ["click", "submit", "focus", "blur"]
      }
    ]
  }
}
```

### Performance Metrics

1. **App Load Time**:
   - Time to interactive (TTI)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

2. **API Call Performance**:
   - Response time
   - Success rate
   - Error rate
   - Slow requests (>3s)

3. **Navigation Performance**:
   - Page load time
   - Resource loading time
   - JavaScript execution time

4. **User Interaction Performance**:
   - Click to action time
   - Form submission time
   - Scroll performance

### Using Performance Monitoring

```typescript
import {
  startPerformanceTrace,
  stopPerformanceTrace,
} from '@/lib/monitoring';

// Track API call
export async function fetchWithPerf(apiName: string) {
  const perfTrace = await startPerformanceTrace(`api_${apiName}`, {
    api: apiName,
  });

  try {
    const response = await fetch(`/api/${apiName}`);
    const duration = await stopPerformanceTrace(perfTrace);

    console.log(`${apiName} completed in ${duration}ms`);
    return response.json();
  } catch (error) {
    const duration = await stopPerformanceTrace(perfTrace);

    // Track API error with performance
    await trackError(error, {
      api: apiName,
      duration,
      performanceTrace: perfTrace.name,
    });

    throw error;
  }
}

// Track page load
export async function trackPageLoad() {
  const perfTrace = await startPerformanceTrace('page_load', {
    page: window.location.pathname,
  });

  // Track when page is interactive
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.interactionId === 'page-load') {
        const duration = await stopPerformanceTrace(perfTrace);
        console.log(`Page interactive in ${duration}ms`);
      }
    }
  }).observe({
    type: 'event',
    buffered: true,
    durationThreshold: 0,
  });

  // Create interaction
  // Note: This is a simplified example
  // In production, use proper performance marks
}
```

### Performance Traces in Console

View performance traces in Firebase Console:

1. Go to Firebase Console → Performance
2. Select a trace (app_load, api_call, navigation)
3. View:
   - Trace duration
   - Performance metrics
   - Sampled requests
   - Distribution charts

---

## Firebase Crashlytics

### Setup

1. **Enable Crashlytics**:

```bash
# In Firebase Console → Crashlytics → Settings
# Enable: Crashlytics
# Sampling Rate: 100%
# Enable: Stack traces
# Enable: Analytics integration
```

2. **Configure Analytics Integration**:

```typescript
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics();

// Enable Crashlytics
analytics.setAnalyticsCollectionEnabled(true);

// Enable user ID tracking
analytics.setUserIdEnabled(true);

// Enable session ID tracking
analytics.setSessionIdEnabled(true);
```

3. **Enable Stack Traces**:

```typescript
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics();

// Enable stack traces for better error analysis
analytics.setEnabled(true);

// Set crashlytics config
analytics.setCrashlyticsCollectionEnabled(true);
```

### Crash Reporting

Automatic crash reporting:

```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

// Report error (automatic)
try {
  // Application code that might crash
  someRiskyOperation();
} catch (error) {
  // Log error to console
  console.error('Error:', error);

  // Log error to Firebase Analytics
  logEvent(analytics, 'error', {
    error_message: error.message,
    error_stack: error.stack,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
}

// Report fatal error (manual)
function reportFatalError(error: Error) {
  console.error('Fatal error:', error);

  // Log to Firebase Analytics
  logEvent(analytics, 'fatal_error', {
    error_message: error.message,
    error_stack: error.stack,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
}
```

### Crash Metrics

View crash metrics in Firebase Console:

1. Go to Firebase Console → Crashlytics
2. View:
   - Crash-free users (percentage)
   - Crash-free sessions (percentage)
   - Issues by stack trace
   - Issues by device
   - Issues by OS
   - Issues by browser

### Crash-Free Users

Crash-free users = (Total users - Users with crashes) / Total users × 100

Target: **99.9%** crash-free users

---

## Sentry Integration

### Setup

1. **Create Sentry Project**:

1. Go to [Sentry.io](https://sentry.io/)
2. Create new project: `atty-financial`
3. Select platform: Browser
4. Get DSN: `https://public@sentry.io/project-id`

2. **Install Sentry SDK**:

```bash
npm install @sentry/react @sentry/tracing

# TypeScript types
npm install -D @sentry/react @sentry/tracing
```

3. **Configure Environment Variables**:

```bash
# Add to .env.production
VITE_SENTRY_DSN=https://public@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
```

### Sentry Configuration

`src/lib/monitoring.ts` includes Sentry configuration:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
    new Sentry.Feedback(),
  ],

  // Sample rate
  tracesSampleRate: import.meta.env.PROD ? 1.0 : 0.1,

  // Session replay sample rate
  replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,

  // Filter errors
  ignoreErrors: [
    // Ignore Axios errors (handled by application)
    /axios/i,
    // Ignore network errors (handled by application)
    /network/i,
  ],

  // beforeSend hook
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.url) {
      const url = new URL(event.request.url);
      url.searchParams.forEach((value, key) => {
        if (key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('password')) {
          url.searchParams.delete(key);
        }
      });
      event.request.url = url.toString();
    }

    // Don't send in development
    if (import.meta.env.DEV) {
      return null;
    }

    return event;
  },

  // User context
  initialScope: {
    tags: {
      environment: import.meta.env.VITE_APP_ENV,
    },
  },

  // Debug mode (development only)
  debug: import.meta.env.DEV,
});
```

### Error Tracking

Track errors with context:

```typescript
import { trackError } from '@/lib/monitoring';

// Track API error
try {
  const response = await fetch('/api/matters');
  const data = await response.json();
} catch (error) {
  await trackError(error, {
    endpoint: '/api/matters',
    method: 'GET',
  });
}

// Track component error
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong.</div>}
      onError={(error, errorInfo) => {
        trackError(error, {
          component: errorInfo.componentStack,
          context: errorInfo,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Source Maps

Source maps for production builds:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true, // Generate source maps
  },
});
```

Upload source maps to Sentry:

```bash
# Deploy to production
firebase deploy

# Upload source maps to Sentry
sentry-cli upload-sourcemaps --url https://attyfinancial.com
```

### Session Replay

Configure session replay:

```typescript
Sentry.init({
  // ... other config

  integrations: [
    new Sentry.Replay({
      // Capture all console logs
      captureConsole: true,
      
      // Capture network requests
      networkCaptureBreadcrumbs: true,
      
      // Capture user interactions
      userInteractionBreadcrumbs: true,
      
      // Capture form inputs
      formInteractions: true,
    }),
  ],
});
```

---

## Monitoring Configuration

### Environment Variables

Required environment variables:

```bash
# Monitoring
VITE_MONITORING_ENABLED=true
VITE_SENTRY_DSN=https://public@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production

# Firebase Analytics
VITE_FIREBASE_ANALYTICS_ENABLED=true

# Performance Monitoring
VITE_CUSTOM_TRACES_ENABLED=true

# Alerting
VITE_ALERTING_ENABLED=true
VITE_ERROR_RATE_THRESHOLD=10
VITE_ERROR_RATE_WINDOW_MS=60000
VITE_PERFORMANCE_THRESHOLD_MS=3000
VITE_API_FAILURE_THRESHOLD=3

# Dashboard
VITE_DASHBOARD_URL=https://attyfinancial.com/dashboard
```

### Monitoring Configuration

`src/lib/monitoring.ts` provides configuration functions:

```typescript
import {
  getMonitoringConfig,
  getAlertConfig,
} from '@/lib/monitoring';

// Get monitoring configuration
const config = getMonitoringConfig();

// Check if monitoring is enabled
if (config.enabled) {
  console.log('Monitoring enabled:', config);
}

// Get alert configuration
const alertConfig = getAlertConfig();

console.log('Alert configuration:', alertConfig);
```

---

## Alerting Rules

### Error Rate Thresholds

Configure error rate thresholds:

| Environment | Threshold | Window |
|-------------|-----------|--------|
| Development | Unlimited | N/A |
| Staging | 20 errors/min | 1 minute |
| Production | 10 errors/min | 1 minute |

### Performance Thresholds

Configure performance thresholds:

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Slow Request | >3s | Warning |
| Slow Page Load | >5s | Warning |
| Navigation Time | >2s | Info |
| API Response Time | >1s | Info |
| Error Rate | >10/min | Critical |

### API Failure Thresholds

Configure API failure thresholds:

| API | Consecutive Failures | Alert |
|-----|---------------------|-------|
| Any API | 3 | Critical |
| Matters API | 3 | Critical |
| Transactions API | 3 | Critical |
| Allocations API | 3 | Critical |

---

## Dashboard Setup

### Firebase Console Dashboard

1. **Performance Dashboard**:
   - Go to Firebase Console → Performance
   - View custom traces
   - Analyze performance metrics
   - Set up alerts

2. **Crashlytics Dashboard**:
   - Go to Firebase Console → Crashlytics
   - View crash-free users
   - View issues by stack trace
   - View issues by device/OS/browser

3. **Analytics Dashboard**:
   - Go to Firebase Console → Analytics
   - View user behavior
   - View custom events
   - View conversions

4. **Sentry Dashboard**:
   - Go to [Sentry.io](https://sentry.io/)
   - View error trends
   - View performance
   - View release health
   - View session replays

### Custom Dashboard

Create custom dashboard for monitoring:

```typescript
import { getMonitoringMetrics } from '@/lib/monitoring';

function MonitoringDashboard() {
  const metrics = getMonitoringMetrics();

  return (
    <div className="monitoring-dashboard">
      <h2>Monitoring Dashboard</h2>

      {/* Error Metrics */}
      <div className="metrics-section">
        <h3>Error Metrics</h3>
        <div className="metric">
          <span>Error Count:</span>
          <span className="value">{metrics.errorCount}</span>
        </div>
        <div className="metric">
          <span>API Failures:</span>
          <span className="value">{metrics.apiFailureCount}</span>
        </div>
        <div className="metric">
          <span>Last Error:</span>
          <span className="value">
            {metrics.lastErrorTime ? new Date(metrics.lastErrorTime).toLocaleString() : 'None'}
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-section">
        <h3>Performance Metrics</h3>
        <div className="metric">
          <span>Average Response Time:</span>
          <span className="value">{metrics.averageResponseTime}ms</span>
        </div>
        <div className="metric">
          <span>Slow Requests:</span>
          <span className="value">{metrics.slowRequestCount}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="actions">
        <button onClick={() => openDashboard()}>
          View Full Dashboard
        </button>
        <button onClick={() => resetMonitoringMetrics()}>
          Reset Metrics
        </button>
      </div>
    </div>
  );
}
```

---

## Performance Monitoring

### Custom Performance Traces

Define custom performance traces:

| Trace Name | Purpose | Sampling |
|------------|---------|-----------|
| **app_load** | Application load time | 100% |
| **api_call** | API call performance | 25% |
| **navigation** | Page navigation performance | 10% |
| **user_interaction** | User interaction (click, submit) | 5% |

### Performance Metrics

Track key performance metrics:

```typescript
import {
  trackApiCall,
  recordPerformanceMetric,
} from '@/lib/monitoring';

// Track API call with performance
const matters = await trackApiCall('getMatters', async () => {
  const response = await fetch('/api/matters');
  return response.json();
});

// Record performance metric
await recordPerformanceMetric('matters_load_time', 2500, {
  count: 50,
});

// Track page navigation performance
await trackApiCall('page_navigation', async () => {
  const startTime = performance.now();
  
  // Navigate to new page
  window.location.href = '/matters';
  
  return new Promise(resolve => {
    setTimeout(() => {
      const duration = performance.now() - startTime;
      resolve(duration);
    }, 100);
  });
});
```

### Performance Optimization

Identify and optimize slow operations:

```typescript
// Slow operation example
async function slowOperation() {
  const startTime = performance.now();

  // Do something slow
  await performHeavyCalculation();

  const duration = performance.now() - startTime;

  // Log slow operation
  if (duration > 100) {
    trackWarning(`Slow operation: slowOperation took ${duration}ms`);
    recordPerformanceMetric('slow_operation', duration, {
      operation: 'slowOperation',
    });
  }
}
```

---

## Error Tracking

### Error Levels

Track errors with appropriate levels:

| Level | Use Case | Example |
|-------|----------|---------|
| **Fatal** | App crash, critical error | Unhandled exception, out of memory |
| **Error** | Application error | API error, validation error |
| **Warning** | Non-critical issue | Deprecated API, slow request |
| **Info** | Informational | User action, successful operation |
| **Debug** | Debug information | Variable values, function calls |

### Error Context

Include context with errors:

```typescript
import { trackError } from '@/lib/monitoring';

// Track error with context
await trackError(error, {
  component: 'MattersList',
  action: 'fetchMatters',
  userId: user?.uid,
  matterCount: matters.length,
});
```

### Error Categories

Categorize errors for better analysis:

| Category | Examples |
|----------|-----------|
| **Network** | Connection timeout, DNS resolution failure |
| **API** | HTTP errors, API rate limiting |
| **Validation** | Invalid input, business logic error |
| **Authentication** | Login failure, session expired |
| **Authorization** | Access denied, insufficient permissions |
| **Database** | Database error, query failure |
| **Business Logic** | Unexpected state, workflow error |
| **UI** | Rendering error, component error |

---

## Alerting

### Alert Types

Configure different alert types:

| Alert Type | Trigger | Severity |
|------------|---------|----------|
| **Error Rate Exceeded** | >10 errors/min | Critical |
| **API Failure Threshold** | 3 consecutive failures | Critical |
| **Performance Degradation** | Multiple slow requests | Warning |
| **Slow Request** | >3s response time | Info |
| **Crash Detected** | Application crash | Critical |
| **Service Unavailable** | Service down | Critical |

### Alert Channels

Configure multiple alert channels:

| Channel | Purpose | Configuration |
|---------|---------|---------------|
| **Slack** | Team notifications | Webhook URL |
| **Email** | Email alerts | Recipient list |
| **Webhook** | Custom alerts | Webhook URL |
| **SMS** | Critical alerts | Phone number |

### Alert Configuration

Configure alerts in `src/lib/monitoring.ts`:

```typescript
import {
  initializeAlerts,
} from '@/lib/monitoring';

// Initialize alerts
initializeAlerts();
```

Alerts will automatically:
- Monitor error rate (10-second intervals)
- Monitor API failures (per API)
- Monitor performance degradation
- Send alerts via configured channels

---

## Alerting Integration

### Slack Integration

Configure Slack webhooks:

1. **Create Slack App**:
   - Go to [Slack API](https://api.slack.com/apps)
   - Create new app: `ATTY Financial Alerts`
   - Create Incoming Webhook
   - Copy webhook URL

2. **Configure Environment Variable**:
   ```bash
   # Add to .env.production
   VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/xxxxxxxxxxxxxxxxxxxx
   ```

3. **Test Slack Alerts**:
   ```bash
   # Test webhook
   curl -X POST https://hooks.slack.com/services/T00000000/B00000000/xxxxxxxxxxxxxxxxxxxx \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test alert from ATTY Financial"}'
   ```

### Email Integration

Configure email alerts:

```typescript
import { sendEmailAlert } from '@/lib/monitoring';

// Send email alert
await sendEmailAlert(['admin@attyfinancial.com'], 'error_rate_exceeded', {
  errorCount: 15,
  threshold: 10,
  window: '1 minute',
});
```

Note: Email alerts require a backend service to send emails.

### Webhook Integration

Configure custom webhooks:

```typescript
import { sendWebhookAlert } from '@/lib/monitoring';

// Send webhook alert
await sendWebhookAlert('https://your-webhook-url.com/api/alerts', 'error_rate_exceeded', {
  errorCount: 15,
  threshold: 10,
  window: '1 minute',
});
```

---

## Monitoring Best Practices

### Performance Monitoring

1. **Sample Appropriate Amount**:
   - Production: 1% for performance traces
   - Staging: 10-25% for performance traces
   - Development: 100% for performance traces

2. **Use Custom Traces**:
   - App load trace (100% sampling)
   - API call traces (25% sampling)
   - Navigation traces (10% sampling)
   - User interaction traces (5% sampling)

3. **Track Key Metrics**:
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - API response time
   - User interaction latency

### Error Tracking

1. **Use Appropriate Error Levels**:
   - Fatal: Application crashes
   - Error: Application errors
   - Warning: Non-critical issues
   - Info: Informational
   - Debug: Debug information

2. **Include Context**:
   - Component name
   - Action being performed
   - User ID (if available)
   - Request details
   - Stack trace

3. **Filter Errors**:
   - Don't report handled errors
   - Don't report development errors
   - Don't report axios errors (handled)

4. **Use Source Maps**:
   - Generate source maps in production
   - Upload to Sentry for debugging

### Alerting

1. **Set Appropriate Thresholds**:
   - Error rate: 10 errors/minute
   - API failures: 3 consecutive failures
   - Slow requests: >3 seconds
   - Performance degradation: Multiple slow requests

2. **Use Multiple Channels**:
   - Slack for team notifications
   - Email for critical alerts
   - Webhook for custom integrations
   - SMS for critical alerts

3. **Rate Limit Alerts**:
   - Don't spam alerts
   - Aggregate alerts
   - Send summaries instead of individual alerts

---

## Troubleshooting

### Performance Issues

**Problem**: Slow page load times

**Solutions**:
1. Check Firebase Performance traces
2. Identify slow resources
3. Optimize large assets
4. Use caching strategies
5. Implement lazy loading

**Problem**: Slow API responses

**Solutions**:
1. Check API performance traces
2. Identify slow endpoints
3. Optimize database queries
4. Add caching for expensive operations
5. Implement pagination

### Error Tracking Issues

**Problem**: Errors not appearing in Sentry

**Solutions**:
1. Verify DSN is correct
2. Check Sentry.init() is called
3. Check ignoreErrors configuration
4. Check beforeSend hook
5. Verify source maps are uploaded

**Problem**: Too many errors

**Solutions**:
1. Filter handled errors
2. Rate limit error reporting
3. Sample errors (only 10%)
4. Deduplicate errors
5. Add error aggregation

### Alerting Issues

**Problem**: Alerts not being sent

**Solutions**:
1. Verify webhook URL is correct
2. Check alert configuration
3. Verify thresholds are configured
4. Check channel configuration
5. Test alert endpoints

**Problem**: Too many alerts

**Solutions**:
1. Increase thresholds
2. Aggregate alerts
3. Send summaries instead of individual alerts
4. Rate limit alerts
5. Use alert escalation levels

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [CDN and Caching](./CDN_CACHING.md)
- [Firebase Production Setup](./FIREBASE_PRODUCTION_SETUP.md)
- [Environment Quick Reference](./ENVIRONMENT_QUICK_REFERENCE.md)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Firebase Crashlytics](https://firebase.google.com/docs/crashlytics)
- [Sentry Documentation](https://docs.sentry.io/)

---

## Appendix

### Monitoring Dashboard Components

| Component | Purpose |
|-----------|---------|
| **Error Metrics** | Display error count, API failures, last error |
| **Performance Metrics** | Display avg response time, slow request count |
| **Recent Errors** | Display list of recent errors |
| **Performance Charts** | Display performance trends |
| **Alert History** | Display alert history and status |
| **Actions** | Buttons to view full dashboard, reset metrics |

### Alert Templates

**Error Rate Exceeded**:
```
🔴 Error Rate Exceeded
Environment: production
Error Count: 15/minute
Threshold: 10/minute
Time: 2026-03-05T10:30:00Z
```

**API Failure Threshold**:
```
⚠️ API Failure Threshold Exceeded
API: /api/matters
Consecutive Failures: 3
Threshold: 3 failures
Last Error: Connection timeout
```

**Performance Degradation**:
```
⚠️ Performance Degradation Detected
Slow Requests: 5 in last 30 seconds
Average Response Time: 2500ms (threshold: 3000ms)
Status: Warning
```

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
