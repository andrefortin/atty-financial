/**
 * Allocation Reports Service
 *
 * Generate allocation reports and export data.
 *
 * @module services/firebase/allocationReports.service
 */

import { queryDocuments, type OperationResult } from './firestore.service';
import type { FirestoreAllocation, FirestoreMatter } from '@/types/firestore';
import { COLLECTION_NAMES } from '@/types/firestore';

// ============================================
// Types
// ============================================

/**
 * Allocation summary report
 */
export interface AllocationSummaryReport {
  allocationId: string;
  period: string;
  totalInterest: number;
  tier1Interest: number;
  tier2Interest: number;
  carryForward: number;
  tier1MattersCount: number;
  tier2MattersCount: number;
  allocationDate: string;
  createdAt: string;
  status: string;
}

/**
 * Matter allocation detail report
 */
export interface MatterAllocationReport {
  matterId: string;
  matterNumber: string;
  clientName: string;
  tier: 'Tier1' | 'Tier2';
  principalBalance: number;
  allocatedInterest: number;
  newInterestOwed: number;
  totalInterestAccrued: number;
  allocationCount: number;
}

/**
 * Firm allocation summary report
 */
export interface FirmAllocationSummaryReport {
  firmId: string;
  period: string;
  totalAllocations: number;
  totalInterestAllocated: number;
  tier1TotalInterest: number;
  tier2TotalInterest: number;
  totalCarryForward: number;
  averageAllocationPerMatter: number;
  tier1MatterCount: number;
  tier2MatterCount: number;
}

/**
 * Report generation options
 */
export interface AllocationReportOptions {
  allocationId: string;
  format: 'json' | 'csv' | 'pdf' | 'html';
}

/**
 * Date range report options
 */
export interface AllocationDateRangeReportOptions {
  firmId: string;
  startDate: number;
  endDate: number;
  status?: 'Draft' | 'Pending' | 'Finalized' | 'Locked';
  format: 'json' | 'csv' | 'pdf' | 'html';
}

// ============================================
// Report Generation Functions
// ============================================

/**
 * Generate allocation summary report
 *
 * @param allocationId - Allocation ID
 * @param format - Output format
 * @returns Operation result with report data
 */
export async function generateAllocationSummaryReport(
  allocationId: string,
  format: 'json' | 'csv' | 'html' = 'json'
): Promise<OperationResult<AllocationSummaryReport>> {
  try {
    // Import allocation service
    const { getAllocationById } = await import('./allocations.service');

    // Get allocation
    const allocationResult = await getAllocationById(allocationId);

    if (!allocationResult.success || !allocationResult.data) {
      return {
        success: false,
        error: 'Allocation not found',
        code: 'not-found',
      };
    }

    const allocation = allocationResult.data;
    const report: AllocationSummaryReport = {
      allocationId: allocation.id,
      period: allocation.data.period,
      totalInterest: allocation.data.totalInterest,
      tier1Interest: allocation.data.tier1Interest,
      tier2Interest: allocation.data.tier2Interest,
      carryForward: allocation.data.carryForward,
      tier1MattersCount: 0,
      tier2MattersCount: 0,
      allocationDate: new Date(allocation.data.allocationDate).toISOString(),
      createdAt: new Date(allocation.data.createdAt).toISOString(),
      status: allocation.data.status,
    };

    // Count matters
    const { getAllocationDetailsByAllocation } = await import('./allocationDetails.service');
    const detailsResult = await getAllocationDetailsByAllocation(allocationId);

    if (detailsResult.success && detailsResult.data) {
      const tier1Count = detailsResult.data.filter((d) => d.data.tier === 'Tier1').length;
      const tier2Count = detailsResult.data.filter((d) => d.data.tier === 'Tier2').length;

      report.tier1MattersCount = tier1Count;
      report.tier2MattersCount = tier2Count;
    }

    // Generate formatted output
    const data = formatReportData(report, format);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Generate matter allocation detail report
 *
 * @param matterId - Matter ID
 * @param format - Output format
 * @returns Operation result with report data
 */
export async function generateMatterAllocationReport(
  matterId: string,
  format: 'json' | 'csv' | 'html' = 'json'
): Promise<OperationResult<MatterAllocationReport[]>> {
  try {
    // Import allocation details service
    const { getAllocationDetailsByMatter } = await import('./allocationDetails.service');

    // Get allocation details
    const detailsResult = await getAllocationDetailsByMatter(matterId);

    if (!detailsResult.success || !detailsResult.data) {
      return {
        success: false,
        error: 'No allocation details found for matter',
        code: 'not-found',
      };
    }

    const details = detailsResult.data;

    // Group by tier
    const tier1Details = details.filter((d) => d.data.tier === 'Tier1');
    const tier2Details = details.filter((d) => d.data.tier === 'Tier2');

    // Get matter details
    const { getMatterById } = await import('./matters.service');
    const matterResult = await getMatterById(matterId);

    if (!matterResult.success || !matterResult.data) {
      return {
        success: false,
        error: 'Matter not found',
        code: 'not-found',
      };
    }

    const matter = matterResult.data.data;
    const totalTier1Allocated = tier1Details.reduce((sum, d) => sum + d.data.allocatedInterest, 0);
    const totalTier2Allocated = tier2Details.reduce((sum, d) => sum + d.data.allocatedInterest, 0);

    // Generate report
    const report: MatterAllocationReport = {
      matterId: matter.id,
      matterNumber: matter.data.matterNumber,
      clientName: matter.data.clientName,
      tier: tier1Details.length > 0 ? 'Tier1' : 'Tier2',
      principalBalance: matter.data.principalBalance,
      allocatedInterest: totalTier1Allocated + totalTier2Allocated,
      newInterestOwed: matter.data.totalInterestAccrued,
      totalInterestAccrued: matter.data.totalInterestAccrued,
      allocationCount: details.length,
    };

    // Generate formatted output
    const data = formatReportData(report, format);

    return {
      success: true,
      data: Array.isArray(data) ? data : [data],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

/**
 * Generate firm allocation summary report
 *
 * @param firmId - Firm ID
 * @param options - Report generation options
 * @returns Operation result with report data
 */
export async function generateFirmAllocationSummaryReport(
  firmId: string,
  options: AllocationDateRangeReportOptions
): Promise<OperationResult<FirmAllocationSummaryReport[]>> {
  try {
    // Import allocation service
    const { getAllocationsByFirm } = await import('./allocations.service');

    // Get allocations for period
    const allocationsResult = await getAllocationsByFirm(firmId, {
      startDate: options.startDate,
      endDate: options.endDate,
      status: options.status,
    });

    if (!allocationsResult.success || !allocationsResult.data) {
      return {
        success: false,
        error: 'No allocations found for period',
        code: 'not-found',
      };
    }

    const allocations = allocationsResult.data;
    const periodCount = allocations.length;

    // Calculate totals
    const totalInterest = allocations.reduce((sum, a) => sum + a.data.totalInterest, 0);
    const totalTier1Interest = allocations.reduce((sum, a) => sum + a.data.tier1Interest, 0);
    const totalTier2Interest = allocations.reduce((sum, a) => sum + a.data.tier2Interest, 0);
    const totalCarryForward = allocations.reduce((sum, a) => sum + a.data.carryForward, 0);
    const averageAllocation = totalInterest / periodCount;

    // Count matters
    const { getAllocationDetailsByAllocation } = await import('./allocationDetails.service');
    let tier1MatterCount = 0;
    let tier2MatterCount = 0;

    for (const allocation of allocations) {
      const detailsResult = await getAllocationDetailsByAllocation(allocation.id);
      if (detailsResult.success && detailsResult.data) {
        const tier1Count = detailsResult.data.filter((d) => d.data.tier === 'Tier1').length;
        const tier2Count = detailsResult.data.filter((d) => d.data.tier === 'Tier2').length;

        tier1MatterCount += tier1Count;
        tier2MatterCount += tier2Count;
      }
    }

    const reports: FirmAllocationSummaryReport[] = allocations.map((allocation) => {
      const detailsResult = await getAllocationDetailsByAllocation(allocation.id);
      let tier1Count = 0;
      let tier2Count = 0;

      if (detailsResult.success && detailsResult.data) {
        tier1Count = detailsResult.data.filter((d) => d.data.tier === 'Tier1').length;
        tier2Count = detailsResult.data.filter((d) => d.data.tier === 'Tier2').length;
      }

      const report: FirmAllocationSummaryReport = {
        firmId: allocation.data.firmId,
        period: allocation.data.period,
        totalAllocations: detailsResult.data?.length || 0,
        totalInterestAllocated: allocation.data.totalInterest,
        tier1TotalInterest: allocation.data.tier1Interest,
        tier2TotalInterest: allocation.data.tier2Interest,
        totalCarryForward: allocation.data.carryForward,
        averageAllocationPerMatter: allocation.data.totalInterest / detailsResult.data?.length || 1,
        tier1MatterCount: tier1Count,
        tier2MatterCount: tier2Count,
      };

      return report;
    });

    // Generate formatted output
    const data = formatReportData(reports, options.format);

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'unknown',
    };
  }
}

// ============================================
// Data Formatting Functions
// ============================================

/**
 * Format report data based on format type
 *
 * @param report - Report data
 * @param format - Output format
 * @returns Formatted data
 */
function formatReportData(
  report: any,
  format: string
): any {
  switch (format) {
    case 'json':
      return report;

    case 'csv':
      return convertToCSV(report);

    case 'html':
      return convertToHTML(report);

    case 'pdf':
      return convertToPDF(report);

    default:
      return report;
  }
}

/**
 * Convert report to CSV format
 *
 * @param report - Report data
 * @returns CSV string
 */
function convertToCSV(report: any): string {
  const headers = ['Allocation ID', 'Period', 'Total Interest', 'Tier 1 Interest', 'Tier 2 Interest', 'Carry Forward'];
  const row = [
    report.allocationId,
    report.period,
    report.totalInterest.toFixed(2),
    report.tier1Interest.toFixed(2),
    report.tier2Interest.toFixed(2),
    report.carryForward.toFixed(2),
  ];

  return [headers.join(','), row.join(',')].join('\n');
}

/**
 * Convert report to HTML format
 *
 * @param report - Report data
 * @returns HTML string
 */
function convertToHTML(report: any): string {
  return `
    <html>
    <head>
      <title>Allocation Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .value { text-align: right; }
        .label { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Allocation Report</h1>
      <table>
        <tr>
          <th>Allocation ID</th>
          <td>${report.allocationId}</td>
        </tr>
        <tr>
          <th>Period</th>
          <td>${report.period}</td>
        </tr>
        <tr>
          <th>Total Interest</th>
          <td class="value">$${report.totalInterest.toFixed(2)}</td>
        </tr>
        <tr>
          <th>Tier 1 Interest</th>
          <td class="value">$${report.tier1Interest.toFixed(2)}</td>
        </tr>
        <tr>
          <th>Tier 2 Interest</th>
          <td class="value">$${report.tier2Interest.toFixed(2)}</td>
        </tr>
        <tr>
          <th>Carry Forward</th>
          <td class="value">$${report.carryForward.toFixed(2)}</td>
        </tr>
        <tr>
          <th>Tier 1 Matters</th>
          <td>${report.tier1MattersCount}</td>
        </tr>
        <tr>
          <th>Tier 2 Matters</th>
          <td>${report.tier2MattersCount}</td>
        </tr>
        <tr>
          <th>Allocation Date</th>
          <td>${report.allocationDate}</td>
        </tr>
        <tr>
          <th>Created At</th>
          <td>${report.createdAt}</td>
        </tr>
        <tr>
          <th>Status</th>
          <td>${report.status}</td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Convert report to PDF format
 *
 * @param report - Report data
 * @returns PDF binary data
 */
function convertToPDF(report: any): Uint8Array {
  // For now, return HTML as placeholder
  // In production, this would use a PDF generation library like jsPDF
  const html = convertToHTML(report);
  return new TextEncoder().encode(html);
}
