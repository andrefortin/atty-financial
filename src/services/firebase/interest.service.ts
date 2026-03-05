/**
 * Interest Service
 *
 * High-level orchestration for interest calculations.
 * Integrates rate lookup, daily balances, and calculation engines.
 *
 * @module services/firebase/interest.service
 */

import { getDocument, updateDocument, queryDocuments } from './firestore.service';
import { type OperationResult } from './firestore.service';
import type {
  FirestoreMatter,
  FirestoreMatterData,
  FirestoreRateEntry,
  FirestoreDailyBalance,
} from '@/types/firestore';
import {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateTieredInterest,
  projectInterest,
  calculateTotalInterest,
  calculateInterestByMatterType,
} from '@/lib/calculators/interestCalculator';
import { getEffectiveRate } from './rateEntries.service';
import { createDailyBalance, updateDailyBalance, getDailyBalancesByMatter } from './dailyBalances.service';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Interest summary for a matter
 */
export interface MatterInterestSummary {
  matterId: string;
  principal: number;
  interestAccrued: number;
  interestPaid: number;
  totalOwed: number;
  effectiveRate: number;
  startDate: number;
  endDate: number;
  days: number;
}

/**
 * Interest calculation request
 */
export interface InterestCalculationRequest {
  matterId: string;
  principal: number;
  startDate: number;
  endDate: number;
  calculationType: 'simple' | 'compound' | 'tiered' | 'compound';
  compoundingPeriod?: 'daily' | 'monthly' | 'annual';
}

/**
 * Batch interest calculation request
 */
export interface BatchInterestCalculationRequest {
  matterIds: string[];
  startDate: number;
  endDate: number;
  calculationType: 'simple' | 'compound' | 'tiered' | 'compound';
}

/**
 * Interest projection request
 */
export interface InterestProjectionRequest {
  matterId: string;
  principal: number;
  projectionDate: number;
  projectionPeriod: '30d' | '60d' | '90d' | '180d' | '365d';
}

/**
 * Batch interest recalculation request
 */
export interface BatchInterestRecalculationRequest {
  matterIds?: string[];
  startDate?: number;
  endDate?: number;
}

// ============================================
// Interest Calculation Operations
// ============================================

/**
 * Calculate interest for a single matter
 *
 * @param request - Interest calculation request
 * @returns Operation result with matter interest summary
 */
export async function calculateMatterInterest(
  request: InterestCalculationRequest
): Promise<OperationResult<MatterInterestSummary>> {
  try {
    // Get matter
    const matterResult = await getDocument<FirestoreMatterData>(
      COLLECTION_NAMES.MATTERS,
      request.matterId
    );

    if (!matterResult.success || !matterResult.data) {
      return {
        success: false,
        error: 'Matter not found',
        code: 'not-found',
      };
    }

    const matterData = matterResult.data.data;

    // Get effective rate
    const rateResult = await getEffectiveRate(request.startDate, matterData.firmId);

    if (!rateResult.success || !rateResult.data) {
      return {
        success: false,
        error: 'Rate not found for specified date',
        code: 'not-found',
      };
    }

    const effectiveRate = request.calculationType === 'tiered'
      ? rateResult.data.totalRate
      : rateResult.data.rate;

    // Calculate interest based on type
    let interest: number;
    let days: number;

    switch (request.calculationType) {
      case 'simple':
        const simpleResult = calculateSimpleInterest(
          request.principal,
          effectiveRate,
          (request.endDate - request.startDate) / (1000 * 60 * 60 * 24)
        );
        interest = simpleResult.interest;
        days = simpleResult.days;
        break;

      case 'compound':
        const compoundResult = await calculateCompoundInterest(
          request.principal,
          request.startDate,
          request.endDate,
          request.compoundingPeriod || 'daily'
        );
        interest = compoundResult.interest;
        days = compoundResult.days;
        break;

      case 'tiered':
        // Note: Tiered calculation requires multiple matters
        // This is handled in batch tiered calculation
        return {
          success: false,
          error: 'Use calculateTieredInterest for tiered calculations',
          code: 'invalid-argument',
        };

      default:
        return {
          success: false,
          error: `Unknown calculation type: ${request.calculationType}`,
          code: 'invalid-argument',
        };
    }

    // Update matter with calculated interest
    const interestAccrued = (matterData.interestAccrued || 0) + interest;
    const totalOwed = (matterData.principalBalance || request.principal) + interestAccrued - (matterData.interestPaid || 0);

    await updateDocument<FirestoreMatterData>(
      COLLECTION_NAMES.MATTERS,
      request.matterId,
      {
        interestAccrued,
        totalOwed,
        totalInterestAccrued: interestAccrued,
        updatedAt: Date.now(),
      }
    );

    return {
      success: true,
      data: {
        matterId: request.matterId,
        principal: matterData.principalBalance || request.principal,
        interestAccrued: interestAccrued,
        interestPaid: matterData.interestPaid || 0,
        totalOwed,
        effectiveRate: rateResult.data.rate,
        totalRate: rateResult.data.totalRate,
        startDate: request.startDate,
        endDate: request.endDate,
        days,
        calculationType: request.calculationType,
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
 * Calculate tiered interest across multiple matters
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier1Balances - Principal balance for tier 1 matters
 * @param tier2Matters - Matters with principal balance > $0
 * @param tier2Balances - Principal balance for tier 2 matters
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param totalInterest - Total interest to allocate
 * @param options - Calculation options
 * @returns Operation result with tiered interest details
 */
export async function calculateTieredInterest(
  tier1Matters: string[],
  tier1Balances: number[],
  tier2Matters: string[],
  tier2Balances: number[],
  startDate: number,
  endDate: number,
  totalInterest: number,
  options?: {
    firmId?: string;
  }
): Promise<OperationResult<{
    tier1Interest: number;
    tier2Interest: number;
    tier1MatterInterest: Array<{ matterId: string; interest: number }>;
    tier2MatterInterest: Array<{ matterId: string; interest: number }>;
  }>> {
  try {
    // Validate inputs
    if (tier1Matters.length !== tier1Balances.length) {
      return {
        success: false,
        error: 'Tier 1 matters count must match balances count',
        code: 'invalid-argument',
      };
    }

    if (tier2Matters.length !== tier2Balances.length) {
      return {
        success: false,
        error: 'Tier 2 matters count must match balances count',
        code: 'invalid-argument',
      };
    }

    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Calculate tier 1 interest (100% allocation)
    const tier1TotalPrincipal = tier1Balances.reduce((sum, balance) => sum + balance, 0);
    const tier1Interest = totalInterest * (tier1TotalPrincipal / (tier1TotalPrincipal + tier2Balances.reduce((sum, balance) => sum + balance, 0)));

    const tier1MatterInterest: tier1Matters.map((matterId, index) => ({
      matterId,
      interest: tier1Balances[index] / tier1TotalPrincipal * tier1Interest,
    }));

    // Calculate tier 2 interest (pro rata)
    const tier2TotalPrincipal = tier2Balances.reduce((sum, balance) => sum + balance, 0);
    const tier2Interest = totalInterest - tier1Interest;

    const tier2MatterInterest: tier2Matters.map((matterId, index) => ({
      matterId,
      interest: tier2Balances[index] / tier2TotalPrincipal * tier2Interest,
    }));

    return {
      success: true,
      data: {
        tier1Interest: tier1Interest,
        tier2Interest: tier2Interest,
        tier1MatterInterest,
        tier2MatterInterest,
        days,
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

// ============================================
// Batch Operations
// ============================================

/**
 * Calculate interest for multiple matters
 *
 * @param request - Batch interest calculation request
 * @returns Operation result with matter interest summaries
 */
export async function calculateBatchInterest(
  request: BatchInterestCalculationRequest
): Promise<OperationResult<MatterInterestSummary[]>> {
  try {
    const results: MatterInterestSummary[] = [];

    for (const matterId of request.matterIds) {
      // Get matter
      const matterResult = await getDocument<FirestoreMatterData>(
        COLLECTION_NAMES.MATTERS,
        matterId
      );

      if (!matterResult.success || !matterResult.data) {
        continue; // Skip non-existent matters
      }

      const matterData = matterResult.data.data;
      const principal = matterData.principalBalance || 0;

      const summary = await calculateMatterInterest({
        matterId,
        principal,
        startDate: request.startDate,
        endDate: request.endDate,
        calculationType: request.calculationType,
        compoundingPeriod: 'daily',
      });

      if (summary.success && summary.data) {
        results.push(summary.data);
      }
    }

    return {
      success: true,
      data: results,
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
// Projection Operations
// ============================================

/**
 * Project interest for a future date
 *
 * @param request - Interest projection request
 * @returns Operation result with projected interest
 */
export async function projectMatterInterest(
  request: InterestProjectionRequest
): Promise<OperationResult<{
    projectedInterest: number;
    projectedTotalOwed: number;
    effectiveRate: number;
  }>> {
  try {
    // Get matter
    const matterResult = await getDocument<FirestoreMatterData>(
      COLLECTION_NAMES.MATTERS,
      request.matterId
    );

    if (!matterResult.success || !matterResult.data) {
      return {
        success: false,
        error: 'Matter not found',
        code: 'not-found',
      };
    }

    const matterData = matterResult.data.data;
    const principal = matterData.principalBalance || request.principal;

    // Calculate projection days
    let projectionDays: number;
    switch (request.projectionPeriod) {
      case '30d':
        projectionDays = 30;
        break;
      case '60d':
        projectionDays = 60;
        break;
      case '90d':
        projectionDays = 90;
        break;
      case '180d':
        projectionDays = 180;
        break;
      case '365d':
        projectionDays = 365;
        break;
      default:
        projectionDays = 30;
    }

    // Get current effective rate
    const rateResult = await getEffectiveRate(
      request.projectionDate,
      matterData.firmId
    );

    if (!rateResult.success || !rateResult.data) {
      return {
        success: false,
        error: 'Rate not found for projection date',
        code: 'not-found',
      };
    }

    const effectiveRate = rateResult.data.rate;

    // Calculate projected interest
    const result = await calculateSimpleInterest(
      principal,
      effectiveRate,
      projectionDays
    );

    const projectedTotalOwed = principal + result.interest;

    return {
      success: true,
      data: {
        projectedInterest: result.interest,
        projectedTotalOwed,
        effectiveRate,
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

// ============================================
// Summary Operations
// ============================================

/**
 * Get interest summary for a firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (startDate, endDate)
 * @returns Operation result with firm interest summary
 */
export async function getFirmInterestSummary(
  firmId: string,
  options?: {
    startDate?: number;
    endDate?: number;
  }
): Promise<OperationResult<{
    totalPrincipal: number;
    totalInterestAccrued: number;
    totalInterestPaid: number;
    totalOwed: number;
    effectiveRate: number;
    matterCount: number;
  }>> {
  try {
    // Query all matters for firm
    const mattersResult = await queryDocuments<FirestoreMatterData>(
      COLLECTION_NAMES.MATTERS,
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
            value: 'Active',
          },
        ],
      }
    );

    if (!mattersResult.success || !mattersResult.data) {
      return {
        success: false,
        error: 'Failed to fetch matters',
        code: 'unknown',
      };
    }

    // Get effective rate (current)
    const rateResult = await getEffectiveRate(Date.now(), firmId);

    if (!rateResult.success || !rateResult.data) {
      return {
        success: false,
        error: 'Failed to get effective rate',
        code: 'unknown',
      };
    }

    // Calculate totals
    const matters = mattersResult.data;
    const totalPrincipal = matters.reduce((sum, matter) => sum + (matter.data.principalBalance || 0), 0);
    const totalInterestAccrued = matters.reduce((sum, matter) => sum + (matter.data.interestAccrued || 0), 0);
    const totalInterestPaid = matters.reduce((sum, matter) => sum + (matter.data.interestPaid || 0), 0);
    const totalOwed = totalPrincipal + totalInterestAccrued - totalInterestPaid;

    return {
      success: true,
      data: {
        totalPrincipal,
        totalInterestAccrued,
        totalInterestPaid,
        totalOwed,
        effectiveRate: rateResult.data.rate,
        matterCount: matters.length,
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
 * Get interest summary by matter type
 *
 * @param firmId - Firm ID
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @returns Operation result with interest summary by type
 */
export async function getInterestSummaryByMatterType(
  firmId: string,
  startDate: number,
  endDate: number
): Promise<OperationResult<Record<string, {
    totalPrincipal: number;
    totalInterest: number;
    matterCount: number;
  }>>> {
  try {
    // Query all active matters for firm
    const mattersResult = await queryDocuments<FirestoreMatterData>(
      COLLECTION_NAMES.MATTERS,
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
            value: 'Active',
          },
        ],
      }
    );

    if (!mattersResult.success || !mattersResult.data) {
      return {
        success: false,
        error: 'Failed to fetch matters',
        code: 'unknown',
      };
    }

    const matters = mattersResult.data;

    // Get effective rate
    const rateResult = await getEffectiveRate(startDate, firmId);

    if (!rateResult.success || !rateResult.data) {
      return {
        success: false,
        error: 'Failed to get effective rate',
        code: 'unknown',
      };
    }

    const effectiveRate = rateResult.data.rate;

    // Group by matter type
    const summaryByType: Record<string, {
      totalPrincipal: number;
      totalInterest: number;
      matterCount: number;
    }> = {};

    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    matters.forEach((matter) => {
      const matterType = matter.data.matterType || 'Other';

      if (!summaryByType[matterType]) {
        summaryByType[matterType] = {
          totalPrincipal: 0,
          totalInterest: 0,
          matterCount: 0,
        };
      }

      summaryByType[matterType].totalPrincipal += (matter.data.principalBalance || 0);
      summaryByType[matterType].totalInterest += (matter.data.interestAccrued || 0);
      summaryByType[matterType].matterCount++;
    });

    // Calculate interest for each type
    Object.keys(summaryByType).forEach((matterType) => {
      const summary = summaryByType[matterType];
      summary.totalInterest = summary.totalPrincipal * (effectiveRate / 365) * (days / 365);
    });

    return {
      success: true,
      data: summaryByType,
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
// Recalculation Operations
// ============================================

/**
 * Batch recalculate interest for matters
 *
 * @param request - Batch recalculation request
 * @returns Operation result
 */
export async function batchRecalculateInterest(
  request: BatchInterestRecalculationRequest
): Promise<OperationResult<{
    recalculatedCount: number;
    errorCount: number;
  }>> {
  try {
    let recalculatedCount = 0;
    let errorCount = 0;

    const mattersResult = await queryDocuments<FirestoreMatterData>(
      COLLECTION_NAMES.MATTERS,
      {
        where: [
          {
            field: 'status',
            operator: '==',
            value: 'Active',
          },
        ],
        limit: 100, // Limit to prevent timeout
      }
    );

    if (!mattersResult.success || !mattersResult.data) {
      return {
        success: false,
        error: 'Failed to fetch matters',
        code: 'unknown',
      };
    }

    const matters = mattersResult.data;

    for (const matter of matters) {
      try {
        const principal = matter.data.principalBalance || 0;

        const summary = await calculateMatterInterest({
          matterId: matter.id,
          principal,
          startDate: request.startDate || Date.now() - (30 * 24 * 60 * 60 * 1000), // Last 30 days
          endDate: request.endDate || Date.now(),
          calculationType: 'compound',
          compoundingPeriod: 'daily',
        });

        if (summary.success && summary.data) {
          recalculatedCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    return {
      success: true,
      data: {
        recalculatedCount,
        errorCount,
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
