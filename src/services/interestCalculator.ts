// Interest Calculator Service for ATTY Financial Application
// Implements ACT/360 day count convention and interest calculations

import { useMatterStore, useTransactionStore, useFirmStore } from '../store';
import { Matter, DailyBalance, InterestAllocation } from '../types';
import {
  getAct360DaysBetween,
  addDays,
} from '../utils/dateUtils';
import { roundToNearestCent, percentageToDecimal } from '../utils/calculations';

// ============================================
// Type Definitions
// ============================================

export interface MatterBalance {
  matterId: string;
  clientName: string;
  principalBalance: number;
  interestAccrued: number;
  interestPaid: number;
  interestOwed: number;
  totalOwed: number;
  asOfDate: Date;
}

export interface DailyInterestResult {
  principal: number;
  annualRate: number;
  dailyInterest: number;
  asOfDate: Date;
}

// ============================================
// Constants
// ============================================

const DAYS_IN_YEAR_ACT360 = 360; // Standard for ACT/360 convention

// ============================================
// Daily Interest Calculation
// ============================================

/**
 * Calculate daily interest for a given principal balance and annual rate
 * Formula: Principal × (Rate / 100) / 360
 *
 * @param principal - The principal balance (in dollars)
 * @param annualRate - The annual interest rate as a percentage (e.g., 8.5 for 8.5%)
 * @returns The daily interest amount (in dollars), rounded to the nearest cent
 *
 * @example
 * calculateDailyInterest(100000, 8.5) // Returns: 23.61
 * // Calculation: 100000 × 0.085 / 360 = 23.6111... → $23.61
 */
export function calculateDailyInterest(
  principal: number,
  annualRate: number
): number {
  if (principal < 0) {
    throw new Error('Principal balance cannot be negative');
  }
  if (annualRate < 0) {
    throw new Error('Annual rate cannot be negative');
  }

  const rateDecimal = percentageToDecimal(annualRate);
  const dailyInterest = principal * rateDecimal / DAYS_IN_YEAR_ACT360;
  return roundToNearestCent(dailyInterest);
}

/**
 * Calculate daily interest with full result object
 *
 * @param principal - The principal balance
 * @param annualRate - The annual interest rate as a percentage
 * @returns Detailed daily interest calculation result
 */
export function calculateDailyInterestDetailed(
  principal: number,
  annualRate: number
): DailyInterestResult {
  const dailyInterest = calculateDailyInterest(principal, annualRate);

  return {
    principal,
    annualRate,
    dailyInterest,
    asOfDate: new Date(),
  };
}

// ============================================
// Accrued Interest Calculation
// ============================================

/**
 * Calculate accrued interest between two dates using ACT/360 convention
 * Formula: Principal × (Rate / 100) × (Days / 360)
 *
 * @param principal - The principal balance (in dollars)
 * @param annualRate - The annual interest rate as a percentage
 * @param startDate - The start date for interest accrual
 * @param endDate - The end date for interest accrual
 * @returns The total accrued interest (in dollars), rounded to the nearest cent
 *
 * @example
 * calculateAccruedInterest(100000, 8.5, new Date('2024-01-01'), new Date('2024-01-31'))
 * // Returns: 729.17
 * // Calculation: 100000 × 0.085 × (31 / 360) = 729.1666... → $729.17
 */
export function calculateAccruedInterest(
  principal: number,
  annualRate: number,
  startDate: Date,
  endDate: Date
): number {
  if (principal < 0) {
    throw new Error('Principal balance cannot be negative');
  }
  if (annualRate < 0) {
    throw new Error('Annual rate cannot be negative');
  }

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (start > end) {
    throw new Error('Start date must be before or equal to end date');
  }

  // Get number of days between dates
  const days = getAct360DaysBetween(start, end);

  // Calculate interest using ACT/360 convention
  const rateDecimal = percentageToDecimal(annualRate);
  const accruedInterest = principal * rateDecimal * (days / DAYS_IN_YEAR_ACT360);

  return roundToNearestCent(accruedInterest);
}

/**
 * Calculate accrued interest between dates handling rate changes
 * This handles periods where the interest rate may change
 *
 * @param principal - The principal balance
 * @param startDate - The start date
 * @param endDate - The end date
 * @param rateChanges - Array of rate changes with date and new rate
 * @returns The total accrued interest
 */
export function calculateAccruedInterestWithRateChanges(
  principal: number,
  startDate: Date,
  endDate: Date,
  rateChanges: Array<{ date: Date; rate: number }>
): number {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  // Sort rate changes by date
  const sortedChanges = [...rateChanges].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Filter rate changes within our date range, plus current rate at start
  const relevantChanges = sortedChanges.filter(
    (change) => change.date.getTime() >= start.getTime() && change.date.getTime() <= end.getTime()
  );

  // Add the rate at the start date
  const startRate = sortedChanges
    .filter((change) => change.date.getTime() <= start.getTime())
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  if (!startRate && relevantChanges.length === 0) {
    // No rate information available
    throw new Error('No rate information available for the specified period');
  }

  // Build rate periods
  const periods: Array<{ startDate: Date; endDate: Date; rate: number }> = [];

  if (startRate) {
    const nextChangeDate = relevantChanges.length > 0 ? relevantChanges[0].date : end;
    periods.push({
      startDate: start,
      endDate: nextChangeDate,
      rate: startRate.rate,
    });
  }

  // Add periods for each rate change
  for (let i = 0; i < relevantChanges.length; i++) {
    const change = relevantChanges[i];
    const periodStart = change.date;
    const periodEnd = i < relevantChanges.length - 1 ? relevantChanges[i + 1].date : end;

    periods.push({
      startDate: periodStart,
      endDate: periodEnd,
      rate: change.rate,
    });
  }

  // Calculate interest for each period and sum
  let totalInterest = 0;
  periods.forEach((period) => {
    totalInterest += calculateAccruedInterest(
      principal,
      period.rate,
      period.startDate,
      period.endDate
    );
  });

  return roundToNearestCent(totalInterest);
}

// ============================================
// Matter Balance Calculations
// ============================================

/**
 * Calculate complete matter balance as of a specific date
 * This includes principal balance, accrued interest, paid interest, and total owed
 *
 * @param matterId - The matter ID
 * @param asOfDate - The date as of which to calculate the balance
 * @returns Complete matter balance information
 */
export function calculateMatterBalance(
  matterId: string,
  asOfDate: Date
): MatterBalance {
  const matter = useMatterStore.getState().getMatterById(matterId);
  const transactions = useTransactionStore.getState().getTransactionsByMatterId(matterId);
  const firmStore = useFirmStore.getState();

  if (!matter) {
    throw new Error(`Matter not found: ${matterId}`);
  }

  const targetDate = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);

  // Calculate principal balance (from existing matter data, but we can recalculate)
  let principalBalance = 0;
  let interestPaid = 0;

  // Process transactions to calculate balances
  const sortedTransactions = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  sortedTransactions.forEach((txn) => {
    if (txn.date <= targetDate) {
      if (txn.type === 'Draw') {
        const allocation = txn.allocations.find((a) => a.matterId === matterId);
        if (allocation) {
          principalBalance += allocation.amount;
        }
      } else if (txn.type === 'Principal Payment') {
        const allocation = txn.allocations.find((a) => a.matterId === matterId);
        if (allocation) {
          principalBalance = Math.max(0, principalBalance - allocation.amount);
        }
      } else if (txn.type === 'Interest Autodraft') {
        const allocation = txn.allocations.find((a) => a.matterId === matterId);
        if (allocation && txn.status === 'Allocated') {
          interestPaid += allocation.amount;
        }
      }
    }
  });

  // Get effective rate for the period
  const rateEntry = firmStore.getRateForDate(targetDate);
  const effectiveRate = rateEntry ? rateEntry.totalRate : 0;

  // Calculate accrued interest from matter creation date to asOfDate
  const startDate = matter.createdAt < targetDate ? matter.createdAt : targetDate;
  const interestAccrued = calculateAccruedInterest(
    principalBalance,
    effectiveRate,
    startDate,
    targetDate
  );

  // Calculate total interest owed (accrued - paid)
  const interestOwed = Math.max(0, interestAccrued - interestPaid);

  // Total owed = principal balance + unpaid interest
  const totalOwed = principalBalance + interestOwed;

  return {
    matterId: matter.id,
    clientName: matter.clientName,
    principalBalance: roundToNearestCent(principalBalance),
    interestAccrued: roundToNearestCent(interestAccrued),
    interestPaid: roundToNearestCent(interestPaid),
    interestOwed: roundToNearestCent(interestOwed),
    totalOwed: roundToNearestCent(totalOwed),
    asOfDate: targetDate,
  };
}

/**
 * Calculate matter balance with historical rate changes
 * This provides a more accurate balance calculation when rates have changed
 *
 * @param matterId - The matter ID
 * @param asOfDate - The date as of which to calculate the balance
 * @returns Complete matter balance information
 */
export function calculateMatterBalanceWithRateHistory(
  matterId: string,
  asOfDate: Date
): MatterBalance {
  const matter = useMatterStore.getState().getMatterById(matterId);
  const transactions = useTransactionStore.getState().getTransactionsByMatterId(matterId);
  const firmStore = useFirmStore.getState();

  if (!matter) {
    throw new Error(`Matter not found: ${matterId}`);
  }

  const targetDate = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);

  // Get rate history from the firm store
  const historicalRates = firmStore.getHistoricalRates();
  const rateChanges = historicalRates.map((rate) => ({
    date: rate.effectiveDate,
    rate: rate.totalRate,
  }));

  // Calculate principal balance
  let principalBalance = 0;
  let interestPaid = 0;

  const sortedTransactions = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  sortedTransactions.forEach((txn) => {
    if (txn.date <= targetDate) {
      if (txn.type === 'Draw') {
        const allocation = txn.allocations.find((a) => a.matterId === matterId);
        if (allocation) {
          principalBalance += allocation.amount;
        }
      } else if (txn.type === 'Principal Payment') {
        const allocation = txn.allocations.find((a) => a.matterId === matterId);
        if (allocation) {
          principalBalance = Math.max(0, principalBalance - allocation.amount);
        }
      } else if (txn.type === 'Interest Autodraft') {
        const allocation = txn.allocations.find((a) => a.matterId === matterId);
        if (allocation && txn.status === 'Allocated') {
          interestPaid += allocation.amount;
        }
      }
    }
  });

  // Calculate accrued interest with rate history
  const startDate = matter.createdAt < targetDate ? matter.createdAt : targetDate;
  const interestAccrued = calculateAccruedInterestWithRateChanges(
    principalBalance,
    startDate,
    targetDate,
    rateChanges
  );

  // Calculate totals
  const interestOwed = Math.max(0, interestAccrued - interestPaid);
  const totalOwed = principalBalance + interestOwed;

  return {
    matterId: matter.id,
    clientName: matter.clientName,
    principalBalance: roundToNearestCent(principalBalance),
    interestAccrued: roundToNearestCent(interestAccrued),
    interestPaid: roundToNearestCent(interestPaid),
    interestOwed: roundToNearestCent(interestOwed),
    totalOwed: roundToNearestCent(totalOwed),
    asOfDate: targetDate,
  };
}

// ============================================
// Total Interest Calculation
// ============================================

/**
 * Calculate total interest accrued across all active matters as of a specific date
 *
 * @param asOfDate - The date as of which to calculate total interest
 * @returns Total interest accrued (in dollars), rounded to the nearest cent
 */
export function calculateTotalInterestAccrued(asOfDate: Date): number {
  const activeMatters = useMatterStore.getState().getActiveMatters();
  const targetDate = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);

  let totalInterest = 0;

  activeMatters.forEach((matter) => {
    const balance = calculateMatterBalance(matter.id, targetDate);
    totalInterest += balance.interestAccrued;
  });

  return roundToNearestCent(totalInterest);
}

/**
 * Calculate total interest owed across all active matters
 * Interest owed = accrued interest - paid interest
 *
 * @param asOfDate - The date as of which to calculate total interest owed
 * @returns Total interest owed (in dollars), rounded to the nearest cent
 */
export function calculateTotalInterestOwed(asOfDate: Date): number {
  const activeMatters = useMatterStore.getState().getActiveMatters();
  const targetDate = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);

  let totalOwed = 0;

  activeMatters.forEach((matter) => {
    const balance = calculateMatterBalance(matter.id, targetDate);
    totalOwed += balance.interestOwed;
  });

  return roundToNearestCent(totalOwed);
}

/**
 * Calculate total owed across all active matters (principal + unpaid interest)
 *
 * @param asOfDate - The date as of which to calculate total owed
 * @returns Total amount owed (in dollars), rounded to the nearest cent
 */
export function calculateTotalOwed(asOfDate: Date): number {
  const activeMatters = useMatterStore.getState().getActiveMatters();
  const targetDate = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);

  let total = 0;

  activeMatters.forEach((matter) => {
    const balance = calculateMatterBalance(matter.id, targetDate);
    total += balance.totalOwed;
  });

  return roundToNearestCent(total);
}

// ============================================
// Interest Allocation
// ============================================

/**
 * Allocate interest payment across multiple matters based on their principal balances
 * Uses pro rata distribution based on each matter's principal balance
 *
 * @param interestAmount - Total interest payment amount to allocate (in dollars)
 * @param date - The date of the interest allocation
 * @returns Map of matter IDs to allocated amounts (in dollars)
 *
 * @example
 * allocateInterestToMatters(1000, new Date('2024-03-15'))
 * // Returns: Map { 'JON-2024-001': 300, 'DOD-2024-003': 700 }
 * // (Allocates based on each matter's principal balance proportion)
 */
export function allocateInterestToMatters(
  interestAmount: number,
  date: Date
): Map<string, number> {
  if (interestAmount < 0) {
    throw new Error('Interest amount cannot be negative');
  }

  const targetDate = date instanceof Date ? date : new Date(date);

  // Get active matters only
  const activeMatters = useMatterStore.getState().getActiveMatters();

  if (activeMatters.length === 0) {
    throw new Error('No active matters found for allocation');
  }

  // Calculate balance for each active matter
  const matterBalances: Array<{ matterId: string; principalBalance: number; interestOwed: number }> = [];

  activeMatters.forEach((matter) => {
    const balance = calculateMatterBalance(matter.id, targetDate);
    matterBalances.push({
      matterId: matter.id,
      principalBalance: balance.principalBalance,
      interestOwed: balance.interestOwed,
    });
  });

  // Calculate total principal balance
  const totalPrincipalBalance = matterBalances.reduce(
    (sum, m) => sum + m.principalBalance,
    0
  );

  if (totalPrincipalBalance === 0) {
    throw new Error('Total principal balance is zero, cannot allocate interest');
  }

  // Allocate interest pro rata based on principal balance
  const allocationMap = new Map<string, number>();
  let remainingAmount = interestAmount;

  // First, allocate to matters based on principal balance (pro rata)
  matterBalances.forEach((matter) => {
    const proRataShare = (matter.principalBalance / totalPrincipalBalance) * interestAmount;
    allocationMap.set(matter.matterId, roundToNearestCent(proRataShare));
  });

  // Adjust for rounding errors by allocating any remainder to the matter with largest balance
  const allocatedSum = Array.from(allocationMap.values()).reduce((sum, amount) => sum + amount, 0);
  const remainder = interestAmount - allocatedSum;

  if (remainder !== 0) {
    const matterWithLargestBalance = matterBalances.reduce((max, m) =>
      m.principalBalance > max.principalBalance ? m : max
    );
    const currentAllocation = allocationMap.get(matterWithLargestBalance.matterId) || 0;
    allocationMap.set(matterWithLargestBalance.matterId, roundToNearestCent(currentAllocation + remainder));
  }

  return allocationMap;
}

/**
 * Allocate interest using waterfall method (Tier 1 + Tier 2)
 * Tier 1: Matters with $0 principal balance (interest-only allocation)
 * Tier 2: Matters with principal balance > 0 (pro rata based on principal)
 *
 * @param interestAmount - Total interest payment amount
 * @param date - The date of the interest allocation
 * @returns Map of matter IDs to allocated amounts with tier information
 */
export function allocateInterestWaterfall(
  interestAmount: number,
  date: Date
): Map<string, number> {
  if (interestAmount < 0) {
    throw new Error('Interest amount cannot be negative');
  }

  const targetDate = date instanceof Date ? date : new Date(date);
  const activeMatters = useMatterStore.getState().getActiveMatters();

  if (activeMatters.length === 0) {
    throw new Error('No active matters found for allocation');
  }

  // Calculate balance for each active matter
  const matterDetails: Array<{
    matterId: string;
    principalBalance: number;
    interestOwed: number;
    tier: 1 | 2;
  }> = [];

  activeMatters.forEach((matter) => {
    const balance = calculateMatterBalance(matter.id, targetDate);
    matterDetails.push({
      matterId: matter.id,
      principalBalance: balance.principalBalance,
      interestOwed: balance.interestOwed,
      tier: balance.principalBalance === 0 ? 1 : 2,
    });
  });

  // Separate into tiers
  const tier1Matters = matterDetails.filter((m) => m.tier === 1);
  const tier2Matters = matterDetails.filter((m) => m.tier === 2);

  const allocationMap = new Map<string, number>();
  let remainingAmount = interestAmount;

  // Tier 1: Allocate to matters with $0 principal balance first
  // These matters only have interest owed, no principal
  if (tier1Matters.length > 0) {
    const totalTier1InterestOwed = tier1Matters.reduce((sum, m) => sum + m.interestOwed, 0);

    if (totalTier1InterestOwed > 0) {
      tier1Matters.forEach((matter) => {
        const share = (matter.interestOwed / totalTier1InterestOwed) * Math.min(remainingAmount, totalTier1InterestOwed);
        allocationMap.set(matter.matterId, roundToNearestCent(share));
      });

      const tier1Allocated = Math.min(remainingAmount, totalTier1InterestOwed);
      remainingAmount -= tier1Allocated;
    }
  }

  // Tier 2: Allocate remaining amount pro rata based on principal balance
  if (remainingAmount > 0 && tier2Matters.length > 0) {
    const totalTier2Principal = tier2Matters.reduce((sum, m) => sum + m.principalBalance, 0);

    if (totalTier2Principal > 0) {
      tier2Matters.forEach((matter) => {
        const proRataShare = (matter.principalBalance / totalTier2Principal) * remainingAmount;
        allocationMap.set(matter.matterId, roundToNearestCent(proRataShare));
      });
    }
  }

  // Handle rounding errors
  const allocatedSum = Array.from(allocationMap.values()).reduce((sum, amount) => sum + amount, 0);
  const remainder = interestAmount - allocatedSum;

  if (remainder !== 0) {
    const matterWithLargestAllocation = Array.from(allocationMap.entries()).reduce((max, [id, amount]) =>
      amount > max[1] ? [id, amount] : max,
      ['', 0]
    );
    const currentAllocation = allocationMap.get(matterWithLargestAllocation[0]) || 0;
    allocationMap.set(matterWithLargestAllocation[0], roundToNearestCent(currentAllocation + remainder));
  }

  return allocationMap;
}

// ============================================
// Daily Balance Generation
// ============================================

/**
 * Generate daily balances for a specific matter over a date range
 * This creates a record of the principal balance and daily interest for each day
 *
 * @param matterId - The matter ID
 * @param startDate - The start date of the period
 * @param endDate - The end date of the period
 * @returns Array of daily balances
 */
export function generateDailyBalancesForMatter(
  matterId: string,
  startDate: Date,
  endDate: Date
): DailyBalance[] {
  const matter = useMatterStore.getState().getMatterById(matterId);
  const transactions = useTransactionStore.getState().getTransactionsByMatterId(matterId);
  const firmStore = useFirmStore.getState();

  if (!matter) {
    throw new Error(`Matter not found: ${matterId}`);
  }

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  const dailyBalances: DailyBalance[] = [];
  let currentDate = new Date(start);
  currentDate.setHours(0, 0, 0, 0);

  let principalBalance = 0;

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  let txnIndex = 0;

  // Process each day
  while (currentDate.getTime() <= end.getTime()) {
    // Apply transactions that occurred on or before this day
    while (txnIndex < sortedTransactions.length) {
      const txn = sortedTransactions[txnIndex];
      const txnDate = new Date(txn.date);
      txnDate.setHours(0, 0, 0, 0);

      if (txnDate.getTime() <= currentDate.getTime()) {
        if (txn.type === 'Draw') {
          const allocation = txn.allocations.find((a) => a.matterId === matterId);
          if (allocation) {
            principalBalance += allocation.amount;
          }
        } else if (txn.type === 'Principal Payment') {
          const allocation = txn.allocations.find((a) => a.matterId === matterId);
          if (allocation) {
            principalBalance = Math.max(0, principalBalance - allocation.amount);
          }
        }
        txnIndex++;
      } else {
        break;
      }
    }

    // Get effective rate for this day
    const rateEntry = firmStore.getRateForDate(currentDate);
    const interestRate = rateEntry ? rateEntry.totalRate : 0;

    // Calculate daily interest
    const dailyInterest = calculateDailyInterest(principalBalance, interestRate);

    // Record daily balance
    dailyBalances.push({
      date: new Date(currentDate),
      matterId: matterId,
      principalBalance: roundToNearestCent(principalBalance),
      interestRate,
      dailyInterest,
    });

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  return dailyBalances;
}

// ============================================
// Payoff Calculations
// ============================================

/**
 * Calculate payoff amount for a matter as of a specific date
 * Returns both firm payoff (principal only) and client payoff (principal + interest)
 *
 * @param matterId - The matter ID
 * @param asOfDate - The date as of which to calculate payoff
 * @returns Payoff information
 */
export function calculateMatterPayoff(
  matterId: string,
  asOfDate: Date
): { matterId: string; clientName: string; principalBalance: number; interestOwed: number; firmPayoff: number; clientPayoff: number; asOfDate: Date } {
  const balance = calculateMatterBalance(matterId, asOfDate);

  return {
    matterId: balance.matterId,
    clientName: balance.clientName,
    principalBalance: balance.principalBalance,
    interestOwed: balance.interestOwed,
    firmPayoff: balance.principalBalance, // Firm pays principal only
    clientPayoff: balance.totalOwed, // Client pays principal + interest
    asOfDate: balance.asOfDate,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get the effective rate for a specific date from the rate calendar
 *
 * @param date - The date to get the rate for
 * @returns The effective interest rate as a percentage
 */
export function getEffectiveRate(date: Date): number {
  const firmStore = useFirmStore.getState();
  const rateEntry = firmStore.getRateForDate(date);
  return rateEntry ? rateEntry.totalRate : 0;
}

/**
 * Calculate the next autodraft date based on a given date
 * Autodrafts occur on the 15th of each month
 *
 * @param fromDate - The date to calculate from
 * @returns The next autodraft date
 */
export function getNextAutodraftDate(fromDate: Date = new Date()): Date {
  const from = fromDate instanceof Date ? fromDate : new Date(fromDate);

  let nextAutodraft = new Date(from.getFullYear(), from.getMonth(), 15);

  if (from.getDate() >= 15) {
    // Move to next month
    nextAutodraft.setMonth(nextAutodraft.getMonth() + 1);
  }

  return nextAutodraft;
}

/**
 * Format interest amount as a currency string
 *
 * @param amount - The interest amount
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatInterestAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format interest rate as a percentage string
 *
 * @param rate - The interest rate as a percentage
 * @returns Formatted percentage string (e.g., "8.50%")
 */
export function formatInterestRate(rate: number, decimals: number = 2): string {
  return `${rate.toFixed(decimals)}%`;
}
