# Interest Calculator Service

The Interest Calculator Service provides comprehensive interest calculations for the ATTY Financial application using the ACT/360 day count convention.

## Overview

This service implements:
- **ACT/360 Day Count Convention**: Actual number of days divided by 360
- **Daily Interest Calculation**: Principal × Rate ÷ 360
- **Accrued Interest**: Interest calculations between dates with rate change support
- **Matter Balance Calculations**: Complete balance including principal, interest, and totals
- **Interest Allocation**: Pro rata and waterfall allocation methods
- **Daily Balance Generation**: Track daily balances over date ranges
- **Payoff Calculations**: Firm and client payoff amounts

## Installation

The service is part of the main codebase. Import from `src/services/interestCalculator.ts`:

```typescript
import {
  calculateDailyInterest,
  calculateAccruedInterest,
  calculateMatterBalance,
  allocateInterestToMatters,
} from '@/services/interestCalculator';
```

## Quick Start

### Calculate Daily Interest

```typescript
const dailyInterest = calculateDailyInterest(100000, 8.5);
console.log(dailyInterest); // 23.61

// Explanation: 100000 × 0.085 / 360 = 23.6111... → $23.61
```

### Calculate Accrued Interest for a Period

```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
const accruedInterest = calculateAccruedInterest(100000, 8.5, startDate, endDate);
console.log(accruedInterest); // 729.17

// Explanation: 100000 × 0.085 × (31 / 360) = 729.1666... → $729.17
```

### Calculate Matter Balance

```typescript
const balance = calculateMatterBalance('JON-2024-001', new Date('2024-03-20'));

console.log(balance.principalBalance); // Principal balance in dollars
console.log(balance.interestAccrued); // Total interest accrued
console.log(balance.interestPaid); // Interest already paid
console.log(balance.interestOwed); // Interest still owed
console.log(balance.totalOwed); // Principal + unpaid interest
```

### Allocate Interest Payment

```typescript
const allocation = allocateInterestToMatters(10000, new Date('2024-03-20'));

allocation.forEach((amount, matterId) => {
  console.log(`${matterId}: $${amount}`);
});
```

## API Reference

### Daily Interest Calculation

#### `calculateDailyInterest(principal, annualRate)`

Calculate daily interest for a given principal balance and annual rate.

**Parameters:**
- `principal` (number): The principal balance in dollars
- `annualRate` (number): The annual interest rate as a percentage (e.g., 8.5 for 8.5%)

**Returns:** `number` - Daily interest amount in dollars, rounded to the nearest cent

**Throws:**
- Error if principal is negative
- Error if annualRate is negative

**Formula:** `Principal × (Rate / 100) / 360`

**Example:**
```typescript
calculateDailyInterest(100000, 8.5) // Returns: 23.61
```

#### `calculateDailyInterestDetailed(principal, annualRate)`

Calculate daily interest with full result object.

**Parameters:**
- `principal` (number): The principal balance in dollars
- `annualRate` (number): The annual interest rate as a percentage

**Returns:** `DailyInterestResult` object containing:
- `principal` (number): The principal balance
- `annualRate` (number): The annual rate
- `dailyInterest` (number): The calculated daily interest
- `asOfDate` (Date): The calculation date

### Accrued Interest Calculation

#### `calculateAccruedInterest(principal, annualRate, startDate, endDate)`

Calculate accrued interest between two dates using ACT/360 convention.

**Parameters:**
- `principal` (number): The principal balance in dollars
- `annualRate` (number): The annual interest rate as a percentage
- `startDate` (Date): The start date for interest accrual
- `endDate` (Date): The end date for interest accrual

**Returns:** `number` - Total accrued interest in dollars, rounded to the nearest cent

**Formula:** `Principal × (Rate / 100) × (Days / 360)`

**Example:**
```typescript
calculateAccruedInterest(100000, 8.5, new Date('2024-01-01'), new Date('2024-01-31'))
// Returns: 729.17 (31 days in January)
```

#### `calculateAccruedInterestWithRateChanges(principal, startDate, endDate, rateChanges)`

Calculate accrued interest handling rate changes during the period.

**Parameters:**
- `principal` (number): The principal balance in dollars
- `startDate` (Date): The start date
- `endDate` (Date): The end date
- `rateChanges` (Array<{date: Date, rate: number}>): Array of rate changes

**Returns:** `number` - Total accrued interest

### Matter Balance Calculation

#### `calculateMatterBalance(matterId, asOfDate)`

Calculate complete matter balance as of a specific date.

**Parameters:**
- `matterId` (string): The matter ID
- `asOfDate` (Date): The date as of which to calculate the balance

**Returns:** `MatterBalance` object containing:
- `matterId` (string): The matter ID
- `clientName` (string): Client name
- `principalBalance` (number): Principal balance in dollars
- `interestAccrued` (number): Total interest accrued in dollars
- `interestPaid` (number): Interest already paid in dollars
- `interestOwed` (number): Interest still owed (accrued - paid) in dollars
- `totalOwed` (number): Total owed (principal + unpaid interest) in dollars
- `asOfDate` (Date): The calculation date

**Example:**
```typescript
const balance = calculateMatterBalance('JON-2024-001', new Date('2024-03-20'));
console.log(`Total Owed: $${balance.totalOwed.toLocaleString()}`);
```

#### `calculateMatterBalanceWithRateHistory(matterId, asOfDate)`

Calculate matter balance considering historical rate changes.

**Parameters:**
- `matterId` (string): The matter ID
- `asOfDate` (Date): The date as of which to calculate the balance

**Returns:** `MatterBalance` object

### Total Interest Calculation

#### `calculateTotalInterestAccrued(asOfDate)`

Calculate total interest accrued across all active matters.

**Parameters:**
- `asOfDate` (Date): The date as of which to calculate total interest

**Returns:** `number` - Total interest accrued in dollars

#### `calculateTotalInterestOwed(asOfDate)`

Calculate total interest owed across all active matters.

**Parameters:**
- `asOfDate` (Date): The date as of which to calculate total interest owed

**Returns:** `number` - Total interest owed in dollars

#### `calculateTotalOwed(asOfDate)`

Calculate total owed (principal + interest) across all active matters.

**Parameters:**
- `asOfDate` (Date): The date as of which to calculate total owed

**Returns:** `number` - Total amount owed in dollars

### Interest Allocation

#### `allocateInterestToMatters(interestAmount, date)`

Allocate interest payment across matters based on principal balances (pro rata).

**Parameters:**
- `interestAmount` (number): Total interest payment amount in dollars
- `date` (Date): The date of the interest allocation

**Returns:** `Map<string, number>` - Map of matter IDs to allocated amounts

**Allocation Method:** Pro rata based on each matter's principal balance

**Example:**
```typescript
const allocation = allocateInterestToMatters(10000, new Date('2024-03-20'));
allocation.forEach((amount, matterId) => {
  console.log(`${matterId}: $${amount}`);
});
```

#### `allocateInterestWaterfall(interestAmount, date)`

Allocate interest using waterfall method (Tier 1 + Tier 2).

**Parameters:**
- `interestAmount` (number): Total interest payment amount in dollars
- `date` (Date): The date of the interest allocation

**Returns:** `Map<string, number>` - Map of matter IDs to allocated amounts

**Waterfall Logic:**
1. **Tier 1**: Matters with $0 principal balance (interest-only matters)
2. **Tier 2**: Matters with principal balance > 0 (pro rata based on principal)

### Daily Balance Generation

#### `generateDailyBalancesForMatter(matterId, startDate, endDate)`

Generate daily balances for a matter over a date range.

**Parameters:**
- `matterId` (string): The matter ID
- `startDate` (Date): The start date of the period
- `endDate` (Date): The end date of the period

**Returns:** Array of `DailyBalance` objects containing:
- `date` (Date): The date
- `matterId` (string): The matter ID
- `principalBalance` (number): Principal balance on that date
- `interestRate` (number): Interest rate on that date
- `dailyInterest` (number): Daily interest accrued on that date

**Example:**
```typescript
const dailyBalances = generateDailyBalancesForMatter(
  'JON-2024-001',
  new Date('2024-03-01'),
  new Date('2024-03-05')
);

dailyBalances.forEach((balance) => {
  console.log(`${balance.date.toLocaleDateString()}: $${balance.dailyInterest.toFixed(2)}`);
});
```

### Payoff Calculation

#### `calculateMatterPayoff(matterId, asOfDate)`

Calculate payoff amounts for a matter.

**Parameters:**
- `matterId` (string): The matter ID
- `asOfDate` (Date): The date as of which to calculate payoff

**Returns:** Object containing:
- `matterId` (string): The matter ID
- `clientName` (string): Client name
- `principalBalance` (number): Principal balance in dollars
- `interestOwed` (number): Interest owed in dollars
- `firmPayoff` (number): Firm payoff amount (principal only)
- `clientPayoff` (number): Client payoff amount (principal + interest)
- `asOfDate` (Date): The calculation date

**Example:**
```typescript
const payoff = calculateMatterPayoff('JON-2024-001', new Date('2024-03-20'));
console.log(`Firm Payoff: $${payoff.firmPayoff.toLocaleString()}`);
console.log(`Client Payoff: $${payoff.clientPayoff.toLocaleString()}`);
```

### Helper Functions

#### `getEffectiveRate(date)`

Get the effective interest rate for a specific date from the rate calendar.

**Parameters:**
- `date` (Date): The date to get the rate for

**Returns:** `number` - The effective interest rate as a percentage

#### `getNextAutodraftDate(fromDate?)`

Calculate the next autodraft date (15th of each month).

**Parameters:**
- `fromDate` (Date, optional): The date to calculate from (defaults to today)

**Returns:** `Date` - The next autodraft date

**Example:**
```typescript
getNextAutodraftDate(new Date('2024-03-10')); // Returns: 2024-03-15
getNextAutodraftDate(new Date('2024-03-20')); // Returns: 2024-04-15
```

#### `formatInterestAmount(amount)`

Format interest amount as a currency string.

**Parameters:**
- `amount` (number): The interest amount in dollars

**Returns:** `string` - Formatted currency string (e.g., "$1,234.56")

**Example:**
```typescript
formatInterestAmount(1234.56); // Returns: "$1,234.56"
```

#### `formatInterestRate(rate, decimals?)`

Format interest rate as a percentage string.

**Parameters:**
- `rate` (number): The interest rate as a percentage
- `decimals` (number, optional): Number of decimal places (default: 2)

**Returns:** `string` - Formatted percentage string (e.g., "8.50%")

**Example:**
```typescript
formatInterestRate(8.5); // Returns: "8.50%"
formatInterestRate(8.5, 3); // Returns: "8.500%"
```

## ACT/360 Day Count Convention

The ACT/360 convention calculates interest using the actual number of days in the period divided by 360:

```
Interest = Principal × Rate × (Actual Days / 360)
```

### Examples:

- **January (31 days)**: 100000 × 8.5% × (31/360) = $729.17
- **February (28 days)**: 100000 × 8.5% × (28/360) = $658.33
- **Full Year (365 days)**: 100000 × 8.5% × (365/360) = $8,590.28

This convention is commonly used in commercial lending and money markets.

## Integration with Stores

The interest calculator integrates seamlessly with Zustand stores:

```typescript
import { useMatterStore, useTransactionStore, useFirmStore } from '@/store';

// Stores are automatically accessed within the service
const balance = calculateMatterBalance('JON-2024-001', new Date());
const rate = getEffectiveRate(new Date());
```

## Error Handling

All functions include proper error handling:

```typescript
try {
  const balance = calculateMatterBalance('INVALID-ID', new Date());
} catch (error) {
  console.error('Error calculating balance:', error.message);
  // "Matter not found: INVALID-ID"
}
```

## Testing

Run the test suite:

```bash
npm test src/services/__tests__/interestCalculator.test.ts
```

## Examples

See `src/services/example.ts` for comprehensive usage examples covering all functions.

## Type Safety

The service is fully typed with TypeScript. Import types from the service:

```typescript
import type {
  MatterBalance,
  DailyInterestResult,
} from '@/services/interestCalculator';
```

## Best Practices

1. **Always use the current effective rate**: Use `getEffectiveRate()` to get the rate for a specific date
2. **Handle rate changes**: Use `calculateAccruedInterestWithRateChanges()` for historical periods
3. **Use waterfall allocation**: Prefer `allocateInterestWaterfall()` for proper interest allocation
4. **Round consistently**: All amounts are rounded to the nearest cent automatically
5. **Validate inputs**: Functions throw errors for invalid inputs (negative values, etc.)

## Performance Considerations

- **Daily balance generation**: Can be computationally expensive for long date ranges
- **Multiple matter calculations**: Consider batching for better performance
- **Rate history lookup**: O(n) for rate calendar entries
- **Transaction processing**: Sorted once per calculation

## Future Enhancements

- Support for other day count conventions (ACT/365, 30/360)
- Caching for frequently accessed calculations
- Batch calculation API for multiple matters
- Interest calculation with compounding
- Support for tiered interest rates
