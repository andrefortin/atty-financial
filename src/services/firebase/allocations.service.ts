/**
 * Allocations Service
 *
 * CRUD operations for interest allocations.
 * Manages allocation status workflow and queries.
 *
 * @module services/firebase/allocations.service
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
  executeTransaction,
  subscribeToDocument,
  subscribeToQuery,
  type OperationResult,
  type FirestoreDocument,
  type PaginationOptions,
  type PaginatedResult,
} from './firestore.service';
import type {
  FirestoreAllocation,
  FirestoreAllocationData,
  FirestoreMatter,
  FirestoreMatterData,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Allocation creation input
 */
export interface CreateAllocationInput {
  allocationDate: number;
  totalInterest: number;
  tier1Interest: number;
  tier2Interest: number;
  carryForward: number;
  firmId: string;
  period: string; // e.g., "January 2026", "Q1 2026"
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  notes?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: number;
}

/**
 * Allocation update input
 */
export interface UpdateAllocationInput {
  allocationDate?: number;
  totalInterest?: number;
  tier1Interest?: number;
  tier2Interest?: number;
  carryForward?: number;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  notes?: string;
  finalizedAt?: number;
  approvedAt?: number;
  approvedBy?: string;
}

/**
 * Allocation detail creation input
 */
export interface CreateAllocationDetailInput {
  allocationId: string;
  matterId: string;
  tier: 'Tier1' | 'Tier2';
  allocatedInterest: number;
  principalBalance: number;
}

/**
 * Allocation query filters
 */
export interface AllocationFilters {
  firmId: string;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  startDate?: number;
  endDate?: number;
  period?: string;
}

/**
 * Allocation summary
 */
export interface AllocationSummary {
  totalAllocations: number;
  totalInterestAllocated: number;
  tier1TotalInterest: number;
  tier2TotalInterest: number;
  totalCarryForward: number;
  averageAllocationPerMatter: number;
  allocationCount: number;
}

/**
 * Matter allocation summary
 */
export interface MatterAllocationSummary {
  matterId: string;
  matterNumber: string;
  clientName: string;
  totalAllocated: number;
  tier1Allocated: number;
  tier2Allocated: number;
  allocationCount: number;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new allocation
 *
 * @param input - Allocation creation data
 * @returns Operation result with created allocation document
 */
export async function createAllocation(
  input: CreateAllocationInput
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>>> {
  const allocationData: Omit<FirestoreAllocationData, 'createdAt' | 'updatedAt'> = {
    allocationDate: input.allocationDate,
    totalInterest: input.totalInterest,
    tier1Interest: input.tier1Interest,
    tier2Interest: input.tier2Interest,
    carryForward: input.carryForward,
    firmId: input.firmId,
    period: input.period,
    status: input.status || 'Draft',
    notes: input.notes,
    createdBy: input.createdBy,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    finalizedAt: input.status === 'Finalized' ? input.finalizedAt : undefined,
  };

  return createDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationData
  );
}

/**
 * Create an allocation with specific ID
 *
 * @param allocationId - Allocation ID (typically UUID)
 * @param input - Allocation creation data
 * @returns Operation result with created allocation document
 */
export async function createAllocationWithId(
  allocationId: string,
  input: CreateAllocationInput
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>>> {
  const allocationData: Omit<FirestoreAllocationData, 'createdAt' | 'updatedAt'> = {
    allocationDate: input.allocationDate,
    totalInterest: input.totalInterest,
    tier1Interest: input.tier1Interest,
    tier2Interest: input.tier2Interest,
    carryForward: input.carryForward,
    firmId: input.firmId,
    period: input.period,
    status: input.status || 'Draft',
    notes: input.notes,
    createdBy: input.createdBy,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    finalizedAt: input.status === 'Finalized' ? input.finalizedAt : undefined,
  };

  return createDocumentWithId<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    allocationData
  );
}

/**
 * Get an allocation by ID
 *
 * @param allocationId - Allocation ID
 * @returns Operation result with allocation document
 */
export async function getAllocationById(
  allocationId: string
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>>> {
  return getDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId
  );
}

/**
 * Update an allocation
 *
 * @param allocationId - Allocation ID
 * @param updates - Allocation update data
 * @returns Operation result
 */
export async function updateAllocation(
  allocationId: string,
  updates: UpdateAllocationInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    updates
  );
}

/**
 * Delete an allocation
 *
 * @param allocationId - Allocation ID
 * @returns Operation result
 */
export async function deleteAllocation(
  allocationId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.ALLOCATIONS, allocationId);
}

// ============================================
// Query Operations
// ============================================

/**
 * Get all allocations for a firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (status, limit)
 * @returns Operation result with allocation documents
 */
export async function getAllocationsByFirm(
  firmId: string,
  options?: {
    status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get allocations by date range
 *
 * @param firmId - Firm ID
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Query options (status)
 * @returns Operation result with allocation documents
 */
export async function getAllocationsByDateRange(
  firmId: string,
  startDate: number,
  endDate: number,
  options?: {
    status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('allocationDate', '>=', startDate),
    where('allocationDate', '<=', endDate),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'desc',
        },
      ],
    }
  );
}

/**
 * Get allocations by period
 *
 * @param firmId - Firm ID
 * @param period - Period string (e.g., "January 2026")
 * @returns Operation result with allocation documents
 */
export async function getAllocationsByPeriod(
  firmId: string,
  period: string
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>[]>> {
  return queryDocuments<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: firmId,
        },
        {
          field: 'period',
          operator: '==',
          value: period,
        },
      ],
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'desc',
        },
      ],
    }
  );
}

/**
 * Get allocations by status
 *
 * @param firmId - Firm ID
 * @param status - Allocation status
 * @returns Operation result with allocation documents
 */
export async function getAllocationsByStatus(
  firmId: string,
  status: 'Draft' | 'Pending' | 'Finalized' | 'Locked'
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>[]>> {
  return queryDocuments<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
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
          field: 'allocationDate',
          direction: 'desc',
        },
      ],
    }
  );
}

/**
 * Get pending allocations
 *
 * @param firmId - Firm ID
 * @returns Operation result with pending allocation documents
 */
export async function getPendingAllocations(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>[]>> {
  return queryDocuments<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: firmId,
        },
        {
          field: 'status',
          operator: '==',
          value: 'Pending',
        },
      ],
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'asc',
        },
      ],
    }
  );
}

/**
 * Get finalized allocations
 *
 * @param firmId - Firm ID
 * @returns Operation result with finalized allocation documents
 */
export async function getFinalizedAllocations(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreAllocation>[]>> {
  return queryDocuments<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: firmId,
        },
        {
          field: 'status',
          operator: '==',
          value: 'Finalized',
        },
      ],
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'desc',
        },
      ],
    }
  );
}

/**
 * Get allocations with pagination
 *
 * @param filters - Allocation filters
 * @param pagination - Pagination options
 * @returns Operation result with paginated allocations
 */
export async function getAllocationsPaginated(
  filters: AllocationFilters,
  pagination?: PaginationOptions
): Promise<OperationResult<PaginatedResult<FirestoreAllocation>>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', filters.firmId),
  ];

  if (filters.status) {
    whereClauses.push(where('status', '==', filters.status));
  }

  if (filters.startDate) {
    whereClauses.push(where('allocationDate', '>=', filters.startDate));
  }

  if (filters.endDate) {
    whereClauses.push(where('allocationDate', '<=', filters.endDate));
  }

  if (filters.period) {
    whereClauses.push(where('period', '==', filters.period));
  }

  return queryDocumentsPaginated<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    pagination,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'desc',
        },
      ],
    }
  );
}

// ============================================
// Allocation Status Management
// ============================================

/**
 * Submit allocation for approval
 *
 * @param allocationId - Allocation ID
 * @returns Operation result
 */
export async function submitAllocationForApproval(
  allocationId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    {
      status: 'Pending',
    updatedAt: Date.now(),
    }
  );
}

/**
 * Approve an allocation
 *
 * @param allocationId - Allocation ID
 * @param approvedBy - User ID who approved
 * @returns Operation result
 */
export async function approveAllocation(
  allocationId: string,
  approvedBy: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    {
      status: 'Finalized',
      approvedAt: Date.now(),
      approvedBy,
      finalizedAt: Date.now(),
      updatedAt: Date.now(),
    }
  );
}

/**
 * Reject an allocation
 *
 * @param allocationId - Allocation ID
 * @returns Operation result
 */
export async function rejectAllocation(
  allocationId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    {
      status: 'Draft',
      approvedAt: null,
      finalizedAt: null,
      updatedAt: Date.now(),
    }
  );
}

/**
 * Lock an allocation
 *
 * @param allocationId - Allocation ID
 * @returns Operation result
 */
export async function lockAllocation(
  allocationId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    {
      status: 'Locked',
      updatedAt: Date.now(),
    }
  );
}

/**
 * Unlock an allocation
 *
 * @param allocationId - Allocation ID
 * @returns Operation result
 */
export async function unlockAllocation(
  allocationId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    {
      status: 'Draft',
      updatedAt: Date.now(),
    }
  );
}

// ============================================
// Allocation Summary Operations
// ============================================

/**
 * Get allocation summary for a firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (startDate, endDate, status)
 * @returns Operation result with allocation summary
 */
export async function getAllocationSummary(
  firmId: string,
  options?: {
    startDate?: number;
    endDate?: number;
    status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  }
): Promise<OperationResult<AllocationSummary>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.startDate) {
    whereClauses.push(where('allocationDate', '>=', options.startDate));
  }

  if (options?.endDate) {
    whereClauses.push(where('allocationDate', '<=', options.endDate));
  }

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  const result = await queryDocuments<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
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
      error: result.error || 'Failed to fetch allocations',
      code: result.code,
    };
  }

  const allocations = result.data;
  const allocationCount = allocations.length;

  if (allocationCount === 0) {
    return {
      success: true,
      data: {
        totalAllocations: 0,
        totalInterestAllocated: 0,
        tier1TotalInterest: 0,
        tier2TotalInterest: 0,
        totalCarryForward: 0,
        averageAllocationPerMatter: 0,
        allocationCount: 0,
      },
    };
  }

  const totalInterestAllocated = allocations.reduce(
    (sum, allocation) => sum + allocation.data.totalInterest,
    0
  );
  const tier1TotalInterest = allocations.reduce(
    (sum, allocation) => sum + allocation.data.tier1Interest,
    0
  );
  const tier2TotalInterest = allocations.reduce(
    (sum, allocation) => sum + allocation.data.tier2Interest,
    0
  );
  const totalCarryForward = allocations.reduce(
    (sum, allocation) => sum + allocation.data.carryForward,
    0
  );

  return {
    success: true,
    data: {
      totalAllocations: allocationCount,
      totalInterestAllocated,
      tier1TotalInterest,
      tier2TotalInterest,
      totalCarryForward,
      averageAllocationPerMatter: totalInterestAllocated / allocationCount,
      allocationCount,
    },
  };
}

/**
 * Get allocation summary by period
 *
 * @param firmId - Firm ID
 * @param period - Period string (e.g., "January 2026")
 * @returns Operation result with allocation summary
 */
export async function getAllocationSummaryByPeriod(
  firmId: string,
  period: string
): Promise<OperationResult<AllocationSummary>> {
  const result = await getAllocationsByPeriod(firmId, period);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch allocations',
      code: result.code,
    };
  }

  const allocations = result.data;
  const allocationCount = allocations.length;

  if (allocationCount === 0) {
    return {
      success: true,
      data: {
        totalAllocations: 0,
        totalInterestAllocated: 0,
        tier1TotalInterest: 0,
        tier2TotalInterest: 0,
        totalCarryForward: 0,
        averageAllocationPerMatter: 0,
        allocationCount: 0,
      },
    };
  }

  const totalInterestAllocated = allocations.reduce(
    (sum, allocation) => sum + allocation.data.totalInterest,
    0
  );
  const tier1TotalInterest = allocations.reduce(
    (sum, allocation) => sum + allocation.data.tier1Interest,
    0
  );
  const tier2TotalInterest = allocations.reduce(
    (sum, allocation) => sum + allocation.data.tier2Interest,
    0
  );
  const totalCarryForward = allocations.reduce(
    (sum, allocation) => sum + allocation.data.carryForward,
    0
  );

  return {
    success: true,
    data: {
      totalAllocations: allocationCount,
      totalInterestAllocated,
      tier1TotalInterest,
      tier2TotalInterest,
      totalCarryForward,
      averageAllocationPerMatter: totalInterestAllocated / allocationCount,
      allocationCount,
    },
  };
}

/**
 * Get matter allocation summary
 *
 * @param allocationId - Allocation ID
 * @returns Operation result with matter allocation summary
 */
export async function getMatterAllocationSummary(
  allocationId: string
): Promise<OperationResult<MatterAllocationSummary[]>> {
  // Import allocation details service
  const { getAllocationDetailsByAllocation } = await import('./allocationDetails.service');

  const result = await getAllocationDetailsByAllocation(allocationId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to fetch allocation details',
      code: result.code,
    };
  }

  const details = result.data;
  const matterSummary: Record<string, MatterAllocationSummary> = {};

  // Group by matter
  details.forEach((detail) => {
    if (!matterSummary[detail.data.matterId]) {
      matterSummary[detail.data.matterId] = {
        matterId: detail.data.matterId,
        matterNumber: '', // Will be filled from matter query
        clientName: '', // Will be filled from matter query
        totalAllocated: 0,
        tier1Allocated: 0,
        tier2Allocated: 0,
        allocationCount: 0,
      };
    }

    const summary = matterSummary[detail.data.matterId];
    summary.totalAllocated += detail.data.allocatedInterest;

    if (detail.data.tier === 'Tier1') {
      summary.tier1Allocated += detail.data.allocatedInterest;
    } else if (detail.data.tier === 'Tier2') {
      summary.tier2Allocated += detail.data.allocatedInterest;
    }

    summary.allocationCount++;
  });

  // Get matter details for matters in allocation
  const matterIds = Object.keys(matterSummary);
  const { getDocumentsById } = await import('./matters.service');
  const matterResult = await getDocumentsById(COLLECTION_NAMES.MATTERS, matterIds);

  if (!matterResult.success || !matterResult.data) {
    return {
      success: true,
      data: [],
    };
  }

  const matterMap = new Map(matterResult.data!.map((m) => [m.id, m.data.matterId, m.data.clientName, m.data.matterNumber]));

  // Update summaries with matter info
  Object.values(matterSummary).forEach((summary) => {
    const matterInfo = matterMap.get(summary.matterId);
    if (matterInfo) {
      summary.matterNumber = matterInfo[2];
      summary.clientName = matterInfo[1];
    }
  });

  return {
    success: true,
    data: Object.values(matterSummary),
  };
}

// ============================================
// Batch Operations
// ============================================

/**
 * Create multiple allocations in a batch
 *
 * @param allocations - Array of allocation inputs
 * @returns Operation result
 */
export async function createAllocationsBatch(
  allocations: CreateAllocationInput[]
): Promise<OperationResult<void>> {
  const operations = allocations.map((input) => ({
    type: 'set',
    collection: COLLECTION_NAMES.ALLOCATIONS,
    data: {
      allocationDate: input.allocationDate,
      totalInterest: input.totalInterest,
      tier1Interest: input.tier1Interest,
      tier2Interest: input.tier2Interest,
      carryForward: input.carryForward,
      firmId: input.firmId,
      period: input.period,
      status: input.status || 'Draft',
      notes: input.notes,
      createdBy: input.createdBy,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
      finalizedAt: input.status === 'Finalized' ? input.finalizedAt : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  }));

  return executeBatch(operations);
}

/**
 * Update multiple allocations in a batch
 *
 * @param updates - Array of { allocationId, updates } tuples
 * @returns Operation result
 */
export async function updateAllocationsBatch(
  updates: Array<{
    allocationId: string;
    updates: UpdateAllocationInput;
  }>
): Promise<OperationResult<void>> {
  const operations = updates.map((update) => ({
    type: 'update',
    collection: COLLECTION_NAMES.ALLOCATIONS,
    documentId: update.allocationId,
    data: {
      ...update.updates,
      updatedAt: Date.now(),
    },
  }));

  return executeBatch(operations);
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to allocation changes
 *
 * @param allocationId - Allocation ID
 * @param onUpdate - Callback for allocation updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToAllocation(
  allocationId: string,
  onUpdate: (allocation: FirestoreDocument<FirestoreAllocation> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    allocationId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to firm allocations
 *
 * @param firmId - Firm ID
 * @param options - Subscription options (status)
 * @param onUpdate - Callback for allocations updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToFirmAllocations(
  firmId: string,
  options?: {
    status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  },
  onUpdate: (allocations: FirestoreDocument<FirestoreAllocation>[]) => void,
  onError?: (error: any) => void
): () => void {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return subscribeToQuery<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'desc',
        },
      ],
    },
    onUpdate,
    onError
  );
}

/**
 * Subscribe to pending allocations
 *
 * @param firmId - Firm ID
 * @param onUpdate - Callback for pending allocations updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToPendingAllocations(
  firmId: string,
  onUpdate: (allocations: FirestoreDocument<FirestoreAllocation>[]) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToQuery<FirestoreAllocationData>(
    COLLECTION_NAMES.ALLOCATIONS,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: firmId,
        },
        {
          field: 'status',
          operator: '==',
          value: 'Pending',
        },
      ],
      orderBy: [
        {
          field: 'allocationDate',
          direction: 'asc',
        },
      ],
    },
    onUpdate,
    onError
  );
}
