/**
 * Rate Entries Service
 *
 * CRUD operations for rate history collection.
 * Provides rate lookup and calendar queries.
 *
 * @module services/firebase/rateEntries.service
 */

import {
  query,
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import {
  createDocument,
  createDocumentWithId,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  subscribeToDocument,
  subscribeToQuery,
  type OperationResult,
  type FirestoreDocument,
} from './firestore.service';
import type {
  FirestoreRateEntry,
  FirestoreRateEntryData,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Rate entry creation input
 */
export interface CreateRateEntryInput {
  rate: number;
  effectiveDate: number;
  source?: string;
  notes?: string;
  firmId?: string;
  modifier?: number;
}

/**
 * Rate entry update input
 */
export interface UpdateRateEntryInput {
  rate?: number;
  effectiveDate?: number;
  source?: string;
  notes?: string;
}

/**
 * Rate lookup result
 */
export interface RateLookupResult {
  rate: number;
  totalRate: number;
  effectiveDate: number;
  rateEntryId: string;
}

/**
 * Rate calendar entry
 */
export interface RateCalendarEntry {
  date: number;
  rate: number;
  totalRate: number;
  rateEntryId: string;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new rate entry
 *
 * @param input - Rate entry creation data
 * @returns Operation result with created rate entry document
 */
export async function createRateEntry(
  input: CreateRateEntryInput
): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>>> {
  const { rate, modifier, firmId, ...rest } = input;

  const rateEntryData: Omit<FirestoreRateEntryData, 'createdAt' | 'updatedAt'> = {
    rate,
    effectiveDate: input.effectiveDate,
    source: input.source || 'Manual Entry',
    notes: input.notes,
    firmId,
    modifier,
    totalRate: modifier ? rate + modifier : rate,
  };

  return createDocument<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    rateEntryData
  );
}

/**
 * Create a rate entry with specific ID
 *
 * @param rateEntryId - Rate entry ID
 * @param input - Rate entry creation data
 * @returns Operation result with created rate entry document
 */
export async function createRateEntryWithId(
  rateEntryId: string,
  input: CreateRateEntryInput
): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>>> {
  const { rate, modifier, firmId, ...rest } = input;

  const rateEntryData: Omit<FirestoreRateEntryData, 'createdAt' | 'updatedAt'> = {
    rate,
    effectiveDate: input.effectiveDate,
    source: input.source || 'Manual Entry',
    notes: input.notes,
    firmId,
    modifier,
    totalRate: modifier ? rate + modifier : rate,
  };

  return createDocumentWithId<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    rateEntryId,
    rateEntryData
  );
}

/**
 * Get a rate entry by ID
 *
 * @param rateEntryId - Rate entry ID
 * @returns Operation result with rate entry document
 */
export async function getRateEntryById(
  rateEntryId: string
): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>>> {
  return getDocument<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    rateEntryId
  );
}

/**
 * Update a rate entry
 *
 * @param rateEntryId - Rate entry ID
 * @param updates - Rate entry update data
 * @returns Operation result
 */
export async function updateRateEntry(
  rateEntryId: string,
  updates: UpdateRateEntryInput
): Promise<OperationResult<void>> {
  const { rate, modifier, ...rest } = updates;
  const updateData: Partial<FirestoreRateEntryData> = {
    ...rest,
  };

  if (rate !== undefined || modifier !== undefined) {
    updateData.rate = rate ?? 0;
    updateData.modifier = modifier;
    updateData.totalRate = (modifier ?? 0) + (rate ?? 0);
  }

  return updateDocument<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    rateEntryId,
    updateData
  );
}

/**
 * Delete a rate entry
 *
 * @param rateEntryId - Rate entry ID
 * @returns Operation result
 */
export async function deleteRateEntry(
  rateEntryId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.RATE_ENTRIES, rateEntryId);
}

// ============================================
// Query Operations
// ============================================

/**
 * Get all rate entries
 *
 * @param options - Query options (firmId, limit)
 * @returns Operation result with rate entry documents
 */
export async function getAllRateEntries(options?: {
  firmId?: string;
  limit?: number;
}): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>[]>> {
  const whereClauses: QueryConstraint[] = [];

  if (options?.firmId) {
    whereClauses.push(where('firmId', '==', options.firmId));
  }

  return queryDocuments<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'effectiveDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get rate entries by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (limit)
 * @returns Operation result with rate entry documents
 */
export async function getRateEntriesByFirm(
  firmId: string,
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>[]>> {
  return queryDocuments<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: firmId,
        },
      ],
      orderBy: [
        {
          field: 'effectiveDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get global rate entries (no firm-specific modifiers)
 *
 * @param options - Query options (limit)
 * @returns Operation result with rate entry documents
 */
export async function getGlobalRateEntries(options?: {
  limit?: number;
}): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>[]>> {
  return queryDocuments<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: null, // null indicates global rate
        },
      ],
      orderBy: [
        {
          field: 'effectiveDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get rate entries by date range
 *
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Query options (firmId)
 * @returns Operation result with rate entry documents
 */
export async function getRateEntriesByDateRange(
  startDate: number,
  endDate: number,
  options?: {
    firmId?: string;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('effectiveDate', '>=', startDate),
    where('effectiveDate', '<=', endDate),
  ];

  if (options?.firmId) {
    whereClauses.push(where('firmId', '==', options.firmId));
  }

  return queryDocuments<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'effectiveDate',
          direction: 'asc',
        },
      ],
    }
  );
}

/**
 * Get rate entries by source
 *
 * @param source - Rate source (e.g., 'Federal Reserve', 'Manual Entry')
 * @param options - Query options (firmId, limit)
 * @returns Operation result with rate entry documents
 */
export async function getRateEntriesBySource(
  source: string,
  options?: {
    firmId?: string;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreRateEntry>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('source', '==', source),
  ];

  if (options?.firmId) {
    whereClauses.push(where('firmId', '==', options.firmId));
  }

  return queryDocuments<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'effectiveDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

// ============================================
// Rate Lookup Operations
// ============================================

/**
 * Get effective rate for a specific date
 *
 * @param targetDate - Target date (timestamp)
 * @param firmId - Firm ID (for firm-specific modifiers)
 * @returns Operation result with rate lookup
 */
export async function getEffectiveRate(
  targetDate: number,
  firmId?: string
): Promise<OperationResult<RateLookupResult>> {
  const whereClauses: QueryConstraint[] = [
    where('effectiveDate', '<=', targetDate),
  ];

  if (firmId) {
    whereClauses.push(where('firmId', '==', firmId));
  }

  const result = await queryDocuments<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'effectiveDate',
          direction: 'desc',
        },
      ],
      limit: 1,
    }
  );

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: 'No rate entry found for the specified date',
      code: 'not-found',
    };
  }

  const rateEntry = result.data[0];

  return {
    success: true,
    data: {
      rate: rateEntry.data.rate,
      totalRate: rateEntry.data.totalRate,
      effectiveDate: rateEntry.data.effectiveDate,
      rateEntryId: rateEntry.id,
    },
  };
}

/**
 * Get current effective rate
 *
 * @param firmId - Firm ID (for firm-specific modifiers)
 * @returns Operation result with rate lookup
 */
export async function getCurrentRate(
  firmId?: string
): Promise<OperationResult<RateLookupResult>> {
  return getEffectiveRate(Date.now(), firmId);
}

/**
 * Get rate calendar for a date range
 *
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param firmId - Firm ID (optional)
 * @returns Operation result with rate calendar
 */
export async function getRateCalendar(
  startDate: number,
  endDate: number,
  firmId?: string
): Promise<OperationResult<RateCalendarEntry[]>> {
  const result = await getRateEntriesByDateRange(startDate, endDate, { firmId });

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to get rate calendar',
      code: result.code,
    };
  }

  const calendar: RateCalendarEntry[] = result.data.map((entry) => ({
    date: entry.data.effectiveDate,
    rate: entry.data.rate,
    totalRate: entry.data.totalRate,
    rateEntryId: entry.id,
  }));

  return {
    success: true,
    data: calendar,
  };
}

/**
 * Detect rate changes between two dates
 *
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param firmId - Firm ID (optional)
 * @returns Operation result with rate changes
 */
export async function detectRateChanges(
  startDate: number,
  endDate: number,
  firmId?: string
): Promise<
  OperationResult<Array<{ date: number; oldRate: number; newRate: number }>
  > {
  const result = await getRateEntriesByDateRange(startDate, endDate, { firmId });

  if (!result.success || !result.data || result.data.length < 2) {
    return {
      success: false,
      error: 'Insufficient rate entries to detect changes',
      code: 'not-found',
    };
  }

  const rateChanges: Array<{
    date: number;
    oldRate: number;
    newRate: number;
  }> = [];

  for (let i = 1; i < result.data.length; i++) {
    const prevEntry = result.data[i - 1];
    const currentEntry = result.data[i];

    if (prevEntry.data.rate !== currentEntry.data.rate) {
      rateChanges.push({
        date: currentEntry.data.effectiveDate,
        oldRate: prevEntry.data.rate,
        newRate: currentEntry.data.rate,
      });
    }
  }

  return {
    success: true,
    data: rateChanges,
  };
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to rate entry changes
 *
 * @param rateEntryId - Rate entry ID
 * @param onUpdate - Callback for rate entry updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToRateEntry(
  rateEntryId: string,
  onUpdate: (rateEntry: FirestoreDocument<FirestoreRateEntry> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    rateEntryId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to firm rate entries
 *
 * @param firmId - Firm ID
 * @param options - Subscription options (limit)
 * @param onUpdate - Callback for rate entries updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToFirmRateEntries(
  firmId: string,
  options?: {
    limit?: number;
  },
  onUpdate: (rateEntries: FirestoreDocument<FirestoreRateEntry>[]) => void,
  onError?: (error: any) => void
): () => void {
  const orderBy = [
    {
      field: 'effectiveDate',
      direction: 'desc',
    },
  ];

  const limit = options?.limit;

  return subscribeToQuery<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: firmId,
        },
      ],
      orderBy,
      limit,
    },
    onUpdate,
    onError
  );
}

/**
 * Subscribe to global rate entries
 *
 * @param options - Subscription options (limit)
 * @param onUpdate - Callback for rate entries updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToGlobalRateEntries(
  options?: {
    limit?: number;
  },
  onUpdate: (rateEntries: FirestoreDocument<FirestoreRateEntry>[]) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToQuery<FirestoreRateEntryData>(
    COLLECTION_NAMES.RATE_ENTRIES,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: null,
        },
      ],
      orderBy: [
        {
          field: 'effectiveDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    },
    onUpdate,
    onError
  );
}
