
/**
 * Firestore Types Index
 *
 * Central export point for all Firestore types.
 *
 * @module types/firestore
 */

// Re-export all types
export * from './firestore';

// Export collection names
export const COLLECTION_NAMES = {
  USERS: 'users',
  FIRMS: 'firms',
  MATTERS: 'matters',
  TRANSACTIONS: 'transactions',
  RATE_ENTRIES: 'rate_entries',
  DAILY_BALANCES: 'daily_balances',
  ALLOCATIONS: 'allocations',
  ALLOCATION_DETAILS: 'allocation_details',
  BANK_FEEDS: 'bank_feeds',
  AUDIT_LOGS: 'audit_logs',
  COMPLIANCE_CERTIFICATES: 'compliance_certificates',
  COMPLIANCE_POLICIES: 'compliance_policies',
  COMPLIANCE_REPORTS: 'compliance_reports',
  COMPLIANCE_STATUS: 'compliance_status',
  COMPLIANCE_ALIGNED_PRACTICES: 'compliance_aligned_practices',
} as const;

// Export collection types explicitly
export type {
  FirestoreUser,
  FirestoreUserData,
} from './firestore';

export type {
  FirestoreFirm,
  FirestoreFirmData,
} from './firestore';

export type {
  FirestoreMatter,
  FirestoreMatterData,
} from './firestore';

export type {
  FirestoreTransaction,
  FirestoreTransactionData,
} from './firestore';

export type {
  FirestoreRateEntry,
  FirestoreRateEntryData,
} from './firestore';

export type {
  FirestoreDailyBalance,
  FirestoreDailyBalanceData,
} from './firestore';

export type {
  FirestoreAllocation,
  FirestoreAllocationData,
} from './firestore';

export type {
  FirestoreAllocationDetail,
  FirestoreAllocationDetailData,
  FirestoreBankFeed,
  FirestoreBankFeedData,
} from './firestore';

export type {
  FirestoreAuditLog,
  FirestoreAuditLogData,
  FirestoreCompliance,
  FirestoreComplianceData,
  FirestoreComplianceCertificate,
  FirestoreComplianceCertificateData,
  FirestoreComplianceReport,
  FirestoreComplianceReportData,
  FirestoreComplianceReportSection,
  FirestoreComplianceReportSectionData,
  FirestoreComplianceStatus,
  FirestoreComplianceStatusData,
  FirestoreSOC2AlignedPractice,
  FirestoreSOC2AlignedPracticeData,
  FirestoreDataRetentionPolicy,
  FirestoreDataRetentionPolicyData,
} from './firestore';
