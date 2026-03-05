/**
 * Allocation Details Service
 *
 * Manages individual matter allocations within an interest allocation.
 * Tracks tier (Tier 1 or Tier 2) and allocated amounts.
 *
 * @module services/firebase/allocationDetails.service
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
  FirestoreAllocationDetail,
  FirestoreAllocationDetailData,
  FirestoreMatter,
  FirestoreMatterData,
  FirestoreAllocation,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Allocation detail creation input
 */
export interface CreateAllocationDetailInput {
  allocationId: string;
  matterId: string;
  tier: 'Tier1' | 'Tier2';
  allocatedInterest: number;
  principalBalance?: number;
  interestOwed?: number;
  newInterestOwed?: number;
}

/**
 * Allocation detail update input
 */
export interface UpdateAllocationDetailInput {
  allocatedInterest?: number;
  principalBalance?: number;
  interestOwed?: number;
  newInterestOwed?: number;
  verifiedAt?: number;
}

/**
 * Allocation detail query filters
 */
export interface AllocationDetailFilters {
  allocationId: string;
  tier?: 'Tier1' | 'Tier2';
  matterId?: string;
}

/**
 * Matter allocation summary
 */
export interface MatterAllocationSummary {
  matterId: string;
  tier: 'Tier1' | 'Tier2';
  allocatedInterest: number;
  principalBalance: number;
  interestOwed: number;
  newInterestOwed: number;
  allocationCount: number;
  totalAllocated: number;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create an allocation detail
 *
 * @param input - Allocation detail creation data
 * @returns Operation result with created allocation detail document
 */
export async function createAllocationDetail(
  input: CreateAllocationDetailInput
): Promise<OperationResult<FirestoreDocument<FirestoreAllocationDetail>>> {
  const detailData: Omit<FirestoreAllocationDetailData, 'createdAt' | 'updatedAt'> = {
    allocationId: input.allocationId,
    matterId: input.matterId,
    tier: input.tier,
    allocatedInterest: input.allocatedInterest,
    principalBalance: input.principalBalance || 0,
    interestOwed: input.interestOwed || 0,
    newInterestOwed: input.newInterestOwed || 0,
    verifiedAt: undefined,
  };

  return createDocument<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    detailData
  );
}

/**
 * Create allocation details in a batch
 *
 * @param inputs - Array of allocation detail inputs
 * @returns Operation result
 */
export async function createAllocationDetailsBatch(
  inputs: CreateAllocationDetailInput[]
): Promise<OperationResult<void>> {
  const operations = inputs.map((input) => ({
    type: 'set',
    collection: COLLECTION_NAMES.ALLOCATION_DETAILS,
    data: {
      allocationId: input.allocationId,
      matterId: input.matterId,
      tier: input.tier,
      allocatedInterest: input.allocatedInterest,
      principalBalance: input.principalBalance || 0,
      interestOwed: input.interestOwed || 0,
      newInterestOwed: input.newInterestOwed || 0,
      verifiedAt: undefined,
      createdAt: Date.now(),
    },
    documentId: `detail-${input.matterId}-${input.tier}`,
  }));

  return executeBatch(operations);
}

/**
 * Get allocation detail by ID
 *
 * @param detailId - Allocation detail ID
 * @returns Operation result with allocation detail document
 */
export async function getAllocationDetailById(
  detailId: string
): Promise<OperationResult<FirestoreDocument<FirestoreAllocationDetail>>> {
  return getDocument<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    detailId
  );
}

/**
 * Get allocation details by allocation
 *
 * @param allocationId - Allocation ID
 * @returns Operation result with allocation detail documents
 */
export async function getAllocationDetailsByAllocation(
  allocationId: string
): Promise<OperationResult<FirestoreDocument<FirestoreAllocationDetail>[]>> {
  return queryDocuments<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    {
      where: [
        {
          field: 'allocationId',
          operator: '==',
          value: allocationId,
        },
      ],
      orderBy: [
        {
          field: 'tier',
          direction: 'asc',
        },
      ],
    }
  );
}

/**
 * Get allocation details by matter
 *
 * @param matterId - Matter ID
 * @returns Operation result with allocation detail documents
 */
export async function getAllocationDetailsByMatter(
  matterId: string
): Promise<OperationResult<FirestoreDocument<FirestoreAllocationDetail>[]>> {
  return queryDocuments<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
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
          field: 'tier',
          direction: 'asc',
        },
      ],
    }
  );
}

/**
 * Get allocation details by tier
 *
 * @param tier - Tier ('Tier1' or 'Tier2')
 * @returns Operation result with allocation detail documents
 */
export async function getAllocationDetailsByTier(
  tier: 'Tier1' | 'Tier2',
  options?: {
    allocationId?: string;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreAllocationDetail>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('tier', '==', tier),
  ];

  if (options?.allocationId) {
    whereClauses.push(where('allocationId', '==', options.allocationId));
  }

  return queryDocuments<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'matterId',
          direction: 'asc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get allocation details with pagination
 *
 * @param filters - Query filters
 * @param pagination - Pagination options
 * @param sort - Sort options
 * @returns Operation result with paginated allocation details
 */
export async function getAllocationDetailsPaginated(
  filters: AllocationDetailFilters,
  pagination?: PaginationOptions,
  sort?: {
    field: 'matterId' | 'tier' | 'allocatedInterest' | 'createdAt';
    direction: 'asc' | 'desc';
  }
): Promise<OperationResult<PaginatedResult<FirestoreAllocationDetail>>> {
  const whereClauses: QueryConstraint[] = [];

  if (filters.allocationId) {
    whereClauses.push(where('allocationId', '==', filters.allocationId));
  }

  if (filters.tier) {
    whereClauses.push(where('tier', '==', filters.tier));
  }

  if (filters.matterId) {
    whereClauses.push(where('matterId', '==', filters.matterId));
  }

  const orderByClauses = sort
    ? [{
        field: sort.field as string,
        direction: sort.direction,
      }]
    : [
        {
          field: 'matterId',
          direction: 'asc',
        },
      ];

  return queryDocumentsPaginated<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
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
 * Update an allocation detail
 *
 * @param detailId - Allocation detail ID
 * @param updates - Allocation detail update data
 * @returns Operation result
 */
export async function updateAllocationDetail(
  detailId: string,
  updates: UpdateAllocationDetailInput
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    detailId,
    updates
  );
}

/**
 * Update allocation details in a batch
 *
 * @param updates - Array of { detailId, updates } tuples
 * @returns Operation result
 */
export async function updateAllocationDetailsBatch(
  updates: Array<{
    detailId: string;
    updates: UpdateAllocationDetailInput;
  }>
): Promise<OperationResult<void>> {
  const operations = updates.map((update) => ({
    type: 'update',
    collection: COLLECTION_NAMES.ALLOCATION_DETAILS,
    documentId: update.detailId,
    data: {
      ...update.updates,
      verifiedAt: update.updates.verifiedAt || Date.now(),
    },
  }));

  return executeBatch(operations);
}

/**
 * Verify an allocation detail
 *
 * @param detailId - Allocation detail ID
 * @returns Operation result
 */
export async function verifyAllocationDetail(
  detailId: string
): Promise<OperationResult<void>> {
  return updateDocument<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    detailId,
    {
      verifiedAt: Date.now(),
    }
  );
}

/**
 * Delete allocation details
 *
 * @param allocationId - Allocation ID
 * @returns Operation result
 */
export async function deleteAllocationDetailsByAllocation(
  allocationId: string
): Promise<OperationResult<void>> {
  // Query all details for allocation
  const result = await queryDocuments<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    {
      where: [
        {
          field: 'allocationId',
          operator: '==',
          value: allocationId,
        },
      ],
    }
  );

  if (!result.success || !result.data) {
    return {
      success: true,
      data: undefined,
    };
  }

  const details = result.data;

  // Delete all details in a batch
  const operations = details.map((detail) => ({
    type: 'delete',
    collection: COLLECTION_NAMES.ALLOCATION_DETAILS,
    documentId: detail.id,
  }));

  return executeBatch(operations);
}

/**
 * Delete allocation detail by ID
 *
 * @param detailId - Allocation detail ID
 * @returns Operation result
 */
export async function deleteAllocationDetail(
  detailId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.ALLOCATION_DETAILS, detailId);
}

// ============================================
// Summary Operations
// ============================================

/**
 * Get matter allocation summary
 *
 * @param matterId - Matter ID
 * @returns Operation result with matter allocation summary
 */
export async function getMatterAllocationSummary(
  matterId: string
): Promise<OperationResult<MatterAllocationSummary>> {
  // Get all allocation details for matter
  const result = await getAllocationDetailsByMatter(matterId);

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: 'No allocation details found for matter',
      code: 'not-found',
    };
  }

  const details = result.data;

  // Calculate summaries by tier
  const tier1Details = details.filter((d) => d.data.tier === 'Tier1');
  const tier2Details = details.filter((d) => d.data.tier === 'Tier2');

  const tier1Allocated = tier1Details.reduce(
    (sum, detail) => sum + detail.data.allocatedInterest,
    0
  );
  const tier2Allocated = tier2Details.reduce(
    (sum, detail) => sum + detail.data.allocatedInterest,
    0
  );
  const tier1InterestOwed = tier1Details.reduce(
    (sum, detail) => sum + detail.data.interestOwed,
    0
  );
  const tier2InterestOwed = tier2Details.reduce(
    (sum, detail) => sum + detail.data.interestOwed,
    0
  );

  // Get latest principal balance
  const latestDetail = details[details.length - 1];
  const principalBalance = latestDetail?.data.principalBalance || 0;

  // Get latest tier info
  const latestTier1Detail = tier1Details[tier1Details.length - 1];
  const latestTier2Detail = tier2Details[tier2Details.length - 1];
  const currentTier = latestTier1Detail?.data.tier || latestTier2Detail?.data.tier;

  return {
    success: true,
    data: {
      matterId,
      tier: currentTier as 'Tier1' | 'Tier2',
      allocatedInterest: tier1Allocated + tier2Allocated,
      principalBalance,
      interestOwed: tier1InterestOwed + tier2InterestOwed,
      newInterestOwed: latestDetail?.data.newInterestOwed || 0,
      allocationCount: details.length,
      tier1Allocated,
      tier2Allocated,
      tier1InterestOwed,
      tier2InterestOwed,
    },
  };
}

/**
 * Get allocation summary by allocation
 *
 * @param allocationId - Allocation ID
 * @returns Operation result with allocation summary
 */
export async function getAllocationSummaryByAllocation(
  allocationId: string
): Promise<OperationResult<{
    tier1Details: FirestoreDocument<FirestoreAllocationDetail>[];
    tier2Details: FirestoreDocument<FirestoreAllocationDetail>[];
    tier1Allocated: number;
    tier2Allocated: number;
    tier1InterestOwed: number;
    tier2InterestOwed: number;
    totalAllocated: number;
    detailCount: number;
  }>> {
  // Get all allocation details
  const result = await getAllocationDetailsByAllocation(allocationId);

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: 'No allocation details found',
      code: 'not-found',
    };
  }

  const details = result.data;

  // Separate by tier
  const tier1Details = details.filter((d) => d.data.tier === 'Tier1');
  const tier2Details = details.filter((d) => d.data.tier === 'Tier2');

  // Calculate totals
  const tier1Allocated = tier1Details.reduce(
    (sum, detail) => sum + detail.data.allocatedInterest,
    0
  );
  const tier2Allocated = tier2Details.reduce(
    (sum, detail) => sum + detail.data.allocatedInterest,
    0
  );
  const tier1InterestOwed = tier1Details.reduce(
    (sum, detail) => sum + detail.data.interestOwed,
    0
  );
  const tier2InterestOwed = tier2Details.reduce(
    (sum, detail) => sum + detail.data.interestOwed,
    0
  );

  return {
    success: true,
    data: {
      tier1Details,
      tier2Details,
      tier1Allocated,
      tier2Allocated,
      tier1InterestOwed,
      tier2InterestOwed,
      totalAllocated: tier1Allocated + tier2Allocated,
      detailCount: details.length,
    },
  };
}

// ============================================
// Batch Operations
// ============================================

/**
 * Update allocation details for multiple matters
 *
 * @param matterIds - Array of matter IDs
 * @param updates - Updates to apply
 * @returns Operation result
 */
export async function updateMatterAllocationDetailsBatch(
  matterIds: string[],
  updates: UpdateAllocationDetailInput
): Promise<OperationResult<void>> {
  // Get all details for matters
  const result = await queryDocuments<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    {
      where: [
        {
          field: 'matterId',
          operator: 'in',
          value: matterIds,
        },
      ],
    }
  );

  if (!result.success || !result.data) {
    return {
      success: true,
      data: undefined,
    };
  }

  const details = result.data;

  // Update all details
  const operations = details.map((detail) => ({
    type: 'update',
    collection: COLLECTION_NAMES.ALLOCATION_DETAILS,
    documentId: detail.id,
    data: {
      ...updates,
      verifiedAt: updates.verifiedAt || Date.now(),
    },
  }));

  return executeBatch(operations);
}

// ============================================
// Real-time Subscriptions
// ============================================

/**
 * Subscribe to allocation detail changes
 *
 * @param detailId - Allocation detail ID
 * @param onUpdate - Callback for allocation detail updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToAllocationDetail(
  detailId: string,
  onUpdate: (detail: FirestoreDocument<FirestoreAllocationDetail> | null) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToDocument<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
    detailId,
    onUpdate,
    onError
  );
}

/**
 * Subscribe to matter allocation details
 *
 * @param matterId - Matter ID
 * @param onUpdate - Callback for allocation details updates
 * @param onError - Error callback
 * @returns Unsubscribe function
 */
export function subscribeToMatterAllocationDetails(
  matterId: string,
  onUpdate: (details: FirestoreDocument<FirestoreAllocationDetail>[]) => void,
  onError?: (error: any) => void
): () => void {
  return subscribeToQuery<FirestoreAllocationDetailData>(
    COLLECTION_NAMES.ALLOCATION_DETAILS,
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
          field: 'tier',
          direction: 'asc',
        },
      ],
    },
    onUpdate,
    onError
  );
}
