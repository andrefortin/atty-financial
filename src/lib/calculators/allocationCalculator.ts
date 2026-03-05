/**
 * Allocation Calculator
 *
 * Implements tiered interest allocation (Tier 1 + Tier 2).
 * Tier 1: 100% allocation to matters with $0 principal balance
 * Tier 2: Pro rata allocation among matters with principal > $0
 *
 * @module lib/calculators/allocationCalculator
 */

// ============================================
// Types
// ============================================

/**
 * Tier 1 matter
 */
export interface Tier1Matter {
  matterId: string;
  principalBalance: number;
  interestOwed: number;
}

/**
 * Tier 2 matter
 */
export interface Tier2Matter {
  matterId: string;
  principalBalance: number;
}

/**
 * Tiered allocation result
 */
export interface TieredAllocationResult {
  tier1Interest: number;
  tier2Interest: number;
  tier1Allocations: Array<{
    matterId: string;
    allocatedInterest: number;
  }>;
  tier2Allocations: Array<{
    matterId: string;
    allocatedInterest: number;
  }>;
  carryForward: number;
  totalAllocated: number;
}

/**
 * Matter allocation summary
 */
export interface MatterAllocationSummary {
  matterId: string;
  tier: 'Tier1' | 'Tier2';
  allocatedInterest: number;
  principalBalance: number;
  newInterestOwed: number;
}

// ============================================
// Constants
// ============================================

const MIN_INTEREST = 0; // Minimum interest to allocate
const ROUND_PRECISION = 2; // Round to 2 decimal places

// ============================================
// Helper Functions
// ============================================

/**
 * Round to specified precision
 */
function roundTo(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calculate tier 1 principal
 */
function calculateTier1Principal(
  tier1Matters: Tier1Matter[]
): number {
  return tier1Matters.reduce(
    (sum, matter) => sum + matter.principalBalance,
    0
  );
}

/**
 * Calculate tier 2 principal
 */
function calculateTier2Principal(
  tier2Matters: Tier2Matter[]
): number {
  return tier2Matters.reduce(
    (sum, matter) => sum + matter.principalBalance,
    0
  );
}

/**
 * Calculate total principal
 */
function calculateTotalPrincipal(
  tier1Matters: Tier1Matter[],
  tier2Matters: Tier2Matter[]
): number {
  return (
    calculateTier1Principal(tier1Matters) +
    calculateTier2Principal(tier2Matters)
  );
}

// ============================================
// Tier 1 Allocation
// ============================================

/**
 * Allocate interest to tier 1 matters
 *
 * Tier 1: Matters with $0 principal balance get 100% allocation
 * Priority: Highest interest owed first
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier1Interest - Total interest to allocate to tier 1
 * @returns Tier 1 allocation result
 */
export function allocateTier1Interest(
  tier1Matters: Tier1Matter[],
  tier1Interest: number
): TieredAllocationResult['tier1Allocations'] {
  // Calculate tier 1 principal
  const tier1Principal = calculateTier1Principal(tier1Matters);

  // Validate
  if (tier1Principal === 0) {
    return [];
  }

  // Check if interest is sufficient
  const tier1InterestOwed = tier1Matters.reduce(
    (sum, matter) => sum + matter.interestOwed,
    0
  );

  if (tier1Interest < tier1InterestOwed) {
    // Not enough interest to cover tier 1
    // Allocate proportionally
    return tier1Matters.map((matter) => ({
      matterId: matter.matterId,
      allocatedInterest: roundTo(
        (matter.interestOwed / tier1InterestOwed) * tier1Interest,
        ROUND_PRECISION
      ),
    }));
  }

  // Full allocation available
  // Priority: Highest interest owed first
  const sortedMatters = [...tier1Matters].sort((a, b) =>
    b.interestOwed - a.interestOwed
  );

  let remainingInterest = tier1Interest;
  const allocations: Array<{
    matterId: string;
    allocatedInterest: number;
  }> = [];

  for (const matter of sortedMatters) {
    if (matter.interestOwed > MIN_INTEREST && remainingInterest >= MIN_INTEREST) {
      const allocation = Math.min(matter.interestOwed, remainingInterest);
      allocations.push({
        matterId: matter.matterId,
        allocatedInterest: roundTo(allocation, ROUND_PRECISION),
      });
      remainingInterest -= allocation;
    }
  }

  return allocations;
}

// ============================================
// Tier 2 Allocation
// ============================================

/**
 * Allocate interest to tier 2 matters
 *
 * Tier 2: Matters with principal > $0 get pro rata allocation
 * Based on principal balance percentage of total tier 2 principal
 *
 * @param tier2Matters - Matters with principal > $0
 * @param tier2Interest - Total interest to allocate to tier 2
 * @returns Tier 2 allocation result
 */
export function allocateTier2Interest(
  tier2Matters: Tier2Matter[],
  tier2Interest: number
): TieredAllocationResult['tier2Allocations'] {
  // Calculate tier 2 principal
  const tier2Principal = calculateTier2Principal(tier2Matters);

  // Validate
  if (tier2Principal === 0) {
    return [];
  }

  // Calculate interest allocation per matter (pro rata)
  const allocations: Array<{
    matterId: string;
    allocatedInterest: number;
  }> = [];

  for (const matter of tier2Matters) {
    const principalShare = matter.principalBalance / tier2Principal;
    const allocation = principalShare * tier2Interest;
    allocations.push({
      matterId: matter.matterId,
      allocatedInterest: roundTo(allocation, ROUND_PRECISION),
    });
  }

  return allocations;
}

// ============================================
// Tiered Interest Allocation
// ============================================

/**
 * Allocate interest across tier 1 and tier 2 matters
 *
 * Tier 1: 100% allocation to $0 principal balance matters
 * Tier 2: Pro rata allocation to > $0 principal balance matters
 * Carry forward: Any unallocated interest carries to next period
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier2Matters - Matters with principal > $0
 * @param totalInterest - Total interest to allocate
 * @param options - Allocation options
 * @returns Tiered allocation result
 */
export function calculateTieredAllocation(
  tier1Matters: Tier1Matter[],
  tier2Matters: Tier2Matter[],
  totalInterest: number,
  options?: {
    /**
     * Whether to allow carry forward (default: true)
     */
    allowCarryForward?: boolean;

    /**
     * Minimum interest to allocate (default: 0)
     */
    minInterest?: number;
  }
): TieredAllocationResult {
  const allowCarryForward = options?.allowCarryForward !== false;
  const minInterest = options?.minInterest ?? MIN_INTEREST;

  // Validate inputs
  if (totalInterest < minInterest) {
    return {
      tier1Interest: 0,
      tier2Interest: 0,
      tier1Allocations: [],
      tier2Allocations: [],
      carryForward: 0,
      totalAllocated: 0,
    };
  }

  // Calculate tier 1 allocation
  const tier1Allocations = allocateTier1Interest(
    tier1Matters,
    totalInterest
  );

  const tier1InterestAllocated = tier1Allocations.reduce(
    (sum, allocation) => sum + allocation.allocatedInterest,
    0
  );

  // Calculate remaining interest for tier 2
  const remainingInterest = totalInterest - tier1InterestAllocated;

  // Validate remaining interest
  if (remainingInterest < 0) {
    return {
      tier1Interest: tier1InterestAllocated,
      tier2Interest: 0,
      tier1Allocations,
      tier2Allocations: [],
      carryForward: 0,
      totalAllocated: tier1InterestAllocated,
    };
  }

  // Calculate tier 2 allocation
  const tier2Allocations = allocateTier2Interest(
    tier2Matters,
    remainingInterest
  );

  const tier2InterestAllocated = tier2Allocations.reduce(
    (sum, allocation) => sum + allocation.allocatedInterest,
    0
  );

  // Calculate carry forward
  let carryForward = 0;
  if (allowCarryForward) {
    carryForward = totalInterest - (tier1InterestAllocated + tier2InterestAllocated);
    // Round to 2 decimal places
    carryForward = roundTo(carryForward, ROUND_PRECISION);
  }

  const totalAllocated = tier1InterestAllocated + tier2InterestAllocated;

  return {
    tier1Interest: roundTo(tier1InterestAllocated, ROUND_PRECISION),
    tier2Interest: roundTo(tier2InterestAllocated, ROUND_PRECISION),
    tier1Allocations,
    tier2Allocations,
    carryForward: carryForward > 0 ? carryForward : 0,
    totalAllocated: roundTo(totalAllocated, ROUND_PRECISION),
  };
}

// ============================================
// Waterfall Allocation
// ============================================

/**
 * Calculate waterfall allocation for multiple periods
 *
 * Handles rate changes and carry-forward across periods
 *
 * @param tier1Matters - Matters with $0 principal balance (by period)
 * @param tier2Matters - Matters with principal > $0 (by period)
 * @param totalInterest - Total interest to allocate for the period
 * @param previousCarryForward - Carry forward from previous period
 * @returns Tiered allocation result
 */
export function calculateWaterfallAllocation(
  tier1Matters: Tier1Matter[],
  tier2Matters: Tier2Matter[],
  totalInterest: number,
  previousCarryForward: number = 0
): TieredAllocationResult {
  // Validate inputs
  if (totalInterest <= 0) {
    return {
      tier1Interest: 0,
      tier2Interest: 0,
      tier1Allocations: [],
      tier2Allocations: [],
      carryForward: 0,
      totalAllocated: 0,
    };
  }

  // Adjust total interest with carry forward
  const adjustedTotalInterest = totalInterest + previousCarryForward;

  // Calculate tiered allocation
  const result = calculateTieredAllocation(
    tier1Matters,
    tier2Matters,
    adjustedTotalInterest
  );

  // Adjust carry forward to exclude previous carry forward
  result.carryForward -= previousCarryForward;

  return result;
}

// ============================================
// Matter Allocation Summary
// ============================================

/**
 * Generate allocation summary by matter
 *
 * @param tieredResult - Tiered allocation result
 * @returns Array of matter allocation summaries
 */
export function generateMatterAllocationSummaries(
  tieredResult: TieredAllocationResult
): MatterAllocationSummary[] {
  const summaries: MatterAllocationSummary[] = [];

  // Add tier 1 allocations
  tieredResult.tier1Allocations.forEach((allocation) => {
    summaries.push({
      matterId: allocation.matterId,
      tier: 'Tier1',
      allocatedInterest: allocation.allocatedInterest,
      principalBalance: 0, // Tier 1 has $0 principal
      newInterestOwed: allocation.allocatedInterest,
    });
  });

  // Add tier 2 allocations
  tieredResult.tier2Allocations.forEach((allocation) => {
    summaries.push({
      matterId: allocation.matterId,
      tier: 'Tier2',
      allocatedInterest: allocation.allocatedInterest,
      principalBalance: 0, // Will be filled from matter data
      newInterestOwed: allocation.allocatedInterest,
    });
  });

  return summaries;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate tiered allocation input
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier2Matters - Matters with principal > $0
 * @param totalInterest - Total interest to allocate
 * @returns Validation result
 */
export function validateTieredAllocation(
  tier1Matters: Tier1Matter[],
  tier2Matters: Tier2Matter[],
  totalInterest: number
): { valid: boolean; error?: string } {
  if (!Array.isArray(tier1Matters)) {
    return { valid: false, error: 'Tier 1 matters must be an array' };
  }

  if (!Array.isArray(tier2Matters)) {
    return { valid: false, error: 'Tier 2 matters must be an array' };
  }

  if (tier1Matters.some((m) => m.principalBalance < 0)) {
    return { valid: false, error: 'Tier 1 matters cannot have negative principal balance' };
  }

  if (tier1Matters.some((m) => m.principalBalance !== 0)) {
    return { valid: false, error: 'Tier 1 matters must have $0 principal balance' };
  }

  if (tier2Matters.some((m) => m.principalBalance <= 0)) {
    return { valid: false, error: 'Tier 2 matters must have principal balance > $0' };
  }

  if (totalInterest < 0) {
    return { valid: false, error: 'Total interest cannot be negative' };
  }

  if (tier1Matters.length + tier2Matters.length === 0) {
    return { valid: false, error: 'At least one matter must be provided' };
  }

  return { valid: true };
}

/**
 * Validate tier 1 matter input
 */
export function validateTier1Matter(
  matter: Tier1Matter
): { valid: boolean; error?: string } {
  if (!matter.matterId) {
    return { valid: false, error: 'Matter ID is required' };
  }

  if (typeof matter.matterId !== 'string') {
    return { valid: false, error: 'Matter ID must be a string' };
  }

  if (typeof matter.principalBalance !== 'number') {
    return { valid: false, error: 'Principal balance must be a number' };
  }

  if (matter.principalBalance < 0) {
    return { valid: false, error: 'Principal balance cannot be negative' };
  }

  if (matter.principalBalance !== 0) {
    return { valid: false, error: 'Tier 1 principal balance must be $0' };
  }

  if (typeof matter.interestOwed !== 'number') {
    return { valid: false, error: 'Interest owed must be a number' };
  }

  if (matter.interestOwed < 0) {
    return { valid: false, error: 'Interest owed cannot be negative' };
  }

  return { valid: true };
}

/**
 * Validate tier 2 matter input
 */
export function validateTier2Matter(
  matter: Tier2Matter
): { valid: boolean; error?: string } {
  if (!matter.matterId) {
    return { valid: false, error: 'Matter ID is required' };
  }

  if (typeof matter.matterId !== 'string') {
    return { valid: false, error: 'Matter ID must be a string' };
  }

  if (typeof matter.principalBalance !== 'number') {
    return { valid: false, error: 'Principal balance must be a number' };
  }

  if (matter.principalBalance <= 0) {
    return { valid: false, error: 'Principal balance must be > $0' };
  }

  return { valid: true };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get tier 1 matters from all matters
 *
 * @param matters - All matters
 * @returns Tier 1 matters (principal balance === 0)
 */
export function getTier1Matters(
  matters: Array<{
    id: string;
    data: { principalBalance: number; };
  }>
): Tier1Matter[] {
  return matters
    .filter((m) => m.data.principalBalance === 0)
    .map((m) => ({
      matterId: m.id,
      principalBalance: m.data.principalBalance,
      interestOwed: m.data.totalOwed || 0,
    }));
}

/**
 * Get tier 2 matters from all matters
 *
 * @param matters - All matters
 * @returns Tier 2 matters (principal balance > $0)
 */
export function getTier2Matters(
  matters: Array<{
    id: string;
    data: { principalBalance: number; };
  }>
): Tier2Matter[] {
  return matters
    .filter((m) => m.data.principalBalance > 0)
    .map((m) => ({
      matterId: m.id,
      principalBalance: m.data.principalBalance,
    }));
}

/**
 * Sort tier 1 matters by priority
 *
 * Priority: Highest interest owed first
 *
 * @param tier1Matters - Tier 1 matters
 * @returns Sorted tier 1 matters
 */
export function sortTier1MattersByPriority(
  tier1Matters: Tier1Matter[]
): Tier1Matter[] {
  return [...tier1Matters].sort((a, b) => b.interestOwed - a.interestOwed);
}

/**
 * Calculate tier 1 allocation percentage
 *
 * @param totalTier1Interest - Total interest for tier 1
 * @param tier1Allocations - Tier 1 allocations
 * @returns Allocation percentages by matter
 */
export function calculateTier1AllocationPercentages(
  totalTier1Interest: number,
  tier1Allocations: Array<{
    matterId: string;
    allocatedInterest: number;
  }>
): Map<string, number> {
  const percentages = new Map<string, number>();

  tier1Allocations.forEach((allocation) => {
    const percentage = (allocation.allocatedInterest / totalTier1Interest) * 100;
    percentages.set(allocation.matterId, percentage);
  });

  return percentages;
}

/**
 * Calculate tier 2 allocation percentage
 *
 * @param totalTier2Interest - Total interest for tier 2
 * @param tier2Allocations - Tier 2 allocations
 * @returns Allocation percentages by matter
 */
export function calculateTier2AllocationPercentages(
  totalTier2Interest: number,
  tier2Allocations: Array<{
    matterId: string;
    allocatedInterest: number;
  }>
): Map<string, number> {
  const percentages = new Map<string, number>();

  tier2Allocations.forEach((allocation) => {
    const percentage = (allocation.allocatedInterest / totalTier2Interest) * 100;
    percentages.set(allocation.matterId, percentage);
  });

  return percentages;
}

/**
 * Verify tiered allocation
 *
 * Checks if all interest has been allocated
 *
 * @param tieredResult - Tiered allocation result
 * @returns Verification result
 */
export function verifyTieredAllocation(
  tieredResult: TieredAllocationResult
): { verified: boolean; unallocated: number; } {
  const totalInterest = tieredResult.tier1Interest + tieredResult.tier2Interest;
  const totalAllocated = tieredResult.totalAllocated;

  if (totalAllocated >= totalInterest - 0.01) {
    // Allow for rounding errors (1 cent)
    return { verified: true, unallocated: 0 };
  }

  return {
    verified: false,
    unallocated: roundTo(totalInterest - totalAllocated, ROUND_PRECISION),
  };
}
