# Firebase Production Configuration Guide

This guide documents all production Firebase settings for ATTY Financial.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [Authentication Providers](#authentication-providers)
- [Firebase App Check](#firebase-app-check)
- [Firestore Production Settings](#firestore-production-settings)
- [Security Rules](#security-rules)
- [Indexes](#indexes)
- [Point-in-Time Recovery](#point-in-time-recovery)
- [Data Retention Policy](#data-retention-policy)
- [Cloud Functions Configuration](#cloud-functions-configuration)
- [Firebase Hosting Configuration](#firebase-hosting-configuration)
- [Firebase Analytics Configuration](#firebase-analytics-configuration)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Backup Strategy](#backup-strategy)
- [Troubleshooting](#troubleshooting)

---

## Overview

ATTY Financial uses Firebase for:
- **Authentication**: Email/password and Google OAuth
- **Firestore**: Database for matters, transactions, allocations
- **Cloud Functions**: Backend logic for calculations and sync
- **Firebase Hosting**: Static web application hosting
- **Firebase Analytics**: User behavior tracking
- **Firebase App Check**: Additional security layer

### Production Projects

| Environment | Project ID | Purpose |
|-------------|-------------|---------|
| Development | `atty-financial-dev` | Local development |
| Staging | `atty-financial-staging` | Pre-production testing |
| Production | `atty-financial-production` | Live production |

---

## Prerequisites

### Required Tools

- **Firebase CLI**: 12.x or later
- **Node.js**: 18.x or later
- **Google Cloud Console access**: For project settings

### Firebase CLI Installation

```bash
npm install -g firebase-tools
firebase login
```

---

## Firebase Project Setup

### Create Production Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project details:
   - **Project name**: `atty-financial-production`
   - **Project ID**: `atty-financial-production` (auto-generated)
   - **Analytics location**: United States
4. Click "Create project"

### Configure Production Project

#### 1. General Settings

**Location**:
- **Region**: `nam5 (us-central)` - For Firestore and Functions
- **Multi-region**: Not required (single-region is faster and cheaper)

**Billing**:
- Enable Blaze (pay-as-you-go) plan
- Set budget alerts

#### 2. Project Settings

**Public settings**:
- Project visibility: `Public` (for Firebase Hosting)

**Web App Configuration**:
- Create web app: `atty-financial-web`
- Copy configuration values to environment variables

---

## Authentication Providers

### Email/Password Authentication

**Setup**:

1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Email/Password"
3. Enable the provider
4. Save

**Configuration**:
```javascript
// Production configuration
{
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ]
}
```

**Security Settings**:
- ✅ Email verification: `Required`
- ✅ Password policy: `Strong` (min 8 characters, 1 uppercase, 1 number, 1 special)
- ✅ Account linking: `Enabled` (for SSO integration)

### Google OAuth (Optional)

**Setup**:

1. Go to Firebase Console → Authentication → Sign-in method
2. Click "Google"
3. Enable the provider
4. Configure OAuth consent screen
5. Add authorized domains:
   - `attyfinancial.com`
   - `atty-financial-production.web.app`
   - `staging.attyfinancial.com` (for staging)
6. Save

**Configuration**:
```javascript
// Production configuration
{
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ]
}
```

**Google Cloud Console Setup**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services → Credentials
4. Create OAuth 2.0 credentials:
   - **Application type**: Web application
   - **Name**: `ATTY Financial Production`
   - **Authorized redirect URIs**:
     - `https://attyfinancial.com`
     - `https://atty-financial-production.web.app`
5. Copy Client ID and Client Secret to Firebase Console

**Security Settings**:
- ✅ Email verification: `Required` (for new users)
- ✅ Account linking: `Enabled`
- ✅ Google-verified domains: `attyfinancial.com`

### Authentication Configuration (Code)

```typescript
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Email/Password sign in
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Verify email is confirmed
  if (!credential.user.emailVerified) {
    throw new Error('Email not verified. Please check your inbox.');
  }

  // Check if account is active (from Firestore user document)
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  const userData = userDoc.data();

  if (userData?.status === 'Disabled') {
    throw new Error('Account has been disabled. Please contact support.');
  }

  return credential;
}

// Google OAuth sign in
export async function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  const result = await signInWithPopup(auth, provider);

  // Check if account is active
  const userDoc = await getDoc(doc(db, 'users', result.user.uid));
  const userData = userDoc.data();

  if (userData?.status === 'Disabled') {
    throw new Error('Account has been disabled. Please contact support.');
  }

  return result;
}

// Sign out
export async function signOut(): Promise<void> {
  await auth.signOut();
}
```

---

## Firebase App Check

Firebase App Check provides additional security by verifying requests come from your legitimate app.

### Setup reCAPTCHA v3

1. Go to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site:
   - **Label**: `ATTY Financial Production`
   - **reCAPTCHA type**: `reCAPTCHA v3`
   - **Domains**: `attyfinancial.com`, `atty-financial-production.web.app`
3. Copy site key and secret key

### Configure App Check in Firebase

1. Go to Firebase Console → App Check
2. Click "Get Started"
3. Select "reCAPTCHA v3"
4. Enter site key from reCAPTCHA Admin Console
5. Copy App Check token to environment variable

### App Check Configuration (Code)

```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { app } from '@/lib/firebase';

// Initialize App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(
    import.meta.env.VITE_FIREBASE_APPCHECK_TOKEN
  ),
  isTokenAutoRefreshEnabled: true, // Auto-refresh tokens
});

// Get App Check token
export async function getAppCheckToken(): Promise<string> {
  const { token } = await appCheck.getToken(/* forceRefresh */ false);
  return token;
}

// Include token in backend requests
export async function makeAuthenticatedRequest(url: string) {
  const appCheckToken = await getAppCheckToken();
  const idToken = await auth.currentUser?.getIdToken();

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'X-Firebase-AppCheck-Token': appCheckToken,
    },
  });

  return response.json();
}
```

### Security Benefits

- ✅ Prevents requests from unauthorized apps/websites
- ✅ Protects against replay attacks
- ✅ Additional layer beyond Firebase Authentication
- ✅ Works with Firebase Security Rules

---

## Firestore Production Settings

### Database Configuration

**Location**:
- **Region**: `nam5 (us-central)`
- **Multi-region**: Not enabled (single-region for performance)

**Capacity**:
- **Default**: Start with default capacity
- **Scale up** as needed (automatic scaling)

### Production Database Settings

#### 1. Indexes

Deploy production indexes from `firestore.indexes.prod.json`:

```bash
firebase deploy --only firestore:indexes
```

**Key Production Indexes**:
- Matters: `firmId + status + createdAt`
- Transactions: `firmId + date`, `matterId + date`
- Daily Balances: `matterId + date`, `firmId + date`
- Interest Allocations: `firmId + periodStart`
- Audit Logs: `userId + timestamp`, `firmId + timestamp`

#### 2. Data Validation

Firestore doesn't enforce schema, but we validate in Cloud Functions:

```typescript
// Example: Validate matter creation
export async function validateMatterOnCreate(
  data: any,
  context: any
): Promise<boolean> {
  // Required fields
  const required = ['matterId', 'clientName', 'firmId', 'status', 'openedDate'];
  const missing = required.filter(field => !data[field]);

  if (missing.length > 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Missing required fields: ${missing.join(', ')}`
    );
  }

  // Field validation
  if (!data.matterId.match(/^[A-Za-z0-9\-_]{1,50}$/)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid matter ID format'
    );
  }

  if (data.clientName.length < 2 || data.clientName.length > 200) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Client name must be between 2 and 200 characters'
    );
  }

  return true;
}
```

#### 3. Rate Limiting

Implement rate limiting via Cloud Functions:

```typescript
// Example: Rate limit API calls
export async function enforceRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<void> {
  const db = admin.firestore();
  const rateLimitRef = db
    .collection('rateLimits')
    .doc(`${userId}_${action}`);

  const doc = await rateLimitRef.get();

  if (doc.exists) {
    const data = doc.data()!;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Count requests in window
    const requests = data.requests.filter(
      (timestamp: number) => timestamp > windowStart
    );

    if (requests.length >= limit) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded: ${action}`
      );
    }

    // Add current request
    requests.push(now);

    // Update document
    await rateLimitRef.update({ requests });

    // Cleanup old entries
    if (requests.length > limit * 2) {
      await rateLimitRef.update({
        requests: requests.slice(-limit * 2)
      });
    }
  } else {
    // Create new rate limit document
    await rateLimitRef.set({
      requests: [Date.now()],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

---

## Security Rules

### Production Security Rules

Production security rules are in `firestore.rules.prod`:

```bash
# Deploy production rules
firebase deploy --only firestore:rules
```

**Key Production Rule Features**:

1. **Tightened Access**:
   - All reads require authentication
   - All writes require authentication + active account
   - Role-based access control (Admin, Accountant, Attorney, Viewer)

2. **Multi-tenant Isolation**:
   - Firm members can only access their firm's data
   - Cross-firm access is blocked

3. **Data Validation**:
   - Email format validation
   - Matter ID format validation
   - Amount validation (must be positive)
   - Date validation (no future dates)

4. **Immutable Audit Trail**:
   - Audit logs cannot be updated or deleted
   - Only system account can create audit logs

5. **System Account Protection**:
   - Critical operations require system account role
   - Cloud Functions use service account for system operations

### Rule Testing

Test security rules locally:

```bash
firebase emulators:start --only firestore
firebase emulators:exec firestore.test.ts
```

---

## Indexes

### Production Indexes

Production indexes are in `firestore.indexes.prod.json`:

**Additional Production Indexes**:
- Matters: `firmId + closedDate`, `firmId + principalBalance`, `firmId + lastInterestDate`
- Transactions: `firmId + type + date`, `category + date`
- Audit Logs: `action + timestamp`, `collection + documentId + timestamp`
- Bank Feeds: `firmId + counterparty + date`
- Reports: `generatedBy + status + reportDate`
- Notifications: `userId + type + createdAt`

### Deploy Indexes

```bash
# Deploy all indexes
firebase deploy --only firestore:indexes

# Deploy single index group
firebase deploy --only firestore:indexes --only matters
```

### Index Monitoring

Monitor index usage in Firebase Console:
1. Go to Firestore → Indexes
2. Monitor index usage and query statistics
3. Optimize indexes based on query patterns

---

## Point-in-Time Recovery

### Enable Point-in-Time Recovery

1. Go to Firebase Console → Firestore
2. Click "Create database" or "Select database"
3. Under "Point-in-time recovery", select:
   - **Enable point-in-time recovery**: ✅ Yes
   - **Recovery period**: 7 days (recommended) or 30 days

### Recovery Process

1. Go to Firebase Console → Firestore
2. Click "Restore data"
3. Select restore point (timestamp)
4. Select collections to restore
5. Confirm restore

### Automated Backup Script

```typescript
// Cloud Function: Scheduled backup
exports.scheduledFirestoreBackup = functions.pubsub
  .schedule('0 2 * * *') // 2:00 AM UTC daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const admin = require('firebase-admin');
    const firestore = admin.firestore();

    // Create backup metadata
    const backupMetadata = {
      backupId: `backup_${Date.now()}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      triggeredBy: 'system',
      collections: [
        'users',
        'firms',
        'matters',
        'transactions',
        'rateEntries',
        'dailyBalances',
        'interestAllocations',
        'bankFeeds',
      ],
    };

    // Save backup metadata
    await firestore
      .collection('backups')
      .doc(backupMetadata.backupId)
      .set(backupMetadata);

    console.log(`Backup created: ${backupMetadata.backupId}`);

    return null;
  });
```

---

## Data Retention Policy

### Recommended Retention Policy

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| Users | Indefinite | User accounts |
| Firms | Indefinite | Firm data |
| Matters | Indefinite | Legal records |
| Transactions | 7 years | Legal requirement |
| Rate Entries | 10 years | Historical data |
| Daily Balances | 2 years | Performance optimization |
| Interest Allocations | 7 years | Legal requirement |
| Bank Feeds | 2 years | Performance optimization |
| Audit Logs | 90 days | Compliance & storage |
| Reports | 1 year | Performance optimization |
| Notifications | 30 days | Performance optimization |

### Implement Retention Policy

#### TTL for Audit Logs

Configure TTL in `firestore.indexes.prod.json`:

```json
{
  "collectionGroup": "auditLogs",
  "fields": [
    {
      "fieldPath": "timestamp",
      "ttl": [
        {
          "value": 777600000
        }
      ]
    }
  ]
}
```

#### Automated Cleanup Cloud Functions

```typescript
// Cloud Function: Cleanup old data
exports.cleanupOldData = functions.pubsub
  .schedule('0 3 * * *') // 3:00 AM UTC daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const admin = require('firebase-admin');
    const firestore = admin.firestore();
    const now = new Date();

    // Cleanup daily balances older than 2 years
    const twoYearsAgo = new Date(
      now.getFullYear() - 2,
      now.getMonth(),
      now.getDate()
    );

    const dailyBalancesQuery = firestore
      .collection('dailyBalances')
      .where('date', '<', twoYearsAgo.toISOString());

    const dailyBalancesSnapshot = await dailyBalancesQuery.get();

    const batch = firestore.batch();
    dailyBalancesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${dailyBalancesSnapshot.size} daily balance records`);

    // Cleanup notifications older than 30 days
    const thirtyDaysAgo = new Date(
      now.getTime() - (30 * 24 * 60 * 60 * 1000)
    );

    const notificationsQuery = firestore
      .collection('notifications')
      .where('createdAt', '<', thirtyDaysAgo.toISOString());

    const notificationsSnapshot = await notificationsQuery.get();

    const notificationBatch = firestore.batch();
    notificationsSnapshot.docs.forEach(doc => {
      notificationBatch.delete(doc.ref);
    });

    await notificationBatch.commit();
    console.log(`Cleaned up ${notificationsSnapshot.size} notifications`);

    return null;
  });
```

---

## Cloud Functions Configuration

### Production Function Settings

**Runtime**: Node.js 18
**Region**: `us-central1` (same as Firestore)
**Memory**: 256MB (default) or 512MB for memory-intensive functions
**Timeout**: 60s (default) or 120s for long-running functions

### Environment Variables

Set environment variables in Firebase Console:

| Variable | Value | Description |
|----------|--------|-------------|
| `BANKJOY_API_KEY` | `your_key` | BankJoy API key |
| `BANKJOY_API_URL` | `https://api.bankjoy.com/v1` | BankJoy API URL |
| `SENTRY_DSN` | `your_dsn` | Sentry error tracking |
| `NODE_ENV` | `production` | Environment |

### Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:calculateInterest

# Deploy with specific region
firebase deploy --only functions --region us-central1
```

---

## Firebase Hosting Configuration

### Production Hosting Settings

**Custom Domain**:
- **Domain**: `attyfinancial.com`
- **SSL/TLS**: Auto-provisioned by Firebase

**Rewrites**:
```json
{
  "rewrites": [
    {
      "source": "/api/**",
      "function": "api"
    },
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

**Headers**:
```json
{
  "headers": [
    {
      "source": "**/*.@(js|css)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000"
        }
      ]
    },
    {
      "source": "**/*.@(jpg|jpeg|png|gif|svg|webp)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Deploy to Hosting

```bash
# Deploy hosting
firebase deploy --only hosting

# Deploy specific channel
firebase hosting:channel:deploy preview

# Promote channel to production
firebase hosting:channel:promote preview
```

---

## Firebase Analytics Configuration

### Production Analytics Setup

1. Go to Firebase Console → Analytics
2. Analytics is automatically enabled with Firebase App creation
3. Verify measurement ID is correct: `G-4QERGV5WGC`

### Configure Analytics (Code)

```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '@/lib/firebase';

const analytics = getAnalytics(app);

// Log custom events
export function logMatterCreated(matterId: string, clientName: string) {
  logEvent(analytics, 'matter_created', {
    matter_id: matterId,
    client_name: clientName,
    timestamp: Date.now(),
  });
}

export function logTransactionCreated(
  transactionId: string,
  type: string,
  amount: number
) {
  logEvent(analytics, 'transaction_created', {
    transaction_id: transactionId,
    type,
    amount,
    timestamp: Date.now(),
  });
}

export function logAllocationExecuted(
  allocationId: string,
  matterCount: number,
  totalAmount: number
) {
  logEvent(analytics, 'allocation_executed', {
    allocation_id: allocationId,
    matter_count: matterCount,
    total_amount: totalAmount,
    timestamp: Date.now(),
  });
}
```

### Configure Analytics (Console)

**Enhanced Measurement**:
- Enable enhanced measurement for automatic event tracking
- Configure:
  - Page views
  - Outbound clicks
  - Site search
  - Video engagement
  - File downloads

**User Properties**:
- Set user properties for segmentation:
  - `firm_id`: Firm ID
  - `role`: User role
  - `plan`: Subscription plan

---

## Monitoring and Alerts

### Firebase Console Monitoring

1. **Usage Monitoring**:
   - Monitor read/write operations
   - Monitor storage usage
   - Monitor bandwidth usage

2. **Performance Monitoring**:
   - Monitor query execution times
   - Monitor index usage
   - Identify slow queries

3. **Error Monitoring**:
   - Monitor Cloud Functions errors
   - Monitor Security Rule violations
   - Monitor Authentication errors

### Alerts Configuration

Set up alerts in Firebase Console:

**Usage Alerts**:
- ⚠️ Read operations: 80% of daily quota
- ⚠️ Write operations: 80% of daily quota
- ⚠️ Storage: 80% of quota

**Performance Alerts**:
- ⚠️ Slow queries (>5s)
- ⚠️ High error rate (>5%)

**Security Alerts**:
- 🔴 Authentication failures (>10/min)
- 🔴 Security rule violations
- 🔴 App Check rejections

### Integration with External Monitoring

**Sentry Integration**:

```typescript
import * as Sentry from '@sentry/react';

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
});

// Capture Cloud Functions errors
functions.logger.addCustomEventSink({
  handler: data => {
    if (data.level === 'error') {
      Sentry.captureException(new Error(data.message));
    }
  },
});
```

---

## Backup Strategy

### Automated Backups

1. **Point-in-Time Recovery**: Enabled (7 days)
2. **Daily Scheduled Backup**: 2:00 AM UTC
3. **Pre-deployment Backup**: Before production deployment

### Manual Backup

```bash
# Create manual backup
firebase firestore:backups create --project atty-financial-production

# List backups
firebase firestore:backups list --project atty-financial-production
```

### Restore from Backup

```bash
# Restore from backup
firebase firestore:backups restore BACKUP_NAME --project atty-financial-production
```

---

## Troubleshooting

### Common Issues

#### Security Rule Errors

**Problem**: "Missing or insufficient permissions"

**Solutions**:
1. Check user authentication status
2. Verify user role in Firestore
3. Check firm membership
4. Verify account is active

#### Index Errors

**Problem**: "The query requires an index"

**Solutions**:
1. Review error message for required index
2. Add index to `firestore.indexes.prod.json`
3. Deploy indexes: `firebase deploy --only firestore:indexes`
4. Wait for index to build (10-15 minutes)

#### App Check Errors

**Problem**: "App Check token rejected"

**Solutions**:
1. Verify App Check token is configured
2. Check reCAPTCHA site key
3. Verify domain is authorized
4. Refresh App Check token

### Debugging Tools

```bash
# Test security rules locally
firebase emulators:start --only firestore

# View Firestore logs
firebase functions:log

# View Cloud Functions logs
firebase functions:log --only functionName
```

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [CI/CD Documentation](./CI_CD.md)
- [GitHub Secrets Guide](./GITHUB_SECRETS.md)
- [Environment Quick Reference](./ENVIRONMENT_QUICK_REFERENCE.md)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
