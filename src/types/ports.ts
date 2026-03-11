// Report Types for ATTY Financial Application
// Defines all report data structures

export interface PayoffReport {
  reportId: string;
  reportDate: string; // ISO 8601 date string
  reportType: 'FirmPayoff' | 'ClientPayoff';
  principalBalance: number;
  interestAccrued: number;
  interestPaid: number;
  principalPaid: number;
  interestOwedNextAutodraft: number;
  totalFirmPayoffAmount: number;
  totalClientPayoffAmount: number;
  clientPayoffDate: string | null; // Date when client pays in full
  transactions: TransactionAllocation[];
}

export interface FundingReport {
  reportId: string;
  reportDate: string;
  reportType: 'Funding';
  drawAmount: number;
  totalDrawAmount: number;
  allocations: FundingAllocation[];
  transactions: Transaction[];
}

export interface FinanceChargeReport {
  reportId: string;
  chargeDate: string;
  reportType: 'FinanceCharge';
  totalInterestAmount: number;
  allocations: FinanceChargeAllocation[];
  transactions: Transaction[];
}

export interface MatterSummaryReport {
  reportId: string;
  reportDate: string;
  reportType: 'MatterSummary';
  totalMatters: number;
  activeMatters: number;
  closedMatters: number;
  totalPrincipalBalance: number;
  totalInterestAccrued: number;
  totalInterestPaid: number;
  totalOwed: number;
  transactions: Transaction[];
}

export interface ClientPayoffReport {
  reportId: string;
  reportDate: string;
  reportType: 'ClientPayoff';
  principalBalance: number;
  interestAccrued: number;
  interestPaid: number;
  principalPaid: number;
  interestOwedNextAutodraft: number;
  totalClientPayoffAmount: number;
  clientPayoffDate: string | null;
  transactions: TransactionAllocation[];
}

export interface FirmPayoffReport {
  reportId: string;
  reportDate: string;
  reportType: 'FirmPayoff';
  principalBalance: number;
  interestAccrued: number;
  interestPaid: number;
  principalPaid: number;
  interestOwedNextAutodraft: number;
  totalFirmPayoffAmount: number;
  totalClientPayoffAmount: number;
  clientPayoffDate: string | null;
  firmPayoffDate: string | null;
  transactions: Transaction[];
}

export interface FundingAllocation {
  matterId: string;
  amount: number;
  purpose: string;
}

export interface FinanceChargeAllocation {
  matterId: string;
  amount: number;
  interestAmount: number;
}

export interface TransactionAllocation {
  transactionId: string;
  matterId: string;
  amount: number;
  category: string;
  type: string;
}

export type ReportType =
  | 'FirmPayoff'
  | 'ClientPayoff'
  | 'Funding'
  | 'FinanceCharge'
  | 'MatterSummary';

export interface ReportOptions {
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeClosed?: boolean;
  includeArchived?: boolean;
}

export interface ReportConfig {
  reportType: ReportType;
  options: ReportOptions;
}

// Settings Page Types
export interface SettingsTab {
  id: 'firm' | 'rate-calendar' | 'preferences';
  label: string;
  icon: string;
}

export interface FirmSettings {
  firmName: string;
  firmAddress: string;
  firmCity: string;
  firmState: string;
  firmZip: string;
  firmPhone: string;
  firmEmail: string;
  firmLicenseNumber: string;
  barNumber: string;
  dateEstablished: Date;
  operatingAccount: string;
  routingNumber: string;
  abaNumber: string;
  wireTransferInstructions: string;
}

export interface RateCalendarEntry {
  id: string;
  rate: number;
  effectiveDate: Date;
  rateType: 'fixed' | 'variable';
  rateBasis: 'act-360' | 'act-365' | 'act-366';
  minimumBalance: number;
  maximumBalance: number;
  documentation?: string;
}

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeZone: string;
  notifications: boolean;
  autoSave: boolean;
}

export interface SettingsState {
  currentTab: SettingsTab;
  firmSettings: FirmSettings;
  rateCalendar: RateCalendarEntry[];
  preferences: Preferences;
}

// Calculator Types
export interface DrawCalculationResult {
  eligibleAmount: number;
  minimumAmount: number;
  maximumAmount: number;
  availableBalance: number;
  utilizedBalance: number;
  utilizationPercentage: number;
  eligibleMatters: string[];
  messages: string[];
}

export interface PayoffCalculationResult {
  totalPayoffAmount: number;
  principalBalance: number;
  interestAccrued: number;
  interestPaid: number;
  totalOwed: number;
  payoffDate: Date;
  payoffBreakdown: {
    principal: number;
    interest: number;
    total: number;
  };
  allocatedMatters: string[];
  messages: string[];
}

export interface InterestCalculationResult {
  principalBalance: number;
  rate: number;
  rateBasis: 'act-360' | 'act-365' | 'act-366';
  startDate: Date;
  endDate: Date;
  daysAccrued: number;
  dailyInterest: number;
  totalInterestAccrued: number;
  averageDailyInterest: number;
  breakdown: {
    [date: string, amount: number][];
  };
  messages: string[];
}

export interface CalculatorState {
  selectedMatterId: string | null;
  selectedDateRange: {
    from: Date;
    to: Date;
  } | null;
  drawAmount: number;
  distributionMethod: 'pro-rata' | 'manual';
  allocations: {
    matterId: string;
    amount: number;
  }[];
}

export interface CalculatorTab {
  id: 'draw' | 'payoff' | 'interest';
  label: string;
  icon: string;
}

// Compliance Types
export interface ComplianceCertification {
  id: string;
  certificationType: 'firm-registration' | 'attorney-registration' | 'trust-account' | 'escrow';
  certificationNumber: string;
  certifiedDate: Date;
  expiresDate: Date;
  documents: string[];
  status: 'active' | 'expired' | 'revoked' | 'suspended';
}

export interface ComplianceCheck {
  id: string;
  checkType: 'attorney-registration' | 'trust-account' | 'escrow' | 'firm-registration';
  status: 'pending' | 'passed' | 'failed' | 'warning';
  description: string;
  lastChecked: Date;
  nextDueDate: Date | null;
  documents: string[];
}

export interface ComplianceState {
  certifications: ComplianceCertification[];
  checks: ComplianceCheck[];
  showCertificationModal: boolean;
  selectedCertification: string | null;
}
