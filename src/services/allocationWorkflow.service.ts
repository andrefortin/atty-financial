/**
 * Allocation Workflow Service
 *
 * Orchestrates the allocation creation and finalization process.
 * Handles multi-stage approval and validation.
 *
 * @module services/allocationWorkflow
 */

import {
  executeTransaction,
  executeBatch,
} from './firebase/firestore.service';
import type { OperationResult } from './firebase/firestore.service';
import type {
  FirestoreAllocation,
  FirestoreAllocationData,
  FirestoreMatter,
  FirestoreMatterData,
  FirestoreAllocationDetail,
  FirestoreAllocationDetailData,
} from '@/types/firestore';
import {
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getAllocationById as getFirestoreAllocationById,
  createAllocation as createFirestoreAllocation,
  updateAllocation as updateFirestoreAllocation,
  deleteAllocation as deleteFirestoreAllocation,
} from './firebase/allocations.service';
import {
  getMatterById,
  getMattersById,
  updateMatter,
  updateMattersBatch,
} from './firebase/matters.service';
import {
  getMatterAllocationSummary,
} from './firebase/allocationDetails.service';
import {
  calculateTieredAllocation,
  getTier1Matters,
  getTier2Matters,
  validateTieredInterestCalculation,
} from '../lib/calculators/interestCalculator';
import {
  createAllocationDetail,
  createAllocationDetailsBatch,
  updateAllocationDetail,
  updateAllocationDetailsBatch,
} from './firebase/allocationDetails.service';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Allocation creation request
 */
export interface CreateAllocationRequest {
  allocationDate: number;
  totalInterest: number;
  tier1MatterIds?: string[];
  tier2MatterIds?: string[];
  firmId: string;
  period: string; // e.g., "January 2026", "Q1 2026"
  notes?: string;
  createdBy: string;
  approverIds?: string[]; // Users who can approve
}

/**
 * Allocation update request
 */
export interface UpdateAllocationRequest {
  allocationId: string;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  notes?: string;
}

/**
 * Allocation approval request
 */
export interface ApproveAllocationRequest {
  allocationId: string;
  approvedBy: string;
  notes?: string;
}

/**
 * Allocation rejection request
 */
export interface RejectAllocationRequest {
  allocationId: string;
  reason: string;
}

/**
 * Undo allocation request
 */
export interface UndoAllocationRequest {
  allocationId: string;
  reason: string;
}

/**
 * Finalize allocation request
 */
export interface FinalizeAllocationRequest {
  allocationId: string;
  notes?: string;
  verifyBeforeFinalize?: boolean;
}

/**
 * Lock allocation request
 */
export interface LockAllocationRequest {
  allocationId: string;
  reason: string;
}

/**
 * Unlock allocation request
 */
export interface UnlockAllocationRequest {
  allocationId: string;
  reason: string;
}

/**
 * Allocation preview result
 */
export interface AllocationPreview {
  tier1Matters: Array<{
    matterId: string;
    matterNumber: string;
    clientName: string;
    principalBalance: number;
    interestOwed: number;
    tier1Interest: number;
  }>;
  tier2Matters: Array<{
    matterId: string;
    matterNumber: string;
    clientName: string;
    principalBalance: number;
    interestOwed: number;
    tier2Interest: number;
  }>;
  totalInterest: number;
  tier1Interest: number;
  tier2Interest: number;
  carryForward: number;
}

/**
 * Allocation workflow result
 */
export interface AllocationWorkflowResult {
  allocationId: string;
  preview: AllocationPreview;
  allocationDetails: FirestoreAllocationDetail[];
  mattersUpdated: FirestoreDocument<FirestoreMatter>[];
}

// ============================================
// Workflow Operations
// ============================================

/**
 * Create a new allocation
 *
 * @param request - Allocation creation request
 * @returns Operation result with allocation preview and workflow result
 */
export async function createAllocationWorkflow(
  request: CreateAllocationRequest
): Promise<OperationResult<AllocationWorkflowResult>> {
  try {
    // Step 1: Validate inputs
    const validation = validateAllocationRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        code: 'invalid-argument',
      };
    }

    // Step 2: Get matter data
    const tier1MatterIds = request.tier1MatterIds || [];
    const tier2MatterIds = request.tier2MatterIds || [];
    const allMatterIds = [...tier1MatterIds, ...tier2MatterIds];

    const mattersResult = await getMattersById(allMatterIds);

    if (!mattersResult.success || !mattersResult.data) {
      return {
        success: false,
        error: 'Failed to fetch matter data',
        code: 'not-found',
      };
    }

    const matters = mattersResult.data;
    const matterMap = new Map(matters.map((m) => [m.id, m.data]));

    // Step 3: Calculate allocation
    const tier1Matters = tier1MatterIds.map((id) => matterMap.get(id));
    const tier2Matters = tier2MatterIds.map((id) => matterMap.get(id));

    const allocationResult = await calculateTieredInterest(
      tier1Matters,
      tier1Matters.map((m) => m.data.principalBalance || 0),
      tier2Matters,
      tier2Matters.map((m) => m.data.principalBalance || 0),
      request.allocationDate,
      Date.now() + (30 * 24 * 60 * 60 * 1000), // End date (30 days from now)
      request.totalInterest,
      { firmId: request.firmId }
    );

    if (!allocationResult.success || !allocationResult.data) {
      return {
        success: false,
        error: allocationResult.error || 'Failed to calculate allocation',
        code: allocationResult.code,
      };
    }

    const tieredResult = allocationResult.data;

    // Step 4: Create allocation document
    const createResult = await createFirestoreAllocation({
      allocationDate: request.allocationDate,
      totalInterest: request.totalInterest,
      tier1Interest: tieredResult.tier1Interest,
      tier2Interest: tieredResult.tier2Interest,
      carryForward: tieredResult.carryForward,
      firmId: request.firmId,
      period: request.period,
      status: 'Draft',
      notes: request.notes,
      createdBy: request.createdBy,
    });

    if (!createResult.success || !createResult.data) {
      return {
        success: false,
        error: 'Failed to create allocation',
        code: createResult.code,
      };
    }

    const allocation = createResult.data;
    const allocationId = allocation.id;

    // Step 5: Create allocation details
    const tier1Details: tier1Matters.map((matter, index) => ({
      allocationId,
      matterId: matter.id,
      tier: 'Tier1',
      allocatedInterest: tieredResult.tier1Allocations[index]?.allocatedInterest || 0,
      principalBalance: matter.data.principalBalance || 0,
      interestOwed: matter.data.totalInterestAccrued || matter.data.totalInterestPaid || 0,
      newInterestOwed: 0,
    }));

    const tier2Details: tier2Matters.map((matter, index) => ({
      allocationId,
      matterId: matter.id,
      tier: 'Tier2',
      allocatedInterest: tieredResult.tier2Allocations[index]?.allocatedInterest || 0,
      principalBalance: matter.data.principalBalance || 0,
      interestOwed: matter.data.totalInterestAccrued || matter.data.totalInterestPaid || 0,
      newInterestOwed: 0,
    }));

    const detailsResult = await createAllocationDetailsBatch([
      ...tier1Details,
      ...tier2Details,
    ]);

    if (!detailsResult.success) {
      return {
        success: false,
        error: 'Failed to create allocation details',
        code: detailsResult.code,
      };
    }

    // Step 6: Update matter totals
    const matterUpdates: matters.map((matter) => {
      const tier1Alloc = tieredResult.tier1Allocations.find((a) => a.matterId === matter.id);
      const tier2Alloc = tieredResult.tier2Allocations.find((a) => a.matterId === matter.id);
      const totalAllocated = (tier1Alloc?.allocatedInterest || 0) + (tier2Alloc?.allocatedInterest || 0);

      return {
        id: matter.id,
        data: {
          totalDraws: (matter.data.totalDraws || 0) + (tier2Alloc?.allocatedInterest || 0), // Tier 2 adds as draws
          totalPrincipalPayments: matter.data.totalPrincipalPayments || 0,
          totalInterestAccrued: (matter.data.totalInterestAccrued || 0) + totalAllocated,
          totalInterestPaid: matter.data.totalInterestPaid || 0,
          principalBalance: matter.data.principalBalance || 0,
          totalOwed: (matter.data.principalBalance || 0) + ((matter.data.totalInterestAccrued || 0) + totalAllocated - (matter.data.totalInterestPaid || 0)),
        },
      };
    });

    const updateResult = await updateMattersBatch(matterUpdates);

    if (!updateResult.success) {
      return {
        success: false,
        error: 'Failed to update matter totals',
        code: updateResult.code,
      };
    }

    // Step 7: Generate preview
    const preview: generateAllocationPreview(
      allocation,
      matters,
      tieredResult
    );

    return {
      success: true,
      data: {
        allocationId,
        preview,
        allocationDetails: detailsResult.data || [],
        mattersUpdated: updateResult.data || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Submit allocation for approval
 *
 * @param allocationId - Allocation ID
 * @param approvedBy - User ID who approved
 * @param notes - Optional approval notes
 * @returns Operation result
 */
export async function submitAllocationForApproval(
  allocationId: string,
  approvedBy: string,
  notes?: string
): Promise<OperationResult<void>> {
  try {
    // Update allocation status to Pending
    const result = await updateFirestoreAllocation(allocationId, {
      status: 'Pending',
      notes,
      approvedBy,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to submit allocation for approval',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Approve an allocation
 *
 * @param request - Approval request
 * @returns Operation result
 */
export async function approveAllocation(
  request: ApproveAllocationRequest
): Promise<OperationResult<void>> {
  try {
    // Get current allocation
    const getResult = await getFirestoreAllocationById(request.allocationId);

    if (!getResult.success || !getResult.data) {
      return {
        success: false,
        error: 'Allocation not found',
        code: 'not-found',
      };
    }

    const allocation = getResult.data;

    // Validate status
    if (allocation.data.status === 'Locked') {
      return {
        success: false,
        error: 'Cannot approve a locked allocation',
        code: 'invalid-argument',
      };
    }

    // Update allocation status to Finalized
    const result = await updateFirestoreAllocation(request.allocationId, {
      status: 'Finalized',
      notes: request.notes,
      approvedBy: request.approvedBy,
      approvedAt: Date.now(),
      finalizedAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to approve allocation',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Reject an allocation
 *
 * @param request - Rejection request
 * @returns Operation result
 */
export async function rejectAllocation(
  request: RejectAllocationRequest
): Promise<OperationResult<void>> {
  try {
    // Update allocation status back to Draft
    const result = await updateFirestoreAllocation(request.allocationId, {
      status: 'Draft',
      notes: `Rejected: ${request.reason}`,
      approvedBy: null,
      approvedAt: null,
      finalizedAt: null,
      updatedAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to reject allocation',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Undo an allocation
 *
 * @param request - Undo request
 * @returns Operation result
 */
export async function undoAllocation(
  request: UndoAllocationRequest
): Promise<OperationResult<void>> {
  try {
    // Update allocation status back to Draft
    const result = await updateFirestoreAllocation(request.allocationId, {
      status: 'Draft',
      notes: `Undo: ${request.reason}`,
      approvedBy: null,
      approvedAt: null,
      finalizedAt: null,
      updatedAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to undo allocation',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Finalize an allocation
 *
 * @param request - Finalization request
 * @returns Operation result
 */
export async function finalizeAllocation(
  request: FinalizeAllocationRequest
): Promise<OperationResult<void>> {
  try {
    // Verify allocation if requested
    if (request.verifyBeforeFinalize) {
      const getResult = await getFirestoreAllocationById(request.allocationId);

      if (!getResult.success || !getResult.data) {
        return {
          success: false,
          error: 'Allocation not found',
          code: 'not-found',
        };
      }

      const allocation = getResult.data;

      // Validate allocation details
      const summaryResult = await getAllocationSummaryByAllocation(request.allocationId);

      if (!summaryResult.success || !summaryResult.data) {
        return {
          success: false,
          error: 'Failed to get allocation summary',
          code: summaryResult.code,
        };
      }

      const summary = summaryResult.data;

      // Check if allocation details exist
      if (summary.detailCount !== summary.tier1MatterIds.length + summary.tier2MatterIds.length) {
        return {
          success: false,
          error: 'Allocation details are incomplete',
          code: 'incomplete',
        };
      }

      // Check if totals match
      const totalAllocated = summary.tier1TotalInterest + summary.tier2TotalInterest;
      const expectedTotal = allocation.data.totalInterest;

      if (Math.abs(totalAllocated - expectedTotal) > 0.01) {
        return {
          success: false,
          error: 'Allocation totals do not match',
          code: 'invalid-state',
        };
      }
    }

    // Update allocation status to Finalized
    const result = await updateFirestoreAllocation(request.allocationId, {
      status: 'Finalized',
      notes: request.notes,
      finalizedAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to finalize allocation',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Lock an allocation
 *
 * @param request - Lock request
 * @returns Operation result
 */
export async function lockAllocation(
  request: LockAllocationRequest
): Promise<OperationResult<void>> {
  try {
    // Update allocation status to Locked
    const result = await updateFirestoreAllocation(request.allocationId, {
      status: 'Locked',
      notes: `Locked: ${request.reason}`,
      updatedAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to lock allocation',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Unlock an allocation
 *
 * @param request - Unlock request
 * @returns Operation result
 */
export async function unlockAllocation(
  request: UnlockAllocationRequest
): Promise<OperationResult<void>> {
  try {
    // Update allocation status back to Pending
    const result = await updateFirestoreAllocation(request.allocationId, {
      status: 'Pending',
      notes: `Unlocked: ${request.reason}`,
      updatedAt: Date.now(),
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to unlock allocation',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Delete an allocation
 *
 * @param allocationId - Allocation ID
 * @returns Operation result
 */
export async function deleteAllocationWorkflow(
  allocationId: string,
  reason: string
): Promise<OperationResult<void>> {
  try {
    // Delete allocation details
    const detailsResult = await deleteAllocationDetailsByAllocation(allocationId);

    if (!detailsResult.success) {
      return {
        success: false,
        error: 'Failed to delete allocation details',
        code: detailsResult.code,
      };
    }

    // Delete allocation document
    const result = await deleteFirestoreAllocation(allocationId);

    if (!result.success) {
      return {
        success: false,
        error: 'Failed to delete allocation',
        code: result.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Revert an allocation
 *
 * Deletes all allocation details and matter updates,
 * returning matters to previous state
 *
 * @param allocationId - Allocation ID
 * @param reason - Revert reason
 * @returns Operation result
 */
export async function revertAllocation(
  allocationId: string,
  reason: string
): Promise<OperationResult<void>> {
  try {
    // Get allocation
    const getResult = await getFirestoreAllocationById(allocationId);

    if (!getResult.success || !getResult.data) {
      return {
        success: false,
        error: 'Allocation not found',
        code: 'not-found',
      };
    }

    const allocation = getResult.data;

    if (allocation.data.status === 'Locked') {
      return {
        success: false,
        error: 'Cannot revert a locked allocation',
        code: 'invalid-argument',
      };
    }

    // Get matter allocation summary
    const summaryResult = await getAllocationSummaryByAllocation(allocationId);

    if (!summaryResult.success || !summaryResult.data) {
      return {
        success: false,
        error: 'Failed to get allocation summary',
        code: summaryResult.code,
      };
    }

    const summary = summaryResult.data;

    // Revert matter totals
    const matterUpdates = summary.tier1Allocations.map((alloc) => ({
      id: alloc.matterId,
      data: {
        totalDraws: (summary.tier1TotalInterest || 0) * -1, // Undo Tier 1 interest
        totalInterestAccrued: (summary.tier1TotalInterest || 0) * -1,
        totalInterestPaid: 0,
        principalBalance: 0, // Will be recalculated
        totalOwed: 0, // Will be recalculated
      },
    }));

    // Update matters
    const updateResult = await updateMattersBatch(matterUpdates);

    if (!updateResult.success) {
      return {
        success: false,
        error: 'Failed to revert matter totals',
        code: updateResult.code,
      };
    }

    // Delete allocation
    const deleteResult = await deleteAllocationWorkflow(allocationId, reason);

    if (!deleteResult.success) {
      return {
        success: false,
        error: 'Failed to delete allocation',
        code: deleteResult.code,
      };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Validate allocation request inputs
 */
function validateAllocationRequest(
  request: CreateAllocationRequest
): { valid: boolean; error?: string } {
  if (!request.allocationDate) {
    return { valid: false, error: 'Allocation date is required' };
  }

  if (request.totalInterest < 0) {
    return { valid: false, error: 'Total interest cannot be negative' };
  }

  if (request.totalInterest > 1000000) {
    return { valid: false, error: 'Total interest is too large' };
  }

  if (!request.firmId) {
    return { valid: false, error: 'Firm ID is required' };
  }

  if (!request.createdBy) {
    return { valid: false, error: 'Created by user ID is required' };
  }

  const hasMatterIds = (request.tier1MatterIds && request.tier1MatterIds.length > 0) ||
                        (request.tier2MatterIds && request.tier2MatterIds.length > 0);

  if (!hasMatterIds) {
    return { valid: false, error: 'At least one tier 1 or tier 2 matter ID is required' };
  }

  return { valid: true };
}

/**
 * Generate allocation preview
 */
function generateAllocationPreview(
  allocation: FirestoreDocument<FirestoreAllocation>,
  matters: FirestoreDocument<FirestoreMatter>[],
  tieredResult: any
): AllocationPreview {
  const tier1Matters = matters.filter((m) =>
    tieredResult.tier1Allocations.some((a) => a.matterId === m.id)
  );

  const tier2Matters = matters.filter((m) =>
    tieredResult.tier2Allocations.some((a) => a.matterId === m.id)
  );

  return {
    tier1Matters: tier1Matters.map((m) => ({
      matterId: m.id,
      matterNumber: m.data.matterNumber,
      clientName: m.data.clientName,
      principalBalance: m.data.principalBalance || 0,
      interestOwed: m.data.totalInterestAccrued || m.data.totalInterestPaid || 0,
      tier1Interest: tieredResult.tier1Allocations.find((a) => a.matterId === m.id)?.allocatedInterest || 0,
    })),
    tier2Matters: tier2Matters.map((m) => ({
      matterId: m.id,
      matterNumber: m.data.matterNumber,
      clientName: m.data.clientName,
      principalBalance: m.data.principalBalance || 0,
      interestOwed: m.data.totalInterestAccrued || m.data.totalInterestPaid || 0,
      tier2Interest: tieredResult.tier2Allocations.find((a) => a.matterId === m.id)?.allocatedInterest || 0,
    })),
    totalInterest: allocation.data.totalInterest,
    tier1Interest: allocation.data.tier1Interest,
    tier2Interest: allocation.data.tier2Interest,
    carryForward: allocation.data.carryForward,
  };
}
