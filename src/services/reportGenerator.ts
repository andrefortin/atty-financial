// Report Generator Service
// Generates various report data structures for ATTY Financial application

import {
  PayoffReport,
  FundingReport,
  FinanceChargeReport,
  MatterSummaryReport,
  ClientPayoffReport,
  FirmPayoffReport,
} from '../types/reports';

/**
 * Generate a mock payoff report for a given matter
 */
export function generatePayoffReport(matterId: string): PayoffReport {
  const today = new Date();

  return {
    matterId,
    reportDate: today.toISOString(),
    reportType: 'FirmPayoff',
    principalBalance: 0,
    interestAccrued: 0,
    interestPaid: 0,
    principalPaid: 0,
    interestOwedNextAutodraft: 0,
    totalFirmPayoffAmount: 0,
    totalClientPayoffAmount: 0,
    clientPayoffDate: null,
    transactions: [],
  };
}

/**
 * Generate a mock funding report
 */
export function generateFundingReport(reportDate: Date = new Date(), drawAmount: number = 0): FundingReport {
  return {
    reportId: `FUND-${reportDate.getTime()}`,
    reportDate: reportDate.toISOString(),
    reportType: 'Funding',
    drawAmount,
    allocations: [],
    totalDrawAmount: drawAmount,
    transactions: [],
  };
}

/**
 * Generate a mock finance charge report
 */
export function generateFinanceChargeReport(chargeDate: Date = new Date(), totalAmount: number = 0): FinanceChargeReport {
  return {
    reportId: `FC-${chargeDate.getTime()}`,
    chargeDate: chargeDate.toISOString(),
    reportType: 'FinanceCharge',
    totalInterestAmount: totalAmount,
    allocations: [],
    transactions: [],
  };
}

/**
 * Generate a mock matter summary report
 */
export function generateMatterSummaryReport(generationDate: Date = new Date()): MatterSummaryReport {
  return {
    reportId: `MSUM-${generationDate.getTime()}`,
    generationDate: generationDate.toISOString(),
    reportType: 'MatterSummary',
    totalMatters: 0,
    activeMatters: 0,
    closedMatters: 0,
    totalPrincipalBalance: 0,
    totalInterestAccrued: 0,
    totalInterestPaid: 0,
    totalOwed: 0,
    transactions: [],
  };
}

/**
 * Generate a mock client payoff report
 */
export function generateClientPayoffReport(matterId: string): ClientPayoffReport {
  const today = new Date();

  return {
    matterId,
    reportDate: today.toISOString(),
    reportType: 'ClientPayoff',
    principalBalance: 0,
    interestAccrued: 0,
    interestPaid: 0,
    principalPaid: 0,
    totalClientPayoffAmount: 0,
    transactions: [],
  };
}

/**
 * Generate a mock firm payoff report
 */
export function generateFirmPayoffReport(matterId: string): FirmPayoffReport {
  const today = new Date();

  return {
    matterId,
    reportDate: today.toISOString(),
    reportType: 'FirmPayoff',
    principalBalance: 0,
    interestAccrued: 0,
    interestPaid: 0,
    principalPaid: 0,
    interestOwedNextAutodraft: 0,
    totalFirmPayoffAmount: 0,
    totalClientPayoffAmount: 0,
    transactions: [],
  };
}
