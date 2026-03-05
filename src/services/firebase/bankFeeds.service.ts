/**
 * Bank Feeds Service
 *
 * CRUD operations for bank feed records.
 * Query unassigned transactions and matched/unmatched transactions.
 * Bank feed reconciliation status tracking.
 *
 * @module services/firebase/bankFeeds.service
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
  type OperationResult,
  type FirestoreDocument,
  type PaginationOptions,
  type PaginatedResult,
} from './firestore.service';
import type {
  FirestoreBankFeed,
  FirestoreBankFeedData,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Bank feed creation input
 */
export interface CreateBankFeedInput {
  bankJoyTransactionId: string;
  bankJoyAccountId: string;
  referenceNumber: string;
  transactionDate: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  counterparty: string;
  description: string;
  accountNumber: string;
  accountType: string;
  accountName: string;
  balance: number;
  runningBalance: number;
  category: string;
  tags?: string[];
  reference?: string;
  status: 'cleared' | 'pending' | 'failed';
  memo?: string;
  attachments?: string[];
  bankJoyBankId: string;
  firmId?: string;
  createdBy?: string;
}

/**
 * Bank feed update input
 */
export interface UpdateBankFeedInput {
  status?: 'cleared' | 'pending' | 'failed';
  matchStatus?: 'unmatched' | 'matched' | 'multiple_matches';
  matterId?: string;
  matchType?: 'reference_number' | 'amount_date' | 'fuzzy';
  matchConfidence?: number;
  matchReason?: string;
  matchedAt?: number;
  reconciledAt?: number;
  discrepancyDetected?: boolean;
  discrepancyAmount?: number;
  discrepancyDetectedAt?: number;
  reconciledBy?: string;
  notes?: string;
}

/**
 * Bank feed query filters
 */
export interface BankFeedQueryFilters {
  firmId?: string;
  bankJoyAccountId?: string;
  status?: 'cleared' | 'pending' | 'failed';
  matchStatus?: 'unmatched' | 'matched' | 'multiple_matches';
  matterId?: string;
  matchType?: 'reference_number' | 'amount_date' | 'fuzzy';
  startDate?: number;
  endDate?: number;
  minAmount?: number;
  maxAmount?: number;
  type?: 'credit' | 'debit';
  counterparty?: string;
  referenceNumber?: string;
}

/**
 * Bank feed summary
 */
export interface BankFeedSummary {
  totalFeeds: number;
  matchedFeeds: number;
  unmatchedFeeds: number;
  multipleMatchFeeds: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  averageMatchConfidence: number;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a bank feed record
 *
 * @param input - Bank feed creation data
 * @returns Operation result with created bank feed document
 */
export async function createBankFeed(
  input: CreateBankFeedInput
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>>> {
  const bankFeedData: Omit<FirestoreBankFeedData, 'createdAt' | 'updatedAt'> = {
    bankJoyTransactionId: input.bankJoyTransactionId,
    bankJoyAccountId: input.bankJoyAccountId,
    referenceNumber: input.referenceNumber,
    transactionDate: input.transactionDate,
    amount: input.amount,
    currency: input.currency,
    type: input.type,
    counterparty: input.counterparty,
    description: input.description,
    accountNumber: input.accountNumber,
    accountType: input.accountType,
    accountName: input.accountName,
    balance: input.balance,
    runningBalance: input.runningBalance,
    category: input.category,
    tags: input.tags || [],
    reference: input.reference,
    status: input.status,
    memo: input.memo,
    attachments: input.attachments,
    bankJoyBankId: input.bankJoyBankId,
    firmId: input.firmId,
    matchStatus: 'unmatched',
    matchConfidence: 0,
    matchType: null,
    matchReason: null,
    matchedAt: null,
    reconciledAt: null,
    discrepancyDetected: false,
    discrepancyAmount: 0,
    discrepancyDetectedAt: null,
    reconciledBy: null,
    notes: input.notes,
    createdBy: input.createdBy,
  };

  return createDocument<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    bankFeedData
  );
}

/**
 * Create bank feed with specific ID
 *
 * @param bankFeedId - Bank feed ID (typically UUID)
 * @param input - Bank feed creation data
 * @returns Operation result with created bank feed document
 */
export async function createBankFeedWithId(
  bankFeedId: string,
  input: CreateBankFeedInput
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>>> {
  const bankFeedData: Omit<FirestoreBankFeedData, 'createdAt' | 'updatedAt'> = {
    bankJoyTransactionId: input.bankJoyTransactionId,
    bankJoyAccountId: input.bankJoyAccountId,
    referenceNumber: input.referenceNumber,
    transactionDate: input.transactionDate,
    amount: input.amount,
    currency: input.currency,
    type: input.type,
    counterparty: input.counterparty,
    description: input.description,
    accountNumber: input.accountNumber,
    accountType: input.accountType,
    accountName: input.accountName,
    balance: input.balance,
    runningBalance: input.runningBalance,
    category: input.category,
    tags: input.tags || [],
    reference: input.reference,
    status: input.status,
    memo: input.memo,
    attachments: input.attachments,
    bankJoyBankId: input.bankJoyBankId,
    firmId: input.firmId,
    matchStatus: 'unmatched',
    matchConfidence: 0,
    matchType: null,
    matchReason: null,
    matchedAt: null,
    reconciledAt: null,
    discrepancyDetected: false,
    discrepancyAmount: 0,
    discrepancyDetectedAt: null,
    reconciledBy: null,
    notes: input.notes,
    createdBy: input.createdBy,
  };

  return createDocumentWithId<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    bankFeedId,
    bankFeedData
  );
}

/**
 * Get bank feed by ID
 *
 * @param bankFeedId - Bank feed ID
 * @returns Operation result with bank feed document
 */
export async function getBankFeedById(
  bankFeedId: string
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>>> {
  return getDocument<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    bankFeedId
  );
}

/**
 * Update a bank feed
 *
 * @param bankFeedId - Bank feed ID
 * @param updates - Bank feed update data
 * @returns Operation result
 */
export async function updateBankFeed(
  bankFeedId: string,
  updates: UpdateBankFeedInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    bankFeedId,
    updates
  );
}

/**
 * Delete a bank feed
 *
 * @param bankFeedId - Bank feed ID
 * @returns Operation result
 */
export async function deleteBankFeed(
  bankFeedId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.BANK_FEEDS, bankFeedId);
}

// ============================================
// Query Operations
// ============================================

/**
 * Get all bank feeds for a firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (status, limit)
 * @returns Operation result with bank feed documents
 */
export async function getBankFeedsByFirm(
  firmId: string,
  options?: {
    status?: 'cleared' | 'pending' | 'failed';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get bank feeds by account
 *
 * @param bankJoyAccountId - BankJoy account ID
 * @param options - Query options (status, limit)
 * @returns Operation result with bank feed documents
 */
export async function getBankFeedsByAccount(
  bankJoyAccountId: string,
  options?: {
    status?: 'cleared' | 'pending' | 'failed';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('bankJoyAccountId', '==', bankJoyAccountId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get bank feeds by date range
 *
 * @param firmId - Firm ID
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Query options (status, limit)
 * @returns Operation result with bank feed documents
 */
export async function getBankFeedsByDateRange(
  firmId: string,
  startDate: number,
  endDate: number,
  options?: {
    status?: 'cleared' | 'pending' | 'failed';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('transactionDate', '>=', startDate),
    where('transactionDate', '<=', endDate),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get unassigned bank feeds
 *
 * @param firmId - Firm ID
 * @param options - Query options (limit, minAmount, maxAmount)
 * @returns Operation result with unassigned bank feed documents
 */
export async function getUnassignedBankFeeds(
  firmId: string,
  options?: {
    limit?: number;
    minAmount?: number;
    maxAmount?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('matchStatus', '==', 'unmatched'),
  ];

  if (options?.minAmount) {
    whereClauses.push(where('amount', '>=', options.minAmount));
  }

  if (options?.maxAmount) {
    whereClauses.push(where('amount', '<=', options.maxAmount));
  }

  return queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
        {
          field: 'amount',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get matched bank feeds
 *
 * @param firmId - Firm ID
 * @param matchStatus - Match status ('matched' | 'multiple_matches')
 * @param options - Query options (limit)
 * @returns Operation result with matched bank feed documents
 */
export async function getMatchedBankFeeds(
  firmId: string,
  matchStatus: 'matched' | 'multiple_matches',
  options?: {
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('matchStatus', '==', matchStatus),
  ];

  return queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get unmatched bank feeds
 *
 * @param firmId - Firm ID
 * @param options - Query options (limit, minAmount, maxAmount)
 * @returns Operation result with unmatched bank feed documents
 */
export async function getUnmatchedBankFeeds(
  firmId: string,
  options?: {
    limit?: number;
    minAmount?: number;
    maxAmount?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('matchStatus', '==', 'unmatched'),
  ];

  if (options?.minAmount) {
    whereClauses.push(where('amount', '>=', options.minAmount));
  }

  if (options?.maxAmount) {
    whereClauses.push(where('amount', '<=', options.maxAmount));
  }

  return queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get bank feeds with pagination
 *
 * @param filters - Query filters
 * @param pagination - Pagination options
 * @param sort - Sort options
 * @returns Operation result with paginated bank feeds
 */
export async function getBankFeedsPaginated(
  filters: BankFeedQueryFilters,
  pagination?: PaginationOptions,
  sort?: {
    field: 'transactionDate' | 'amount' | 'createdAt' | 'matchedAt';
    direction: 'asc' | 'desc';
  }
): Promise<OperationResult<PaginatedResult<FirestoreBankFeed>>> {
  const whereClauses: QueryConstraint[] = [];

  if (filters.firmId) {
    whereClauses.push(where('firmId', '==', filters.firmId));
  }

  if (filters.bankJoyAccountId) {
    whereClauses.push(where('bankJoyAccountId', '==', filters.bankJoyAccountId));
  }

  if (filters.status) {
    whereClauses.push(where('status', '==', filters.status));
  }

  if (filters.matchStatus) {
    whereClauses.push(where('matchStatus', '==', filters.matchStatus));
  }

  if (filters.matterId) {
    whereClauses.push(where('matterId', '==', filters.matterId));
  }

  if (filters.matchType) {
    whereClauses.push(where('matchType', '==', filters.matchType));
  }

  if (filters.startDate) {
    whereClauses.push(where('transactionDate', '>=', filters.startDate));
  }

  if (filters.endDate) {
    whereClauses.push(where('transactionDate', '<=', filters.endDate));
  }

  if (filters.minAmount) {
    whereClauses.push(where('amount', '>=', filters.minAmount));
  }

  if (filters.maxAmount) {
    whereClauses.push(where('amount', '<=', filters.maxAmount));
  }

  if (filters.type) {
    whereClauses.push(where('type', '==', filters.type));
  }

  if (filters.counterparty) {
    whereClauses.push(where('counterparty', '==', filters.counterparty));
  }

  if (filters.referenceNumber) {
    whereClauses.push(where('referenceNumber', '==', filters.referenceNumber));
  }

  const orderByClauses = sort
    ? [{
        field: sort.field as string,
        direction: sort.direction,
      }]
    : [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
      ];

  return queryDocumentsPaginated<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    pagination,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: orderByClauses,
    }
  );
}

/**
 * Get bank feeds by matter
 *
 * @param matterId - Matter ID
 * @param options - Query options (status, limit)
 * @returns Operation result with bank feed documents
 */
export async function getBankFeedsByMatter(
  matterId: string,
  options?: {
    status?: 'cleared' | 'pending' | 'failed';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreBankFeed>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('matterId', '==', matterId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'transactionDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get bank feed summary for a firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (startDate, endDate, status)
 * @returns Operation result with bank feed summary
 */
export async function getBankFeedSummary(
  firmId: string,
  options?: {
    startDate?: number;
    endDate?: number;
    status?: 'cleared' | 'pending' | 'failed';
  }
): Promise<OperationResult<BankFeedSummary>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.startDate) {
    whereClauses.push(where('transactionDate', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('transactionDate', '<=', options.endDate));
  }

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  const result = await queryDocuments<FirestoreBankFeedData>(
    COLLECTION_NAMES.BANK_FEEDS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
    }
  );

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch bank feeds',
      code: result.code,
    };
  }

  const bankFeeds = result.data;

  const totalFeeds = bankFeeds.length;
  const matchedFeeds = bankFeeds.filter((f) => f.data.matchStatus === 'matched').length;
  const unmatchedFeeds = bankFeeds.filter((f) => f.data.matchStatus === 'unmatched').length;
  const multipleMatchFeeds = bankFeeds.filter((f) => f.data.matchStatus === 'multiple_matches').length;
  const totalAmount = bankFeeds.reduce((sum, f) => sum + f.data.amount, 0);
  const matchedAmount = bankFeeds.filter((f) => f.data.matchStatus === 'matched').reduce((sum, f) => sum + f.data.amount, 0);
  const unmatchedAmount = bankFeeds.filter((f) => f.data.matchStatus === 'unmatched').reduce((sum, f) => sum + f.data.amount, 0);
  const averageMatchConfidence = matchedFeeds > 0
    ? bankFeeds.filter((f) => f.data.matchStatus === 'matched').reduce((sum, f) => sum + f.data.matchConfidence, 0) / matchedFeeds
    : 0;

  return {
    success: true,
    data: {
      totalFeeds,
      matchedFeeds,
      unmatchedFeeds,
      multipleMatchFeeds,
      totalAmount,
      matchedAmount,
      unmatchedAmount,
      averageMatchConfidence,
    },
  };
}

// ============================================
// Batch Operations
// ============================================

/**
 * Create multiple bank feeds in a batch
 *
 * @param inputs - Array of bank feed inputs
 * @returns Operation result
 */
export async function createBankFeedsBatch(
  inputs: CreateBankFeedInput[]
): Promise<OperationResult<void>> {
  const operations = inputs.map((input) => ({
    type: 'set',
    collection: COLLECTION_NAMES.BANK_FEEDS,
    data: {
      bankJoyTransactionId: input.bankJoyTransactionId,
      bankJoyAccountId: input.bankJoyAccountId,
      referenceNumber: input.referenceNumber,
      transactionDate: input.transactionDate,
      amount: input.amount,
      currency: input.currency,
      type: input.type,
      counterparty: input.counterparty,
      description: input.description,
      accountNumber: input.accountNumber,
      accountType: input.accountType,
      accountName: input.accountName,
      balance: input.balance,
      runningBalance: input.runningBalance,
      category: input.category,
      tags: input.tags || [],
      reference: input.reference,
      status: input.status,
      memo: input.memo,
      attachments: input.attachments,
      bankJoyBankId: input.bankJoyBankId,
      firmId: input.firmId,
      matchStatus: 'unmatched',
      matchConfidence: 0,
      matchType: null,
      matchReason: null,
      matchedAt: null,
      reconciledAt: null,
      discrepancyDetected: false,
      discrepancyAmount: 0,
      discrepancyDetectedAt: null,
      reconciledBy: null,
      notes: input.notes,
      createdBy: input.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  }));

  return executeBatch(operations);
}

/**
 * Update multiple bank feeds in a batch
 *
 * @param updates - Array of { bankFeedId, updates } tuples
 * @returns Operation result
 */
export async function updateBankFeedsBatch(
  updates: Array<{
    bankFeedId: string;
    updates: UpdateBankFeedInput;
  }>
): Promise<OperationResult<void>> {
  const operations = updates.map((update) => ({
    type: 'update',
    collection: COLLECTION_NAMES.BANK_FEEDS,
    documentId: update.bankFeedId,
    data: {
      ...update.updates,
      updatedAt: Date.now(),
    },
  }));

  return executeBatch(operations);
}

/**
 * Update bank feeds match status in a batch
 *
 * @param matterId - Matter ID to update
 * @param bankFeedIds - Bank feed IDs to update
 * @param matchStatus - Match status
 * @param matchType - Match type
 * @param matchConfidence - Match confidence
 * @returns Operation result
 */
export async function updateBankFeedsMatchStatusBatch(
  matterId: string,
  bankFeedIds: string[],
  matchStatus: 'matched' | 'multiple_matches',
  matchType?: 'reference_number' | 'amount_date' | 'fuzzy',
  matchConfidence?: number
): Promise<OperationResult<void>> {
  const updates = bankFeedIds.map((bankFeedId) => ({
    bankFeedId,
    updates: {
      matterId,
      matchStatus,
      matchType,
      matchConfidence,
      matchedAt: Date.now(),
      matchReason: matchStatus === 'multiple_matches'
        ? 'Multiple matters with same reference'
        : null,
    },
  }));

  return updateBankFeedsBatch(updates);
}

/**
 * Update bank feeds reconciliation status in a batch
 *
 * @param bankFeedIds - Bank feed IDs to update
 * @param discrepancyDetected - Whether discrepancy was detected
 * @param discrepancyAmount - Discrepancy amount (if any)
 * @returns Operation result
 */
export async function updateBankFeedsReconciliationStatusBatch(
  bankFeedIds: string[],
  discrepancyDetected: boolean,
  discrepancyAmount?: number
): Promise<OperationResult<void>> {
  const updates = bankFeedIds.map((bankFeedId) => ({
    bankFeedId,
    updates: {
      discrepancyDetected,
      discrepancyAmount: discrepancyAmount || 0,
      discrepancyDetectedAt: discrepancyDetected ? Date.now() : null,
    },
  }));

  return updateBankFeedsBatch(updates);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format bank feed reference number for display
 *
 * @param referenceNumber - Reference number to format
 * @returns Formatted reference number
 */
export function formatBankFeedReferenceNumber(referenceNumber: string): string {
  if (!referenceNumber) {
    return '';
  }

  // Add hyphens if needed (format: XXXX-XXXX-XXXXX)
  const normalized = referenceNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (normalized.length === 12) {
    return `${normalized.substring(0, 4)}-${normalized.substring(4, 8)}-${normalized.substring(8, 12)}`;
  }

  return normalized;
}

/**
 * Format bank feed amount for display
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted amount
 */
export function formatBankFeedAmount(amount: number, currency: string = 'USD'): string {
  if (isNaN(amount)) {
    return '$0.00';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Format bank feed date for display
 *
 * @param date - Date string to format
 * @param format - Date format (default: 'MM/DD/YYYY')
 * @returns Formatted date
 */
export function formatBankFeedDate(date: string, format: string = 'MM/DD/YYYY'): string {
  if (!date) {
    return '';
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return date;
  }

  const day = parsedDate.getDate().toString().padStart(2, '0');
  const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
  const year = parsedDate.getFullYear().toString();

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  } else if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  return date;
}
