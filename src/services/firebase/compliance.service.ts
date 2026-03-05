/**
 * Compliance Service
 *
 * Compliance certification tracking and SOC 2 audit preparation.
 * Data retention policies and compliance status tracking.
 *
 * @module services/firebase/compliance.service
 */

import {
  query,
  where,
  orderBy,
  QueryConstraint,
} from 'firebase/firestore';
import {
  createDocument,
  createDocumentWithId,
  getDocument,
  updateDocument,
  queryDocuments,
  executeBatch,
  type OperationResult,
  type FirestoreDocument,
} from './firestore.service';
import type {
  FirestoreCompliance,
  FirestoreComplianceData,
} from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Compliance certificate
 */
export interface ComplianceCertificate {
  /**
   * Certificate ID (auto-generated)
   */
  certificateId: string;

  /**
   * Certificate type
   */
  certificateType: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS';

  /**
   * Certificate period (start date)
   */
  periodStart: string;

  /**
   * Certificate period (end date)
   */
  periodEnd: string;

  /**
   * Certificate status
   */
  status: 'pending' | 'in-review' | 'approved' | 'rejected' | 'expired';

  /**
   * Certificate issuer
   */
  issuer: string;

  /**
   * Certificate date
   */
  certificateDate: string;

  /**
   * Certificate expiry date
   */
  certificateExpiryDate: string;

  /**
   * Certificate URL
   */
  certificateUrl?: string;

  /**
   * Compliance report
   */
  complianceReport?: string;

  /**
   * Audit log summary
   */
  auditLogSummary?: string;

  /**
   * Risk assessment
   */
  riskAssessment?: string;

  /**
   * Mitigation plan
   */
  mitigationPlan?: string;

  /**
   * Notes
   */
  notes?: string;
}

/**
 * Data retention policy
 */
export interface DataRetentionPolicy {
  /**
   * Policy ID (auto-generated)
   */
  policyId: string;

  /**
   * Policy type
   */
  policyType: 'audit-logs' | 'transactions' | 'matters' | 'allocations' | 'bank-feeds';

  /**
   * Firm ID
   */
  firmId: string;

  /**
   * Policy name
   */
  name: string;

  /**
   * Retention period in days
   */
  retentionPeriodDays: number;

  /**
   * Policy start date
   */
  startDate: string;

  /**
   * Policy end date
   */
  endDate: string;

  /**
   * Whether policy is active
   */
  active: boolean;

  /**
   * Policy description
   */
  description: string;

  /**
   * Data categories covered
   */
  dataCategories: string[];

  /**
   * Legal requirements
   */
  legalRequirements: string[];

  /**
   * Deletion policy
   */
  deletionPolicy: 'auto-delete' | 'manual-review' | 'retain-forever';

  /**
   * Deletion delay in days (after period ends)
   */
  deletionDelayDays: number;

  /**
   * Compliance notes
   */
  complianceNotes?: string;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  /**
   * Report ID (auto-generated)
   */
  reportId: string;

  /**
   * Report type
   */
  reportType: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';

  /**
   * Firm ID
   */
  firmId: string;

  /**
   * Report period (start date)
   */
  periodStart: string;

  /**
   * Report period (end date)
   */
  periodEnd: string;

  /**
   * Report status
   */
  status: 'draft' | 'in-review' | 'completed' | 'published';

  /**
   * Report title
   */
  title: string;

  /**
   * Report description
   */
  description: string;

  /**
   * Report sections
   */
  sections: ComplianceReportSection[];

  /**
   * Report summary
   */
  summary: string;

  /**
   * Findings
   */
  findings: string[];

  /**
   * Recommendations
   */
  recommendations: string[];

  /**
   * Risk level
   */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  /**
   * Compliance score (0-100)
   */
  complianceScore: number;

  /**
   * Audit log references
   */
  auditLogIds: string[];

  /**
   * Created by user ID
   */
  createdBy: string;

  /**
   * Reviewed by user ID
   */
  reviewedBy?: string;

  /**
   * Approved by user ID
   */
  approvedBy?: string;

  /**
   * Review timestamp
   */
  reviewedAt?: number;

  /**
   * Approval timestamp
   */
  approvedAt?: number;

  /**
   * Published timestamp
   */
  publishedAt?: number;

  /**
   * Notes
   */
  notes?: string;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;
}

/**
 * Compliance report section
 */
export interface ComplianceReportSection {
  /**
   * Section ID
   */
  sectionId: string;

  /**
   * Section title
   */
  title: string;

  /**
   * Section type
   */
  sectionType: 'executive-summary' | 'control-mapping' | 'risk-assessment' | 'audit-findings' | 'compliance-status' | 'remediation' | 'evidence' | 'sign-off';

  /**
   * Section content
   */
  content: string;

  /**
   * Section data (for structured content)
   */
  data?: any;

  /**
   * Section order
   */
  order: number;
}

/**
 * Compliance status
 */
export interface ComplianceStatus {
  /**
   * Status ID (auto-generated)
   */
  statusId: string;

  /**
   * Firm ID
   */
  firmId: string;

  /**
   * Compliance type
   */
  complianceType: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';

  /**
   * Status
   */
  status: 'compliant' | 'non-compliant' | 'partially-compliant' | 'non-applicable';

  /**
   * Compliance score (0-100)
   */
  complianceScore: number;

  /**
   * Last assessment date
   */
  lastAssessmentDate: number;

  /**
   * Last certificate expiry date
   */
  lastCertificateExpiryDate?: number;

  /**
   * Next assessment date
   */
  nextAssessmentDate?: number;

  /**
   * Certificate ID
   */
  certificateId?: string;

  /**
   * Report ID
   */
  reportId?: string;

  /**
   * High risk findings
   */
  highRiskFindings: string[];

  /**
   * Remediation plan
   */
  remediationPlan?: string;

  /**
   * Notes
   */
  notes?: string;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;
}

/**
 * SOC 2 aligned practices
 */
export interface SOC2AlignedPractice {
  /**
   * Practice ID (auto-generated)
   */
  practiceId: string;

  /**
   * Practice category
   */
  category: 'access-control' | 'encryption' | 'logging' | 'monitoring' | 'incident-response' | 'data-retention' | 'risk-assessment' | 'vulnerability-management' | 'security-awareness' | 'change-management';

  /**
   * Practice name
   */
  name: string;

  /**
   * Practice description
   */
  description: string;

  /**
   * SOC 2 control (if applicable)
   */
  control?: string;

  /**
   * Compliance status
   */
  status: 'compliant' | 'partially-compliant' | 'non-compliant' | 'not-applicable';

  /**
   * Evidence
   */
  evidence?: string[];

  /**
   * Last review date
   */
  lastReviewDate: number;

  /**
   * Review notes
   */
  reviewNotes?: string;

  /**
   * Action items
   */
  actionItems?: string[];

  /**
   * Due date
   */
  dueDate?: number;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;
}

/**
 * Compliance operation input
 */
export interface ComplianceOperationInput {
  /**
   * Operation type
   */
  operation: 'create-certificate' | 'update-certificate' | 'delete-certificate' | 'create-policy' | 'update-policy' | 'delete-policy' | 'create-report' | 'update-report' | 'delete-report' | 'assess-compliance' | 'generate-report' | 'create-aligned-practice' | 'update-aligned-practice' | 'delete-aligned-practice';

  /**
   * Compliance type
   */
  complianceType: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';

  /**
   * Firm ID
   */
  firmId: string;

  /**
   * User ID (who performed operation)
   */
  userId: string;

  /**
   * Certificate data (for create-certificate, update-certificate)
   */
  certificateData?: Partial<ComplianceCertificate>;

  /**
   * Policy data (for create-policy, update-policy)
   */
  policyData?: Partial<DataRetentionPolicy>;

  /**
   * Report data (for create-report, update-report)
   */
  reportData?: Partial<ComplianceReport>;

  /**
   * Aligned practice data (for create-aligned-practice, update-aligned-practice)
   */
  alignedPracticeData?: Partial<SOC2AlignedPractice>;

  /**
   * Notes
   */
  notes?: string;
}

/**
 * Compliance assessment result
 */
export interface ComplianceAssessmentResult {
  /**
   * Assessment ID
   */
  assessmentId: string;

  /**
   * Compliance type
   */
  complianceType: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';

  /**
   * Compliance score (0-100)
   */
  complianceScore: number;

  /**
   * Risk level
   */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  /**
   * High risk findings
   */
  highRiskFindings: string[];

  /**
   * Recommendations
   */
  recommendations: string[];

  /**
   * Remediation plan
   */
  remediationPlan?: string;

  /**
   * Assessment date
   */
  assessmentDate: number;

  /**
   * Notes
   */
  notes?: string;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a compliance certificate
 *
 * @param input - Certificate creation data
 * @returns Operation result with created certificate document
 */
export async function createComplianceCertificate(
  input: Omit<ComplianceCertificate, 'certificateId'>
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  const certificateId = crypto.randomUUID();

  const certificateData: Omit<FirestoreComplianceData, 'certificateId'> = {
    certificateId,
    certificateType: input.certificateType,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    status: 'pending',
    issuer: input.issuer,
    certificateDate: new Date().toISOString(),
    certificateExpiryDate: input.certificateExpiryDate,
    certificateUrl: input.certificateUrl,
    complianceReport: input.complianceReport,
    auditLogSummary: input.auditLogSummary,
    riskAssessment: input.riskAssessment,
    mitigationPlan: input.mitigationPlan,
    notes: input.notes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return createDocumentWithId<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_CERTIFICATES,
    certificateId,
    certificateData
  );
}

/**
 * Get compliance certificate by ID
 *
 * @param certificateId - Certificate ID
 * @returns Operation result with certificate document
 */
export async function getComplianceCertificateById(
  certificateId: string
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  return getDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_CERTIFICATES,
    certificateId
  );
}

/**
 * Get compliance certificates by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (status, certificate type)
 * @returns Operation result with certificates array
 */
export async function getComplianceCertificatesByFirm(
  firmId: string,
  options?: {
    status?: 'pending' | 'in-review' | 'approved' | 'rejected' | 'expired';
    certificateType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.certificateType) {
    whereClauses.push(where('certificateType', '==', options.certificateType));
  }

  return queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_CERTIFICATES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'certificateDate',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get active compliance certificates by firm
 *
 * @param firmId - Firm ID
 * @returns Operation result with active certificates array
 */
export async function getActiveComplianceCertificates(
  firmId: string,
  options?: {
    certificateType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('status', '==', 'approved'),
  ];

  if (options?.certificateType) {
    whereClauses.push(where('certificateType', '==', options.certificateType));
  }

  return queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_CERTIFICATES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'certificateExpiryDate',
          direction: 'asc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Update a compliance certificate
 *
 * @param certificateId - Certificate ID
 * @param updates - Certificate updates
 * @returns Operation result
 */
export async function updateComplianceCertificate(
  certificateId: string,
  updates: Partial<ComplianceCertificate>
): Promise<OperationResult<void>> {
  const updateData: Partial<FirestoreComplianceData> = {
    ...updates,
    updatedAt: Date.now(),
  };

  return updateDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_CERTIFICATES,
    certificateId,
    updateData
  );
}

/**
 * Delete a compliance certificate
 *
 * @param certificateId - Certificate ID
 * @returns Operation result
 */
export async function deleteComplianceCertificate(
  certificateId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.COMPLIANCE_CERTIFICATES, certificateId);
}

/**
 * Create a data retention policy
 *
 * @param input - Policy creation data
 * @returns Operation result with created policy document
 */
export async function createDataRetentionPolicy(
  input: Omit<DataRetentionPolicy, 'policyId'>
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  const policyId = crypto.randomUUID();

  const policyData: Omit<FirestoreComplianceData, 'policyId'> = {
    policyId,
    policyType: input.policyType,
    firmId: input.firmId,
    name: input.name,
    retentionPeriodDays: input.retentionPeriodDays,
    startDate: input.startDate,
    endDate: input.endDate,
    active: true,
    description: input.description,
    dataCategories: input.dataCategories,
    legalRequirements: input.legalRequirements,
    deletionPolicy: input.deletionPolicy,
    deletionDelayDays: input.deletionDelayDays,
    complianceNotes: input.complianceNotes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return createDocumentWithId<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_POLICIES,
    policyId,
    policyData
  );
}

/**
 * Get data retention policy by ID
 *
 * @param policyId - Policy ID
 * @returns Operation result with policy document
 */
export async function getDataRetentionPolicyById(
  policyId: string
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  return getDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_POLICIES,
    policyId
  );
}

/**
 * Get data retention policies by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (policy type, active)
 * @returns Operation result with policies array
 */
export async function getDataRetentionPoliciesByFirm(
  firmId: string,
  options?: {
    policyType?: 'audit-logs' | 'transactions' | 'matters' | 'allocations' | 'bank-feeds';
    active?: boolean;
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.policyType) {
    whereClauses.push(where('policyType', '==', options.policyType));
  }

  if (options?.active !== undefined) {
    whereClauses.push(where('active', '==', options.active));
  }

  return queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_POLICIES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'name',
          direction: 'asc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get active data retention policies by firm
 *
 * @param firmId - Firm ID
 * @returns Operation result with active policies array
 */
export async function getActiveDataRetentionPolicies(
  firmId: string
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('active', '==', true),
  ];

  return queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_POLICIES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'name',
          direction: 'asc',
        },
      ],
    }
  );
}

/**
 * Update a data retention policy
 *
 * @param policyId - Policy ID
 * @param updates - Policy updates
 * @returns Operation result
 */
export async function updateDataRetentionPolicy(
  policyId: string,
  updates: Partial<DataRetentionPolicy>
): Promise<OperationResult<void>> {
  const updateData: Partial<FirestoreComplianceData> = {
    ...updates,
    updatedAt: Date.now(),
  };

  return updateDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_POLICIES,
    policyId,
    updateData
  );
}

/**
 * Delete a data retention policy
 *
 * @param policyId - Policy ID
 * @returns Operation result
 */
export async function deleteDataRetentionPolicy(
  policyId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.COMPLIANCE_POLICIES, policyId);
}

/**
 * Create a compliance report
 *
 * @param input - Report creation data
 * @returns Operation result with created report document
 */
export async function createComplianceReport(
  input: Omit<ComplianceReport, 'reportId'>
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  const reportId = crypto.randomUUID();

  const reportData: Omit<FirestoreComplianceData, 'reportId'> = {
    reportId,
    reportType: input.reportType,
    firmId: input.firmId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    status: 'draft',
    title: input.title,
    description: input.description,
    sections: input.sections,
    summary: input.summary,
    findings: input.findings,
    recommendations: input.recommendations,
    riskLevel: input.riskLevel,
    complianceScore: input.complianceScore,
    auditLogIds: input.auditLogIds,
    createdBy: input.userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    notes: input.notes,
  };

  return createDocumentWithId<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_REPORTS,
    reportId,
    reportData
  );
}

/**
 * Get compliance report by ID
 *
 * @param reportId - Report ID
 * @returns Operation result with report document
 */
export async function getComplianceReportById(
  reportId: string
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  return getDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_REPORTS,
    reportId
  );
}

/**
 * Get compliance reports by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (status, report type, limit)
 * @returns Operation result with reports array
 */
export async function getComplianceReportsByFirm(
  firmId: string,
  options?: {
    status?: 'draft' | 'in-review' | 'completed' | 'published';
    reportType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  if (options?.reportType) {
    whereClauses.push(where('reportType', '==', options.reportType));
  }

  return queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_REPORTS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'periodEnd',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Get completed compliance reports by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (report type, limit)
 * @returns Operation result with completed reports array
 */
export async function getCompletedComplianceReports(
  firmId: string,
  options?: {
    reportType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
    where('status', '==', 'completed'),
  ];

  if (options?.reportType) {
    whereClauses.push(where('reportType', '==', options.reportType));
  }

  return queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_REPORTS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'periodEnd',
          direction: 'desc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Update a compliance report
 *
 * @param reportId - Report ID
 * @param updates - Report updates
 * @returns Operation result
 */
export async function updateComplianceReport(
  reportId: string,
  updates: Partial<ComplianceReport>
): Promise<OperationResult<void>> {
  const updateData: Partial<FirestoreComplianceData> = {
    ...updates,
    updatedAt: Date.now(),
  };

  return updateDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_REPORTS,
    reportId,
    updateData
  );
}

/**
 * Delete a compliance report
 *
 * @param reportId - Report ID
 * @returns Operation result
 */
export async function deleteComplianceReport(
  reportId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.COMPLIANCE_REPORTS, reportId);
}

/**
 * Get compliance status by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (compliance type)
 * @returns Operation result with compliance status document
 */
export async function getComplianceStatusByFirm(
  firmId: string,
  options?: {
    complianceType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
  }
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.complianceType) {
    whereClauses.push(where('complianceType', '==', options.complianceType));
  }

  const result = await queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_STATUS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'lastAssessmentDate',
          direction: 'desc',
        },
      ],
      limit: 1,
    }
  );

  if (!result.success || !result.data || result.data.length === 0) {
    // Create default compliance status
    const statusData: Omit<FirestoreComplianceData, 'statusId'> = {
      firmId,
      complianceType: options?.complianceType || 'internal',
      status: 'non-applicable',
      complianceScore: 0,
      lastAssessmentDate: Date.now(),
      lastCertificateExpiryDate: undefined,
      nextAssessmentDate: undefined,
      highRiskFindings: [],
      remediationPlan: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: 'Default compliance status created',
    };

    const createResult = await createDocument<FirestoreComplianceData>(
      COLLECTION_NAMES.COMPLIANCE_STATUS,
      statusData
    );

    return {
      success: createResult.success,
      data: createResult.data,
      error: createResult.error,
      code: createResult.code,
    };
  }

  return {
    success: true,
    data: result.data[0],
    error: result.error,
    code: result.code,
  };
}

/**
 * Update a compliance status
 *
 * @param firmId - Firm ID
 * @param options - Update options (compliance type)
 * @param updates - Status updates
 * @returns Operation result
 */
export async function updateComplianceStatus(
  firmId: string,
  options?: {
    complianceType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
  },
  updates: Partial<ComplianceStatus>
): Promise<OperationResult<void>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.complianceType) {
    whereClauses.push(where('complianceType', '==', options.complianceType));
  }

  const result = await queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_STATUS,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      limit: 1,
    }
  );

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      error: 'Compliance status not found',
      code: 'not-found',
    };
  }

  const statusId = result.data[0].id;
  const updateData = {
    ...updates,
    lastAssessmentDate: updates.lastAssessmentDate || Date.now(),
    updatedAt: Date.now(),
  };

  return updateDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_STATUS,
    statusId,
    updateData
  );
}

// ============================================
// Compliance Assessment
// ============================================

/**
 * Assess compliance status
 *
 * @param firmId - Firm ID
 * @param options - Assessment options (compliance type)
 * @returns Compliance assessment result
 */
export async function assessCompliance(
  firmId: string,
  options?: {
    complianceType?: 'SOC2' | 'SOC1' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'internal';
  }
): Promise<OperationResult<ComplianceAssessmentResult>> {
  const auditLogsResult = await queryDocuments<FirestoreAuditLogData>(
    COLLECTION_NAMES.AUDIT_LOGS,
    {
      where: [
        {
          field: 'firmId',
          operator: '==',
          value: firmId,
        },
        {
          field: 'timestamp',
          operator: '>=',
          value: Date.now() - (365 * 24 * 60 * 60 * 1000), // Last 1 year
        },
      ],
      orderBy: [
        {
          field: 'timestamp',
          direction: 'desc',
        },
      ],
      limit: 1000,
    }
  );

  if (!auditLogsResult.success || !auditLogsResult.data) {
    return {
      success: false,
      error: 'Failed to fetch audit logs',
      code: 'audit-logs-error',
    };
  }

  const auditLogs = auditLogsResult.data;

  // Calculate compliance score
  const compliantLogs = auditLogs.filter((l) => l.data.complianceStatus === 'compliant');
  const nonCompliantLogs = auditLogs.filter((l) => l.data.complianceStatus === 'non-compliant');
  const flaggedLogs = auditLogs.filter((l) => l.data.complianceStatus === 'flagged');
  const investigatedLogs = auditLogs.filter((l) => l.data.complianceStatus === 'investigated');
  const totalLogs = auditLogs.length;

  const complianceScore = totalLogs > 0
    ? ((compliantLogs.length / totalLogs) * 100)
    : 0;

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  const highRiskLogs = auditLogs.filter((l) => l.data.riskLevel >= 0.7);

  if (highRiskLogs.length > 10 || complianceScore < 50) {
    riskLevel = 'critical';
  } else if (highRiskLogs.length > 5 || complianceScore < 70) {
    riskLevel = 'high';
  } else if (highRiskLogs.length > 2 || complianceScore < 85) {
    riskLevel = 'medium';
  }

  // High risk findings
  const findings = highRiskLogs.map((l) => {
    const operation = l.data.operation;
    const collection = l.data.collection;
    const documentId = l.data.documentId;

    return `High-risk ${operation} on ${collection}:${documentId} at ${new Date(l.data.timestamp).toLocaleString()}`;
  });

  // Recommendations
  const recommendations = [];

  if (flaggedLogs.length > 0) {
    recommendations.push('Review flagged operations');
  }

  if (investigatedLogs.length > 0) {
    recommendations.push('Complete investigation of high-risk operations');
  }

  if (nonCompliantLogs.length > 0) {
    recommendations.push('Address non-compliant operations');
  }

  if (complianceScore < 90) {
    recommendations.push('Improve compliance score to 90%+');
  }

  if (riskLevel === 'critical') {
    recommendations.push('Immediate action required for critical risk level');
  }

  return {
    success: true,
    data: {
      assessmentId: crypto.randomUUID(),
      complianceType: options?.complianceType || 'internal',
      complianceScore,
      riskLevel,
      highRiskFindings: findings,
      recommendations,
      remediationPlan: recommendations.join('; '),
      assessmentDate: Date.now(),
      notes: `Based on ${totalLogs} audit logs in the last year`,
    },
  };
}

// ============================================
// SOC 2 Aligned Practices
// ============================================

/**
 * Create an SOC 2 aligned practice
 *
 * @param practiceData - Practice creation data
 * @returns Operation result with created practice document
 */
export async function createSOC2AlignedPractice(
  practiceData: Omit<SOC2AlignedPractice, 'practiceId'>
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>>> {
  const practiceId = crypto.randomUUID();

  const alignedPracticeData: Omit<FirestoreComplianceData, 'practiceId'> = {
    practiceId,
    category: practiceData.category,
    name: practiceData.name,
    description: practiceData.description,
    control: practiceData.control,
    status: 'compliant',
    evidence: practiceData.evidence || [],
    lastReviewDate: Date.now(),
    reviewNotes: practiceData.reviewNotes,
    actionItems: practiceData.actionItems || [],
    dueDate: practiceData.dueDate || Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return createDocumentWithId<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_ALIGNED_PRACTICES,
    practiceId,
    alignedPracticeData
  );
}

/**
 * Get SOC 2 aligned practices by firm
 *
 * @param firmId - Firm ID
 * @param options - Query options (category, status)
 * @returns Operation result with practices array
 */
export async function getSOC2AlignedPracticesByFirm(
  firmId: string,
  options?: {
    category?: string;
    status?: 'compliant' | 'partially-compliant' | 'non-compliant' | 'not-applicable';
    limit?: number;
  }
): Promise<OperationResult<FirestoreDocument<FirestoreCompliance>[]>> {
  const whereClauses: QueryConstraint[] = [
    where('firmId', '==', firmId),
  ];

  if (options?.category) {
    whereClauses.push(where('category', '==', options.category));
  }

  if (options?.status) {
    whereClauses.push(where('status', '==', options.status));
  }

  return queryDocuments<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_ALIGNED_PRACTICES,
    {
      where: whereClauses.map((clause) => ({
        field: clause.field as string,
        operator: clause.operator as any,
        value: clause.value,
      })),
      orderBy: [
        {
          field: 'name',
          direction: 'asc',
        },
      ],
      limit: options?.limit,
    }
  );
}

/**
 * Update an SOC 2 aligned practice
 *
 * @param practiceId - Practice ID
 * @param updates - Practice updates
 * @returns Operation result
 */
export async function updateSOC2AlignedPractice(
  practiceId: string,
  updates: Partial<SOC2AlignedPractice>
): Promise<OperationResult<void>> {
  const updateData: Partial<FirestoreComplianceData> = {
    ...updates,
    lastReviewDate: updates.lastReviewDate || Date.now(),
    updatedAt: Date.now(),
  };

  return updateDocument<FirestoreComplianceData>(
    COLLECTION_NAMES.COMPLIANCE_ALIGNED_PRACTICES,
    practiceId,
    updateData
  );
}

/**
 * Delete an SOC 2 aligned practice
 *
 * @param practiceId - Practice ID
 * @returns Operation result
 */
export async function deleteSOC2AlignedPractice(
  practiceId: string
): Promise<OperationResult<void>> {
  return deleteDocument(COLLECTION_NAMES.COMPLIANCE_ALIGNED_PRACTICES, practiceId);
}
