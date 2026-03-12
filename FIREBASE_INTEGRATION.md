# Firebase Integration for ATTY Financial

Complete Firebase integration for ATTY Financial, including authentication, Firestore database, Cloud Functions, and security features.

## Overview

This document describes the Firebase integration for ATTY Financial, a credit line platform for law offices specializing in personal injury and tort law.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  React App  │  │  Zustand     │  │  React Router    │  │
│  │  (Vite)     │  │  Store       │  │  (Auth Pages)    │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Firebase SDK (Browser)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Services                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth       │  │   Firestore  │  │   Analytics      │  │
│  │  (Auth)     │  │   (DB)       │  │  (Analytics)     │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Firestore Database
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Database                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  users      │  │  matters     │  │  transactions    │  │
│  │  firms      │  │  allocations │  │  notifications   │  │
│  │  auditLogs  │  │  rateEntries │  │  dailySummaries  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Cloud Functions
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloud Functions                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth       │  │  Matters     │  │  Transactions    │  │
│  │  Lifecycle  │  │  Handlers    │  │  Handlers        │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Scheduled  │  │  Audit Logs  │  │  Security        │  │
│  │  Tasks      │  │  Functions   │  │  Middleware      │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Cloud Firestore
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloud Firestore (Cloud Storage)                │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Firebase Configuration & Environment Setup

### 1.1 Environment Variables

Create a `.env` file in the root directory:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_APPCHECK_TOKEN=your_app_check_token

# Environment
NODE_ENV=development
```

### 1.2 Firebase Configuration Files

- **`src/lib/firebaseConfig.ts`** - Environment-based Firebase configuration with validation
- **`src/lib/firebaseConfig.prod.ts`** - Production Firebase configuration
- **`src/lib/firebase.ts`** - Firebase initialization with App Check and error handling

### 1.3 Connection Status Monitoring

The Firebase configuration includes connection status monitoring:

```typescript
import { checkFirebaseConnection } from './lib/firebaseConfig';

const status = await checkFirebaseConnection();
console.log('Connected:', status.connected);
```

## Phase 2: Authentication System

### 2.1 Authentication Context

**File:** `src/contexts/AuthContext.tsx`

Features:
- Auth state management
- Login, register, logout functions
- Password reset
- Profile update
- Role-based access control
- Session timeout (30 minutes)

### 2.2 Authentication Hooks

**File:** `src/hooks/useAuth.ts`

Convenience hooks:
- `useAuth()` - Access auth state and functions
- `useHasRole(role)` - Check if user has a specific role
- `useRequireAuth()` - Require authentication
- `useRequireAdmin()` - Require admin role
- `useCurrentUser()` - Get current user
- `useCurrentUserId()` - Get current user ID
- `useCurrentEmail()` - Get current email
- `useCurrentDisplayName()` - Get current display name

### 2.3 Protected Routes

**File:** `src/components/ProtectedRoute.tsx`

Route protection with:
- Authentication checks
- Admin role checks
- Role-based protection
- Loading states
- Error handling

### 2.4 Authentication Pages

- **`src/pages/Login.tsx`** - Email/password login
- **`src/pages/Register.tsx`** - User registration
- **`src/pages/ForgotPassword.tsx`** - Password reset request
- **`src/pages/PasswordReset.tsx`** - Password reset confirmation
- **`src/pages/Settings.tsx`** - User profile management

### 2.5 Navbar with Auth

**File:** `src/components/Navbar.tsx`

Features:
- Authentication-aware navigation
- User dropdown menu
- Role-based menu items
- Loading states

### 2.6 Session Timeout

Session timeout is configured in `App.tsx` with a 30-minute timeout:

```typescript
const useSessionTimeout = (timeoutMs: number = 30 * 60 * 1000) => {
  const { logout } = useAuth();
  const [timeoutExpired, setTimeoutExpired] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      logout();
      setTimeoutExpired(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [logout, timeoutMs]);
};
```

## Phase 3: Firestore Integration

### 3.1 Firebase Services

**File:** `src/services/firebase/`

Services:
- **`matters.service.ts`** - Matter CRUD operations
- **`transactions.service.ts`** - Transaction CRUD operations
- **`notifications.service.ts`** - Notification management
- **`firestore.service.ts`** - Base Firestore service

### 3.2 Matter Service

Features:
- Create, read, update, delete matters
- Real-time listeners
- Data validation
- Filtering and sorting

```typescript
import { createMatter, getMatters, listenToMatters } from './firebase';

// Create a matter
const result = await createMatter({
  id: 'matter-123',
  clientName: 'John Doe',
  notes: 'Personal injury case',
});

// Get matters with filters
const { matters } = await getMatters({
  status: 'Active',
  searchQuery: 'Doe',
  limit: 10,
});

// Real-time listener
const unsubscribe = listenToMatters({
  firmId: 'firm-123',
  onUpdate: (matters) => {
    console.log('Matters updated:', matters);
  },
});
```

### 3.3 Transaction Service

Features:
- Create, read, update, delete transactions
- Allocation management
- Real-time listeners
- Filtering by matter, type, status

```typescript
import { createTransaction, getTransactionsByMatter } from './firebase';

// Create a transaction
const result = await createTransaction({
  matterId: 'matter-123',
  type: 'Draw',
  category: 'Court & Filing Fees',
  amount: 5000,
  date: new Date(),
  allocations: [],
});

// Get transactions by matter
const { transactions } = await getTransactionsByMatter('matter-123');
```

### 3.4 Notification Service

Features:
- Create notifications
- Get notifications with filters
- Mark as read
- Real-time listeners
- Unread count

```typescript
import { createNotification, getUnreadCount } from './firebase';

// Create a notification
await createNotification({
  title: 'Matter Updated',
  message: 'Matter #123 has been updated',
  type: 'info',
  userId: 'user-123',
});

// Get unread count
const { count } = await getUnreadCount('user-123');
```

### 3.5 Store Updates

The existing Zustand stores (`matterStore.ts`, `transactionStore.ts`) can be updated to use Firebase services instead of mock data.

## Phase 4: Cloud Functions

### 4.1 Auth Lifecycle Functions

**File:** `functions/src/functions/auth/onUserCreate.ts`

Functions:
- `onUserAfterCreate` - User onboarding after authentication
- `onUserAfterLogin` - Update last login timestamp
- `onUserBeforeDelete` - Soft delete user
- `onUserAfterPasswordReset` - Log password reset

### 4.2 Matter Lifecycle Functions

**File:** `functions/src/functions/matters/onMatterCreate.ts`

Functions:
- `onMatterCreate` - Validate and process matter creation
- `onMatterUpdate` - Handle matter updates
- `onMatterClose` - Process matter closure

Features:
- Matter number uniqueness validation
- Initial allocation creation
- Audit logging

### 4.3 Transaction Lifecycle Functions

**File:** `functions/src/functions/transactions/onTransactionCreate.ts`

Functions:
- `onTransactionCreate` - Validate and process transaction creation
- `onTransactionUpdate` - Handle transaction updates

Features:
- Update matter totals based on transaction type
- Create allocation records
- Status change notifications

### 4.4 Scheduled Tasks

**File:** `functions/src/functions/scheduled/tasks.ts`

Scheduled tasks:
- `calculateDailyInterest` - Daily interest calculation (midnight)
- `sendDailyAlerts` - Daily alerts check (9 AM)
- `generateDailySummary` - Daily summary generation (8 AM)
- `cleanupOldDailySummaries` - Weekly cleanup (Sundays 1 AM)

### 4.5 Main Cloud Functions

**File:** `functions/src/index.ts`

Functions:
- Audit logging triggers for all collections
- Data consistency functions
- Role management
- HTTP functions (health check, user permissions)
- Cleanup tasks

## Phase 5: Security Hardening

### 5.1 Security Utilities

**File:** `src/utils/security.ts`

Features:
- CSRF token generation and validation
- Session token generation and validation
- Request validation helpers
- Input sanitization
- Security headers

```typescript
import {
  generateCSRFToken,
  verifyCSRFToken,
  validateEmail,
  validatePasswordStrength,
} from './utils/security';

// Generate CSRF token
const token = generateCSRFToken();

// Verify CSRF token
const result = verifyCSRFToken(token, storedToken);

// Validate email
const emailResult = validateEmail('user@example.com');

// Validate password
const passwordResult = validatePasswordStrength('SecurePass123!');
```

### 5.2 Auth Middleware

**File:** `src/middleware/authMiddleware.ts`

Middleware:
- `requireAuth` - Require authentication
- `requireRole(role)` - Require specific role
- `requireAdmin` - Require admin role
- `requireFirmAccess(firmId)` - Require firm access
- `validateCSRF` - CSRF token validation
- `rateLimit(maxRequests, windowMs)` - Rate limiting
- `validateBody(schema)` - Request body validation

```typescript
import { requireAuth, requireAdmin } from './middleware/authMiddleware';

// Require authentication
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Require admin
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  res.json({ success: true });
});
```

### 5.3 Firestore Security Rules

Create `firestore.rules` in the functions directory:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Match any document
    match /{document=**} {
      // Require authentication
      require authenticated();
    }

    // Specific collection rules
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth.uid == userId;
      // Users can update their own data
      allow update: if request.auth.uid == userId;
      // Admins can manage all users
      allow create, delete: if request.auth.token.role == 'Admin';
    }

    match /matters/{matterId} {
      // Users can read matters they have access to
      allow read: if request.auth != null;
      // Users can create matters
      allow create: if request.auth != null;
      // Users can update their own matters
      allow update: if request.auth != null;
      // Admins can manage all matters
      allow delete: if request.auth.token.role == 'Admin';
    }
  }
}
```

## Phase 6: Testing & Documentation

### 6.1 Unit Tests

**File:** `src/__tests__/auth.test.tsx`

Tests for:
- AuthContext
- useAuth hook
- Error handling
- Role-based access

### 6.2 Integration Tests

**File:** `src/__tests__/integration/`

Integration tests for:
- Bank feed to transaction flow
- Interest allocation flow

### 6.3 Coverage Requirements

Maintain 80%+ test coverage for:
- Services (`src/services/`)
- Stores (`src/store/`)
- Components (`src/components/`)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a web app and get configuration
5. Copy configuration to `.env` file

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
npm run deploy
```

### 4. Deploy Firestore Rules

1. Go to Firestore > Rules
2. Copy `firestore.rules`
3. Deploy rules

### 5. Run Tests

```bash
npm run test
```

### 6. Start Development Server

```bash
npm run dev
```

## API Reference

### Auth Functions

```typescript
// Login
await login(email, password);

// Register
await register(email, password, displayName, role);

// Logout
await logout();

// Reset Password
await resetPassword(email);

// Update Profile
await updateProfile(displayName, photoURL);
```

### Matter Functions

```typescript
// Create Matter
await createMatter(data, firmId);

// Get Matters
await getMatters({ status, searchQuery, limit });

// Get Matter by ID
await getMatterById(matterId);

// Update Matter
await updateMatter(matterId, data, firmId);

// Delete Matter
await deleteMatter(matterId, firmId);

// Close Matter
await closeMatter(matterId, firmId);

// Reopen Matter
await reopenMatter(matterId, firmId);

// Listen to Matters
const unsubscribe = listenToMatters({
  firmId,
  onUpdate,
  onError,
});
```

### Transaction Functions

```typescript
// Create Transaction
await createTransaction(data, firmId);

// Get Transactions
await getTransactions({ matterId, type, status });

// Get Transactions by Matter
await getTransactionsByMatter(matterId);

// Update Transaction
await updateTransaction(transactionId, data, firmId);

// Delete Transaction
await deleteTransaction(transactionId, firmId);

// Update Status
await updateTransactionStatus(transactionId, status, firmId);

// Listen to Transactions
const unsubscribe = listenToTransactions({
  matterId,
  onUpdate,
  onError,
});
```

### Notification Functions

```typescript
// Create Notification
await createNotification(data, firmId);

// Get Notifications
await getNotifications(userId, status, limit);

// Get Unread Count
await getUnreadCount(userId);

// Mark as Read
await markAsRead(notificationId, firmId);

// Mark All as Read
await markAllAsRead(userId, firmId);

// Delete Notification
await deleteNotification(notificationId, firmId);

// Listen to Notifications
const unsubscribe = listenToNotifications(userId, onUpdate, onError);
```

## Security Best Practices

1. **Always validate user input** using the provided validation utilities
2. **Use CSRF tokens** for all state-changing requests
3. **Implement rate limiting** to prevent abuse
4. **Use role-based access control** throughout the application
5. **Keep dependencies updated** to prevent security vulnerabilities
6. **Enable Firebase App Check** in production
7. **Monitor authentication logs** for suspicious activity
8. **Use HTTPS** in production
9. **Implement proper error handling** to avoid leaking sensitive information
10. **Regular security audits** of Firestore rules and Cloud Functions

## Troubleshooting

### Firebase Not Initializing

- Check that all required environment variables are set
- Verify Firebase configuration in `.env` file
- Check browser console for errors

### Authentication Issues

- Verify Firebase Auth is enabled in Firebase Console
- Check that users have the correct role in Firestore
- Verify email verification is enabled if required

### Firestore Errors

- Check Firestore security rules
- Verify user has proper permissions
- Check for network issues

### Cloud Functions Not Working

- Check Cloud Functions logs in Firebase Console
- Verify functions are deployed correctly
- Check for syntax errors in function code

## Performance Optimization

1. **Use real-time listeners** instead of polling
2. **Implement pagination** for large datasets
3. **Cache frequently accessed data**
4. **Optimize Firestore queries** with proper indexes
5. **Use Firestore indexes** for complex queries
6. **Implement query batching** for multiple reads
7. **Use Firestore compound indexes** for sorted queries
8. **Monitor query performance** in Firestore console

## Monitoring & Analytics

1. **Enable Firebase Analytics** for user behavior tracking
2. **Set up Cloud Monitoring** for performance metrics
3. **Configure error tracking** with Firebase Crashlytics
4. **Monitor Cloud Functions** execution time and errors
5. **Set up alerts** for critical issues
6. **Review Firestore usage** regularly
7. **Monitor authentication** events and failures

## Future Enhancements

- [ ] Implement multi-factor authentication
- [ ] Add social login providers (Google, GitHub)
- [ ] Implement file upload for documents
- [ ] Add email templates for notifications
- [ ] Implement role-based access control in Firestore
- [ ] Add audit log export functionality
- [ ] Implement data backup and restore
- [ ] Add performance monitoring dashboards
- [ ] Implement A/B testing framework
- [ ] Add internationalization (i18n) support
