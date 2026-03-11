# Cloud Functions Deployment

This guide covers Cloud Functions deployment configuration, deployment procedures, and troubleshooting.

## Table of Contents

- [Overview](#overview)
- [Cloud Functions Architecture](#cloud-functions-architecture)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Deployment Script](#deployment-script)
- [Deployment Procedures](#deployment-procedures)
- [Function Triggers](#function-triggers)
- [Structured Logging](#structured-logging)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

ATTY Financial uses Firebase Cloud Functions for backend logic, scheduled tasks, and data consistency.

### Cloud Functions Features

- **HTTP Triggers**: REST API endpoints
- **Firestore Triggers**: Document/Collection changes
- **Pub/Sub Triggers**: Scheduled tasks
- **Authentication**: Firebase Authentication integration
- **CORS Support**: Cross-origin requests
- **Structured Logging**: Request ID-based logging
- **Rate Limiting**: Per-endpoint rate limiting
- **DDoS Protection**: IP blocking and suspicious activity detection

### Deployment Strategy

- **Staging First**: Deploy to staging environment first
- **Production Validation**: Validate in staging before production
- **Incremental Deployment**: Deploy function updates incrementally
- **Rollback Support**: Ability to rollback to previous version
- **Zero Downtime**: Gradual traffic shift during deployment

---

## Cloud Functions Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        HTTP Client                        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Firebase Hosting                       │
│              (Custom Domain: attyfinancial.com)         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 Cloud Functions (us-central1)              │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐│
│  │ HTTP Triggers  │ Firestore     │ Pub/Sub      │ Rate Limiter ││
│  │ - apiGetMatters  │ - onUserWrite │ - scheduled   │ - checkLimit ││
│  │ - apiCreateMatter │ - onMatterWrite │ - cleanup     │ - resetLimit ││
│  │ - getUserPermissions │ - onTransaction │ - reconcile  │              │
│  │ - healthCheck    │ - onTransaction │ - syncFeed     │              │
│  └──────────────┴──────────────┴──────────────┴──────────┘│
│              │                   │                  │              │
│              ▼                   ▼                  ▼              ▼
│  ┌─────────────────────────────────────────────────────────┐│
│  │             Firebase Firestore                      ││
│  │  - Data Storage                                      ││
│  │  - Real-time Sync                                      ││
│  │  - Security Rules                                     ││
│  │  - Audit Logging                                      ││
│  └─────────────────────────────────────────────────────────┘│
│              │                                                     │
│              ▼                                                     ▼
│  ┌─────────────────────────────────────────────────────────────┐  ┌─────────────────────────────────────────────────┐│
│  │         External Services (BankJoy API)                   │  │      Cloud Logging & Monitoring        ││
│  │  - Webhook Handling                                       │  │  - Request/Response Logging           ││
│  │  - Bank Feed Sync                                      │  │  - Error Tracking                      ││
│  │  - Transaction Reconciliation                               │  │  - Performance Metrics                 ││
│  └─────────────────────────────────────────────────────────────┘  └─────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Function Types

| Type | Purpose | Count |
|------|----------|-------|
| **HTTP Triggers** | REST API endpoints | 2 |
| **Firestore Triggers** | Document/Collection change triggers | 7 |
| **Pub/Sub Triggers** | Scheduled tasks | 4 |
| **Total** | - | 13 |

---

## Configuration

### Firebase Functions Configuration

#### `firebase.json`

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ],
      "runtime": "nodejs18",
      "source": "functions"
    }
  ]
}
```

### Runtime Configuration

| Setting | Value | Description |
|----------|-------|-------------|
| **Runtime** | Node.js 18 | Cloud Functions runtime |
| **Memory** | 256MB | Default memory allocation |
| **Timeout** | 60s | Default timeout |
| **Min Instances** | 0 (automatic) | Minimum instances |
| **Max Instances** | 100 | Maximum concurrent instances |

### Region Configuration

```bash
# Production region
export REGION=us-central1

# Staging region
export STAGING_REGION=us-central1
```

**Supported Regions**:
- `us-central1` - Iowa
- `us-east1` - South Carolina
- `us-east4` - Northern Virginia
- `us-west1` - Oregon
- `us-west2` - Los Angeles
- `europe-west1` - Belgium
- `europe-west2` - London
- `europe-west3` - Frankfurt
- `asia-east1` - Taiwan
- `asia-east2` - Hong Kong
- `asia-southeast1` - Singapore
- `australia-southeast1` - Sydney

---

## Environment Variables

### Firebase Environment Variables

| Variable | Production Value | Staging Value | Description |
|----------|-------------------|----------------|-------------|
| `FIREBASE_PROJECT` | `atty-financial-production` | `atty-financial-staging` | Firebase project ID |
| `FIREBASE_API_KEY` | `AIza...` | `AIza...` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | `attyfinancial.firebaseapp.com` | `attyfinancial-staging.firebaseapp.com` | Auth domain |
| `FIREBASE_DATABASE_URL` | `https://atty-financial-production.firebaseio.com` | `https://atty-financial-staging.firebaseio.com` | Database URL |
| `GCP_PROJECT` | `atty-financial-8cb16` | `atty-financial-8cb16` | Google Cloud project |
| `GCP_REGION` | `us-central1` | `us-central1` | Google Cloud region |
| `STAGE` | `production` | `staging` | Environment (production/staging) |

### Service-Specific Environment Variables

| Variable | Production Value | Description |
|----------|-------------------|-------------|
| `BANKJOY_API_KEY` | `your_api_key` | BankJoy API key |
| `BANKJOY_API_URL` | `https://api.bankjoy.com/v1` | BankJoy API URL |
| `BANKJOY_WEBHOOK_SECRET` | `your_webhook_secret` | BankJoy webhook secret |
| `BANKJOY_EVENT_TYPE` | `transaction.created` | BankJoy event type |
| `SENTRY_DSN` | `https://public@sentry.io/...` | Sentry DSN (production) |
| `SENTRY_ENVIRONMENT` | `production` | Sentry environment |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack webhook URL |
| `WEBHOOK_URL` | `https://your-webhook-url.com/api/alerts` | Custom webhook URL |

### Environment Configuration

#### Development Environment

```bash
# .env.development
FIREBASE_PROJECT=atty-financial-dev
FIREBASE_API_KEY=AIzaSyDe...  (from Firebase Console)
STAGE=development
SENTRY_ENVIRONMENT=development
```

#### Staging Environment

```bash
# .env.staging
FIREBASE_PROJECT=atty-financial-staging
FIREBASE_API_KEY=AIzaSyDe...  (from Firebase Console)
STAGE=staging
SENTRY_ENVIRONMENT=staging
```

#### Production Environment

```bash
# .env.production
FIREBASE_PROJECT=atty-financial-production
FIREBASE_API_KEY=AIzaSyDe...  (from Firebase Console)
STAGE=production
SENTRY_ENVIRONMENT=production
SENTRY_DSN=https://public@sentry.io/your-project
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
```

---

## Deployment Script

### Deployment Script: `scripts/deploy-functions.sh`

**Purpose**: Automated Cloud Functions deployment script

**Features**:

1. **Build Functions**:
   - Install dependencies
   - Compile TypeScript
   - Output to `functions/lib`

2. **Deploy Functions**:
   - Deploy all functions to target environment
   - Deploy specific functions
   - Deploy to staging or production

3. **Rollback Capability**:
   - Rollback to previous deployment version
   - Track deployment history

4. **Status Checking**:
   - List deployed functions
   - Check deployment status
   - View function logs

5. **Environment Support**:
   - Development
   - Staging
   - Production

6. **Verbose Mode**:
   - Enable detailed output
   - Show deployment progress

### Deployment Commands

```bash
# Build functions
./scripts/deploy-functions.sh build

# Deploy all functions to production
./scripts/deploy-functions.sh deploy

# Deploy to staging
./scripts/deploy-functions.sh deploy --stage staging

# Deploy specific function
./scripts/deploy-functions.sh deploy --function apiGetMatters

# Rollback to previous version
./scripts/deploy-functions.sh rollback

# List all deployed functions
./scripts/deploy-functions.sh list

# View function logs
./scripts/deploy-functions.sh logs apiGetMatters

# Check deployment status
./scripts/deploy-functions.sh status

# Show help
./scripts/deploy-functions.sh help
```

---

## Deployment Procedures

### Staging Deployment

#### Step 1: Build Functions

```bash
# Build Cloud Functions
cd functions
npm run build

# Verify build
ls -la lib/
```

#### Step 2: Deploy to Staging

```bash
# Deploy to staging environment
./scripts/deploy-functions.sh deploy --stage staging

# Expected output
Building Cloud Functions...
Compiling TypeScript...
Build successful!

Deploying Cloud Functions to staging...
Target project: atty-financial-staging
Target region: us-central1

i  functions: Beginning deployment...
i  functions: Uploading 13 functions...
i  functions: Upload complete
i  functions: functions[apiGetMatters] (us-central1) ...
i  functions: functions[apiCreateMatter] (us-central1) ...
...
i  functions: Finished!

✓ Deployment successful!

Deployment Metadata
Project: atty-financial-staging
Region: us-central1
Functions: 13 deployed
Runtime: nodejs18
Memory: 256MB
Timeout: 60s
```

#### Step 3: Validate Staging Deployment

```bash
# Test API endpoints
curl https://atty-financial-staging.web.app/api/getMatters

# Test health check
curl https://atty-financial-staging.web.app/api/healthCheck

# View function logs
./scripts/deploy-functions.sh logs apiGetMatters
```

### Production Deployment

#### Step 1: Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Staging deployment validated
- [ ] Environment variables configured
- [ ] Backup created (optional)
- [ ] Team notified of deployment
- [ ] Rollback plan prepared

#### Step 2: Build Functions

```bash
# Build Cloud Functions
cd functions
npm run build

# Verify build
ls -la lib/
```

#### Step 3: Deploy to Production

```bash
# Deploy to production environment
./scripts/deploy-functions.sh deploy

# Expected output
Building Cloud Functions...
Compiling TypeScript...
Build successful!

Deploying Cloud Functions to production...
Target project: atty-financial-production
Target region: us-central1

i  functions: Beginning deployment...
i  functions: Uploading 13 functions...
i  functions: Upload complete
i  functions: functions[apiGetMatters] (us-central1) ...
i  functions: functions[apiCreateMatter] (us-central1) ...
...
i  functions: Finished!

✓ Deployment successful!

Deployment Metadata
Project: atty-financial-production
Region: us-central1
Functions: 13 deployed
Runtime: nodejs18
Memory: 256MB
Timeout: 60s

Deployment ID: 6c6a1e8f7d6c6a1e8f7d6c6a1e8f7d6
Deployed by: John Doe <john.doe@attyfinancial.com>
Deployed at: 2026-03-05T10:00:00Z
```

#### Step 4: Validate Production Deployment

```bash
# Test API endpoints
curl https://attyfinancial.com/api/getMatters

# Test health check
curl https://attyfinancial.com/api/healthCheck

# View function logs
./scripts/deploy-functions.sh logs apiGetMatters

# Check deployment status
./scripts/deploy-functions.sh status
```

---

## Function Triggers

### HTTP Triggers

HTTP triggers provide REST API endpoints:

| Function | Method | Path | Description |
|----------|--------|------|-------------|
| **healthCheck** | GET | `/api/healthCheck` | Health check endpoint |
| **getUserPermissions** | CALL | `getUserPermissions` | Get user role and permissions |

### Firestore Triggers

Firestore triggers respond to database changes:

| Function | Trigger | Description |
|----------|---------|-------------|
| **onUserWrite** | `users/{userId}` - onWrite | Audit log for user changes |
| **onFirmWrite** | `firms/{firmId}` - onWrite | Audit log for firm changes |
| **onMatterWrite** | `matters/{matterId}` - onWrite | Audit log for matter changes |
| **onTransactionWrite** | `transactions/{transactionId}` - onWrite | Audit log for transaction changes |
| **onUserCreate** | `users/{userId}` - onCreate | Update firm member count |
| **onMatterCreate** | `matters/{matterId}` - onCreate | Update matter count |

### Pub/Sub Scheduled Triggers

Pub/Sub triggers run on a schedule:

| Function | Schedule | Description |
|----------|----------|-------------|
| **checkMatterAlerts** | Every day at 9 AM | Check for matters needing alerts |
| **cleanupOldAuditLogs** | Every Sunday at 2 AM | Cleanup audit logs older than 1 year |
| **cleanupOldNotifications** | Every day at 3 AM | Cleanup notifications older than 30 days |

### BankJoy Webhooks (HTTP)

HTTP triggers handle BankJoy webhooks:

| Function | Method | Path | Description |
|----------|--------|------|-------------|
| **handleBankJoyWebhook** | POST | `/webhook/bankjoy/transaction` | Handle BankJoy webhook |
| **syncBankJoyBankFeed** | POST | `/cron/bankjoy/sync-feed` | Sync BankJoy bank feed |
| **reconcileBankJoyTransactions** | POST | `/cron/bankjoy/reconcile-transactions` | Reconcile transactions |
| **createBankJoyBankFeed** | POST | `/webhook/bankjoy/create-bank-feed` | Create bank feed |

---

## Structured Logging

### Request ID-Based Logging

All Cloud Functions use request ID-based logging:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logging utility with request ID
 */
interface LogData {
  requestId: string;
  function: string;
  region: string;
  environment: string;
  timestamp: admin.firestore.Timestamp;
  userId?: string;
  userEmail?: string;
  eventData?: any;
  error?: any;
}

/**
 * Log event with request ID
 */
async function logEvent(data: LogData): Promise<void> {
  await db.collection('functionLogs').add({
    ...data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(JSON.stringify(data, null, 2));
}

/**
 * Log HTTP request
 */
export function logHttpRequest(
  function: string,
  method: string,
  path: string,
  userId?: string,
  eventData?: any
): string {
  const requestId = generateRequestId();

  const logData: LogData = {
    requestId,
    function,
    region: process.env.GCP_REGION || 'us-central1',
    environment: process.env.STAGE || 'production',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    request: {
      method,
      path,
    },
    userId,
    eventData,
  };

  // Log asynchronously
  logEvent(logData).catch(error => {
    console.error('Failed to log event:', error);
  });

  return requestId;
}

/**
 * Log function error
 */
export function logFunctionError(
  function: string,
  error: Error,
  userId?: string,
  context?: any
): void {
  const requestId = generateRequestId();

  const logData: LogData = {
    requestId,
    function,
    region: process.env.GCP_REGION || 'us-central1',
    environment: process.env.STAGE || 'production',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as any).code,
    },
    userId,
    context,
  };

  logEvent(logData).catch(err => {
    console.error('Failed to log error:', err);
  });

  console.error(`[${requestId}] ${function} error:`, error.message);
}

/**
 * Log function completion
 */
export function logFunctionCompletion(
  function: string,
  requestId: string,
  userId?: string,
  result?: any
): void {
  const logData: LogData = {
    requestId,
    function,
    region: process.env.GCP_REGION || 'us-central1',
    environment: process.env.STAGE || 'production',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    status: 'completed',
    userId,
    result,
  };

  logEvent(logData).catch(err => {
    console.error('Failed to log completion:', err);
  });

  console.log(`[${requestId}] ${function} completed`);
}

// Usage in HTTP function
export const apiGetMatters = functions.https.onCall(
  async (data, context) => {
    // Log HTTP request
    const requestId = logHttpRequest(
      context.functionName,
      'onCall',
      'getMatters',
      context.auth?.uid
    );

    try {
      // Function logic
      const matters = await getMatters();

      // Log function completion
      logFunctionCompletion(context.functionName, requestId, context.auth?.uid, {
        matterCount: matters.length,
      });

      return { matters, requestId };
    } catch (error) {
      // Log function error
      logFunctionError(context.functionName, error, context.auth?.uid);

      // Throw error
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
```

### Logging Best Practices

1. **Request IDs**:
   - Generate unique request ID for each function invocation
   - Include request ID in all log entries
   - Use request ID to correlate logs

2. **Structured Logging**:
   - Use consistent log format
   - Include all relevant context
   - Log to Firestore for persistence

3. **Log Levels**:
   - **Info**: Normal operation
   - **Warning**: Non-critical issues
   - **Error**: Errors that don't affect functionality
   - **Critical**: Errors that affect functionality

4. **Error Logging**:
   - Always log error message
   - Always log error stack
   - Always log user ID (if available)
   - Always log function name
   - Always log request ID

5. **Completion Logging**:
   - Log function completion with request ID
   - Include result (if appropriate)
   - Include timing information

6. **Context Logging**:
   - Always log user ID
   - Always log function name
   - Always log region
   - Always log environment

---

## Rollback Procedures

### Rollback Strategy

1. **Identify Previous Version**:
   - Use `firebase deploy:list` to get previous version
   - Select version to rollback to

2. **Rollback Deployment**:
   - Deploy previous version using version number
   - Monitor rollback for errors

3. **Verify Rollback**:
   - Test API endpoints
   - Check function logs
   - Verify data integrity

4. **Rollback Fallback**:
   - If rollback fails, use emergency rollback
   - Contact Firebase Support if needed

### Rollback Commands

```bash
# Rollback to previous version
./scripts/deploy-functions.sh rollback

# Rollback to specific version
firebase deploy --only functions --project atty-financial-production --version VERSION_ID

# Rollback specific function
firebase deploy --only functions:apiGetMatters --project atty-financial-production --version VERSION_ID
```

### Rollback Monitoring

Monitor rollback progress:

```bash
# Check rollback status
./scripts/deploy-functions.sh status

# View function logs during rollback
./scripts/deploy-functions.sh logs apiGetMatters
```

---

## Monitoring

### Function Metrics

Monitor Cloud Functions metrics:

| Metric | Description | Target |
|--------|-------------|--------|
| **Invocation Count** | Number of function invocations | N/A |
| **Success Rate** | Percentage of successful invocations | > 99% |
| **Error Rate** | Percentage of failed invocations | < 1% |
| **Average Duration** | Average function execution time | < 1s |
| **P99 Duration** | 99th percentile execution time | < 5s |
| **Memory Usage** | Average memory usage per invocation | < 256MB |
| **Cold Start Rate** | Percentage of cold starts | < 10% |

### Monitoring Dashboard

View metrics in Firebase Console:

1. Go to Firebase Console → Functions
2. View:
   - Execution count
   - Success rate
   - Error rate
   - Average latency
   - Memory usage
   - Cold start percentage

### Alerting

Configure alerts for Cloud Functions:

| Alert Type | Trigger | Action |
|------------|---------|--------|
| **High Error Rate** | Error rate > 1% | Send alert to team |
| **High Latency** | P99 latency > 5s | Send alert to team |
| **Cold Start Spike** | Cold start rate > 10% | Send alert to team |
| **Function Timeout** | Function timeout (> 60s) | Send alert to team |
| **Out of Memory** | Memory limit exceeded | Send alert to team |

---

## Troubleshooting

### Common Issues

**Problem**: Function deployment fails

**Solutions**:
1. Check build errors
2. Check environment variables
3. Check Firebase project ID
4. Check region configuration
5. Verify Firebase CLI authentication

**Problem**: Function execution timeout

**Solutions**:
1. Increase function timeout
2. Optimize function logic
3. Reduce data processing
4. Use pagination for Firestore queries
5. Increase memory allocation

**Problem**: Function out of memory

**Solutions**:
1. Increase memory allocation
2. Optimize data structures
3. Stream data instead of loading all
4. Use Firestore cursor-based pagination
5. Reduce concurrent invocations

**Problem**: Functions not triggering

**Solutions**:
1. Check Firestore security rules
2. Check Pub/Sub topic subscription
3. Verify function region
4. Check function deployment
5. Review function logs

### Debugging Tips

1. **Enable Debug Mode**:
   ```bash
   firebase functions:shell
   ```

2. **View Function Logs**:
   ```bash
   firebase functions:log apiGetMatters
   ```

3. **Stream Function Logs**:
   ```bash
   firebase functions:log apiGetMatters --only apiGetMatters
   ```

4. **Check Function Status**:
   ```bash
   firebase functions:list
   ```

5. **Test Function Locally**:
   ```bash
   firebase emulators:start --only functions
   ```

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Monitoring and Alerts](./MONITORING.md)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Functions Documentation](https://cloud.google.com/functions/docs)

---

## Appendix

### Deployment Commands

```bash
# Build functions
cd functions
npm run build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:apiGetMatters

# Deploy with specific region
firebase deploy --only functions --region us-central1

# View deployed functions
firebase functions:list

# View function logs
firebase functions:log apiGetMatters

# Test function locally
firebase emulators:start --only functions
```

### Environment Variables

```bash
# Set Firebase project
export FIREBASE_PROJECT=atty-financial-production

# Set Firebase region
export REGION=us-central1

# Set environment
export STAGE=production
```

### Function Configuration

```bash
# Set function memory
firebase deploy --only functions --memory 512MB

# Set function timeout
firebase deploy --only functions --timeout 120s

# Set function concurrency
firebase deploy --only functions --max-instances 10

# Set function region
firebase deploy --only functions --region us-central1
```

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
