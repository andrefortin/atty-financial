// Interest Calculator Service - Usage Examples
// This file demonstrates how to use the interest calculator service

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
} from './interestCalculator';

// ============================================
// Daily Interest Calculation Examples
// ============================================

/**
 * Example 1: Calculate daily interest for a specific principal and rate
 */
export const exampleDailyInterest = () => {
  const principal = 100000; // $100,000 principal balance
  const annualRate = 8.5; // 8.5% annual rate

  const dailyInterest = calculateDailyInterest(principal, annualRate);
  console.log(`Daily interest on $${principal.toLocaleString()} at ${annualRate}%: $${dailyInterest.toFixed(2)}`);
  // Output: Daily interest on $100,000 at 8.5%: $23.61

  // Explanation: 100000 * 0.085 / 360 = 23.6111... → $23.61
};

/**
 * Example 2: Get detailed daily interest information
 */
export const exampleDailyInterestDetailed = () => {
  const result = calculateDailyInterestDetailed(100000, 8.5);

  console.log('Daily Interest Details:');
  console.log(`  Principal: $${result.principal.toLocaleString()}`);
  console.log(`  Annual Rate: ${result.annualRate}%`);
  console.log(`  Daily Interest: $${result.dailyInterest.toFixed(2)}`);
  console.log(`  As Of: ${result.asOfDate.toISOString()}`);
};

// ============================================
// Accrued Interest Calculation Examples
// ============================================

/**
 * Example 3: Calculate accrued interest for a specific period
 */
export const exampleAccruedInterest = () => {
  const principal = 100000;
  const annualRate = 8.5;
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31'); // 31 days in January

  const accruedInterest = calculateAccruedInterest(principal, annualRate, startDate, endDate);
  console.log(`Accrued interest from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}: $${accruedInterest.toFixed(2)}`);
  // Output: Accrued interest from 1/1/2024 to 1/31/2024: $729.17

  // Explanation: 100000 * 0.085 * (31 / 360) = 729.1666... → $729.17
};

/**
 * Example 4: Calculate accrued interest with rate changes during the period
 */
export const exampleAccruedInterestWithRateChanges = () => {
  const principal = 100000;
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-03-31');

  const rateChanges = [
    { date: new Date('2024-02-01'), rate: 9.0 }, // Rate increased to 9.0% on Feb 1
    { date: new Date('2024-03-01'), rate: 8.75 }, // Rate decreased to 8.75% on Mar 1
  ];

  const accruedInterest = calculateAccruedInterestWithRateChanges(
    principal,
    startDate,
    endDate,
    rateChanges
  );

  console.log(`Accrued interest with rate changes: $${accruedInterest.toFixed(2)}`);
  // This will calculate interest for each period separately and sum them
};

// ============================================
// Matter Balance Calculation Examples
// ============================================

/**
 * Example 5: Calculate complete balance for a specific matter
 */
export const exampleMatterBalance = () => {
  const matterId = 'JON-2024-001';
  const asOfDate = new Date('2024-03-20');

  const balance = calculateMatterBalance(matterId, asOfDate);

  console.log(`Balance for matter ${matterId} as of ${asOfDate.toLocaleDateString()}:`);
  console.log(`  Client: ${balance.clientName}`);
  console.log(`  Principal Balance: $${balance.principalBalance.toLocaleString()}`);
  console.log(`  Interest Accrued: $${balance.interestAccrued.toLocaleString()}`);
  console.log(`  Interest Paid: $${balance.interestPaid.toLocaleString()}`);
  console.log(`  Interest Owed: $${balance.interestOwed.toLocaleString()}`);
  console.log(`  Total Owed: $${balance.totalOwed.toLocaleString()}`);
};

/**
 * Example 6: Calculate matter balance considering rate history
 */
export const exampleMatterBalanceWithRateHistory = () => {
  const matterId = 'DOD-2024-003';
  const asOfDate = new Date('2024-03-20');

  const balance = calculateMatterBalanceWithRateHistory(matterId, asOfDate);

  console.log(`Balance with rate history for matter ${matterId}:`);
  console.log(`  Principal Balance: $${balance.principalBalance.toLocaleString()}`);
  console.log(`  Interest Accrued: $${balance.interestAccrued.toLocaleString()}`);
  console.log(`  Total Owed: $${balance.totalOwed.toLocaleString()}`);
};

// ============================================
// Total Interest Calculation Examples
// ============================================

/**
 * Example 7: Calculate total interest accrued across all active matters
 */
export const exampleTotalInterestAccrued = () => {
  const asOfDate = new Date('2024-03-20');

  const totalInterest = calculateTotalInterestAccrued(asOfDate);
  console.log(`Total interest accrued across all active matters: $${totalInterest.toLocaleString()}`);
};

/**
 * Example 8: Calculate total interest owed across all active matters
 */
export const exampleTotalInterestOwed = () => {
  const asOfDate = new Date('2024-03-20');

  const totalOwed = calculateTotalInterestOwed(asOfDate);
  console.log(`Total interest owed across all active matters: $${totalOwed.toLocaleString()}`);
};

/**
 * Example 9: Calculate total owed (principal + interest) across all active matters
 */
export const exampleTotalOwed = () => {
  const asOfDate = new Date('2024-03-20');

  const totalOwed = calculateTotalOwed(asOfDate);
  console.log(`Total owed (principal + interest) across all active matters: $${totalOwed.toLocaleString()}`);
};

// ============================================
// Interest Allocation Examples
// ============================================

/**
 * Example 10: Allocate interest payment across matters (pro rata by principal balance)
 */
export const exampleAllocateInterest = () => {
  const interestAmount = 10000; // $10,000 interest payment
  const allocationDate = new Date('2024-03-20');

  const allocation = allocateInterestToMatters(interestAmount, allocationDate);

  console.log(`Interest allocation of $${interestAmount.toLocaleString()}:`);
  allocation.forEach((amount, matterId) => {
    console.log(`  ${matterId}: $${amount.toLocaleString()}`);
  });

  // Verify total
  let total = 0;
  allocation.forEach((amount) => total += amount);
  console.log(`  Total: $${total.toLocaleString()} (should equal $${interestAmount.toLocaleString()})`);
};

/**
 * Example 11: Allocate interest using waterfall method (Tier 1 + Tier 2)
 */
export const exampleAllocateInterestWaterfall = () => {
  const interestAmount = 10000;
  const allocationDate = new Date('2024-03-20');

  const allocation = allocateInterestWaterfall(interestAmount, allocationDate);

  console.log(`Waterfall interest allocation of $${interestAmount.toLocaleString()}:`);
  allocation.forEach((amount, matterId) => {
    console.log(`  ${matterId}: $${amount.toLocaleString()}`);
  });

  // Verify total
  let total = 0;
  allocation.forEach((amount) => total += amount);
  console.log(`  Total: $${total.toLocaleString()}`);
};

// ============================================
// Daily Balance Generation Examples
// ============================================

/**
 * Example 12: Generate daily balances for a matter over a period
 */
export const exampleGenerateDailyBalances = () => {
  const matterId = 'JON-2024-001';
  const startDate = new Date('2024-03-01');
  const endDate = new Date('2024-03-05');

  const dailyBalances = generateDailyBalancesForMatter(matterId, startDate, endDate);

  console.log(`Daily balances for matter ${matterId}:`);
  dailyBalances.forEach((balance) => {
    console.log(`  ${balance.date.toLocaleDateString()}:`);
    console.log(`    Principal: $${balance.principalBalance.toLocaleString()}`);
    console.log(`    Rate: ${balance.interestRate}%`);
    console.log(`    Daily Interest: $${balance.dailyInterest.toFixed(2)}`);
  });
};

// ============================================
// Payoff Calculation Examples
// ============================================

/**
 * Example 13: Calculate payoff amounts for a matter
 */
export const exampleMatterPayoff = () => {
  const matterId = 'JON-2024-001';
  const asOfDate = new Date('2024-03-20');

  const payoff = calculateMatterPayoff(matterId, asOfDate);

  console.log(`Payoff information for matter ${matterId}:`);
  console.log(`  Client: ${payoff.clientName}`);
  console.log(`  Principal Balance: $${payoff.principalBalance.toLocaleString()}`);
  console.log(`  Interest Owed: $${payoff.interestOwed.toLocaleString()}`);
  console.log(`  Firm Payoff (principal only): $${payoff.firmPayoff.toLocaleString()}`);
  console.log(`  Client Payoff (principal + interest): $${payoff.clientPayoff.toLocaleString()}`);
  console.log(`  As Of: ${payoff.asOfDate.toLocaleDateString()}`);
};

// ============================================
// Helper Function Examples
// ============================================

/**
 * Example 14: Get effective rate for a specific date
 */
export const exampleGetEffectiveRate = () => {
  const date = new Date('2024-03-20');
  const rate = getEffectiveRate(date);

  console.log(`Effective interest rate as of ${date.toLocaleDateString()}: ${rate}%`);
};

/**
 * Example 15: Get next autodraft date
 */
export const exampleGetNextAutodraftDate = () => {
  // From March 10th, next autodraft is March 15th
  const next1 = getNextAutodraftDate(new Date('2024-03-10'));
  console.log(`Next autodraft from March 10: ${next1.toLocaleDateString()}`);

  // From March 20th, next autodraft is April 15th
  const next2 = getNextAutodraftDate(new Date('2024-03-20'));
  console.log(`Next autodraft from March 20: ${next2.toLocaleDateString()}`);
};

/**
 * Example 16: Format interest amount as currency
 */
export const exampleFormatInterestAmount = () => {
  const amount = 1234.5678;
  const formatted = formatInterestAmount(amount);

  console.log(`Formatted interest amount: ${formatted}`); // $1,234.57
};

/**
 * Example 17: Format interest rate as percentage
 */
export const exampleFormatInterestRate = () => {
  const rate = 8.5;
  const formatted = formatInterestRate(rate);

  console.log(`Formatted interest rate: ${formatted}`); // 8.50%
};

// ============================================
// Complex Example: Complete Interest Calculation Flow
// ============================================

/**
 * Example 18: Complete interest calculation and allocation flow
 */
export const exampleCompleteFlow = () => {
  console.log('=== Complete Interest Calculation Flow ===\n');

  // 1. Calculate daily interest
  const dailyInterest = calculateDailyInterest(100000, 8.5);
  console.log(`1. Daily Interest: $${dailyInterest.toFixed(2)}\n`);

  // 2. Calculate accrued interest for January
  const januaryInterest = calculateAccruedInterest(
    100000,
    8.5,
    new Date('2024-01-01'),
    new Date('2024-01-31')
  );
  console.log(`2. January Interest: $${januaryInterest.toFixed(2)}\n`);

  // 3. Get matter balance
  const balance = calculateMatterBalance('JON-2024-001', new Date('2024-03-20'));
  console.log('3. Matter Balance:');
  console.log(`   Principal: $${balance.principalBalance.toLocaleString()}`);
  console.log(`   Interest Owed: $${balance.interestOwed.toLocaleString()}`);
  console.log(`   Total Owed: $${balance.totalOwed.toLocaleString()}\n`);

  // 4. Allocate interest payment
  const allocation = allocateInterestToMatters(5000, new Date('2024-03-20'));
  console.log('4. Interest Allocation:');
  allocation.forEach((amount, matterId) => {
    console.log(`   ${matterId}: $${amount.toLocaleString()}`);
  });
  console.log();

  // 5. Calculate payoff
  const payoff = calculateMatterPayoff('JON-2024-001', new Date('2024-03-20'));
  console.log('5. Payoff:');
  console.log(`   Firm: $${payoff.firmPayoff.toLocaleString()}`);
  console.log(`   Client: $${payoff.clientPayoff.toLocaleString()}\n`);

  // 6. Get next autodraft date
  const nextAutodraft = getNextAutodraftDate();
  console.log(`6. Next Autodraft: ${nextAutodraft.toLocaleDateString()}\n`);
};

// ============================================
// Example: ACT/360 Day Count Convention
// ============================================

/**
 * Example 19: Understanding ACT/360 convention
 */
export const exampleAct360Convention = () => {
  console.log('ACT/360 Day Count Convention Examples:\n');

  const principal = 100000;
  const rate = 8.5;

  // January (31 days)
  const janInterest = calculateAccruedInterest(
    principal,
    rate,
    new Date('2024-01-01'),
    new Date('2024-01-31')
  );
  console.log(`January (31 days): $${janInterest.toFixed(2)}`);
  console.log(`  Formula: ${principal} × ${rate / 100} × (31 / 360) = ${janInterest.toFixed(2)}\n`);

  // February (29 days in leap year)
  const febInterest = calculateAccruedInterest(
    principal,
    rate,
    new Date('2024-02-01'),
    new Date('2024-02-29')
  );
  console.log(`February 2024 (29 days, leap year): $${febInterest.toFixed(2)}`);
  console.log(`  Formula: ${principal} × ${rate / 100} × (29 / 360) = ${febInterest.toFixed(2)}\n`);

  // Full year (365 days in actual, divided by 360 in convention)
  const yearInterest = calculateAccruedInterest(
    principal,
    rate,
    new Date('2024-01-01'),
    new Date('2024-12-31')
  );
  console.log(`Full Year (365 days): $${yearInterest.toFixed(2)}`);
  console.log(`  Formula: ${principal} × ${rate / 100} × (365 / 360) = ${yearInterest.toFixed(2)}`);
};

// ============================================
// Run all examples
// ============================================

export const runAllExamples = () => {
  console.log('\n========================================');
  console.log('  Interest Calculator - Usage Examples');
  console.log('========================================\n');

  exampleDailyInterest();
  console.log();

  exampleAccruedInterest();
  console.log();

  exampleMatterBalance();
  console.log();

  exampleTotalInterestAccrued();
  console.log();

  exampleAllocateInterest();
  console.log();

  exampleMatterPayoff();
  console.log();

  exampleAct360Convention();
  console.log();

  exampleCompleteFlow();
};
