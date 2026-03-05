/**
 * Common Firestore Patterns and Templates
 *
 * This file provides code templates and patterns for common Firestore operations.
 * Copy and adapt these patterns for your specific use cases.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTION_NAMES } from '@/types/firestore';
import { createDocument, createUpdate, toDate } from '@/lib/firestoreUtils';

// ============================================
// Pattern 1: Read a Single Document
// ============================================

/**
 * Template for reading a single document by ID
 */
export async function getDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as T;
}

// Usage:
// const user = await getDocument<FirestoreUser>(COLLECTION_NAMES.USERS, userId);

// ============================================
// Pattern 2: Query with Multiple Conditions
// ============================================

/**
 * Template for querying documents with multiple conditions
 */
export async function queryDocuments<T extends Record<string, unknown>>(
  collectionName: string,
  conditions: Array<{ field: string; operator: '==' | '!=' | '>' | '<' | '>=' | '<='; value: unknown }>,
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);

  let q = query(collectionRef);

  // Add where conditions
  conditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });

  // Add ordering
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }

  // Add limit
  if (limitCount) {
    q = query(q, limit(limitCount));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as T));
}

// Usage:
// const activeMatters = await queryDocuments<FirestoreMatter>(
//   COLLECTION_NAMES.MATTERS,
//   [
//     { field: 'firmId', operator: '==', value: firmId },
//     { field: 'status', operator: '==', value: 'Active' },
//   ],
//   'createdAt',
//   'desc'
// );

// ============================================
// Pattern 3: Create a Document
// ============================================

/**
 * Template for creating a new document with auto-generated ID
 */
export async function createDocumentAutoId<T extends Record<string, unknown>>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'createdBy'>,
  userId?: string
): Promise<string> {
  const collectionRef = collection(db, collectionName);
  const documentData = createDocument(data, userId);

  const docRef = await addDoc(collectionRef, documentData);
  return docRef.id;
}

// Usage:
// const matterId = await createDocumentAutoId<FirestoreMatter>(
//   COLLECTION_NAMES.MATTERS,
//   {
//     matterNumber: 'M-001',
//     clientName: 'John Doe',
//     matterType: 'Personal Injury',
//     status: 'Active',
//     principal: 0,
//     interestRate: 11.0,
//     openDate: Date.now(),
//     firmId: currentFirmId,
//   },
//   userId
// );

// ============================================
// Pattern 4: Update a Document
// ============================================

/**
 * Template for updating a document
 */
export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  updates: Partial<Omit<T, 'id' | 'createdAt' | 'createdBy'>>,
  userId?: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  const updateData = createUpdate(updates, userId);

  await updateDoc(docRef, updateData);
}

// Usage:
// await updateDocument<FirestoreMatter>(
//   COLLECTION_NAMES.MATTERS,
//   matterId,
//   {
//     status: 'Closed',
//     closeDate: Date.now(),
//   },
//   userId
// );

// ============================================
// Pattern 5: Delete a Document
// ============================================

/**
 * Template for deleting a document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
}

// Usage:
// await deleteDocument(COLLECTION_NAMES.MATTERS, matterId);

// ============================================
// Pattern 6: Batch Create Multiple Documents
// ============================================

/**
 * Template for creating multiple documents in a batch
 */
export async function batchCreateDocuments<T extends Record<string, unknown>>(
  collectionName: string,
  items: Array<Omit<T, 'id' | 'createdAt' | 'createdBy'>>,
  userId?: string
): Promise<string[]> {
  const { writeBatch, getDocs } = await import('firebase/firestore');

  const collectionRef = collection(db, collectionName);
  const batch = writeBatch(db);
  const docRefs: string[] = [];

  // Firestore batches are limited to 500 operations
  const batchSize = 500;

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const currentBatch = writeBatch(db);

    chunk.forEach(item => {
      const docRef = doc(collectionRef);
      const documentData = createDocument(item, userId);
      currentBatch.set(docRef, documentData);
      docRefs.push(docRef.id);
    });

    await currentBatch.commit();
  }

  return docRefs;
}

// Usage:
// const matterIds = await batchCreateDocuments<FirestoreMatter>(
//   COLLECTION_NAMES.MATTERS,
//   [
//     { matterNumber: 'M-001', clientName: 'John Doe', /* ... */ },
//     { matterNumber: 'M-002', clientName: 'Jane Smith', /* ... */ },
//   ],
//   userId
// );

// ============================================
// Pattern 7: Real-time Subscription
// ============================================

/**
 * Template for real-time document subscription
 */
export function subscribeToDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  onUpdate: (data: T | null) => void,
  onError: (error: Error) => void
): () => void {
  const { onSnapshot, doc } = require('firebase/firestore');

  const docRef = doc(db, collectionName, documentId);

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onUpdate(null);
        return;
      }

      onUpdate({
        id: docSnap.id,
        ...docSnap.data(),
      } as T);
    },
    (error) => {
      onError(error as Error);
    }
  );

  return unsubscribe;
}

// Usage:
// const unsubscribe = subscribeToDocument<FirestoreMatter>(
//   COLLECTION_NAMES.MATTERS,
//   matterId,
//   (matter) => {
//     console.log('Matter updated:', matter);
//   },
//   (error) => {
//     console.error('Error:', error);
//   }
// );
//
// // Call to unsubscribe
// unsubscribe();

// ============================================
// Pattern 8: Paginated Query
// ============================================

/**
 * Template for paginated queries
 */
export interface PaginationResult<T> {
  items: T[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot;
}

export async function queryPaginated<T extends Record<string, unknown>>(
  collectionName: string,
  conditions: Array<{ field: string; operator: '==' | '>' | '<' | '>=' | '<='; value: unknown }>,
  orderByField: string,
  pageSize: number = 10,
  lastDoc?: QueryDocumentSnapshot
): Promise<PaginationResult<T>> {
  let q = query(collection(db, collectionName));

  // Add where conditions
  conditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });

  // Add ordering
  q = query(q, orderBy(orderByField, 'desc'));

  // Add pagination
  q = query(q, limit(pageSize));

  // Start after last document
  if (lastDoc) {
    const { startAfter } = await import('firebase/firestore');
    q = query(q, startAfter(lastDoc));
  }

  const querySnapshot = await getDocs(q);
  const items = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as T));

  return {
    items,
    hasMore: items.length === pageSize,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
  };
}

// Usage:
// let lastDoc: QueryDocumentSnapshot | undefined;
//
// async function loadMore() {
//   const result = await queryPaginated<FirestoreMatter>(
//     COLLECTION_NAMES.MATTERS,
//     [{ field: 'firmId', operator: '==', value: firmId }],
//     'createdAt',
//     10,
//     lastDoc
//   );
//
//   // Handle results...
//   lastDoc = result.lastDoc;
// }

// ============================================
// Pattern 9: Transactional Update
// ============================================

/**
 * Template for transactional updates
 */
export async function transactionalUpdate<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  updates: Partial<Omit<T, 'id' | 'createdAt' | 'createdBy'>>,
  userId?: string
): Promise<void> {
  const { runTransaction, doc } = await import('firebase/firestore');

  const docRef = doc(db, collectionName, documentId);
  const updateData = createUpdate(updates, userId);

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);

    if (!docSnap.exists()) {
      throw new Error('Document does not exist');
    }

    // Perform any validation here using docSnap.data()

    transaction.update(docRef, updateData);
  });
}

// Usage:
// await transactionalUpdate<FirestoreMatter>(
//   COLLECTION_NAMES.MATTERS,
//   matterId,
//   {
//     status: 'Closed',
//     closeDate: Date.now(),
//   },
//   userId
// );

// ============================================
// Pattern 10: Check Document Exists
// ============================================

/**
 * Template for checking if a document exists
 */
export async function documentExists(
  collectionName: string,
  documentId: string
): Promise<boolean> {
  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

// Usage:
// const exists = await documentExists(COLLECTION_NAMES.MATTERS, matterId);
