/**
 * Firebase Audit Hooks
 *
 * React Query integration for audit log operations.
 * Compliance status and audit trail queries.
 *
 * @module hooks/firebase/useFirebaseAudit
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateAuditLogInput,
  AuditLogQueryFilters,
  AuditLogSummary,
} from '@/services/firebase/auditLogs.service';
import type {
  ComplianceAssessmentResult,
} from '@/services/firebase/compliance.service';
import {
  createAuditLog,
  getAuditLogById,
  getAuditLogsByFirm,
  getAuditLogsByUser,
  getAuditLogsByCollection,
  getAuditLogsByDocument,
  getAuditLogsByMatter,
  getAuditLogsByTransaction,
  getAuditLogsByAllocation,
  getAuditLogsByBankFeed,
  getAuditLogsByDateRange,
  getAuditLogsByComplianceStatus,
  getAuditLogsByRiskLevel,
  getUnreviewedAuditLogs,
  getReviewedAuditLogs,
  getFailedAuditLogs,
  getAuditLogsPaginated,
  getAuditLogSummary,
  createAuditLogsBatch,
  updateAuditLogsBatch,
  getAuditLogsByUsers,
  getAuditLogsByDocuments,
  getAuditLogsByMatters,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
} from '@/services/firebase/auditLogs.service';
import {
  assessCompliance,
  getComplianceCertificatesByFirm,
  getActiveComplianceCertificates,
  createComplianceCertificate,
  updateComplianceCertificate,
  deleteComplianceCertificate,
  createDataRetentionPolicy,
  getDataRetentionPolicyById,
  getDataRetentionPoliciesByFirm,
  getActiveDataRetentionPolicies,
  updateDataRetentionPolicy,
  deleteDataRetentionPolicy,
  createComplianceReport,
  getComplianceReportById,
  getComplianceReportsByFirm,
  getCompletedComplianceReports,
  updateComplianceReport,
  deleteComplianceReport,
  getComplianceStatusByFirm,
  createSOC2AlignedPractice,
  getSOC2AlignedPracticesByFirm,
  updateSOC2AlignedPractice,
  deleteSOC2AlignedPractice,
} from '@/services/firebase/compliance.service';
import type { FirestoreDocument, FirestoreAuditLog, FirestoreAuditLogData } from '@/types/firestore';

// ============================================
// Types
// ============================================

export interface UseAuditLogsOptions {
  firmId: string;
  userId?: string;
  operation?: 'create' | 'update' | 'delete' | 'read' | 'batch' | 'match' | 'reconcile';
  collection?: string;
  documentId?: string;
  matterId?: string;
  transactionId?: string;
  allocationId?: string;
  bankFeedId?: string;
  startDate?: number;
  endDate?: number;
  success?: boolean;
  complianceStatus?: 'compliant' | 'non-compliant' | 'flagged' | 'investigated';
  riskLevel?: number;
  reviewed?: boolean;
  minRiskLevel?: number;
  maxRiskLevel?: number;
  remoteIp?: string;
  requestId?: string;
  sessionId?: string;
  page?: number;
  pageSize?: number;
}

export interface UseAuditLogSummaryOptions {
  firmId: string;
  userId?: string;
  startDate?: number;
  endDate?: number;
}

export interface UseComplianceCertificatesOptions {
  firmId: string;
  status?: 'pending' | 'in-review' | 'approved' | 'rejected' | 'expired';
  certificateType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS';
  limit?: number;
}

export interface UseComplianceReportsOptions {
  firmId: string;
  status?: 'draft' | 'in-review' | 'completed' | 'published';
  reportType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
  limit?: number;
}

export interface UseComplianceStatusOptions {
  firmId: string;
  complianceType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
}

// ============================================
// Audit Log Hooks
// ============================================

/**
 * Hook for fetching audit logs by firm
 */
export function useAuditLogsByFirm(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'firm', options.firmId, options.operation, options.startDate, options.endDate, options.limit],
    queryFn: async () => {
      if (!options.firmId) {
        return [];
      }

      const result = await getAuditLogsByFirm(options.firmId, {
        operation: options.operation,
        startDate: options.startDate,
        endDate: options.endDate,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by user
 */
export function useAuditLogsByUser(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'user', options.userId, options.operation, options.startDate, options.endDate, options.limit],
    queryFn: async () => {
      if (!options.userId) {
        return [];
      }

      const result = await getAuditLogsByUser(options.userId, {
        operation: options.operation,
        startDate: options.startDate,
        endDate: options.endDate,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by collection
 */
export function useAuditLogsByCollection(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'collection', options.collection, options.operation, options.limit],
    queryFn: async () => {
      if (!options.collection) {
        return [];
      }

      const result = await getAuditLogsByCollection(options.collection, {
        operation: options.operation,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.collection,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by document
 */
export function useAuditLogsByDocument(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'document', options.documentId, options.operation, options.limit],
    queryFn: async () => {
      if (!options.documentId) {
        return [];
      }

      const result = await getAuditLogsByDocument(options.documentId, {
        operation: options.operation,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.documentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by matter
 */
export function useAuditLogsByMatter(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'matter', options.matterId, options.operation, options.limit],
    queryFn: async () => {
      if (!options.matterId) {
        return [];
      }

      const result = await getAuditLogsByMatter(options.matterId, {
        operation: options.operation,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.matterId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by transaction
 */
export function useAuditLogsByTransaction(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'transaction', options.transactionId, options.operation, options.limit],
    queryFn: async () => {
      if (!options.transactionId) {
        return [];
      }

      const result = await getAuditLogsByTransaction(options.transactionId, {
        operation: options.operation,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.transactionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by allocation
 */
export function useAuditLogsByAllocation(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'allocation', options.allocationId, options.operation, options.limit],
    queryFn: async () => {
      if (!options.allocationId) {
        return [];
      }

      const result = await getAuditLogsByAllocation(options.allocationId, {
        operation: options.operation,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.allocationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by bank feed
 */
export function useAuditLogsByBankFeed(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'bankFeed', options.bankFeedId, options.operation, options.limit],
    queryFn: async () => {
      if (!options.bankFeedId) {
        return [];
      }

      const result = await getAuditLogsByBankFeed(options.bankFeedId, {
        operation: options.operation,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.bankFeedId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by date range
 */
export function useAuditLogsByDateRange(
  options: UseAuditLogsOptions & { startDate: number; endDate: number }
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'dateRange', options.firmId, options.startDate, options.endDate, options.operation, options.limit],
    queryFn: async () => {
      if (!options.firmId || !options.startDate || !options.endDate) {
        return [];
      }

      const result = await getAuditLogsByDateRange(
        options.firmId,
        options.startDate,
        options.endDate,
        {
          operation: options.operation,
          limit: options.limit,
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.firmId && !!options.startDate && !!options.endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by compliance status
 */
export function useAuditLogsByComplianceStatus(
  options: UseAuditLogsOptions & { complianceStatus: 'compliant' | 'non-compliant' | 'flagged' | 'investigated' }
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'complianceStatus', options.firmId, options.complianceStatus, options.limit],
    queryFn: async () => {
      if (!options.firmId || !options.complianceStatus) {
        return [];
      }

      const result = await getAuditLogsByComplianceStatus(options.firmId, options.complianceStatus, {
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.firmId && !!options.complianceStatus,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit logs by risk level
 */
export function useAuditLogsByRiskLevel(
  options: UseAuditLogsOptions & { minRiskLevel: number; maxRiskLevel: number }
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'riskLevel', options.firmId, options.minRiskLevel, options.maxRiskLevel, options.limit],
    queryFn: async () => {
      if (!options.firmId || options.minRiskLevel === undefined || options.maxRiskLevel === undefined) {
        return [];
      }

      const result = await getAuditLogsByRiskLevel(options.firmId, options.minRiskLevel, options.maxRiskLevel, {
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching unreviewed audit logs
 */
export function useUnreviewedAuditLogs(
  options: UseAuditLogsOptions & { minRiskLevel?: number }
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'unreviewed', options.firmId, options.minRiskLevel, options.limit],
    queryFn: async () => {
      if (!options.firmId) {
        return [];
      }

      const result = await getUnreviewedAuditLogs(options.firmId, {
        minRiskLevel: options.minRiskLevel,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching reviewed audit logs
 */
export function useReviewedAuditLogs(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'reviewed', options.firmId, options.limit],
    queryFn: async () => {
      if (!options.firmId) {
        return [];
      }

      const result = await getReviewedAuditLogs(options.firmId, {
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching failed audit logs
 */
export function useFailedAuditLogs(
  options: UseAuditLogsOptions
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'failed', options.firmId, options.limit],
    queryFn: async () => {
      if (!options.firmId) {
        return [];
      }

      const result = await getFailedAuditLogs(options.firmId, {
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching paginated audit logs
 */
export function useAuditLogsPaginated(
  options: UseAuditLogsOptions & { page?: number; pageSize?: number; sort?: { field: 'timestamp' | 'duration' | 'riskLevel' | 'complianceStatus'; direction: 'asc' | 'desc' } }
): {
  data: FirestoreDocument<FirestoreAuditLog>[] | undefined;
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>[]>({
    queryKey: ['auditLogs', 'paginated', options.firmId, options.userId, options.operation, options.collection, options.startDate, options.endDate, options.page, options.pageSize, options.sort],
    queryFn: async () => {
      if (!options.firmId) {
        return {
          data: [],
          totalCount: 0,
          page: 1,
          pageSize: 50,
          hasMore: false,
        };
      }

      const result = await getAuditLogsPaginated(
        options.firmId,
        {
          userId: options.userId,
          operation: options.operation,
          collection: options.collection,
          documentId: options.documentId,
          matterId: options.matterId,
          transactionId: options.transactionId,
          allocationId: options.allocationId,
          bankFeedId: options.bankFeedId,
          startDate: options.startDate,
          endDate: options.endDate,
          success: options.success,
          complianceStatus: options.complianceStatus,
          riskLevel: options.riskLevel,
          reviewed: options.reviewed,
          minRiskLevel: options.minRiskLevel,
          maxRiskLevel: options.maxRiskLevel,
          remoteIp: options.remoteIp,
          requestId: options.requestId,
          sessionId: options.sessionId,
        },
        {
          page: options.page || 1,
          pageSize: options.pageSize || 50,
        },
        options.sort
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit logs');
      }

      return {
        data: result.data.data,
        totalCount: result.data.totalCount,
        page: result.data.page,
        pageSize: result.data.pageSize,
        hasMore: result.data.hasMore,
      };
    },
    enabled: !!options.firmId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching audit log summary
 */
export function useAuditLogSummary(
  options: UseAuditLogSummaryOptions
): {
  data: AuditLogSummary | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<AuditLogSummary>({
    queryKey: ['auditLogSummary', options.firmId, options.userId, options.startDate, options.endDate],
    queryFn: async () => {
      if (!options.firmId) {
        return {
          totalLogs: 0,
          totalCreates: 0,
          totalUpdates: 0,
          totalDeletes: 0,
          totalReads: 0,
          totalBatches: 0,
          totalMatches: 0,
          totalReconciles: 0,
          successfulLogs: 0,
          failedLogs: 0,
          successRate: 0,
          averageDuration: 0,
          compliantLogs: 0,
          nonCompliantLogs: 0,
          flaggedLogs: 0,
          investigatedLogs: 0,
          complianceRate: 0,
          averageRiskLevel: 0,
          highRiskLogs: 0,
          reviewedLogs: 0,
          unreviewedLogs: 0,
          uniqueUsers: 0,
          uniqueCollections: 0,
          uniqueMatters: 0,
          uniqueTransactions: 0,
          uniqueAllocations: 0,
          uniqueBankFeeds: 0,
        };
      }

      const result = await getAuditLogSummary(options.firmId, {
        startDate: options.startDate,
        endDate: options.endDate,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit log summary');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching audit log by ID
 */
export function useAuditLogById(
  auditLogId: string
): {
  data: FirestoreDocument<FirestoreAuditLog> | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<FirestoreDocument<FirestoreAuditLog>>({
    queryKey: ['auditLog', auditLogId],
    queryFn: async () => {
      if (!auditLogId) {
        throw new Error('Audit log ID is required');
      }

      const result = await getAuditLogById(auditLogId);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch audit log');
      }

      return result.data;
    },
    enabled: !!auditLogId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// Compliance Hooks
// ============================================

/**
 * Hook for assessing compliance
 */
export function useComplianceAssessment(
  firmId: string,
  complianceType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal'
): {
  data: ComplianceAssessmentResult | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<ComplianceAssessmentResult>({
    queryKey: ['compliance', 'assessment', firmId, complianceType],
    queryFn: async () => {
      if (!firmId) {
        throw new Error('Firm ID is required');
      }

      const result = await assessCompliance(firmId, {
        complianceType,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to assess compliance');
      }

      return result.data;
    },
    enabled: !!firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching compliance certificates by firm
 */
export function useComplianceCertificatesByFirm(
  options: UseComplianceCertificatesOptions
): {
  data: any[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<any[]>({
    queryKey: ['complianceCertificates', 'firm', options.firmId, options.status, options.certificateType, options.limit],
    queryFn: async () => {
      if (!options.firmId) {
        return [];
      }

      const result = await getComplianceCertificatesByFirm(options.firmId, {
        status: options.status,
        certificateType: options.certificateType,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch compliance certificates');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching active compliance certificates by firm
 */
export function useActiveComplianceCertificates(
  firmId: string,
  options?: {
    certificateType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS';
    limit?: number;
  }
): {
  data: any[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<any[]>({
    queryKey: ['activeComplianceCertificates', firmId, options?.certificateType, options?.limit],
    queryFn: async () => {
      if (!firmId) {
        return [];
      }

      const result = await getActiveComplianceCertificates(firmId, options);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch active compliance certificates');
      }

      return result.data;
    },
    enabled: !!firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching compliance reports by firm
 */
export function useComplianceReportsByFirm(
  options: UseComplianceReportsOptions
): {
  data: any[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<any[]>({
    queryKey: ['complianceReports', 'firm', options.firmId, options.status, options.reportType, options.limit],
    queryFn: async () => {
      if (!options.firmId) {
        return [];
      }

      const result = await getComplianceReportsByFirm(options.firmId, {
        status: options.status,
        reportType: options.reportType,
        limit: options.limit,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch compliance reports');
      }

      return result.data;
    },
    enabled: !!options.firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching completed compliance reports by firm
 */
export function useCompletedComplianceReports(
  firmId: string,
  options?: {
    reportType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
    limit?: number;
  }
): {
  data: any[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<any[]>({
    queryKey: ['completedComplianceReports', firmId, options?.reportType, options?.limit],
    queryFn: async () => {
      if (!firmId) {
        return [];
      }

      const result = await getCompletedComplianceReports(firmId, options);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch completed compliance reports');
      }

      return result.data;
    },
    enabled: !!firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching compliance status by firm
 */
export function useComplianceStatusByFirm(
  options: UseComplianceStatusOptions
): {
  data: any | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return useQuery<any>({
    queryKey: ['complianceStatus', 'firm', options.firmId, options.complianceType],
    queryFn: async () => {
      if (!options.firmId) {
        return null;
      }

      const result = await getComplianceStatusByFirm(options.firmId, {
        complianceType: options.complianceType,
      });

      if (!result.success || !result.data || result.data.length === 0) {
        // Create default compliance status
        const statusData = {
          firmId: options.firmId,
          complianceType: options.complianceType || 'internal',
          status: 'non-applicable',
          complianceScore: 0,
          lastAssessmentDate: Date.now(),
          lastCertificateExpiryDate: undefined,
          nextAssessmentDate: undefined,
          highRiskFindings: [],
          remediationPlan: undefined,
          notes: 'Default compliance status',
        };

        return statusData;
      }

      return result.data[0].data;
    },
    enabled: !!options.firmId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Hook for reviewing audit log
 */
export function useReviewAuditLog(): {
  mutate: (auditLogId: string, updates: { reviewed: boolean; reviewNotes?: string; reviewedBy?: string; reviewedAt?: number }) => Promise<void>;
  isMutating: boolean;
} {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditLogId, updates }) => {
      if (!auditLogId) {
        throw new Error('Audit log ID is required');
      }

      const result = await updateAuditLog(auditLogId, {
        reviewed: updates.reviewed,
        reviewNotes: updates.reviewNotes,
        reviewedBy: updates.reviewedBy,
        reviewedAt: updates.reviewedAt || Date.now(),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to review audit log');
      }

      queryClient.invalidateQueries({ queryKey: ['auditLogs', 'unreviewed'] });
      queryClient.invalidateQueries({ queryKey: ['auditLog', auditLogId] });

      return result.data;
    },
  });
}

/**
 * Hook for batch reviewing audit logs
 */
export function useReviewAuditLogsBatch(): {
  mutate: (auditLogIds: string[], updates: { reviewed: boolean; reviewNotes?: string; reviewedBy?: string }) => Promise<void>;
  isMutating: boolean;
} {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auditLogIds, updates }) => {
      if (!auditLogIds.length) {
        throw new Error('Audit log IDs are required');
      }

      const updatesData = auditLogIds.map((auditLogId) => ({
        auditLogId,
        updates: {
          ...updates,
          reviewedAt: Date.now(),
        },
      }));

      const result = await updateAuditLogsBatch(updatesData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to review audit logs');
      }

      queryClient.invalidateQueries({ queryKey: ['auditLogs', 'unreviewed'] });

      return result.data;
    },
  });
}

/**
 * Hook for creating compliance certificate
 */
export function useCreateComplianceCertificate(): {
  mutate: (input: Omit<any, 'certificateId'>) => Promise<any>;
  isMutating: boolean;
} {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      const result = await createComplianceCertificate(input);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create compliance certificate');
      }

      queryClient.invalidateQueries({ queryKey: ['complianceCertificates', 'firm'] });
      queryClient.invalidateQueries({ queryKey: ['activeComplianceCertificates'] });

      return result.data;
    },
  });
}

/**
 * Hook for creating compliance report
 */
export function useCreateComplianceReport(): {
  mutate: (input: Omit<any, 'reportId'>) => Promise<any>;
  isMutating: boolean;
} {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      const result = await createComplianceReport(input);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create compliance report');
      }

      queryClient.invalidateQueries({ queryKey: ['complianceReports', 'firm'] });
      queryClient.invalidateQueries({ queryKey: ['completedComplianceReports'] });
      queryClient.invalidateQueries({ queryKey: ['complianceStatus', 'firm'] });

      return result.data;
    },
  });
}

/**
 * Hook for exporting audit logs to CSV
 */
export function useExportAuditLogsToCSV(): {
  mutate: (auditLogs: FirestoreDocument<FirestoreAuditLog>[]) => Promise<void>;
  isMutating: boolean;
} {
  return useMutation({
    mutationFn: async (auditLogs) => {
      const csv = exportAuditLogsToCSV(auditLogs);

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}

/**
 * Hook for exporting audit logs to JSON
 */
export function useExportAuditLogsToJSON(): {
  mutate: (auditLogs: FirestoreDocument<FirestoreAuditLog>[]) => Promise<void>;
  isMutating: boolean;
} {
  return useMutation({
    mutationFn: async (auditLogs) => {
      const json = exportAuditLogsToJSON(auditLogs);

      // Create download link
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}

// ============================================
// Exports
// ============================================

export {
  useAuditLogsByFirm,
  useAuditLogsByUser,
  useAuditLogsByCollection,
  useAuditLogsByDocument,
  useAuditLogsByMatter,
  useAuditLogsByTransaction,
  useAuditLogsByAllocation,
  useAuditLogsByBankFeed,
  useAuditLogsByDateRange,
  useAuditLogsByComplianceStatus,
  useAuditLogsByRiskLevel,
  useUnreviewedAuditLogs,
  useReviewedAuditLogs,
  useFailedAuditLogs,
  useAuditLogsPaginated,
  useAuditLogSummary,
  useAuditLogById,
  useComplianceAssessment,
  useComplianceCertificatesByFirm,
  useActiveComplianceCertificates,
  useComplianceReportsByFirm,
  useCompletedComplianceReports,
  useComplianceStatusByFirm,
  useReviewAuditLog,
  useReviewAuditLogsBatch,
  useCreateComplianceCertificate,
  useCreateComplianceReport,
  useExportAuditLogsToCSV,
  useExportAuditLogsToJSON,
};
