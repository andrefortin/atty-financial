// Tests for Interest Calculator Service

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  calculateDailyInterest,
  calculateDailyInterestDetailed,
  calculateAccruedInterest,
  calculateAccruedInterestWithRateChanges,
  calculateMatterBalance,
  calculateMatterBalanceWithRateHistory,
  calculateTotalInterestAccrued,
  calculateTotalInterestOwed,
  calculateTotalOwed,
  allocateInterestToMatters,
  allocateInterestWaterfall,
  generateDailyBalancesForMatter,
  calculateMatterPayoff,
  getEffectiveRate,
  getNextAutodraftDate,
  formatInterestAmount,
  formatInterestRate,
} from '../interestCalculator';
import { initializeStores } from '../../store';

// ============================================
// Setup
// ============================================

beforeEach(() => {
  initializeStores();
});

// ============================================
// Daily Interest Calculation Tests
// ============================================

describe('calculateDailyInterest', () => {
  it('should calculate daily interest correctly using ACT/360 convention', () => {
    const result = calculateDailyInterest(100000, 8.5);
    // Formula: 100000 * 0.085 / 360 = 23.6111...
    expect(result).toBe(23.61);
  });

  it('should handle zero principal balance', () => {
    const result = calculateDailyInterest(0, 8.5);
    expect(result).toBe(0);
  });

  it('should handle zero interest rate', () => {
    const result = calculateDailyInterest(100000, 0);
    expect(result).toBe(0);
  });

  it('should throw error for negative principal', () => {
    expect(() => calculateDailyInterest(-100000, 8.5)).toThrow('Principal balance cannot be negative');
  });

  it('should throw error for negative rate', () => {
    expect(() => calculateDailyInterest(100000, -8.5)).toThrow('Annual rate cannot be negative');
  });
});

describe('calculateDailyInterestDetailed', () => {
  it('should return detailed daily interest result', () => {
    const result = calculateDailyInterestDetailed(100000, 8.5);

    expect(result.principal).toBe(100000);
    expect(result.annualRate).toBe(8.5);
    expect(result.dailyInterest).toBe(23.61);
    expect(result.asOfDate).toBeInstanceOf(Date);
  });
});

// ============================================
// Accrued Interest Calculation Tests
// ============================================

describe('calculateAccruedInterest', () => {
  it('should calculate accrued interest for a period of days', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const result = calculateAccruedInterest(100000, 8.5, startDate, endDate);
    // Formula: 100000 * 0.085 * (31 / 360) = 729.1666...
    expect(result).toBe(729.17);
  });

  it('should handle single day period', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-01');
    const result = calculateAccruedInterest(100000, 8.5, startDate, endDate);
    // Formula: 100000 * 0.085 * (1 / 360) = 23.6111...
    expect(result).toBe(23.61);
  });

  it('should handle leap year (February)', () => {
    const startDate = new Date('2024-02-01');
    const endDate = new Date('2024-02-29');
    const result = calculateAccruedInterest(100000, 8.5, startDate, endDate);
    // Formula: 100000 * 0.085 * (29 / 360) = 681.9444...
    expect(result).toBe(681.94);
  });

  it('should throw error when start date is after end date', () => {
    const startDate = new Date('2024-02-01');
    const endDate = new Date('2024-01-01');
    expect(() => calculateAccruedInterest(100000, 8.5, startDate, endDate)).toThrow();
  });
});

describe('calculateAccruedInterestWithRateChanges', () => {
  it('should calculate interest with rate changes during period', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-03-31');
    const rateChanges = [
      { date: new Date('2024-02-01'), rate: 9.0 },
      { date: new Date('2024-03-01'), rate: 8.75 },
    ];

    const result = calculateAccruedInterestWithRateChanges(100000, startDate, endDate, rateChanges);
    // Should calculate interest for each rate period
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });
});

// ============================================
// Matter Balance Calculation Tests
// ============================================

describe('calculateMatterBalance', () => {
  it('should calculate matter balance correctly', () => {
    const result = calculateMatterBalance('JON-2024-001', new Date('2024-03-20'));

    expect(result.matterId).toBe('JON-2024-001');
    expect(result.clientName).toBe('Johnathan Smithson');
    expect(result.principalBalance).toBeGreaterThanOrEqual(0);
    expect(result.interestAccrued).toBeGreaterThanOrEqual(0);
    expect(result.interestPaid).toBeGreaterThanOrEqual(0);
    expect(result.interestOwed).toBeGreaterThanOrEqual(0);
    expect(result.totalOwed).toBe(result.principalBalance + result.interestOwed);
  });

  it('should throw error for non-existent matter', () => {
    expect(() => calculateMatterBalance('NON-EXISTENT', new Date('2024-03-20'))).toThrow(
      'Matter not found'
    );
  });
});

describe('calculateMatterBalanceWithRateHistory', () => {
  it('should calculate balance considering rate history', () => {
    const result = calculateMatterBalanceWithRateHistory('JON-2024-001', new Date('2024-03-20'));

    expect(result.matterId).toBe('JON-2024-001');
    expect(result.principalBalance).toBeGreaterThanOrEqual(0);
    expect(result.interestAccrued).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// Total Interest Calculation Tests
// ============================================

describe('calculateTotalInterestAccrued', () => {
  it('should calculate total interest across all active matters', () => {
    const result = calculateTotalInterestAccrued(new Date('2024-03-20'));

    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });
});

describe('calculateTotalInterestOwed', () => {
  it('should calculate total interest owed across all active matters', () => {
    const result = calculateTotalInterestOwed(new Date('2024-03-20'));

    expect(result).toBeGreaterThanOrEqual(0);
    expect(typeof result).toBe('number');
  });
});

describe('calculateTotalOwed', () => {
  it('should calculate total owed (principal + interest) across all active matters', () => {
    const result = calculateTotalOwed(new Date('2024-03-20'));

    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });
});

// ============================================
// Interest Allocation Tests
// ============================================

describe('allocateInterestToMatters', () => {
  it('should allocate interest pro rata based on principal balance', () => {
    const result = allocateInterestToMatters(1000, new Date('2024-03-20'));

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBeGreaterThan(0);

    // Sum of allocations should equal total amount
    let total = 0;
    result.forEach((amount) => {
      total += amount;
    });
    expect(total).toBe(1000);
  });

  it('should throw error for negative amount', () => {
    expect(() => allocateInterestToMatters(-1000, new Date('2024-03-20'))).toThrow(
      'Interest amount cannot be negative'
    );
  });
});

describe('allocateInterestWaterfall', () => {
  it('should allocate interest using waterfall method (Tier 1 + Tier 2)', () => {
    const result = allocateInterestWaterfall(1000, new Date('2024-03-20'));

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBeGreaterThanOrEqual(0);

    // Sum of allocations should equal total amount
    let total = 0;
    result.forEach((amount) => {
      total += amount;
    });
    expect(total).toBe(1000);
  });
});

// ============================================
// Daily Balance Generation Tests
// ============================================

describe('generateDailyBalancesForMatter', () => {
  it('should generate daily balances for a matter over a period', () => {
    const result = generateDailyBalancesForMatter(
      'JON-2024-001',
      new Date('2024-03-01'),
      new Date('2024-03-05')
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('date');
    expect(result[0]).toHaveProperty('matterId');
    expect(result[0]).toHaveProperty('principalBalance');
    expect(result[0]).toHaveProperty('interestRate');
    expect(result[0]).toHaveProperty('dailyInterest');
  });
});

// ============================================
// Payoff Calculation Tests
// ============================================

describe('calculateMatterPayoff', () => {
  it('should calculate payoff amounts correctly', () => {
    const result = calculateMatterPayoff('JON-2024-001', new Date('2024-03-20'));

    expect(result.matterId).toBe('JON-2024-001');
    expect(result.clientName).toBe('Johnathan Smithson');
    expect(result.firmPayoff).toBe(result.principalBalance);
    expect(result.clientPayoff).toBe(result.principalBalance + result.interestOwed);
  });
});

// ============================================
// Helper Function Tests
// ============================================

describe('getEffectiveRate', () => {
  it('should return the effective rate for a date', () => {
    const result = getEffectiveRate(new Date('2024-03-20'));

    expect(result).toBeGreaterThanOrEqual(0);
    expect(typeof result).toBe('number');
  });
});

describe('getNextAutodraftDate', () => {
  it('should return next autodraft date (15th of month)', () => {
    const result = getNextAutodraftDate(new Date('2024-03-10'));
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(2); // March
  });

  it('should move to next month if past 15th', () => {
    const result = getNextAutodraftDate(new Date('2024-03-20'));
    expect(result.getDate()).toBe(15);
    expect(result.getMonth()).toBe(3); // April
  });
});

describe('formatInterestAmount', () => {
  it('should format amount as currency', () => {
    const result = formatInterestAmount(1234.56);
    expect(result).toBe('$1,234.56');
  });
});

describe('formatInterestRate', () => {
  it('should format rate as percentage', () => {
    const result = formatInterestRate(8.5);
    expect(result).toBe('8.50%');
  });
});
