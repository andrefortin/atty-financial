/**
 * Matters Service
 *
 * CRUD operations for matters in Firestore.
 * Includes real-time listeners and data validation.
 *
 * Features:
 * - CRUD operations for matters
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
import type { Matter, CreateMatterInput, UpdateMatterInput } from '../../types';

// ============================================
// Types
// ============================================

export interface MatterQueryOptions {
  status?: string;
  searchQuery?: string;
  hasBalance?: boolean;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface MatterListenerOptions {
  firmId?: string;
  status?: string;
  onUpdate?: (matters: Matter[]) => void;
  onError?: (error: Error) => void;
}

export interface CreateMatterResult {
  success: boolean;
  matter?: Matter;
  error?: string;
}

export interface UpdateMatterResult {
  success: boolean;
  matter?: Matter;
  error?: string;
}

export interface DeleteMatterResult {
  success: boolean;
  error?: string;
}

// ============================================
// Constants
// ============================================

const MATTERS_COLLECTION = 'matters';

// ============================================
// Helper Functions
// ============================================

/**
 * Convert Firestore document to Matter type
 */
const documentToMatter = (doc: { id: string; data: DocumentData }): Matter => {
  const data = doc.data();

  return {
    id: doc.id,
    clientName: data.clientName || '',
    status: (data.status as Matter['status']) || 'Active',
    notes: data.notes,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    closedAt: data.closedAt ? new Date(data.closedAt) : undefined,
    totalDraws: data.totalDraws || 0,
    totalPrincipalPayments: data.totalPrincipalPayments || 0,
    totalInterestAccrued: data.totalInterestAccrued || 0,
    interestPaid: data.interestPaid || 0,
    principalBalance: data.principalBalance || 0,
    totalOwed: data.totalOwed || 0,
  };
};

/**
 * Validate matter data
 */
const validateMatterData = (data: Partial<Matter>): string[] => {
  const errors: string[] = [];

  if (!data.clientName || data.clientName.trim() === '') {
    errors.push('Client name is required');
  }

  if (!data.status || !['Active', 'Closed', 'Archive'].includes(data.status)) {
    errors.push('Invalid status');
  }

  if (data.principalBalance !== undefined && data.principalBalance < 0) {
    errors.push('Principal balance cannot be negative');
  }

  if (data.totalInterestAccrued !== undefined && data.totalInterestAccrued < 0) {
    errors.push('Total interest accrued cannot be negative');
  }

  if (data.totalOwed !== undefined && data.totalOwed < 0) {
    errors.push('Total owed cannot be negative');
  }

  return errors;
};

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new matter
 */
export const createMatter = async (
  data: CreateMatterInput,
  firmId?: string
): Promise<CreateMatterResult> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, MATTERS_COLLECTION);

    // Validate data
    const validationErrors = validateMatterData(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', '),
      };
    }

    // Create document
    const matterData: DocumentData = {
      ...data,
      status: data.status || 'Active',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalDraws: 0,
      totalPrincipalPayments: 0,
      totalInterestAccrued: 0,
      interestPaid: 0,
      principalBalance: 0,
      totalOwed: 0,
    };

    // Add firm ID if provided
    if (firmId) {
      matterData.firmId = firmId;
    }

    const docRef = await addDoc(collectionRef, matterData);

    // Get the created document
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Failed to create matter',
      };
    }

    const matter = documentToMatter(docSnap);

    return {
      success: true,
      matter,
    };
  } catch (error) {
    console.error('Error creating matter:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create matter';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get a matter by ID
 */
export const getMatterById = async (matterId: string): Promise<CreateMatterResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, MATTERS_COLLECTION, matterId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Matter not found',
      };
    }

    const matter = documentToMatter(docSnap);

    return {
      success: true,
      matter,
    };
  } catch (error) {
    console.error('Error getting matter:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get matter';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Get matters with filters
 */
export const getMatters = async (
  options: MatterQueryOptions = {}
): Promise<{ success: boolean; matters: Matter[]; error?: string }> => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, MATTERS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    if (options.hasBalance !== undefined) {
      constraints.push(
        where('principalBalance', '>', 0)
      );
    }

    // Add search query filter
    if (options.searchQuery) {
      constraints.push(
        where('clientName', '>=', options.searchQuery.toLowerCase())
      );
      constraints.push(
        where('clientName', '<=', options.searchQuery.toLowerCase() + '\uf8ff')
      );
    }

    // Add ordering
    if (options.orderBy) {
      constraints.push(orderBy(options.orderBy, options.orderDirection || 'asc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    // Add limit
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const matters: Matter[] = [];
    querySnapshot.forEach((doc) => {
      matters.push(documentToMatter(doc));
    });

    return {
      success: true,
      matters,
    };
  } catch (error) {
    console.error('Error getting matters:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get matters';

    return {
      success: false,
      matters: [],
      error: errorMessage,
    };
  }
};

/**
 * Update a matter
 */
export const updateMatter = async (
  matterId: string,
  data: UpdateMatterInput,
  firmId?: string
): Promise<UpdateMatterResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, MATTERS_COLLECTION, matterId);

    // Check if matter exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Matter not found',
      };
    }

    // Validate data
    const validationErrors = validateMatterData(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.join(', '),
      };
    }

    // Update document
    const updateData: DocumentData = {
      ...data,
      updatedAt: new Date(),
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
        error: 'Failed to update matter',
      };
    }

    const matter = documentToMatter(updatedSnap);

    return {
      success: true,
      matter,
    };
  } catch (error) {
    console.error('Error updating matter:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update matter';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Delete a matter
 */
export const deleteMatter = async (
  matterId: string,
  firmId?: string
): Promise<DeleteMatterResult> => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, MATTERS_COLLECTION, matterId);

    // Check if matter exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Matter not found',
      };
    }

    await deleteDoc(docRef);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting matter:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete matter';

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Close a matter
 */
export const closeMatter = async (
  matterId: string,
  firmId?: string
): Promise<UpdateMatterResult> => {
  return updateMatter(matterId, {
    status: 'Closed',
    closedAt: new Date(),
  }, firmId);
};

/**
 * Reopen a matter
 */
export const reopenMatter = async (
  matterId: string,
  firmId?: string
): Promise<UpdateMatterResult> => {
  return updateMatter(matterId, {
    status: 'Active',
    closedAt: undefined,
  }, firmId);
};

// ============================================
// Real-time Listeners
// ============================================

/**
 * Listen to matters in real-time
 */
export const listenToMatters = (
  options: MatterListenerOptions
): (() => void) | null => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, MATTERS_COLLECTION);

    const constraints: QueryConstraint[] = [];

    // Add filters
    if (options.firmId) {
      constraints.push(where('firmId', '==', options.firmId));
    }

    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collectionRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matters: Matter[] = [];
        snapshot.forEach((doc) => {
          matters.push(documentToMatter(doc));
        });

        if (options.onUpdate) {
          options.onUpdate(matters);
        }
      },
      (error) => {
        console.error('Error listening to matters:', error);
        if (options.onError) {
          options.onError(error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up matter listener:', error);
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error(String(error)));
    }
    return null;
  }
};

// ============================================
// Export
// ============================================

export * from './matters.service';
