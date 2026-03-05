/**
 * Transactions Service
 *
 * Provides CRUD operations and workflow management for the transactions collection.
 *
 * @module services/firebase/transactions.service
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
  subscribeToDocument,
  subscribeToQuery,
  type OperationResult,
  type FirestoreDocument,
  type PaginatedResult,
  type PaginationOptions,
} from './firestore.service';
import type {
  FirestoreTransaction,
  FirestoreTransactionData,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Transaction creation input
 */
export interface CreateTransactionInput {
  matterId?: string;
  firmId: string;
  type: FirestoreTransactionData['type'];
  amount: number;
  date?: number;
  description?: string;
  reference?: string;
  category?: string;
  bankFeedId?: string;
}

/**
 * Transaction update input
 */
export interface UpdateTransactionInput {
  matterId?: string;
  type?: FirestoreTransactionData['type'];
  amount?: number;
  description?: string;
  reference?: string;
  status?: FirestoreTransactionData['status'];
  category?: string;
  isReconciled?: boolean;
  postedBy?: string;
  approvedBy?: string;
  approvedAt?: number;
}

/**
 * Transaction query filters
 */
export interface TransactionFilters {
  firmId: string;
  matterId?: string;
  type?: FirestoreTransactionData['type'];
  status?: FirestoreTransactionData['status'];
  category?: string;
  dateFrom?: number;
  dateTo?: number;
  allocationId?: string;
  bankFeedId?: string;
  isReconciled?: boolean;
  search?: string;
}

/**
 * Transaction sort options
 */
export interface TransactionSortOptions {
  field: 'date' | 'amount' | 'type' | 'status' | 'createdAt';
  direction: 'asc' | 'desc';
}

/**
 * Transaction status workflow
 */
export type TransactionStatusWorkflow =
  | 'pending'
  | 'posted'
  | 'matched'
  | 'allocated'
  | 'reconciled'
  | 'void';

/**
 * Status transitions map
 */
export const STATUS_TRANSITIONS: Record<
  FirestoreTransactionData['status'],
  FirestoreTransactionData['status'][]
> = {
  pending: ['posted', 'void'],
  posted: ['matched', 'allocated', 'reconciled', 'void'],
  matched: ['allocated', 'void'],
  allocated: ['reconciled', 'void'],
  reconciled: ['void'],
  void: [],
};

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new transaction
 *
 * @param input - Transaction creation data
 * @returns Operation result with created transaction document
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>>> {
  const transactionData: Omit<FirestoreTransactionData, 'createdAt' | 'updatedAt'> = {
    matterId: input.matterId,
    firmId: input.firmId,
    type: input.type,
    amount: input.amount,
    date: input.date || Date.now(),
    description: input.description,
    reference: input.reference,
    status: 'pending',
    category: input.category,
    isReconciled: false,
    bankFeedId: input.bankFeedId,
  };

  return createDocument<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
    transactionData
  );
}

/**
 * Create a transaction with specific ID
 *
 * @param transactionId - Transaction ID
 * @param input - Transaction creation data
 * @returns Operation result with created transaction document
 */
export async function createTransactionWithId(
  transactionId: string,
  input: CreateTransactionInput
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>>> {
  const transactionData: Omit<FirestoreTransactionData, 'createdAt' | 'updatedAt'> = {
    matterId: input.matterId,
    firmId: input.firmId,
    type: input.type,
    amount: input.amount,
    date: input.date || Date.now(),
    description: input.description,
    reference: input.reference,
    status: 'pending',
    category: input.category,
    isReconciled: false,
    bankFeedId: input.bankFeedId,
  };

  return createDocumentWithId<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
    transactionId,
    transactionData
  );
}

/**
 * Get a transaction by ID
 *
 * @param transactionId - Transaction ID
 * @returns Operation result with transaction document
 */
export async function getTransactionById(
  transactionId: string
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>>> {
  return getDocument<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
    transactionId
  );
}

/**
 * Update a transaction
 *
 * @param transactionId - Transaction ID
 * @param updates - Transaction update data
 * @returns Operation result
 */
export async function updateTransaction(
  transactionId: string,
  updates: UpdateTransactionInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
    transactionId,
    updates
  );
}

/**
 * Delete a transaction
 *
 * @param transactionId - Transaction ID
 * @returns Operation result
 */
export async function deleteTransaction(
  transactionId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.TRANSACTIONS, transactionId);
}

// ============================================
// Query Operations
// ============================================

/**
 * Get transactions by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (status, type, limit)
 * @returns Operation result with transaction documents
 */
export async function getTransactionsByFirm(
  firmId: string,
  options?: {
    status?: FirestoreTransactionData['status'];
    type?: FirestoreTransactionData['type'];
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.type) {
    whereClauses.push(where('type', '==', options.type));
  }

  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
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
  });
}

/**
 * Get transactions by matter
 *
 * @param matterId - Matter ID
 * @param options - Query options (status, type)
 * @returns Operation result with transaction documents
 */
export async function getTransactionsByMatter(
  matterId: string,
  options?: {
    status?: FirestoreTransactionData['status'];
    type?: FirestoreTransactionData['type'];
  }
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('matterId', '==', matterId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.type) {
    whereClauses.push(where('type', '==', options.type));
  }

  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
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
  });
}

/**
 * Get transactions with pagination
 *
 * @param filters - Transaction filters
 * @param pagination - Pagination options
 * @param sort - Sort options
 * @returns Operation result with paginated transactions
 */
export async function getTransactionsPaginated(
  filters: TransactionFilters,
  pagination?: PaginationOptions,
  sort?: TransactionSortOptions
): Promise<OperationResult<PaginatedResult<FirestoreTransaction>>> {
  const whereClauses: QueryConstraint[] = [];

  if (filters.matterId) {
    whereClauses.push(where('matterId', '==', filters.matterId));
  }

  if (filters.type) {
    whereClauses.push(where('type', '==', filters.type));
  }

  if (filters.status) {
    whereClauses.push(where('status', '==', filters.status));
  }

  if (filters.category) {
    whereClauses.push(where('category', '==', filters.category));
  }

  if (filters.dateFrom) {
    whereClauses.push(where('date', '>=', filters.dateFrom));
  }

  if (filters.dateTo) {
    whereClauses.push(where('date', '<=', filters.dateTo));
  }

  if (filters.allocationId) {
    whereClauses.push(where('allocationId', '==', filters.allocationId));
  }

  if (filters.bankFeedId) {
    whereClauses.push(where('bankFeedId', '==', filters.bankFeedId));
  }

  if (filters.isReconciled !== undefined) {
    whereClauses.push(where('isReconciled', '==', filters.isReconciled));
  }

  const orderByClauses = sort
    ? [
        {
          field: sort.field,
          direction: sort.direction,
        },
      ]
    : [
        {
          field: 'date',
          direction: 'desc',
        },
      ];

  const result = await queryDocumentsPaginated<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
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

  // Apply search filter if provided
  if (filters.search && result.success && result.data) {
    const searchLower = filters.search.toLowerCase();
    result.data.data = result.data.data.filter(
      (transaction) =>
        transaction.data.description?.toLowerCase().includes(searchLower) ||
        transaction.data.reference?.toLowerCase().includes(searchLower)
    );
  }

  return result;
}

/**
 * Get transactions by date range
 *
 * @param firmId - Firm ID
 * @param startDate - Start date
 * @param endDate - End date
 * @param options - Query options (status, type)
 * @returns Operation result with transaction documents
 */
export async function getTransactionsByDateRange(
  firmId: string,
  startDate: number,
  endDate: number,
  options?: {
    status?: FirestoreTransactionData['status'];
    type?: FirestoreTransactionData['type'];
  }
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.type) {
    whereClauses.push(where('type', '==', options.type));
  }

  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
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
  });
}

// ============================================
// Transaction Status Workflow
// ============================================

/**
 * Validate status transition
 *
 * @param currentStatus - Current status
 * @param newStatus - Proposed new status
 * @returns Whether transition is valid
 */
export function isValidStatusTransition(
  currentStatus: FirestoreTransactionData['status'],
  newStatus: FirestoreTransactionData['status']
): boolean {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Update transaction status
 *
 * @param transactionId - Transaction ID
 * @param newStatus - New status
 * @returns Operation result
 */
export async function updateTransactionStatus(
  transactionId: string,
  newStatus: FirestoreTransactionData['status']
): Promise<OperationResult<void>> {
  // Get current transaction to validate transition
  const currentResult = await getTransactionById(transactionId);

  if (!currentResult.success || !currentResult.data) {
    return {
      success: false,
      error: 'Transaction not found',
      code: 'not-found',
    };
  }

  const currentStatus = currentResult.data.data.status;

  // Validate status transition
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
      code: 'invalid-argument',
    };
  }

  return updateTransaction(transactionId, { status: newStatus });
}

/**
 * Post a transaction
 *
 * @param transactionId - Transaction ID
 * @param postedBy - User ID who posted the transaction
 * @returns Operation result
 */
export async function postTransaction(
  transactionId: string,
  postedBy?: string
): Promise<OperationResult<void>> {
  return updateTransaction(transactionId, {
    status: 'posted',
    postedBy,
  });
}

/**
 * Match a transaction (to a bank feed)
 *
 * @param transactionId - Transaction ID
 * @param bankFeedId - Bank feed ID
 * @returns Operation result
 */
export async function matchTransaction(
  transactionId: string,
  bankFeedId: string
): Promise<OperationResult<void>> {
  return updateTransaction(transactionId, {
    status: 'matched',
    bankFeedId,
  });
}

/**
 * Allocate a transaction
 *
 * @param transactionId - Transaction ID
 * @param allocationId - Interest allocation ID
 * @returns Operation result
 */
export async function allocateTransaction(
  transactionId: string,
  allocationId: string
): Promise<OperationResult<void>> {
  return updateTransaction(transactionId, {
    status: 'allocated',
    allocationId,
  });
}

/**
 * Reconcile a transaction
 *
 * @param transactionId - Transaction ID
 * @returns Operation result
 */
export async function reconcileTransaction(
  transactionId: string
): Promise<OperationResult<void>> {
  return updateTransaction(transactionId, {
    status: 'reconciled',
    isReconciled: true,
  });
}

/**
 * Void a transaction
 *
 * @param transactionId - Transaction ID
 * @returns Operation result
 */
export async function voidTransaction(
  transactionId: string
): Promise<OperationResult<void>> {
  return updateTransaction(transactionId, {
    status: 'void',
  });
}

/**
 * Get pending transactions
 *
 * @param firmId - Firm ID
 * @returns Operation result with transaction documents
 */
export async function getPendingTransactions(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'status',
        operator: '==',
        value: 'pending',
      },
    ],
    orderBy: [
      {
        field: 'date',
        direction: 'asc',
      },
    ],
  });
}

/**
 * Get unallocated transactions
 *
 * @param firmId - Firm ID
 * @returns Operation result with transaction documents
 */
export async function getUnallocatedTransactions(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'status',
        operator: 'in',
        value: ['pending', 'posted', 'matched'],
      },
    ],
    orderBy: [
      {
        field: 'date',
        direction: 'asc',
      },
    ],
  });
}

/**
 * Get transactions by status
 *
 * @param firmId - Firm ID
 * @param status - Transaction status
 * @returns Operation result with transaction documents
 */
export async function getTransactionsByStatus(
  firmId: string,
  status: FirestoreTransactionData['status']
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'status',
        operator: '==',
        value: status,
      },
    ],
    orderBy: [
      {
        field: 'date',
        direction: 'desc',
      },
    ],
  });
}

/**
 * Get transactions by allocation
 *
 * @param allocationId - Interest allocation ID
 * @returns Operation result with transaction documents
 */
export async function getTransactionsByAllocation(
  allocationId: string
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
    where: [
      {
        field: 'allocationId',
        operator: '==',
        value: allocationId,
      },
    ],
    orderBy: [
      {
        field: 'date',
        direction: 'desc',
      },
    ],
  });
}

// ============================================
// Transaction Type Operations
// ============================================

/**
 * Get transactions by type
 *
 * @param firmId - Firm ID
 * @param type - Transaction type
 * @returns Operation result with transaction documents
 */
export async function getTransactionsByType(
  firmId: string,
  type: FirestoreTransactionData['type']
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  return queryDocuments<FirestoreTransactionData>(COLLECTION_NAMES.TRANSACTIONS, {
    where: [
      {
        field: 'firmId',
        operator: '==',
        value: firmId,
      },
      {
        field: 'type',
        operator: '==',
        value: type,
      },
    ],
    orderBy: [
      {
        field: 'date',
        direction: 'desc',
      },
    ],
  });
}

// ============================================
// Search & Filtering
// ============================================

/**
 * Search transactions
 *
 * @param firmId - Firm ID
 * @param searchTerm - Search term (searches description, reference)
 * @param options - Search options (status, type)
 * @returns Operation result with transaction documents
 */
export async function searchTransactions(
  firmId: string,
  searchTerm: string,
  options?: {
    status?: FirestoreTransactionData['status'];
    type?: FirestoreTransactionData['type'];
  }
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  const result = await getTransactionsByFirm(firmId, options);

  if (!result.success || !result.data) {
    return result;
  }

  const searchLower = searchTerm.toLowerCase();
  const filteredTransactions = result.data.filter(
    (transaction) =>
      transaction.data.description?.toLowerCase().includes(searchLower) ||
      transaction.data.reference?.toLowerCase().includes(searchLower)
  );

  return {
    success: true,
    data: filteredTransactions,
  };
}

/**
 * Get transactions with filters
 *
 * @param filters - Transaction filters
 * @returns Operation result with transaction documents
 */
export async function getTransactionsByFilters(
  filters: TransactionFilters
): Promise<OperationResult<FirestoreDocument<FirestoreTransaction>[]>> {
  const whereClauses: QueryConstraint[] = [];

  if (filters.matterId) {
    whereClauses.push(where('matterId', '==', filters.matterId));
  }

  if (filters.type) {
    whereClauses.push(where('type', '==', filters.type));
  }

  if (filters.status) {
    whereClauses.push(where('status', '==', filters.status));
  }

  if (filters.category) {
    whereClauses.push(where('category', '==', filters.category));
  }

  if (filters.dateFrom) {
    whereClauses.push(where('date', '>=', filters.dateFrom));
  }

  if (filters.dateTo) {
    whereClauses.push(where('date', '<=', filters.dateTo));
  }

  if (filters.allocationId) {
    whereClauses.push(where('allocationId', '==', filters.allocationId));
  }

  if (filters.bankFeedId) {
    whereClauses.push(where('bankFeedId', '==', filters.bankFeedId));
  }

  if (filters.isReconciled !== undefined) {
    whereClauses.push(where('isReconciled', '==', filters.isReconciled));
  }

  const result = await queryDocuments<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
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

  // Apply search filter if provided
  if (filters.search && result.success && result.data) {
    const searchLower = filters.search.toLowerCase();
    result.data = result.data.filter(
      (transaction) =>
        transaction.data.description?.toLowerCase().includes(searchLower) ||
        transaction.data.reference?.toLowerCase().includes(searchLower)
    );
  }

  return result;
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to transaction changes
 *
 * @param transactionId - Transaction ID
 * @param onUpdate - Callback for transaction updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToTransaction(
  transactionId: string,
  onUpdate: (transaction: FirestoreDocument<FirestoreTransaction> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
    transactionId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to firm transactions
 *
 * @param firmId - Firm ID
 * @param options - Subscription options
 * @param onUpdate - Callback for transactions updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToFirmTransactions(
  firmId: string,
  options?: {
    status?: FirestoreTransactionData['status'];
    type?: FirestoreTransactionData['type'];
  },
  onUpdate: (transactions: FirestoreDocument<FirestoreTransaction>[]) => void,
  onError?: (error: any) => void
): () => void {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.type) {
    whereClauses.push(where('type', '==', options.type));
  }

  return subscribeToQuery<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
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
    },
    onUpdate,
    onError
  );
}

/**
 * Subscribe to matter transactions
 *
 * @param matterId - Matter ID
 * @param options - Subscription options
 * @param onUpdate - Callback for transactions updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToMatterTransactions(
  matterId: string,
  options?: {
    status?: FirestoreTransactionData['status'];
    type?: FirestoreTransactionData['type'];
  },
  onUpdate: (transactions: FirestoreDocument<FirestoreTransaction>[]) => void,
  onError?: (error: any) => void
): () => void {
  const whereClauses: QueryConstraint[] = [
    where('matterId', '==', matterId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.type) {
    whereClauses.push(where('type', '==', options.type));
  }

  return subscribeToQuery<FirestoreTransactionData>(
    COLLECTION_NAMES.TRANSACTIONS,
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
    },
    onUpdate,
    onError
  );
}
