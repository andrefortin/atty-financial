// Custom hook for interest calculations
// Wraps interest calculator service with convenient access

import { useCallback } from 'react';
import {
  calculateDailyInterest,
  calculateDailyInterestDetailed,
  calculateAccruedInterest,
  calculateAccruedInterestWithRateChanges,
  calculateMatterBalance,
  calculateMatterBalanceWithRateHistory,
  calculateMatterPayoff,
  getEffectiveRate,
  getNextAutodraftDate,
} from '../services/interestCalculator';
import type { MatterBalance, DailyInterestResult } from '../services/interestCalculator';

/**
 * Hook: Access interest calculator daily interest function
 * @returns Function to calculate daily interest
 */
export const useInterestCalculator = () => {
  return {
    calculateDailyInterest,
    calculateDailyInterestDetailed,
    calculateAccruedInterest,
    calculateAccruedInterestWithRateChanges,
  };
};

/**
 * Hook: Get matter balance with real-time calculations
 * @param matterId - Matter ID
 * @param asOfDate - Date as of which to calculate balance (optional, defaults to today)
 * @returns MatterBalance object with principal, interest, and totals
 */
export const useMatterBalance = (matterId: string, asOfDate: Date = new Date()) => {
  return useCallback(() => {
    try {
      return calculateMatterBalance(matterId, asOfDate);
    } catch (error) {
      console.error('Error calculating matter balance:', error);
      return null;
    }
  }, [matterId, asOfDate]);
};

/**
 * Hook: Get matter balance with rate history consideration
 * @param matterId - Matter ID
 * @param asOfDate - Date as of which to calculate balance (optional, defaults to today)
 * @returns MatterBalance object with principal, interest, and totals
 */
export const useMatterBalanceWithHistory = (matterId: string, asOfDate: Date = new Date()) => {
  return useCallback(() => {
    try {
      return calculateMatterBalanceWithRateHistory(matterId, asOfDate);
    } catch (error) {
      console.error('Error calculating matter balance with history:', error);
      return null;
    }
  }, [matterId, asOfDate]);
};

/**
 * Hook: Calculate payoff amounts for a matter
 * @param matterId - Matter ID
 * @param asOfDate - Date as of which to calculate payoff (optional, defaults to today)
 * @returns Payoff information object
 */
export const useMatterPayoff = (matterId: string, asOfDate: Date = new Date()) => {
  return useCallback(() => {
    try {
      return calculateMatterPayoff(matterId, asOfDate);
    } catch (error) {
      console.error('Error calculating matter payoff:', error);
      return null;
    }
  }, [matterId, asOfDate]);
};

/**
 * Hook: Get effective interest rate for a specific date
 * @param date - Date to get rate for (optional, defaults to today)
 * @returns Effective interest rate as percentage
 */
export const useEffectiveRate = (date: Date = new Date()) => {
  return useCallback(() => {
    try {
      return getEffectiveRate(date);
    } catch (error) {
      console.error('Error getting effective rate:', error);
      return 0;
    }
  }, [date]);
};

/**
 * Hook: Calculate daily interest for a principal balance and rate
 * @param principal - Principal balance amount
 * @param annualRate - Annual interest rate as percentage
 * @returns Daily interest amount
 */
export const useDailyInterest = (principal: number, annualRate: number) => {
  return useCallback(() => {
    return calculateDailyInterest(principal, annualRate);
  }, [principal, annualRate]);
};

/**
 * Hook: Calculate detailed daily interest for a principal balance and rate
 * @param principal - Principal balance amount
 * @param annualRate - Annual interest rate as percentage
 * @returns DailyInterestResult object with all details
 */
export const useDailyInterestDetailed = (principal: number, annualRate: number) => {
  return useCallback(() => {
    return calculateDailyInterestDetailed(principal, annualRate);
  }, [principal, annualRate]);
};

/**
 * Hook: Calculate accrued interest between two dates
 * @param principal - Principal balance amount
 * @param annualRate - Annual interest rate as percentage
 * @param startDate - Start date for interest calculation
 * @param endDate - End date for interest calculation
 * @returns Total accrued interest amount
 */
export const useAccruedInterest = (
  principal: number,
  annualRate: number,
  startDate: Date,
  endDate: Date
) => {
  return useCallback(() => {
    try {
      return calculateAccruedInterest(principal, annualRate, startDate, endDate);
    } catch (error) {
      console.error('Error calculating accrued interest:', error);
      return 0;
    }
  }, [principal, annualRate, startDate, endDate]);
};

/**
 * Hook: Calculate accrued interest handling rate changes during period
 * @param principal - Principal balance amount
 * @param startDate - Start date for interest calculation
 * @param endDate - End date for interest calculation
 * @param rateChanges - Array of rate changes during the period
 * @returns Total accrued interest amount
 */
export const useAccruedInterestWithChanges = (
  principal: number,
  startDate: Date,
  endDate: Date,
  rateChanges: Array<{ date: Date; rate: number }>
) => {
  return useCallback(() => {
    try {
      return calculateAccruedInterestWithRateChanges(principal, startDate, endDate, rateChanges);
    } catch (error) {
      console.error('Error calculating accrued interest with rate changes:', error);
      return 0;
    }
  }, [principal, startDate, endDate, rateChanges]);
};

/**
 * Hook: Get next autodraft date
 * @param fromDate - Date to calculate from (optional, defaults to today)
 * @returns Next autodraft date (15th of month)
 */
export const useNextAutodraftDate = (fromDate: Date = new Date()) => {
  return useCallback(() => {
    return getNextAutodraftDate(fromDate);
  }, [fromDate]);
};

/**
 * Hook: Get interest calculation method information
 * @returns Object with method details
 */
export const useInterestCalculationInfo = () => {
  return {
    method: 'ACT/360',
    description: 'Actual number of days divided by 360',
    formula: 'Principal × (Rate / 100) × (Days / 360)',
    example: '$100,000 × 8.5% × (31 / 360) = $729.17',
  };
};
