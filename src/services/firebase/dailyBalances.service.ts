/**
 * Daily Balances Service
 *
 * CRUD operations for daily balance records.
 * Provides balance history and caching management.
 *
 * @module services/firebase/dailyBalances.service
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
  queryDocumentsPaginated,
  executeBatch,
  subscribeToDocument,
  subscribeToQuery,
  type OperationResult,
  type FirestoreDocument,
  type PaginationOptions,
  type PaginatedResult,
} from './firestore.service';
import type {
  FirestoreDailyBalance,
  FirestoreDailyBalanceData,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Daily balance creation input
 */
export interface CreateDailyBalanceInput {
  matterId: string;
  date: number;
  principal: number;
  interestToDate: number;
  balance: number;
  rate: number;
  dailyInterest?: number;
  firmId: string;
}

/**
 * Daily balance update input
 */
export interface UpdateDailyBalanceInput {
  principal?: number;
  interestToDate?: number;
  balance?: number;
  rate?: number;
  dailyInterest?: number;
}

/**
 * Balance history query options
 */
export interface BalanceHistoryOptions {
  matterId: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

/**
 * Balance summary for a date range
 */
export interface BalanceSummary {
  totalPrincipal: number;
  totalInterest: number;
  totalBalance: number;
  averageRate: number;
  dayCount: number;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new daily balance record
 *
 * @param input - Daily balance creation data
 * @returns Operation result with created daily balance document
 */
export async function createDailyBalance(
  input: CreateDailyBalanceInput
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>>> {
  const balanceData: Omit<FirestoreDailyBalanceData, 'createdAt' | 'updatedAt'> = {
    matterId: input.matterId,
    date: input.date,
    principal: input.principal,
    interestToDate: input.interestToDate,
    balance: input.balance,
    rate: input.rate,
    dailyInterest: input.dailyInterest || 0,
    firmId: input.firmId,
  };

  return createDocument<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    balanceData
  );
}

/**
 * Create a daily balance with specific ID
 *
 * @param balanceId - Daily balance ID
 * @param input - Daily balance creation data
 * @returns Operation result with created daily balance document
 */
export async function createDailyBalanceWithId(
  balanceId: string,
  input: CreateDailyBalanceInput
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>>> {
  const balanceData: Omit<FirestoreDailyBalanceData, 'createdAt' | 'updatedAt'> = {
    matterId: input.matterId,
    date: input.date,
    principal: input.principal,
    interestToDate: input.interestToDate,
    balance: input.balance,
    rate: input.rate,
    dailyInterest: input.dailyInterest || 0,
    firmId: input.firmId,
  };

  return createDocumentWithId<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    balanceId,
    balanceData
  );
}

/**
 * Get a daily balance by ID
 *
 * @param balanceId - Daily balance ID
 * @returns Operation result with daily balance document
 */
export async function getDailyBalanceById(
  balanceId: string
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>>> {
  return getDocument<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    balanceId
  );
}

/**
 * Update a daily balance
 *
 * @param balanceId - Daily balance ID
 * @param updates - Daily balance update data
 * @returns Operation result
 */
export async function updateDailyBalance(
  balanceId: string,
  updates: UpdateDailyBalanceInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    balanceId,
    updates
  );
}

/**
 * Delete a daily balance
 *
 * @param balanceId - Daily balance ID
 * @returns Operation result
 */
export async function deleteDailyBalance(
  balanceId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.DAILY_BALANCES, balanceId);
}

// ============================================
// Query Operations
// ============================================

/**
 * Get daily balances for a matter
 *
 * @param matterId - Matter ID
 * @param options - Query options (startDate, endDate, limit)
 * @returns Operation result with daily balance documents
 */
export async function getDailyBalancesByMatter(
  matterId: string,
  options?: {
    startDate?: number;
    endDate?: number;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('matterId', '==', matterId),
  ];

  if (options?.startDate) {
    whereClauses.push(where('date', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('date', '<=', options.endDate));
  }

  return queryDocuments<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'date',
          direction: 'asc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get daily balances for a firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (startDate, endDate, limit)
 * @returns Operation result with daily balance documents
 */
export async function getDailyBalancesByFirm(
  firmId: string,
  options?: {
    startDate?: number;
    endDate?: number;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.startDate) {
    whereClauses.push(where('date', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('date', '<=', options.endDate));
  }

  return queryDocuments<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'date',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get daily balances with pagination
 *
 * @param options - Query options
 * @param pagination - Pagination options
 * @returns Operation result with paginated daily balances
 */
export async function getDailyBalancesPaginated(
  options: {
    matterId?: string;
    firmId?: string;
    startDate?: number;
    endDate?: number;
  },
  pagination?: PaginationOptions
): Promise<OperationResult<PaginatedResult<FirestoreDailyBalance>>> {
  const whereClauses: QueryConstraint[] = [];

  if (options.matterId) {
    whereClauses.push(where('matterId', '==', options.matterId));
  }

  if (options.firmId) {
    whereClauses.push(where('firmId', '==', options.firmId));
  }

  if (options.startDate) {
    whereClauses.push(where('date', '>=', options.startDate));
  }

  if (options.endDate) {
    whereClauses.push(where('date', '<=', options.endDate));
  }

  return queryDocumentsPaginated<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    pagination,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'date',
          direction: 'desc',
        },
      ],
    }
  );
}

/**
 * Get daily balance for a specific date
 *
 * @param matterId - Matter ID
 * @param date - Date (timestamp)
 * @returns Operation result with daily balance document
 */
export async function getDailyBalanceForDate(
  matterId: string,
  date: number
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>>> {
  const result = await queryDocuments<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    {
      where: [
        {
          field: 'matterId',
          operator: '==',
          value: matterId,
        },
        {
          field: 'date',
          operator: '==',
          value: date,
        },
      ],
      limit: 1,
    }
  );

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: `No daily balance found for matter ${matterId} on date ${new Date(date).toISOString()}`,
      code: 'not-found',
    };
  }

  return {
    success: true,
    data: result.data[0],
  };
}

/**
 * Get latest daily balance for a matter
 *
 * @param matterId - Matter ID
 * @returns Operation result with latest daily balance document
 */
export async function getLatestDailyBalance(
  matterId: string
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>>> {
  const result = await queryDocuments<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    {
      where: [
        {
          field: 'matterId',
          operator: '==',
          value: matterId,
        },
      ],
      orderBy: [
        {
          field: 'date',
          direction: 'desc',
        },
      ],
      limit: 1,
    }
  );

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: `No daily balance found for matter ${matterId}`,
      code: 'not-found',
    };
  }

  return {
    success: true,
    data: result.data[0],
  };
}

/**
 * Get balance history for a date range
 *
 * @param options - Balance history query options
 * @returns Operation result with balance history
 */
export async function getBalanceHistory(
  options: BalanceHistoryOptions
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>[]>> {
  return getDailyBalancesByMatter(options.matterId, {
    startDate: options.startDate,
    endDate: options.endDate,
    limit: options.limit,
  });
}

// ============================================
// Balance Summary Operations
// ============================================

/**
 * Calculate balance summary for a date range
 *
 * @param options - Balance history query options
 * @returns Operation result with balance summary
 */
export async function getBalanceSummary(
  options: BalanceHistoryOptions
): Promise<OperationResult<BalanceSummary>> {
  const result = await getBalanceHistory(options);

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: 'No balances found for the specified date range',
      code: 'not-found',
    };
  }

  const balances = result.data;

  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalBalance = 0;
  let rateSum = 0;

  balances.forEach((balance) => {
    totalPrincipal += balance.data.principal;
    totalInterest += balance.data.interestToDate;
    totalBalance += balance.data.balance;
    rateSum += balance.data.rate;
  });

  const summary: BalanceSummary = {
    totalPrincipal,
    totalInterest,
    totalBalance,
    averageRate: rateSum / balances.length,
    dayCount: balances.length,
  };

  return {
    success: true,
    data: summary,
  };
}

// ============================================
// Batch Operations
// ============================================

/**
 * Create multiple daily balances in a batch
 *
 * @param balances - Array of daily balance inputs
 * @returns Operation result
 */
export async function createDailyBalancesBatch(
  balances: CreateDailyBalanceInput[]
): Promise<OperationResult<void>> {
  const operations = balances.map((balance) => ({
    type: 'set',
    collection: COLLECTION_NAMES.DAILY_BALANCES,
    data: {
      matterId: balance.matterId,
      date: balance.date,
      principal: balance.principal,
      interestToDate: balance.interestToDate,
      balance: balance.balance,
      rate: balance.rate,
      dailyInterest: balance.dailyInterest || 0,
      firmId: balance.firmId,
      createdAt: Date.now(),
    },
    documentId: `daily-${balance.matterId}-${balance.date}`,
  }));

  return executeBatch(operations);
}

/**
 * Update multiple daily balances in a batch
 *
 * @param updates - Array of { balanceId, updates } tuples
 * @returns Operation result
 */
export async function updateDailyBalancesBatch(
  updates: Array<{
    balanceId: string;
    updates: UpdateDailyBalanceInput;
  }>
): Promise<OperationResult<void>> {
  const operations = updates.map((update) => ({
    type: 'update',
    collection: COLLECTION_NAMES.DAILY_BALANCES,
    documentId: update.balanceId,
    data: {
      ...update.updates,
      updatedAt: Date.now(),
    },
  }));

  return executeBatch(operations);
}

/**
 * Delete daily balances for a date range
 *
 * @param matterId - Matter ID
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @returns Operation result
 */
export async function deleteDailyBalancesByDateRange(
  matterId: string,
  startDate: number,
  endDate: number
): Promise<OperationResult<void>> {
  const result = await getDailyBalancesByMatter(matterId, {
    startDate,
    endDate,
  });

  if (!result.success || !result.data) {
    return {
      success: true,
      data: undefined,
    };
  }

  const operations = result.data.map((balance) => ({
    type: 'delete',
    collection: COLLECTION_NAMES.DAILY_BALANCES,
    documentId: balance.id,
  }));

  return executeBatch(operations);
}

// ============================================
// Cache Management
// ============================================

/**
 * Check if daily balance exists for a matter and date
 *
 * @param matterId - Matter ID
 * @param date - Date (timestamp)
 * @returns Operation result with boolean
 */
export async function dailyBalanceExists(
  matterId: string,
  date: number
): Promise<OperationResult<boolean>> {
  const result = await queryDocuments<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    {
      where: [
        {
          field: 'matterId',
          operator: '==',
          value: matterId,
        },
        {
          field: 'date',
          operator: '==',
          value: date,
        },
      ],
      limit: 1,
    }
  );

  return {
    success: true,
    data: result.success && !!result.data && result.data.length > 0,
  };
}

/**
 * Get cached daily balances for a matter
 *
 * @param matterId - Matter ID
 * @param count - Number of recent balances to fetch
 * @returns Operation result with cached daily balances
 */
export async function getCachedDailyBalances(
  matterId: string,
  count: number = 30
): Promise<OperationResult<FirestoreDocument<FirestoreDailyBalance>[]>> {
  return getDailyBalancesByMatter(matterId, {
    limit: count,
  });
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to daily balance changes
 *
 * @param balanceId - Daily balance ID
 * @param onUpdate - Callback for daily balance updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToDailyBalance(
  balanceId: string,
  onUpdate: (balance: FirestoreDocument<FirestoreDailyBalance> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    balanceId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to matter daily balances
 *
 * @param matterId - Matter ID
 * @param options - Subscription options (startDate, endDate, limit)
 * @param onUpdate - Callback for daily balances updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToMatterDailyBalances(
  matterId: string,
  options?: {
    startDate?: number;
    endDate?: number;
    limit?: number;
  },
  onUpdate: (balances: FirestoreDocument<FirestoreDailyBalance>[]) => void,
  onError?: (error: any) => void
): () => void {
  const whereClauses: QueryConstraint[] = [
    where('matterId', '==', matterId),
  ];

  if (options?.startDate) {
    whereClauses.push(where('date', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('date', '<=', options.endDate));
  }

  return subscribeToQuery<FirestoreDailyBalanceData>(
    COLLECTION_NAMES.DAILY_BALANCES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'date',
          direction: 'asc',
        },
      ],
      limit: options?.limit,
    },
    onUpdate,
    onError
  );
}
