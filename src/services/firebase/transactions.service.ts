/**
 * Transactions Service
 *
 * CRUD operations for transactions in Firestore.
 * Includes allocation management and real-time listeners.
 *
 * Features:
 * - CRUD operations for transactions
 * - Allocation management
 * - Real-time updates with listeners
 * - Data validation
 * - Error handling
 * - Loading states
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
  onSnapshot,
  type QueryConstraint,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseDB } from '../..';
import type { Transaction, CreateTransactionInput } from '../../types';

// ============================================
// Types
// ============================================

export interface TransactionQueryOptions {
  matterId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface TransactionListenerOptions {
  matterId?: string;
  onUpdate?: (transactions: Transaction[]) => void;
  onError?: (error: Error) => void;
}

export interface CreateTransactionResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export interface UpdateTransactionResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export interface DeleteTransactionResult {
  success: boolean;
  error?: string;
}

// ============================================
// Constants
// ============================================

const TRANSACTIONS_COLLECTION = 'transactions';

// ============================================
// Helper Functions
// ============================================

/**
 * Convert Firestore document to Transaction type
 */
const documentToTransaction = (doc: { id: string; data: DocumentData }): Transaction => {
  const data = doc.data();

  return {
    id: doc.id,
    date: data.date ? new Date(data.date) : new Date(),
    type: (data.type as Transaction['type']) || 'Draw',
    category: data.category as any,
    amount: data.amount || 0,
    netAmount: data.netAmount || 0,
    status: (data.status as Transaction['status']) || 'Unassigned',
    description: data.description,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    allocations: data.allocations || [],
  };
};

/**
 * Validate transaction data
 */
const validateTransactionData = (data: Partial<Transaction>): string[] => {
  const errors: string[] = [];

  if (!data.type || !['Draw', 'Principal Payment', 'Interest Autodraft'].includes(data.type)) {
    errors.push('Invalid transaction type');
  }

  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!data.matterId) {
    errors.push('Matter ID is required');
  }

  return errors;
};

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new transaction
 */
export const createTransaction = async (
  data: CreateTransactionInput,
  firmId?: string
): Promise<CreateTransactionResult> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, TRANSACTIONS_COLLECTION);

    // Validate data
    const validationErrors = validateTransactionData(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', '),
      };
    }

    // Calculate net amount
    const netAmount = data.amount;

    // Create document
    const transactionData: DocumentData = {
      ...data,
      amount: data.amount,
      netAmount,
      status: 'Unassigned',
      createdAt: new Date(),
    };

    // Add firm ID if provided
    if (firmId) {
      transactionData.firmId = firmId;
    }

    const docRef = await addDoc(collectionRef, transactionData);

    // Get the created document
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Failed to create transaction',
      };
    }

    const transaction = documentToTransaction(docSnap);

    return {
      success: true,
      transaction,
    };
  } catch (error) {
    console.error('Error creating transaction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create transaction';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get a transaction by ID
 */
export const getTransactionById = async (
  transactionId: string
): Promise<CreateTransactionResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    const transaction = documentToTransaction(docSnap);

    return {
      success: true,
      transaction,
    };
  } catch (error) {
    console.error('Error getting transaction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get transaction';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get transactions with filters
 */
export const getTransactions = async (
  options: TransactionQueryOptions = {}
): Promise<{ success: boolean; transactions: Transaction[]; error?: string }> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, TRANSACTIONS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (options.matterId) {
      constraints.push(where('matterId', '==', options.matterId));
    }

    if (options.type) {
      constraints.push(where('type', '==', options.type));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options.startDate) {
      constraints.push(where('date', '>=', options.startDate.getTime()));
    }

    if (options.endDate) {
      constraints.push(where('date', '<=', options.endDate.getTime()));
    }

    // Add ordering
    if (options.orderBy) {
      constraints.push(orderBy(options.orderBy, options.orderDirection || 'desc'));
    } else {
      constraints.push(orderBy('date', 'desc'));
    }

    // Add limit
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      transactions.push(documentToTransaction(doc));
    });

    return {
      success: true,
      transactions,
    };
  } catch (error) {
    console.error('Error getting transactions:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get transactions';

    return {
      success: false,
      transactions: [],
      error: errorMessage,
    };
  }
};

/**
 * Get transactions by matter
 */
export const getTransactionsByMatter = async (
  matterId: string
): Promise<{ success: boolean; transactions: Transaction[]; error?: string }> => {
  return getTransactions({ matterId });
};

/**
 * Update a transaction
 */
export const updateTransaction = async (
  transactionId: string,
  data: Partial<Transaction>,
  firmId?: string
): Promise<UpdateTransactionResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);

    // Check if transaction exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // Validate data
    const validationErrors = validateTransactionData(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', '),
      };
    }

    // Update document
    const updateData: DocumentData = {
      ...data,
    };

    // Add firm ID if provided
    if (firmId) {
      updateData.firmId = firmId;
    }

    await updateDoc(docRef, updateData);

    // Get the updated document
    const updatedSnap = await getDoc(docRef);

    if (!updatedSnap.exists()) {
      return {
        success: false,
        error: 'Failed to update transaction',
      };
    }

    const transaction = documentToTransaction(updatedSnap);

    return {
      success: true,
      transaction,
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update transaction';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Delete a transaction
 */
export const deleteTransaction = async (
  transactionId: string,
  firmId?: string
): Promise<DeleteTransactionResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);

    // Check if transaction exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    await deleteDoc(docRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete transaction';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (
  transactionId: string,
  status: Transaction['status'],
  firmId?: string
): Promise<UpdateTransactionResult> => {
  return updateTransaction(transactionId, { status }, firmId);
};

// ============================================
// Real-time Listeners
// ============================================

/**
 * Listen to transactions in real-time
 */
export const listenToTransactions = (
  options: TransactionListenerOptions
): (() => void) | null => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, TRANSACTIONS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (options.matterId) {
      constraints.push(where('matterId', '==', options.matterId));
    }

    constraints.push(orderBy('date', 'desc'));

    const q = query(collectionRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactions: Transaction[] = [];
        snapshot.forEach((doc) => {
          transactions.push(documentToTransaction(doc));
        });

        if (options.onUpdate) {
          options.onUpdate(transactions);
        }
      },
      (error) => {
        console.error('Error listening to transactions:', error);
        if (options.onError) {
          options.onError(error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up transaction listener:', error);
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error(String(error)));
    }
    return null;
  }
};

// ============================================
// Export
// ============================================

export * from './transactions.service';
