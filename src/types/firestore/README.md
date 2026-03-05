# Firestore Types Documentation

This directory contains comprehensive TypeScript types for Firestore documents in the ATTY Financial application.

## Overview

The Firestore types are designed to:
- Provide type safety for all Firestore operations
- Extend existing application types with Firestore-specific fields
- Support both development and production environments
- Enable type-safe queries and document operations

## Core Types

### Base Types

- `FirestoreDocument<T>`: Base interface for all Firestore documents with `id` and `data`
- `TimestampedDocument<T>`: Extends any type with Firestore timestamp fields
- `FirestoreTimestamps`: Common timestamp fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`)

### Typed Collection References

- `TypedCollectionReference<T>`: Type-safe collection reference
- `TypedDocumentReference<T>`: Type-safe document reference
- `TypedQuerySnapshot<T>`: Type-safe query snapshot

## Collection Types

### Users (`FirestoreUser`)

```typescript
interface FirestoreUserData {
  email: string;
  emailVerified?: boolean;
  name: string;
  role: FirestoreUserRole; // 'Admin' | 'Accountant' | 'Attorney' | 'View-only' | 'System'
  firmId: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  lastLogin?: number;
  isActive: boolean;
  permissions?: Partial<UserPermissions>;
  preferences?: UserPreferences;
}
```

**User Roles & Permissions:**
- `Admin`: Full access to all features and user management
- `Accountant`: Can manage matters, transactions, and reports
- `Attorney`: Can manage matters and view reports
- `View-only`: Read-only access to all data
- `System`: System account with limited access

### Firms (`FirestoreFirm`)

```typescript
interface FirestoreFirmData {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: Address;
  logoUrl?: string;
  settings: FirmSettingsData;
  isActive: boolean;
  subscriptionTier?: 'Free' | 'Pro' | 'Agency' | 'Enterprise';
  subscriptionExpiresAt?: number;
  stripeCustomerId?: string;
}
```

### Matters (`FirestoreMatter`)

```typescript
interface FirestoreMatterData {
  matterNumber: string;
  clientName: string;
  matterType: MatterType;
  status: MatterStatus; // 'Active' | 'Closed' | 'Archive'
  principal: number;
  interestRate: number;
  openDate: number;
  closeDate?: number;
  description?: string;
  notes?: string;
  // Cached calculated fields
  totalDraws?: number;
  totalPrincipalPayments?: number;
  totalInterestAccrued?: number;
  interestPaid?: number;
  principalBalance?: number;
  totalOwed?: number;
  firmId: string;
  assignedAttorneyId?: string;
  tags?: string[];
}
```

### Transactions (`FirestoreTransaction`)

```typescript
interface FirestoreTransactionData {
  matterId?: string;
  firmId: string;
  type: TransactionType; // 'deposit' | 'withdrawal' | 'adjustment' | 'interest_payment'
  amount: number;
  date: number;
  description?: string;
  reference?: string;
  status: TransactionStatus; // 'pending' | 'posted' | 'allocated' | 'reconciled' | 'void'
  allocationId?: string;
  category?: string;
  bankFeedId?: string;
  isReconciled?: boolean;
  postedBy?: string;
  approvedBy?: string;
  approvedAt?: number;
}
```

### Rate Entries (`FirestoreRateEntry`)

```typescript
interface FirestoreRateEntryData {
  rate: number; // e.g., 8.5 for 8.5%
  effectiveDate: number;
  source?: string; // 'Federal Reserve' | 'Manual Entry'
  notes?: string;
  firmId?: string;
  modifier?: number; // Firm-specific modifier
  totalRate?: number; // Rate + modifier
}
```

### Daily Balances (`FirestoreDailyBalance`)

```typescript
interface FirestoreDailyBalanceData {
  matterId: string;
  date: number;
  principal: number;
  interestToDate: number;
  balance: number;
  rate: number;
  dailyInterest?: number;
  firmId: string;
}
```

### Interest Allocations (`FirestoreInterestAllocation`)

```typescript
interface FirestoreInterestAllocationData {
  periodStart: number;
  periodEnd: number;
  totalInterest: number;
  tier1Amount: number; // $0 principal matters
  tier2Amount: number; // Pro rata allocation
  carryForward: number;
  status: AllocationStatus; // 'draft' | 'pending' | 'finalized' | 'void'
  allocations: MatterAllocation[];
  autodraftTransactionId?: string;
  autodraftDate?: number;
  finalizedAt?: number;
  finalizedBy?: string;
  firmId: string;
}
```

### Audit Logs (`FirestoreAuditLog`)

```typescript
interface FirestoreAuditLogData {
  userId: string;
  userName: string;
  userEmail?: string;
  action: AuditAction;
  collection: string;
  documentId?: string;
  timestamp: number;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  firmId: string;
}
```

### Bank Feeds (`FirestoreBankFeed`)

```typescript
interface FirestoreBankFeedData {
  firmId: string;
  source: BankFeedSource; // 'BankJoy' | 'Plaid' | 'Manual' | 'OFX'
  rawTransactionId: string;
  amount: number;
  date: number;
  description: string;
  status: BankFeedStatus; // 'pending' | 'matched' | 'unmatched' | 'ignored' | 'error'
  matchedTransactionId?: string;
  matchedAt?: number;
  confidenceScore?: number;
  rawData?: Record<string, unknown>;
  processedAt?: number;
  errorMessage?: string;
  retryCount?: number;
}
```

## Utility Types

### Type Conversions

- `WithDates<T>`: Convert Firestore timestamp numbers to Date objects
- `FirestoreToAppType<T>`: Convert Firestore document to app type
- `UpdateType<T>`: Create an update type with optional fields

### Query Types

- `QueryConstraints`: Type-safe query constraints
- `PaginatedQueryResult<T>`: Paginated query results
- `FirestoreQueryResult<T>`: Query result with document metadata

### Collection Names

```typescript
export const COLLECTION_NAMES = {
  USERS: 'users',
  FIRMS: 'firms',
  MATTERS: 'matters',
  TRANSACTIONS: 'transactions',
  RATE_ENTRIES: 'rateEntries',
  DAILY_BALANCES: 'dailyBalances',
  INTEREST_ALLOCATIONS: 'interestAllocations',
  AUDIT_LOGS: 'auditLogs',
  BANK_FEEDS: 'bankFeeds',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
} as const;
```

## Usage Examples

### Reading Documents

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreUser } from '@/types/firestore';

const userRef = doc(db, COLLECTION_NAMES.USERS, userId);
const userDoc = await getDoc(userRef);

if (userDoc.exists()) {
  const userData = userDoc.data() as FirestoreUser;
  console.log(userData.name, userData.role);
}
```

### Writing Documents

```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreMatter } from '@/types/firestore';
import { createDocument } from '@/lib/firestoreUtils';

const mattersRef = collection(db, COLLECTION_NAMES.MATTERS);

const newMatter: Omit<FirestoreMatter, 'id'> = createDocument({
  matterNumber: 'M-001',
  clientName: 'John Doe',
  matterType: 'Personal Injury',
  status: 'Active',
  principal: 0,
  interestRate: 11.0,
  openDate: Date.now(),
  firmId: currentFirmId,
}, userId);

await addDoc(mattersRef, newMatter);
```

### Updating Documents

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreMatterUpdate } from '@/types/firestore';
import { createUpdate } from '@/lib/firestoreUtils';

const matterRef = doc(db, COLLECTION_NAMES.MATTERS, matterId);

const updates: FirestoreMatterUpdate = createUpdate({
  status: 'Closed',
  closeDate: Date.now(),
  principalBalance: 0,
  totalOwed: 0,
}, userId);

await updateDoc(matterRef, updates);
```

### Type-Safe Queries

```typescript
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreMatter } from '@/types/firestore';

const mattersRef = collection(db, COLLECTION_NAMES.MATTERS) as TypedCollectionReference<FirestoreMatter>;

const q = query(
  mattersRef,
  where('firmId', '==', firmId),
  where('status', '==', 'Active'),
  orderBy('createdAt', 'desc')
);
```

### Converting Timestamps

```typescript
import { toDate, formatTimestamp } from '@/lib/firestoreUtils';

// Convert to Date
const date = toDate(matter.createdAt); // Date | null

// Format for display
const formatted = formatTimestamp(matter.createdAt, 'short'); // 'Jan 15, 2026'
```

## Helper Functions

The `@/lib/firestoreUtils` module provides utility functions:

- `toDate(timestamp)`: Convert Firestore timestamp to Date
- `toTimestamp(date)`: Convert Date to Firestore Timestamp
- `now()`: Get current timestamp as milliseconds
- `formatTimestamp(timestamp, format)`: Format timestamp for display
- `createDocument(data, userId)`: Create document with timestamps
- `createUpdate(updates, userId)`: Create update object with timestamp
- `isValidDocumentId(id)`: Validate document ID
- `sanitizeDocumentId(id)`: Sanitize string for document ID

## Best Practices

1. **Always use types**: Always specify the document type when working with Firestore
2. **Use utility functions**: Use `createDocument` and `createUpdate` for consistent timestamps
3. **Validate IDs**: Validate document IDs before creating documents
4. **Handle timestamps**: Use `toDate` to convert timestamps to Date objects
5. **Type assertions**: Use type assertions only when necessary, prefer type guards
6. **Collection names**: Always use `COLLECTION_NAMES` constants
7. **Error handling**: Use FirestoreError class for consistent error handling

## Migration Notes

When migrating from existing types to Firestore types:

1. Replace `Date` fields with `number` (milliseconds since epoch)
2. Add `createdAt` and `updatedAt` fields to all documents
3. Use `TimestampedDocument<T>` to extend existing types
4. Update all Firestore operations to use typed references
5. Add permission checks based on user roles

## Type Safety Guarantees

- All Firestore operations are fully typed
- Collection references are type-safe
- Query constraints are validated at compile time
- Document IDs are validated before creation
- Timestamps are handled consistently
- Updates only allow fields that exist in the document type
