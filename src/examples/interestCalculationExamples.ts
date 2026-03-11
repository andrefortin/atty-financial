// Interest Calculation Integration Examples
// These examples demonstrate how to use the Interest Calculator service

import {
  calculateDailyInterest,
  calculateTotalInterestAccrued,
  calculateInterestForPeriod,
  generateDailyBalances,
  allocatePaymentToInterest,
  calculatePayoffAmount,
  getEffectiveRateForDate,
  calculateAverageRate,
} from '../services/interestCalculator';
import { Matter, Transaction } from '../types';
import { RateCalendar } from '../types/calculations';
import { mockMatters } from '../data/mockMatters';

// ============================================
// Example 1: Simple Interest Calculation with Single Rate
// ============================================

/**
 * Example 1: Calculate daily interest for a simple scenario
 * 
 * Scenario: A matter with $10,000 principal balance, 11% annual rate
 * Expected: Daily interest ≈ $3.06
 */
export function example1_SimpleInterestCalculation() {
  console.log('=== Example 1: Simple Interest Calculation ===');

  // Setup
  const principal = 10000;
  const annualRate = 11.0; // 11%
  const days = 30;

  // Calculate daily interest
  const result = calculateDailyInterest(principal, annualRate, days);

  // Output results
  console.log('Principal Balance:', principal);
  console.log('Annual Rate:', annualRate + '%');
  console.log('Days:', days);
  console.log('Daily Interest:', result.dailyInterest);
  console.log('Total Interest:', result.totalInterest);
  console.log('');
  console.log('Formula: Principal × Rate ÷ 360 × Days');
  console.log(`Calculation: ${principal} × ${annualRate}% ÷ 360 × ${days}`);
  console.log(`Result: ${result.dailyInterest} per day`);

  return result;
}

// ============================================
// Example 2: Interest Calculation with Rate Changes
// ============================================

/**
 * Example 2: Calculate interest over a period with rate changes
 * 
 * Scenario: Matter with multiple rate changes in January-March 2024
 * Expected: Weighted average rate with total interest
 */
export function example2_RateChangeHandling() {
  console.log('=== Example 2: Interest Calculation with Rate Changes ===');

  // Setup rate calendar with rate changes
  const rateCalendar: RateCalendar = {
    entries: [
      {
        effectiveDate: new Date('2024-01-01'),
        primeRate: 8.5,
        modifier: 2.5,
        totalRate: 11.0,
        source: 'Federal Reserve',
      },
      {
        effectiveDate: new Date('2024-02-01'),
        primeRate: 8.75,
        modifier: 2.5,
        totalRate: 11.25,
        source: 'Federal Reserve',
      },
      {
        effectiveDate: new Date('2024-03-01'),
        primeRate: 9.0,
        modifier: 2.5,
        totalRate: 11.5,
        source: 'Federal Reserve',
      },
    ],
    defaultPrimeRate: 8.5,
    defaultModifier: 2.5,
  };

  // Setup matter
  const matter: Matter = {
    id: 'EX-2024-001',
    clientName: 'Example Client',
    status: 'Active',
    notes: 'Rate change example',
    createdAt: new Date('2024-01-01'),
    principalBalance: 10000,
    totalDraws: 10000,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 0,
    interestPaid: 0,
    totalOwed: 10000,
  };

  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-03-31');

  // Calculate interest for period
  const result = calculateInterestForPeriod(matter, rateCalendar, startDate, endDate);

  // Calculate average rate
  const averageRate = calculateAverageRate(rateCalendar, startDate, endDate);

  // Get rates at different points
  const rateJan = getEffectiveRateForDate(rateCalendar, new Date('2024-01-15'));
  const rateFeb = getEffectiveRateForDate(rateCalendar, new Date('2024-02-15'));
  const rateMar = getEffectiveRateForDate(rateCalendar, new Date('2024-03-15'));

  // Output results
  console.log('Period:', startDate.toDateString(), 'to', endDate.toDateString());
  console.log('Days:', result.days);
  console.log('');
  console.log('Rates during period:');
  console.log('  January:', rateJan.totalRate + '%');
  console.log('  February:', rateFeb.totalRate + '%');
  console.log('  March:', rateMar.totalRate + '%');
  console.log('  Average:', averageRate.toFixed(2) + '%');
  console.log('');
  console.log('Total Interest:', result.totalInterest);
  console.log('Daily Balances Generated:', result.dailyBalances.length);

  return result;
}

// ============================================
// Example 3: Payment Allocation Across Multiple Matters
// ============================================

/**
 * Example 3: Allocate an interest payment using waterfall method
 * 
 * Scenario: $5,000 autodraft payment to be allocated across 3 matters
 * - Matter 1: $0 principal, $150 interest owed
 * - Matter 2: $8,000 principal, $400 interest owed
 * - Matter 3: $5,000 principal, $250 interest owed
 * 
 * Expected:
 * - Tier 1: Matter 1 gets $150 (all interest owed)
 * - Tier 2: $4,850 pro rata between Matters 2 and 3
 *   - Matter 2: $4,850 × (8000/13000) = $2,985
 *   - Matter 3: $4,850 × (5000/13000) = $1,865
 */
export function example3_PaymentAllocation() {
  console.log('=== Example 3: Payment Allocation (Waterfall) ===');

  // Setup rate calendar
  const rateCalendar: RateCalendar = {
    entries: [
      {
        effectiveDate: new Date('2024-01-01'),
        primeRate: 8.5,
        modifier: 2.5,
        totalRate: 11.0,
        source: 'Federal Reserve',
      },
    ],
    defaultPrimeRate: 8.5,
    defaultModifier: 2.5,
  };

  // Setup matters
  const matters: Matter[] = [
    {
      id: 'EX-2024-001',
      clientName: 'Tier 1 Matter',
      status: 'Active',
      notes: 'Zero principal balance',
      createdAt: new Date('2024-01-01'),
      principalBalance: 0,
      totalDraws: 5000,
      totalPrincipalPayments: 5000,
      totalInterestAccrued: 150,
      interestPaid: 0,
      totalOwed: 150,
    },
    {
      id: 'EX-2024-002',
      clientName: 'Tier 2 Matter A',
      status: 'Active',
      notes: 'High principal balance',
      createdAt: new Date('2024-01-01'),
      principalBalance: 8000,
      totalDraws: 13000,
      totalPrincipalPayments: 5000,
      totalInterestAccrued: 400,
      interestPaid: 0,
      totalOwed: 8400,
    },
    {
      id: 'EX-2024-003',
      clientName: 'Tier 2 Matter B',
      status: 'Active',
      notes: 'Medium principal balance',
      createdAt: new Date('2024-01-01'),
      principalBalance: 5000,
      totalDraws: 10000,
      totalPrincipalPayments: 5000,
      totalInterestAccrued: 250,
      interestPaid: 0,
      totalOwed: 5250,
    },
  ];

  const paymentAmount = 5000;
  const asOfDate = new Date('2024-03-01');

  // Allocate payment
  const result = allocatePaymentToInterest(paymentAmount, matters, rateCalendar, asOfDate);

  // Output results
  console.log('Payment Amount:', paymentAmount);
  console.log('Total Interest Owed:', result.totalInterestOwed);
  console.log('Number of Matters:', matters.length);
  console.log('');
  console.log('Allocations:');
  console.log('');
  console.log('TIER 1 (Zero Principal Balance):');
  const tier1Allocations = result.allocations.filter((a) => a.tier === 1);
  tier1Allocations.forEach((allocation) => {
    console.log(`  ${allocation.matterName} (${allocation.matterId}):`);
    console.log(`    Interest Owed: $${allocation.interestOwed.toFixed(2)}`);
    console.log(`    Allocated: $${allocation.allocatedAmount.toFixed(2)}`);
    console.log(`    Remaining: $${allocation.interestRemainingAfter.toFixed(2)}`);
  });
  console.log('');
  console.log('TIER 2 (Pro Rata Distribution):');
  const tier2Allocations = result.allocations.filter((a) => a.tier === 2);
  tier2Allocations.forEach((allocation) => {
    console.log(`  ${allocation.matterName} (${allocation.matterId}):`);
    console.log(`    Principal Balance: $${allocation.principalBalance.toFixed(2)}`);
    console.log(`    Interest Owed: $${allocation.interestOwed.toFixed(2)}`);
    console.log(`    Allocated: $${allocation.allocatedAmount.toFixed(2)}`);
    console.log(`    Remaining: $${allocation.interestRemainingAfter.toFixed(2)}`);
  });
  console.log('');
  console.log('Summary:');
  console.log('  Total Allocated:', result.allocatedToMatters);
  console.log('  Carry Forward:', result.carryForward);
  console.log('  Fully Allocated:', result.fullyAllocated);

  return result;
}

// ============================================
// Example 4: Payoff Calculation for a Matter
// ============================================

/**
 * Example 4: Calculate payoff amounts for a matter
 * 
 * Scenario: Matter with $10,000 principal and $300 unpaid interest
 * Expected:
 * - Firm Payoff: $10,000 (principal only)
 * - Client Payoff: $10,300 (principal + interest)
 */
export function example4_PayoffCalculation() {
  console.log('=== Example 4: Payoff Calculation ===');

  // Use a mock matter (or real matter from data)
  const matter: Matter = {
    id: 'EX-2024-004',
    clientName: 'Payoff Example Client',
    status: 'Active',
    notes: 'Payoff calculation example',
    createdAt: new Date('2024-01-01'),
    principalBalance: 10000,
    totalDraws: 10000,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 500,
    interestPaid: 200,
    totalOwed: 10300,
  };

  // Setup rate calendar
  const rateCalendar: RateCalendar = {
    entries: [
      {
        effectiveDate: new Date('2024-01-01'),
        primeRate: 8.5,
        modifier: 2.5,
        totalRate: 11.0,
        source: 'Federal Reserve',
      },
    ],
    defaultPrimeRate: 8.5,
    defaultModifier: 2.5,
  };

  const asOfDate = new Date('2024-03-31');

  // Calculate payoff
  const result = calculatePayoffAmount(matter, rateCalendar, asOfDate);

  // Output results
  console.log('Matter:', matter.id);
  console.log('Client:', matter.clientName);
  console.log('As of Date:', asOfDate.toDateString());
  console.log('');
  console.log('Payoff Breakdown:');
  console.log('  Principal Balance:', result.principalBalance.toFixed(2));
  console.log('  Total Interest Accrued:', result.interestAccrued.toFixed(2));
  console.log('  Interest Paid:', result.interestPaid.toFixed(2));
  console.log('  Interest Owed:', result.interestOwed.toFixed(2));
  console.log('');
  console.log('Payoff Amounts:');
  console.log('  FIRM Payoff:', result.totalFirmPayoff.toFixed(2));
  console.log('    (Principal balance only)');
  console.log('  CLIENT Payoff:', result.totalClientPayoff.toFixed(2));
  console.log('    (Principal + Unpaid Interest)');
  console.log('');
  console.log('Difference:', (result.totalClientPayoff - result.totalFirmPayoff).toFixed(2));
  console.log('  (Interest component)');

  return result;
}

// ============================================
// Example 5: Daily Balance Generation
// ============================================

/**
 * Example 5: Generate daily balances for a matter
 * 
 * Scenario: Matter with transactions over a 30-day period
 * Expected: Daily balance for each day with interest accrual
 */
export function example5_DailyBalanceGeneration() {
  console.log('=== Example 5: Daily Balance Generation ===');

  // Setup matter
  const matter: Matter = {
    id: 'EX-2024-005',
    clientName: 'Daily Balance Client',
    status: 'Active',
    notes: 'Daily balance example',
    createdAt: new Date('2024-03-01'),
    principalBalance: 5000,
    totalDraws: 10000,
    totalPrincipalPayments: 5000,
    totalInterestAccrued: 100,
    interestPaid: 0,
    totalOwed: 5100,
  };

  // Setup rate calendar
  const rateCalendar: RateCalendar = {
    entries: [
      {
        effectiveDate: new Date('2024-03-01'),
        primeRate: 8.5,
        modifier: 2.5,
        totalRate: 11.0,
        source: 'Federal Reserve',
      },
    ],
    defaultPrimeRate: 8.5,
    defaultModifier: 2.5,
  };

  const startDate = new Date('2024-03-01');
  const endDate = new Date('2024-03-31');

  // Mock transactions (would normally come from data store)
  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      date: new Date('2024-03-05'),
      type: 'Draw',
      category: 'Court & Filing Fees',
      amount: 2000,
      netAmount: 2000,
      status: 'Assigned',
      createdAt: new Date('2024-03-05'),
      allocations: [],
    },
    {
      id: 'TXN-002',
      date: new Date('2024-03-15'),
      type: 'Principal Payment',
      category: 'Principal Payment/Adjustment',
      amount: 2000,
      netAmount: -2000,
      status: 'Assigned',
      createdAt: new Date('2024-03-15'),
      allocations: [],
    },
  ];

  // Generate daily balances
  const result = generateDailyBalances(
    matter,
    rateCalendar,
    startDate,
    endDate,
    transactions
  );

  // Output results
  console.log('Matter:', matter.id);
  console.log('Period:', startDate.toDateString(), 'to', endDate.toDateString());
  console.log('Daily Balances Generated:', result.dailyBalances.length);
  console.log('');
  console.log('Sample Daily Balances (first 5 days):');
  result.dailyBalances.slice(0, 5).forEach((balance, index) => {
    console.log(`  Day ${index + 1} (${balance.date.toDateString()}):`);
    console.log(`    Principal Balance: $${balance.principalBalance.toFixed(2)}`);
    console.log(`    Interest Rate: ${balance.interestRate.toFixed(2)}%`);
    console.log(`    Daily Interest: $${balance.dailyInterest.toFixed(4)}`);
    console.log(`    Accrued Interest: $${balance.accruedInterest.toFixed(2)}`);
  });
  console.log('...');
  console.log('');
  console.log('Summary:');
  console.log('  Total Interest:', result.totalInterest.toFixed(2));
  console.log('  Average Rate:', result.averageRate.toFixed(2) + '%');

  return result;
}

// ============================================
// Run All Examples
// ============================================

export function runAllExamples() {
  console.log('========================================');
  console.log('Interest Calculation Examples');
  console.log('========================================');
  console.log('');

  example1_SimpleInterestCalculation();
  console.log('');

  example2_RateChangeHandling();
  console.log('');

  example3_PaymentAllocation();
  console.log('');

  example4_PayoffCalculation();
  console.log('');

  example5_DailyBalanceGeneration();
  console.log('');

  console.log('========================================');
  console.log('All examples completed');
  console.log('========================================');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}
