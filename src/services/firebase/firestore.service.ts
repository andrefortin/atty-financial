/**
 * Base Firestore Service
 *
 * Provides common CRUD operations, error handling, retry logic,
 * and transaction support for all Firebase collections.
 *
 * @module services/firebase/firestore.service
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  QueryDocumentSnapshot,
  DocumentReference,
  CollectionReference,
  runTransaction,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FirestoreDocument, TimestampedDocument, QueryConstraints } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  pageSize?: number;
  startAfterDoc?: QueryDocumentSnapshot;
}

/**
 * Query result with pagination info
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot;
  total: number;
}

/**
 * Operation result with error handling
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Batch operation options
 */
export interface BatchOptions {
  maxBatchSize?: number;
}

// ============================================
// Error Handling
// ============================================

/**
 * Custom error class for Firestore operations
 */
export class FirestoreServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'FirestoreServiceError';
  }
}

/**
 * Parse Firestore error and return user-friendly message
 */
export function parseFirestoreError(error: unknown): FirestoreServiceError {
  if (error instanceof FirestoreServiceError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'An unknown error occurred';

  // Map common Firebase error codes
  const codeMap: Record<string, string> = {
    'permission-denied': 'You do not have permission to perform this action',
    'not-found': 'The requested document was not found',
    'already-exists': 'A document with this identifier already exists',
    'invalid-argument': 'Invalid arguments provided',
    'failed-precondition': 'Operation failed due to precondition',
    'aborted': 'The operation was aborted',
    'out-of-range': 'The operation was attempted past the valid range',
    'unauthenticated': 'You must be authenticated to perform this action',
    'resource-exhausted': 'Resource quota has been exceeded',
    'cancelled': 'The operation was cancelled',
    'data-loss': 'Unrecoverable data loss or corruption',
    'unknown': 'Unknown error',
  };

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    const friendlyMessage = codeMap[errorCode] || message;
    return new FirestoreServiceError(friendlyMessage, errorCode, error);
  }

  return new FirestoreServiceError(message, 'unknown', error);
}

// ============================================
// Retry Logic
// ============================================

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Execute operation with retry logic
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain error types
      const isNonRetryable =
        error instanceof FirestoreServiceError &&
        [
          'permission-denied',
          'not-found',
          'already-exists',
          'invalid-argument',
          'unauthenticated',
        ].includes(error.code || '');

      if (isNonRetryable || attempt === maxAttempts) {
        throw parseFirestoreError(error);
      }

      // Wait before retrying
      const currentDelay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  throw parseFirestoreError(lastError);
}

// ============================================
// Base CRUD Operations
// ============================================

/**
 * Create a document with auto-generated ID
 */
export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: Omit<TimestampedDocument<T>, 'id' | 'createdAt'>
): Promise<OperationResult<FirestoreDocument<T>>> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Date.now(),
    });

    const newDoc = await getDoc(docRef);
    const docData = newDoc.data();

    if (!docData) {
      throw new FirestoreServiceError('Failed to retrieve created document', 'unknown');
    }

    return {
      success: true,
      data: {
        id: newDoc.id,
        data: docData as TimestampedDocument<T>,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

/**
 * Create a document with specific ID
 */
export async function createDocumentWithId<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: Omit<TimestampedDocument<T>, 'id' | 'createdAt'>
): Promise<OperationResult<FirestoreDocument<T>>> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await setDoc(docRef, {
      ...data,
      createdAt: Date.now(),
    });

    const newDoc = await getDoc(docRef);
    const docData = newDoc.data();

    if (!docData) {
      throw new FirestoreServiceError('Failed to retrieve created document', 'unknown');
    }

    return {
      success: true,
      data: {
        id: newDoc.id,
        data: docData as TimestampedDocument<T>,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

/**
 * Get a document by ID
 */
export async function getDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string
): Promise<OperationResult<FirestoreDocument<T>>> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: `Document ${documentId} not found in ${collectionName}`,
        code: 'not-found',
      };
    }

    const docData = docSnap.data();
    if (!docData) {
      throw new FirestoreServiceError('Failed to retrieve document data', 'unknown');
    }

    return {
      success: true,
      data: {
        id: docSnap.id,
        data: docData as TimestampedDocument<T>,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

/**
 * Update a document
 */
export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  updates: Partial<TimestampedDocument<T>>
): Promise<OperationResult<void>> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

/**
 * Set a document (replace entire document)
 */
export async function setDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: TimestampedDocument<T>
): Promise<OperationResult<void>> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await setDoc(docRef, data);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<OperationResult<void>> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

// ============================================
// Query Operations
// ============================================

/**
 * Build a Firestore query from constraints
 */
function buildQuery<T extends Record<string, unknown>>(
  collectionRef: CollectionReference<T>,
  constraints?: QueryConstraints
): Query<T> {
  let q = query(collectionRef) as Query<T>;

  if (!constraints) return q;

  // Add where clauses
  if (constraints.where) {
    constraints.where.forEach((constraint) => {
      q = query(q, where(constraint.field, constraint.operator, constraint.value));
    });
  }

  // Add ordering
  if (constraints.orderBy) {
    constraints.orderBy.forEach((order) => {
      q = query(q, orderBy(order.field, order.direction));
    });
  }

  // Add limit
  if (constraints.limit) {
    q = query(q, limit(constraints.limit));
  }

  return q;
}

/**
 * Query documents
 */
export async function queryDocuments<T extends Record<string, unknown>>(
  collectionName: string,
  constraints?: QueryConstraints
): Promise<OperationResult<FirestoreDocument<T>[]>> {
  try {
    const collectionRef = collection(db, collectionName) as CollectionReference<T>;
    const q = buildQuery(collectionRef, constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((docSnap) => {
      const docData = docSnap.data();
      if (!docData) {
        throw new FirestoreServiceError('Failed to retrieve document data', 'unknown');
      }
      return {
        id: docSnap.id,
        data: docData as TimestampedDocument<T>,
      };
    });

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

/**
 * Query documents with pagination
 */
export async function queryDocumentsPaginated<T extends Record<string, unknown>>(
  collectionName: string,
  pagination: PaginationOptions = {},
  constraints?: QueryConstraints
): Promise<OperationResult<PaginatedResult<T>>> {
  try {
    const { pageSize = 50, startAfterDoc } = pagination;
    const collectionRef = collection(db, collectionName) as CollectionReference<T>;
    let q = buildQuery(collectionRef, constraints);

    // Add pagination
    q = query(q, limit(pageSize + 1)); // +1 to check if there are more

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((docSnap) => {
      const docData = docSnap.data();
      if (!docData) {
        throw new FirestoreServiceError('Failed to retrieve document data', 'unknown');
      }
      return {
        id: docSnap.id,
        data: docData as TimestampedDocument<T>,
      };
    });

    const hasMore = documents.length > pageSize;
    const pageDocs = hasMore ? documents.slice(0, pageSize) : documents;

    return {
      success: true,
      data: {
        data: pageDocs,
        hasMore,
        lastDoc: querySnapshot.docs[Math.min(pageSize, querySnapshot.docs.length - 1)],
        total: pageDocs.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

// ============================================
// Transaction Support
// ============================================

/**
 * Execute a transaction
 */
export async function executeTransaction<T>(
  transactionFn: (transaction: ReturnType<typeof runTransaction>) => Promise<T>
): Promise<OperationResult<T>> {
  try {
    const result = await runTransaction(db, transactionFn);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

// ============================================
// Batch Operations
// ============================================

/**
 * Execute a batch operation
 */
export async function executeBatch(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    documentId: string;
    data?: Record<string, unknown>;
  }>,
  options: BatchOptions = {}
): Promise<OperationResult<void>> {
  try {
    const { maxBatchSize = 500 } = options;
    const batches: ReturnType<typeof writeBatch>[] = [];

    // Chunk operations into batches
    for (let i = 0; i < operations.length; i += maxBatchSize) {
      const chunk = operations.slice(i, i + maxBatchSize);
      const batch = writeBatch(db);

      chunk.forEach((op) => {
        const docRef = doc(db, op.collection, op.documentId);

        switch (op.type) {
          case 'set':
            if (op.data) {
              batch.set(docRef, op.data);
            }
            break;
          case 'update':
            if (op.data) {
              batch.update(docRef, op.data);
            }
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      batches.push(batch);
    }

    // Commit all batches
    await Promise.all(batches.map((batch) => batch.commit()));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: parseFirestoreError(error).message,
      code: parseFirestoreError(error).code,
    };
  }
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to document changes
 */
export function subscribeToDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  onUpdate: (doc: FirestoreDocument<T> | null) => void,
  onError?: (error: FirestoreServiceError) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, documentId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onUpdate(null);
        return;
      }

      const docData = docSnap.data();
      if (!docData) {
        return;
      }

      onUpdate({
        id: docSnap.id,
        data: docData as TimestampedDocument<T>,
      });
    },
    (error) => {
      if (onError) {
        onError(parseFirestoreError(error));
      }
    }
  );
}

/**
 * Subscribe to query results
 */
export function subscribeToQuery<T extends Record<string, unknown>>(
  collectionName: string,
  constraints?: QueryConstraints,
  onUpdate: (docs: FirestoreDocument<T>[]) => void,
  onError?: (error: FirestoreServiceError) => void
): Unsubscribe {
  const collectionRef = collection(db, collectionName) as CollectionReference<T>;
  const q = buildQuery(collectionRef, constraints);

  return onSnapshot(
    q,
    (querySnapshot) => {
      const documents = querySnapshot.docs.map((docSnap) => {
        const docData = docSnap.data();
        if (!docData) {
          throw new FirestoreServiceError('Failed to retrieve document data', 'unknown');
        }
        return {
          id: docSnap.id,
          data: docData as TimestampedDocument<T>,
        };
      });

      onUpdate(documents);
    },
    (error) => {
      if (onError) {
        onError(parseFirestoreError(error));
      }
    }
  );
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a document exists
 */
export async function documentExists(
  collectionName: string,
  documentId: string
): Promise<OperationResult<boolean>> {
  const result = await getDocument(collectionName, documentId);
  return {
    success: true,
    data: result.success,
  };
}

/**
 * Get collection reference
 */
export function getCollectionRef<T extends Record<string, unknown>>(
  collectionName: string
): CollectionReference<T> {
  return collection(db, collectionName) as CollectionReference<T>;
}

/**
 * Get document reference
 */
export function getDocRef<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string
): DocumentReference<T> {
  return doc(db, collectionName, documentId) as DocumentReference<T>;
}
