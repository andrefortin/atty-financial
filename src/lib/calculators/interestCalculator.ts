/**
 * Interest Calculator
 *
 * Tiered interest calculation with support for various
 * day count conventions, compounding periods, and calculation types.
 *
 * @module lib/calculators/interestCalculator
 */

import {
  getEffectiveRate,
  type RateLookupResult,
} from '@/services/firebase/rateEntries.service';
import type { FirestoreRateEntry } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Interest calculation type
 */
export type InterestCalculationType = 'simple' | 'tiered' | 'tier1' | 'tier2' | 'compound' | 'waterfall';

/**
 * Compounding period
 */
export type CompoundingPeriod = 'daily' | 'monthly' | 'annual';

/**
 * Interest calculation result
 */
export interface InterestCalculationResult {
  principal: number;
  interest: number;
  rate: number;
  days: number;
  startDate: number;
  endDate: number;
  calculationType: InterestCalculationType;
  compoundingPeriod?: CompoundingPeriod;
}

/**
 * Tiered interest calculation result
 */
export interface TieredInterestResult {
  tier1Interest: number;
  tier2Interest: number;
  totalInterest: number;
  principal: number;
  days: number;
  startDate: number;
  endDate: number;
  rate: number;
}

/**
 * Compound interest calculation result
 */
export interface CompoundInterestResult {
  principal: number;
  interest: number;
  principalBalance: number;
  days: number;
  startDate: number;
  endDate: number;
  rate: number;
  compoundingPeriod: CompoundingPeriod;
}

/**
 * Waterfall allocation result
 */
export interface WaterfallAllocationResult {
  tier1Interest: number;
  tier2Interest: number;
  carryForward: number;
  allocated: number;
  startDate: number;
  endDate: number;
  days: number;
}

/**
 * Interest calculation options
 */
export interface InterestCalculationOptions {
  /**
   * Firm ID for rate lookup
   */
  firmId?: string;

  /**
   * Whether to use firm-specific rate modifiers
   */
  useFirmModifiers?: boolean;
}

/**
 * Day count calculator options
 */
export interface DayCountOptions {
  /**
   * Whether to include end date in count (default: true)
   */
  includeEndDate?: boolean;

  /**
   * Whether to exclude weekends from count
   */
  excludeWeekends?: boolean;

  /**
   * Holidays to exclude from count
   */
  holidays?: Array<{ date: Date; name: string }>;

  /**
   * Business days (0 = Sunday, 1 = Monday, etc.)
   */
  businessDays?: {
    startDay: number;
    endDay: number;
  };
}

// ============================================
// Constants
// ============================================

const DAYS_IN_YEAR = 365;
const DAYS_IN_MONTH = 30.41666666666666667; // Average days per month

// ============================================
// Helper Functions
// ============================================

/**
 * Convert percentage to decimal
 */
function percentToDecimal(percent: number): number {
  return percent / 100;
}

/**
 * Convert decimal to percentage
 */
function decimalToPercent(decimal: number): number {
  return decimal * 100;
}

/**
 * Round to specified decimal places
 */
function roundTo(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ============================================
// Simple Interest Calculation
// ============================================

/**
 * Calculate simple interest using I = P × R × T
 *
 * @param principal - Principal amount
 * @param rate - Annual interest rate (e.g., 0.11 for 11%)
 * @param days - Number of days
 * @returns Simple interest
 */
export function calculateSimpleInterest(
  principal: number,
  rate: number,
  days: number
): InterestCalculationResult {
  const interest = principal * (rate / 365) * (days / 365);

  return {
    principal,
    interest: roundTo(interest, 2),
    rate,
    days,
    startDate: 0,
    endDate: 0,
    calculationType: 'simple',
  };
}

/**
 * Calculate simple interest between two dates
 *
 * @param principal - Principal amount
 * @param rate - Annual interest rate
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Calculation options
 * @returns Simple interest calculation result
 */
export async function calculateSimpleInterestBetweenDates(
  principal: number,
  startDate: number,
  endDate: number,
  options?: InterestCalculationOptions
): Promise<InterestCalculationResult> {
  // Calculate days
  const days = (endDate - startDate) / (1000 * 60 * 60 * 24);

  // Get effective rate
  const rateResult: RateLookupResult = await getEffectiveRate(startDate, options?.firmId);
  const rate = options?.useFirmModifiers !== false
    ? rateResult.totalRate
    : rateResult.rate;

  return {
    principal,
    interest: roundTo(principal * (rate / 365) * (days / 365), 2),
    rate,
    days,
    startDate,
    endDate,
    calculationType: 'simple',
  };
}

// ============================================
// Compound Interest Calculation
// ============================================

/**
 * Calculate compound interest using A = P(1 + r/n)^(nt) - P
 *
 * @param principal - Principal amount
 * @param rate - Annual interest rate
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param compoundingPeriod - Compounding period (daily, monthly, annual)
 * @param options - Calculation options
 * @returns Compound interest calculation result
 */
export async function calculateCompoundInterest(
  principal: number,
  startDate: number,
  endDate: number,
  compoundingPeriod: CompoundingPeriod = 'daily',
  options?: InterestCalculationOptions
): Promise<CompoundInterestResult> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate periods based on compounding type
  let n: number;
  let r: number;

  switch (compoundingPeriod) {
    case 'daily':
      n = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      r = (await getEffectiveRate(startDate, options?.firmId)).rate / 365;
      break;

    case 'monthly':
      n = Math.floor((end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()));
      r = (await getEffectiveRate(startDate, options?.firmId)).rate / 12;
      break;

    case 'annual':
      n = end.getFullYear() - start.getFullYear();
      r = await getEffectiveRate(startDate, options?.firmId).then((result) => result.rate);
      break;

    default:
      throw new Error(`Unknown compounding period: ${compoundingPeriod}`);
  }

  // Calculate compound interest
  const amount = principal * Math.pow(1 + r, n) - principal;

  return {
    principal,
    interest: roundTo(amount, 2),
    principalBalance: roundTo(principal + amount, 2),
    days: n,
    startDate,
    endDate,
    rate: (await getEffectiveRate(startDate, options?.firmId)).rate,
    compoundingPeriod,
  };
}

/**
 * Calculate compound interest with specified number of periods
 *
 * @param principal - Principal amount
 * @param rate - Annual interest rate
 * @param periods - Number of compounding periods
 * @param compoundingPeriod - Compounding period type
 * @param options - Calculation options
 * @returns Compound interest calculation result
 */
export async function calculateCompoundInterestByPeriods(
  principal: number,
  rate: number,
  periods: number,
  compoundingPeriod: CompoundingPeriod = 'daily',
  options?: InterestCalculationOptions
): Promise<CompoundInterestResult> {
  // Get effective rate
  const effectiveRate = options?.useFirmModifiers !== false
    ? (await getEffectiveRate(Date.now(), options?.firmId)).totalRate
    : rate;

  // Convert annual rate to period rate
  let periodRate: number;

  switch (compoundingPeriod) {
    case 'daily':
      periodRate = effectiveRate / 365;
      break;

    case 'monthly':
      periodRate = effectiveRate / 12;
      break;

    case 'annual':
      periodRate = effectiveRate;
      break;

    default:
      throw new Error(`Unknown compounding period: ${compoundingPeriod}`);
  }

  // Calculate compound interest
  const amount = principal * Math.pow(1 + periodRate, periods) - principal;

  return {
    principal,
    interest: roundTo(amount, 2),
    principalBalance: roundTo(principal + amount, 2),
    days: periods,
    startDate: 0,
    endDate: 0,
    rate: effectiveRate,
    compoundingPeriod,
  };
}

// ============================================
// Tiered Interest Calculation
// ============================================

/**
 * Calculate tiered interest (two-tier allocation)
 *
 * Tier 1: Matters with $0 principal balance get highest priority
 * Tier 2: Remaining interest allocated pro rata among matters with principal
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier1Balances - Principal balance for tier 1 matters
 * @param tier2Matters - Matters with principal balance > $0
 * @param tier2Balances - Principal balance for tier 2 matters
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Calculation options
 * @returns Tiered interest calculation result
 */
export async function calculateTieredInterest(
  tier1Matters: Array<{ id: string }>,
  tier1Balances: number[],
  tier2Matters: Array<{ id: string }>,
  tier2Balances: number[],
  startDate: number,
  endDate: number,
  options?: InterestCalculationOptions
): Promise<TieredInterestResult> {
  // Calculate total principal for each tier
  const tier1TotalPrincipal = tier1Balances.reduce((sum, balance) => sum + balance, 0);
  const tier2TotalPrincipal = tier2Balances.reduce((sum, balance) => sum + balance, 0);
  const totalPrincipal = tier1TotalPrincipal + tier2TotalPrincipal;

  // Get average effective rate for the period
  const effectiveRate = options?.useFirmModifiers !== false
    ? (await getEffectiveRate(startDate, options?.firmId)).totalRate
    : (await getEffectiveRate(startDate, options?.firmId)).rate;

  const days = (endDate - startDate) / (1000 * 60 * 60 * 24);

  // Calculate total interest
  const totalInterest = totalPrincipal * (effectiveRate / 365) * (days / 365);

  // Calculate tier 1 interest (100% allocation)
  const tier1Interest = totalInterest * percentToDecimal(tier1TotalPrincipal / totalPrincipal);

  // Calculate tier 2 interest (remaining)
  const tier2Interest = totalInterest - tier1Interest;

  return {
    tier1Interest: roundTo(tier1Interest, 2),
    tier2Interest: roundTo(tier2Interest, 2),
    totalInterest: roundTo(totalInterest, 2),
    principal: totalPrincipal,
    days,
    startDate,
    endDate,
    rate: effectiveRate,
    calculationType: 'tiered',
  };
}

/**
 * Calculate tiered interest with rate changes
 *
 * Handles multiple rate changes within the period
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier1Balances - Principal balance for tier 1 matters
 * @param tier2Matters - Matters with principal balance > $0
 * @param tier2Balances - Principal balance for tier 2 matters
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Calculation options
 * @returns Tiered interest calculation result
 */
export async function calculateTieredInterestWithRateChanges(
  tier1Matters: Array<{ id: string }>,
  tier1Balances: number[],
  tier2Matters: Array<{ id: string }>,
  tier2Balances: number[],
  startDate: number,
  endDate: number,
  options?: InterestCalculationOptions
): Promise<TieredInterestResult> {
  // Get rate changes for the period
  const { getEffectiveRate } = await import('@/services/firebase/rateEntries.service');

  // Calculate daily interest for each day in the period
  const dayCount = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  const oneDay = 1000 * 60 * 60 * 24;

  let tier1TotalInterest = 0;
  let tier2TotalInterest = 0;
  let totalPrincipal = tier1Balances.reduce((sum, balance) => sum + balance, 0) +
                    tier2Balances.reduce((sum, balance) => sum + balance, 0);

  for (let day = 0; day < dayCount; day++) {
    const currentDate = startDate + day * oneDay;
    const rateResult = await getEffectiveRate(currentDate, options?.firmId);
    const effectiveRate = options?.useFirmModifiers !== false
      ? rateResult.totalRate
      : rateResult.rate;
    const dailyRate = effectiveRate / 365;

    // Calculate daily interest for each tier
    const tier1DailyInterest = tier1Balances.reduce((sum, balance) =>
      sum + (balance * dailyRate), 0
    );
    const tier2DailyInterest = tier2Balances.reduce((sum, balance) =>
      sum + (balance * dailyRate), 0
    );
    const totalDailyInterest = tier1DailyInterest + tier2DailyInterest;

    tier1TotalInterest += tier1DailyInterest;
    tier2TotalInterest += tier2DailyInterest;
  }

  return {
    tier1Interest: roundTo(tier1TotalInterest, 2),
    tier2Interest: roundTo(tier2TotalInterest, 2),
    totalInterest: roundTo(tier1TotalInterest + tier2TotalInterest, 2),
    principal: totalPrincipal,
    days: dayCount,
    startDate,
    endDate,
    rate: (await getEffectiveRate(startDate, options?.firmId)).rate,
    calculationType: 'tiered',
  };
}

// ============================================
// Waterfall Interest Allocation
// ============================================

/**
 * Calculate waterfall interest allocation
 *
 * Allocates interest using tiered approach:
 * - Tier 1: Matters with $0 principal balance get full allocation
 * - Tier 2: Matters with principal > $0 get pro rata allocation
 * - Carry forward: Any unallocated interest carries to next period
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier1Balances - Principal balance for tier 1 matters
 * @param tier2Matters - Matters with principal balance > $0
 * @param tier2Balances - Principal balance for tier 2 matters
 * @param totalInterest - Total interest to allocate
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Calculation options
 * @returns Waterfall allocation result
 */
export async function calculateWaterfallAllocation(
  tier1Matters: Array<{ id: string }>,
  tier1Balances: number[],
  tier2Matters: Array<{ id: string }>,
  tier2Balances: number[],
  totalInterest: number,
  startDate: number,
  endDate: number,
  options?: InterestCalculationOptions
): Promise<WaterfallAllocationResult> {
  // Calculate tier 1 allocation (full)
  const tier1TotalPrincipal = tier1Balances.reduce((sum, balance) => sum + balance, 0);
  const tier1Allocation = totalInterest * percentToDecimal(tier1TotalPrincipal /
    (tier1TotalPrincipal + tier2Balances.reduce((sum, balance) => sum + balance, 0)));

  // Calculate tier 2 allocation (pro rata by principal)
  const tier2TotalPrincipal = tier2Balances.reduce((sum, balance) => sum + balance, 0);
  const tier2Allocation = totalInterest - tier1Allocation;

  // Check for carry forward
  const allocated = tier1Allocation + tier2Allocation;
  const carryForward = totalInterest - allocated;

  return {
    tier1Interest: roundTo(tier1Allocation, 2),
    tier2Interest: roundTo(tier2Allocation, 2),
    carryForward: roundTo(carryForward, 2),
    allocated: roundTo(allocated, 2),
    startDate,
    endDate,
    days: Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)),
  };
}

/**
 * Calculate daily interest for a matter
 *
 * @param matterId - Matter ID
 * @param principal - Principal balance
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Calculation options
 * @returns Compound interest result
 */
export async function calculateDailyInterestForMatter(
  matterId: string,
  principal: number,
  startDate: number,
  endDate: number,
  options?: InterestCalculationOptions
): Promise<CompoundInterestResult> {
  return calculateCompoundInterest(
    principal,
    startDate,
    endDate,
    'daily',
    options
  );
}

// ============================================
// Interest Projection
// ============================================

/**
 * Calculate projected interest for a future date
 *
 * @param principal - Principal amount
 * @param rate - Annual interest rate
 * @param startDate - Start date (timestamp)
 * @param projectionDate - Projection date (timestamp)
 * @param compoundingPeriod - Compounding period (default: daily)
 * @param options - Calculation options
 * @returns Interest projection result
 */
export async function projectInterest(
  principal: number,
  rate: number,
  startDate: number,
  projectionDate: number,
  compoundingPeriod: CompoundingPeriod = 'daily',
  options?: InterestCalculationOptions
): Promise<InterestCalculationResult> {
  const effectiveRate = options?.useFirmModifiers !== false
    ? (await getEffectiveRate(startDate, options?.firmId)).totalRate
    : rate;

  const days = (projectionDate - startDate) / (1000 * 60 * 60 * 24);
  const interest = principal * (effectiveRate / 365) * (days / 365);

  return {
    principal,
    interest: roundTo(interest, 2),
    rate: effectiveRate,
    days,
    startDate,
    endDate: projectionDate,
    calculationType: 'compound',
  };
}

// ============================================
// Interest Summary Calculations
// ============================================

/**
 * Calculate total interest for a period across all matters
 *
 * @param matterBalances - Array of matter principal balances
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Calculation options
 * @returns Total interest summary
 */
export async function calculateTotalInterest(
  matterBalances: number[],
  startDate: number,
  endDate: number,
  options?: InterestCalculationOptions
): Promise<number> {
  // Get effective rate for the period (use average)
  const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const effectiveRate = options?.useFirmModifiers !== false
    ? (await getEffectiveRate(startDate, options?.firmId)).totalRate
    : (await getEffectiveRate(startDate, options?.firmId)).rate;

  const totalPrincipal = matterBalances.reduce((sum, balance) => sum + balance, 0);
  const totalInterest = totalPrincipal * (effectiveRate / 365) * (days / 365);

  return roundTo(totalInterest, 2);
}

/**
 * Calculate interest summary by matter type
 *
 * @param matters - Array of matters with principal balances
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param options - Calculation options
 * @returns Object with interest by matter type
 */
export async function calculateInterestByMatterType(
  matters: Array<{ id: string; type: string; principal: number }>,
  startDate: number,
  endDate: number,
  options?: InterestCalculationOptions
): Promise<Record<string, number>> {
  const effectiveRate = options?.useFirmModifiers !== false
    ? (await getEffectiveRate(startDate, options?.firmId)).totalRate
    : (await getEffectiveRate(startDate, options?.firmId)).rate;

  const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
  const interestRate = effectiveRate / 365;

  const summary: Record<string, number> = {};

  // Group by matter type
  const grouped = matters.reduce((acc, matter) => {
    if (!acc[matter.type]) {
      acc[matter.type] = { totalPrincipal: 0, count: 0 };
    }
    acc[matter.type].totalPrincipal += matter.principal;
    acc[matter.type].count++;
    return acc;
  }, {} as Record<string, { totalPrincipal: number; count: number }>);

  // Calculate interest for each type
  for (const [type, data] of Object.entries(grouped)) {
    summary[type] = roundTo(data.totalPrincipal * interestRate * (days / 365), 2);
  }

  return summary;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate interest calculation inputs
 *
 * @param principal - Principal amount
 * @param rate - Annual interest rate
 * @param days - Number of days
 * @returns Validation result with error message
 */
export function validateInterestCalculation(
  principal: number,
  rate: number,
  days: number
): { valid: boolean; error?: string } {
  if (principal < 0) {
    return { valid: false, error: 'Principal cannot be negative' };
  }

  if (principal === 0) {
    return { valid: false, error: 'Principal must be greater than zero' };
  }

  if (rate < 0) {
    return { valid: false, error: 'Interest rate cannot be negative' };
  }

  if (rate > 1) {
    return { valid: false, error: 'Interest rate cannot exceed 100%' };
  }

  if (days < 0) {
    return { valid: false, error: 'Number of days cannot be negative' };
  }

  if (days > 366) { // Allow for leap year + 1
    return { valid: false, error: 'Number of days cannot exceed 366' };
  }

  return { valid: true };
}

/**
 * Validate tiered interest calculation inputs
 *
 * @param tier1Matters - Matters with $0 principal balance
 * @param tier1Balances - Principal balance for tier 1 matters
 * @param tier2Matters - Matters with principal balance > $0
 * @param tier2Balances - Principal balance for tier 2 matters
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param totalInterest - Total interest to allocate
 * @returns Validation result with error message
 */
export function validateTieredInterestCalculation(
  tier1Matters: unknown[],
  tier1Balances: unknown[],
  tier2Matters: unknown[],
  tier2Balances: unknown[],
  startDate: number,
  endDate: number,
  totalInterest: number
): { valid: boolean; error?: string } {
  if (!Array.isArray(tier1Matters) || tier1Matters.length === 0) {
    return { valid: false, error: 'Tier 1 matters must be a non-empty array' };
  }

  if (!Array.isArray(tier1Balances) || tier1Balances.length !== tier1Matters.length) {
    return { valid: false, error: 'Tier 1 balances must match matters array' };
  }

  if (!Array.isArray(tier2Matters) || tier2Matters.length === 0) {
    return { valid: false, error: 'Tier 2 matters must be a non-empty array' };
  }

  if (!Array.isArray(tier2Balances) || tier2Balances.length !== tier2Matters.length) {
    return { valid: false, error: 'Tier 2 balances must match matters array' };
  }

  const totalTier1 = tier1Balances.reduce((sum, balance) => sum + (balance as number), 0);
  const totalTier2 = tier2Balances.reduce((sum, balance) => sum + (balance as number), 0);

  if (totalTier1 < 0) {
    return { valid: false, error: 'Tier 1 principal balances cannot be negative' };
  }

  if (totalTier2 < 0) {
    return { valid: false, error: 'Tier 2 principal balances cannot be negative' };
  }

  if (startDate >= endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  if (totalInterest < 0) {
    return { valid: false, error: 'Total interest cannot be negative' };
  }

  return { valid: true };
}

/**
 * Validate compound interest calculation inputs
 *
 * @param principal - Principal amount
 * @param startDate - Start date (timestamp)
 * @param endDate - End date (timestamp)
 * @param compoundingPeriod - Compounding period
 * @returns Validation result with error message
 */
export function validateCompoundInterestCalculation(
  principal: number,
  startDate: number,
  endDate: number,
  compoundingPeriod: CompoundingPeriod
): { valid: boolean; error?: string } {
  if (principal < 0) {
    return { valid: false, error: 'Principal cannot be negative' };
  }

  if (principal === 0) {
    return { valid: false, error: 'Principal must be greater than zero' };
  }

  if (startDate >= endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  const validPeriods = ['daily', 'monthly', 'annual'];
  if (!validPeriods.includes(compoundingPeriod)) {
    return { valid: false, error: `Invalid compounding period: ${compoundingPeriod}` };
  }

  return { valid: true };
}
