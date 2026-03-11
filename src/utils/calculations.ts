// Calculation utilities for ATTY Financial Application

import { DayCountConvention } from '../types/calculations';

// ============================================
// Day Count Functions
// ============================================

/**
 * Get the number of days between two dates based on the specified convention
 */
export function getDaysBetween(
  startDate: Date | string,
  endDate: Date | string,
  convention: DayCountConvention = 'actual/360'
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate);

  // Ensure dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date provided');
  }

  // Normalize to midnight
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - start.getTime();
  const actualDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (convention) {
    case 'actual/360':
      // Actual number of days divided by 360
      return Math.max(0, actualDays) / 360;

    case 'actual/365':
      // Actual number of days divided by 365
      return Math.max(0, actualDays) / 365;

    case '30/360':
      // 30 days per month divided by 360
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return Math.max(0, months * 30) / 360;

    default:
      throw new Error(`Unknown day count convention: ${convention}`);
  }
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the number of days in a specific month
 */
export function getDaysInMonth(year: number, month: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 0 || month > 11) {
    throw new Error(`Invalid month: ${month}`);
  }

  let days = daysInMonth[month];
  if (month === 1 && isLeapYear(year)) {
    days = 29;
  }

  return days;
}

// ============================================
// Rounding Functions
// ============================================

/**
 * Round to the nearest cent (2 decimal places) using standard rounding
 */
export function roundToNearestCent(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Round up to the nearest cent (2 decimal places)
 */
export function roundUpToNearestCent(amount: number): number {
  return Math.ceil(amount * 100) / 100;
}

/**
 * Round to specified number of decimal places
 */
export function roundToDecimals(amount: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(amount * multiplier) / multiplier;
}

/**
 * Round using Banker's Rounding (round half to even)
 */
export function bankersRound(amount: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  const scaled = Math.round(amount * multiplier * 2) / 2;
  return scaled / multiplier;
}

// ============================================
// Interest Helpers
// ============================================

/**
 * Apply rate modifier to prime rate
 */
export function applyRateModifier(primeRate: number, modifier: number): number {
  return primeRate + modifier;
}

/**
 * Calculate annual rate from daily rate
 */
export function calculateAnnualRate(dailyRate: number, days: number = 360): number {
  return dailyRate * days;
}

/**
 * Calculate daily rate from annual rate
 */
export function calculateDailyRate(annualRate: number, days: number = 360): number {
  return annualRate / days;
}

/**
 * Convert percentage to decimal (e.g., 8.5% -> 0.085)
 */
export function percentageToDecimal(percentage: number): number {
  return percentage / 100;
}

/**
 * Convert decimal to percentage (e.g., 0.085 -> 8.5%)
 */
export function decimalToPercentage(decimal: number): number {
  return decimal * 100;
}

// ============================================
// Calculation Validation
// ============================================

/**
 * Validate that amounts are non-negative
 */
export function validateNonNegative(amount: number, fieldName: string): void {
  if (amount < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
}

/**
 * Validate that principal balance doesn't exceed payment
 */
export function validatePaymentDoesNotExceedBalance(
  paymentAmount: number,
  principalBalance: number
): void {
  if (paymentAmount > principalBalance) {
    throw new Error('Payment amount cannot exceed principal balance');
  }
}

// ============================================
// Pro Rata Distribution
// ============================================

/**
 * Distribute amount proportionally among balances
 */
export function distributeProRata(
  totalAmount: number,
  balances: Array<{ id: string; balance: number }>
): Array<{ id: string; amount: number }> {
  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  if (totalBalance === 0) {
    throw new Error('Cannot distribute with zero total balance');
  }

  return balances.map((b) => ({
    id: b.id,
    amount: roundToNearestCent(totalAmount * (b.balance / totalBalance)),
  }));
}

// ============================================
// Math Utilities
// ============================================

/**
 * Calculate sum of array
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * Calculate average of array
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return sum(numbers) / numbers.length;
}

/**
 * Find minimum value
 */
export function min(numbers: number[]): number {
  if (numbers.length === 0) throw new Error('Cannot find min of empty array');
  return Math.min(...numbers);
}

/**
 * Find maximum value
 */
export function max(numbers: number[]): number {
  if (numbers.length === 0) throw new Error('Cannot find max of empty array');
  return Math.max(...numbers);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================
// Financial Formatting
// ============================================

/**
 * Format number as currency string (for display only)
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number as percentage
 */
export function formatRate(rate: number, decimals: number = 2): string {
  return `${rate.toFixed(decimals)}%`;
}
