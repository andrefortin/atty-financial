/**
 * Firestore Utility Functions
 *
 * Helper functions for working with Firestore documents and timestamps
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// Timestamp Conversions
// ============================================

/**
 * Convert a Firestore Timestamp or number to a JavaScript Date
 */
export function toDate(timestamp: Timestamp | number | Date | undefined): Date | null {
  if (!timestamp) {
    return null;
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }

  // Assume it's a number (milliseconds since epoch)
  return new Date(timestamp);
}

/**
 * Convert a JavaScript Date to Firestore Timestamp
 */
export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Convert a JavaScript Date to milliseconds since epoch
 */
export function toMillis(date: Date): number {
  return date.getTime();
}

/**
 * Get current timestamp as milliseconds
 */
export function now(): number {
  return Date.now();
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(
  timestamp: Timestamp | number | Date | undefined,
  format: 'short' | 'long' | 'time' = 'short'
): string {
  const date = toDate(timestamp);

  if (!date) {
    return 'N/A';
  }

  const options: Intl.DateTimeFormatOptions = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
    time: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
  }[format];

  return date.toLocaleDateString('en-US', options);
}

// ============================================
// Document Helpers
// ============================================

/**
 * Create a document with timestamps for creation
 */
export function createDocument<T extends Record<string, unknown>>(
  data: T,
  userId?: string
): T & { createdAt: number; createdBy?: string } {
  return {
    ...data,
    createdAt: now(),
    ...(userId && { createdBy: userId }),
  };
}

/**
 * Create an update object with timestamp
 */
export function createUpdate<T extends Record<string, unknown>>(
  updates: Partial<T>,
  userId?: string
): Partial<T> & { updatedAt: number; updatedBy?: string } {
  return {
    ...updates,
    updatedAt: now(),
    ...(userId && { updatedBy: userId }),
  };
}

/**
 * Check if a document exists
 */
export function documentExists<T>(doc: { exists: boolean } | null | undefined): doc is { exists: true } {
  return doc !== null && doc !== undefined && doc.exists;
}

// ============================================
// Query Helpers
// ============================================

/**
 * Build a query path for a document
 */
export function documentPath(collection: string, documentId: string): string {
  return `${collection}/${documentId}`;
}

/**
 * Extract document ID from a Firestore reference
 */
export function getDocumentId(ref: { id: string }): string {
  return ref.id;
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate that a string is a valid Firestore document ID
 */
export function isValidDocumentId(id: string): boolean {
  // Firestore document IDs must be non-empty strings
  // and cannot contain certain special characters
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    id.length <= 1500 &&
    !id.includes('/') &&
    !id.includes('..') &&
    !id.startsWith('.')
  );
}

/**
 * Sanitize a string for use as a document ID
 */
export function sanitizeDocumentId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 1500);
}

// ============================================
// Type Guards
// ============================================

/**
 * Check if a value is a Firestore Timestamp
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

/**
 * Check if a value is a timestamp number (milliseconds)
 */
export function isTimestampNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && value < Date.now() + 31536000000; // Within 1 year from now
}

// ============================================
// Batch Operation Helpers
// ============================================

/**
 * Group documents by a field for batch operations
 */
export function groupByField<T extends Record<string, unknown>, K extends keyof T>(
  items: T[],
  field: K
): Map<T[K], T[]> {
  return items.reduce((map, item) => {
    const key = item[field];
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(item);
    return map;
  }, new Map());
}

/**
 * Chunk an array into smaller arrays for batch operations
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// ============================================
// Error Helpers
// ============================================

/**
 * Create a standardized error object for Firestore operations
 */
export class FirestoreError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

/**
 * Check if an error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  return (
    error instanceof FirestoreError &&
    (error.code === 'permission-denied' || error.code === 'unauthenticated')
  );
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof FirestoreError && error.code === 'not-found';
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return (
    error instanceof FirestoreError && error.code === 'failed-precondition'
  );
}
