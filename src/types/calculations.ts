// Types for Interest Calculation Service

import { Matter, Transaction, TransactionAllocation } from './index';

// ============================================
// Day Count Conventions
// ============================================
export type DayCountConvention = 'actual/360' | 'actual/365' | '30/360';

// ============================================
// Interest Calculation Results
// ============================================
export interface InterestCalculationResult {
  principal: number;
  rate: number;
  days: number;
  dailyInterest: number;
  totalInterest: number;
  roundedTotal: number;
}

// ============================================
// Daily Balance
// ============================================
export interface DailyBalance {
  date: Date;
  matterId: string;
  principalBalance: number;
  interestRate: number;
  dailyInterest: number;
  accruedInterest: number;
}

// ============================================
// Interest Allocation
// ============================================
export interface InterestAllocationDetail {
  matterId: string;
  matterName: string;
  principalBalance: number;
  interestAccrued: number;
  interestOwed: number;
  allocatedAmount: number;
  interestRemainingBefore: number;
  interestRemainingAfter: number;
  tier: 1 | 2; // Tier 1: $0 principal, Tier 2: Pro rata
}

// ============================================
// Payoff Breakdown
// ============================================
export interface PayoffBreakdown {
  principalBalance: number;
  interestAccrued: number;
  interestPaid: number;
  interestOwed: number;
  totalFirmPayoff: number; // principal balance only
  totalClientPayoff: number; // principal + unpaid interest
  asOfDate: Date;
}

// ============================================
// Rate History
// ============================================
export interface RateEntry {
  effectiveDate: Date;
  primeRate: number;
  modifier: number;
  totalRate: number; // Prime + modifier
  source?: string;
  notes?: string;
}

export interface RateCalendar {
  entries: RateEntry[];
  defaultPrimeRate: number;
  defaultModifier: number;
}

// ============================================
// Period Interest Calculation
// ============================================
export interface PeriodInterestResult {
  startDate: Date;
  endDate: Date;
  days: number;
  averageRate: number;
  totalInterest: number;
  dailyBalances: DailyBalance[];
}

// ============================================
// Waterfall Allocation Result
// ============================================
export interface WaterfallAllocationResult {
  autodraftAmount: number;
  totalInterestOwed: number;
  allocations: InterestAllocationDetail[];
  allocatedToMatters: number;
  carryForward: number;
  fullyAllocated: boolean;
}

// ============================================
// Payment Allocation Result
// ============================================
export interface PaymentAllocationResult {
  paymentAmount: number;
  matters: Array<{
    matterId: string;
    matterName: string;
    principalPayment: number;
    interestPayment: number;
    remainingPrincipal: number;
    remainingInterest: number;
  }>;
  totalPrincipalPayment: number;
  totalInterestPayment: number;
}

// ============================================
// Calculation Context
// ============================================
export interface CalculationContext {
  convention: DayCountConvention;
  roundingMethod: 'standard' | 'bankers';
  asOfDate: Date;
}

// ============================================
// Rate Change Event
// ============================================
export interface RateChangeEvent {
  date: Date;
  oldRate: number;
  newRate: number;
  principalBalance: number;
}
