# Firestore Quick Start Guide

Get up and running with Firestore types in 5 minutes.

## Step 1: Set Up Environment Variables

Copy the Firebase variables from `.env.example` to your `.env` file:

```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Step 2: Import Firebase

```typescript
import { auth, db } from '@/lib/firebase';
```

## Step 3: Import Types

```typescript
import type {
  FirestoreUser,
  FirestoreMatter,
  FirestoreTransaction,
} from '@/types/firestore';

import { COLLECTION_NAMES } from '@/types/firestore';
```

## Step 4: Basic Operations

### Read a Document

```typescript
import { doc, getDoc } from 'firebase/firestore';

const userRef = doc(db, COLLECTION_NAMES.USERS, userId);
const userDoc = await getDoc(userRef);

if (userDoc.exists()) {
  const user = userDoc.data() as FirestoreUser;
  console.log(user.name, user.role);
}
```

### Create a Document

```typescript
import { collection, addDoc } from 'firebase/firestore';
import { createDocument } from '@/lib/firestoreUtils';

const mattersRef = collection(db, COLLECTION_NAMES.MATTERS);

const newMatter = createDocument({
  matterNumber: 'M-001',
  clientName: 'John Doe',
  matterType: 'Personal Injury',
  status: 'Active',
  principal: 0,
  interestRate: 11.0,
  openDate: Date.now(),
  firmId: currentFirmId,
}, userId);

const docRef = await addDoc(mattersRef, newMatter);
console.log('Created with ID:', docRef.id);
```

### Update a Document

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { createUpdate } from '@/lib/firestoreUtils';

const matterRef = doc(db, COLLECTION_NAMES.MATTERS, matterId);

const updates = createUpdate({
  status: 'Closed',
  closeDate: Date.now(),
}, userId);

await updateDoc(matterRef, updates);
```

### Query Documents

```typescript
import { collection, query, where, orderBy } from 'firebase/firestore';

const mattersRef = collection(db, COLLECTION_NAMES.MATTERS);

const q = query(
  mattersRef,
  where('firmId', '==', firmId),
  where('status', '==', 'Active'),
  orderBy('createdAt', 'desc')
);

const querySnapshot = await getDocs(q);
const matters = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
} as FirestoreMatter));
```

### Delete a Document

```typescript
import { doc, deleteDoc } from 'firebase/firestore';

const matterRef = doc(db, COLLECTION_NAMES.MATTERS, matterId);
await deleteDoc(matterRef);
```

## Step 5: Use Utility Functions

### Convert Timestamps

```typescript
import { toDate, formatTimestamp } from '@/lib/firestoreUtils';

// Convert to Date
const date = toDate(matter.createdAt); // Date | null

// Format for display
const formatted = formatTimestamp(matter.createdAt, 'short'); // 'Jan 15, 2026'
const long = formatTimestamp(matter.createdAt, 'long'); // 'January 15, 2026 at 2:30 PM'
```

### Validate Document IDs

```typescript
import { isValidDocumentId, sanitizeDocumentId } from '@/lib/firestoreUtils';

if (isValidDocumentId(matterId)) {
  // Use the ID
}

const safeId = sanitizeDocumentId('User #123'); // 'User__123'
```

## Common Patterns

### Check Document Exists

```typescript
import { doc, getDoc } from 'firebase/firestore';

const docRef = doc(db, COLLECTION_NAMES.MATTERS, matterId);
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
  // Document exists
}
```

### Real-time Updates

```typescript
import { doc, onSnapshot } from 'firebase/firestore';

const matterRef = doc(db, COLLECTION_NAMES.MATTERS, matterId);

const unsubscribe = onSnapshot(matterRef, (docSnap) => {
  if (docSnap.exists()) {
    const matter = docSnap.data() as FirestoreMatter;
    console.log('Matter updated:', matter);
  }
});

// Call to stop listening
unsubscribe();
```

### Paginated Query

```typescript
import { collection, query, orderBy, limit, startAfter } from 'firebase/firestore';

let lastDoc = null;

async function loadMatters() {
  let q = query(
    collection(db, COLLECTION_NAMES.MATTERS),
    where('firmId', '==', firmId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  lastDoc = snapshot.docs[snapshot.docs.length - 1];

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as FirestoreMatter));
}
```

## Collection Names Reference

```typescript
COLLECTION_NAMES.USERS              // 'users'
COLLECTION_NAMES.FIRMS              // 'firms'
COLLECTION_NAMES.MATTERS            // 'matters'
COLLECTION_NAMES.TRANSACTIONS       // 'transactions'
COLLECTION_NAMES.RATE_ENTRIES        // 'rateEntries'
COLLECTION_NAMES.DAILY_BALANCES      // 'dailyBalances'
COLLECTION_NAMES.INTEREST_ALLOCATIONS // 'interestAllocations'
COLLECTION_NAMES.AUDIT_LOGS         // 'auditLogs'
COLLECTION_NAMES.BANK_FEEDS         // 'bankFeeds'
COLLECTION_NAMES.REPORTS            // 'reports'
COLLECTION_NAMES.NOTIFICATIONS      // 'notifications'
```

## Type Examples

### FirestoreUser

```typescript
interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Accountant' | 'Attorney' | 'View-only' | 'System';
  firmId: string;
  createdAt: number;
  updatedAt?: number;
  isActive: boolean;
  // ... more fields
}
```

### FirestoreMatter

```typescript
interface FirestoreMatter {
  id: string;
  matterNumber: string;
  clientName: string;
  matterType: 'Personal Injury' | 'Workers Compensation' | 'Mass Tort' | 'Class Action' | 'Other';
  status: 'Active' | 'Closed' | 'Archive';
  principal: number;
  interestRate: number;
  openDate: number;
  closeDate?: number;
  createdAt: number;
  // ... more fields
}
```

### FirestoreTransaction

```typescript
interface FirestoreTransaction {
  id: string;
  matterId?: string;
  firmId: string;
  type: 'deposit' | 'withdrawal' | 'adjustment' | 'interest_payment';
  amount: number;
  date: number;
  status: 'pending' | 'posted' | 'allocated' | 'reconciled' | 'void';
  createdAt: number;
  // ... more fields
}
```

## Error Handling

```typescript
import { FirestoreError } from '@/lib/firestoreUtils';

try {
  await updateDoc(matterRef, updates);
} catch (error) {
  if (error instanceof FirestoreError) {
    console.error('Firestore error:', error.code, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Learn More

- **Full Documentation**: `src/types/firestore/README.md`
- **Code Patterns**: `src/types/firestore/patterns.ts`
- **Implementation Summary**: `src/types/firestore/IMPLEMENTATION_SUMMARY.md`
- **Firebase Utils**: `src/lib/firestoreUtils.ts`

## Need Help?

Check the existing code examples in:
- `src/components/` - Component usage examples
- `src/services/` - Service layer patterns
- `src/hooks/` - Custom React hooks for Firestore

Happy coding! 🚀
