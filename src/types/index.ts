// Core Types for ATTY Financial Application

// Re-export Firestore types
export * from './firestore';

// ============================================
// Matter Types
// ============================================
export type MatterStatus = 'Active' | 'Closed' | 'Archive';

export interface Matter {
  id: string; // Matter ID (unique)
  clientName: string;
  status: MatterStatus;
  notes?: string;
  createdAt: Date;
  closedAt?: Date;

  // Derived/calculated fields
  totalDraws: number;
  totalPrincipalPayments: number;
  totalInterestAccrued: number;
  interestPaid: number;
  principalBalance: number;
  totalOwed: number;
}

export interface CreateMatterInput {
  id: string;
  clientName: string;
  notes?: string;
}

export interface UpdateMatterInput {
  clientName?: string;
  status?: MatterStatus;
  notes?: string;
}

// ============================================
// Transaction Types
// ============================================
export type TransactionType = 'Draw' | 'Principal Payment' | 'Interest Autodraft';
export type TransactionStatus = 'Unassigned' | 'Assigned' | 'Allocated';

export type ExpenseCategory =
  | 'Court & Filing Fees'
  | 'Service of Process'
  | 'Depositions & Transcripts'
  | 'Expert Witness Fees'
  | 'Medical Records & Related Costs'
  | 'Investigation & Evidence'
  | 'Discovery & Document Production'
  | 'Witness Costs'
  | 'Travel & Trial Preparation'
  | 'Mediation & Arbitration'
  | 'Miscellaneous';

export type PaymentCategory = 'Principal Payment/Adjustment' | 'Payoff';

export interface TransactionAllocation {
  matterId: string;
  matterName: string;
  amount: number;
}

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  category: ExpenseCategory | PaymentCategory | 'Monthly Interest Draft';
  amount: number;
  netAmount: number;
  status: TransactionStatus;
  description?: string;
  createdAt: Date;
  allocations: TransactionAllocation[];
}

export interface CreateTransactionInput {
  date: Date;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  allocations: Array<{
    matterId: string;
    amount: number;
  }>;
}

// ============================================
// Firm & Facility Types
// ============================================
export interface Firm {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string;
  primeRateModifier: number; // e.g., 2.5 for +2.5%
  lineOfCreditLimit: number;
  createdAt: Date;
  settings: FirmSettings;
}

export interface FirmSettings {
  dayCountConvention: 'ACT/360' | 'ACT/365' | '30/360';
  roundingMethod: 'Standard' | 'Bankers';
  complianceCertified: boolean;
  complianceCertifiedAt?: Date;
  complianceCertifiedBy?: string;
}

// ============================================
// Rate Calendar Types
// ============================================
export interface RateEntry {
  id: string;
  effectiveDate: Date;
  primeRate: number; // e.g., 8.5 for 8.5%
  modifier: number; // Firm-specific modifier
  totalRate: number; // Prime + modifier
  source?: string;
  notes?: string;
  createdAt: Date;
}

// ============================================
// Interest Allocation Types
// ============================================
export interface InterestAllocation {
  id: string;
  autodraftId: string;
  autodraftDate: Date;
  totalAmount: number;
  allocations: Array<{
    matterId: string;
    matterName: string;
    allocatedAmount: number;
    interestRemainingBefore: number;
    interestRemainingAfter: number;
    tier: 1 | 2; // Tier 1: $0 principal, Tier 2: Pro rata
  }>;
  carryForward: number;
  executedAt: Date;
}

export interface AllocationRequest {
  autodraftTransactionId: string;
  autodraftDate: Date;
  totalAmount: number;
}

// ============================================
// Daily Balance Types (Generated)
// ============================================
export interface DailyBalance {
  date: Date;
  matterId: string;
  principalBalance: number;
  interestRate: number;
  dailyInterest: number;
}

// ============================================
// Report Types
// ============================================
export type ReportType = 'FirmPayoff' | 'ClientPayoff' | 'Funding' | 'FinanceCharge';

export interface PayoffReport {
  matterId: string;
  matterClientName: string;
  reportDate: Date;
  summary: {
    totalDraws: number;
    totalInterestAccrued: number;
    principalPaid: number;
    interestPaid: number;
    interestOwedNextAutodraft: number;
    totalFirmPayoffAmount: number;
    totalClientPayoffAmount: number;
  };
  transactions: Transaction[];
}

export interface FundingReport {
  drawDate: Date;
  totalDrawAmount: number;
  items: Array<{
    matterId: string;
    clientName: string;
    purpose: string;
    amount: number;
  }>;
}

export interface FinanceChargeReport {
  paymentDate: Date;
  totalInterestPaymentAmount: number;
  allocations: Array<{
    matterId: string;
    clientName: string;
    principalBalance: number;
    interestPaymentAmount: number;
  }>;
}

// ============================================
// Calculator Types
// ============================================
export interface AnticipatedDrawInput {
  matterId: string;
  expenseAmount: number;
}

export interface AnticipatedDrawResult {
  selectedMatters: Array<{
    matterId: string;
    clientName: string;
    expenseAmount: number;
  }>;
  totalAmount: number;
}

export interface AnticipatedPayoffResult {
  selectedMatters: Array<{
    matterId: string;
    clientName: string;
    principalBalance: number;
  }>;
  totalPayoffAmount: number;
}

// ============================================
// Dashboard & UI Types
// ============================================
export interface DashboardSummary {
  totalPrincipalBalance: number;
  totalInterestAccrued: number;
  activeMattersCount: number;
  currentEffectiveRate: number;
  nextAutodraftDate: Date;
  nextAutodraftAmount: number;
  unassignedTransactionsCount: number;
  overdueMattersCount: number;
}

export interface MatterAlert {
  matterId: string;
  clientName: string;
  daysSinceClosure: number;
  principalBalance: number;
  alertLevel: 'Warning' | 'Error';
}

// ============================================
// Audit Types
// ============================================
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

// ============================================
// User Types
// ============================================
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Viewer';
  firmId: string;
  createdAt: Date;
}
