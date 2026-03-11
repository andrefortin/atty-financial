// Report Export Service
// Handles exporting reports to various formats (PDF, CSV)

import {
  PayoffReport,
  FundingReport,
  FinanceChargeReport,
  MatterSummaryReport,
  ClientPayoffReport,
  FirmPayoffReport,
} from '../types/ports';
import { formatDate } from '../utils/formatters';

/**
 * Export report data to CSV format
 */
export function exportReportToCSV(report: any): string {
  const headers: string[] = [];
  const rows: any[][] = [];

  if (report.reportType === 'FirmPayoff') {
    const firmReport = report as FirmPayoffReport;
    headers.push('Report ID', 'Matter ID', 'Report Date', 'Principal Balance', 'Interest Accrued', 'Interest Paid', 'Principal Paid', 'Total Firm Payoff', 'Client Payoff Date');
    rows.push([
      firmReport.reportId,
      firmReport.matterId,
      formatDate(firmReport.reportDate),
      firmReport.principalBalance.toFixed(2),
      firmReport.interestAccrued.toFixed(2),
      firmReport.interestPaid.toFixed(2),
      firmReport.principalPaid.toFixed(2),
      firmReport.totalFirmPayoffAmount.toFixed(2),
      firmReport.clientPayoffDate ? formatDate(firmReport.clientPayoffDate) : 'N/A',
    ]);
  } else if (report.reportType === 'ClientPayoff') {
    const clientReport = report as ClientPayoffReport;
    headers.push('Report ID', 'Matter ID', 'Report Date', 'Principal Balance', 'Interest Accrued', 'Interest Paid', 'Principal Paid', 'Total Client Payoff');
    rows.push([
      clientReport.reportId,
      clientReport.matterId,
      formatDate(clientReport.reportDate),
      clientReport.principalBalance.toFixed(2),
      clientReport.interestAccrued.toFixed(2),
      clientReport.interestPaid.toFixed(2),
      clientReport.principalPaid.toFixed(2),
      clientReport.totalClientPayoffAmount.toFixed(2),
    ]);
  } else if (report.reportType === 'MatterSummary') {
    const summaryReport = report as MatterSummaryReport;
    headers.push('Report ID', 'Report Date', 'Total Matters', 'Active Matters', 'Closed Matters', 'Total Principal Balance', 'Total Interest Accrued', 'Total Interest Paid', 'Total Owed');
    rows.push([
      summaryReport.reportId,
      formatDate(summaryReport.generationDate),
      summaryReport.totalMatters,
      summaryReport.activeMatters,
      summaryReport.closedMatters,
      summaryReport.totalPrincipalBalance.toFixed(2),
      summaryReport.totalInterestAccrued.toFixed(2),
      summaryReport.totalInterestPaid.toFixed(2),
      summaryReport.totalOwed.toFixed(2),
    ]);
  }

  // Convert rows to CSV string
  const csvContent = rows.map(row => row.join(',')).join('\n');
  const csvHeaders = headers.join(',');

  return `${csvHeaders}\n${csvContent}`;
}

/**
 * Download report as CSV file
 */
export function downloadReportCSV(report: any, filename: string = 'report.csv'): void {
  const csvData = exportReportToCSV(report);

  // Create CSV blob
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  // Cleanup
  URL.revokeObjectURL(url);
}

/**
 * Export report data for PDF generation
 * Note: This is a placeholder implementation
 * For real PDF export, use jsPDF or similar library
 */
export function exportReportToPDF(report: any, filename: string = 'report.pdf'): void {
  console.log('PDF export requested for:', report.reportType);

  if (report.reportType === 'MatterSummary') {
    const summaryReport = report as MatterSummaryReport;
    console.log('Generating Matter Summary PDF with', summaryReport.totalMatters, 'matters');
  }

  // Placeholder for PDF generation
  // In production, integrate jsPDF or react-pdf library
  console.warn('PDF export requires additional library implementation');

  // For now, download CSV as fallback
  downloadReportCSV(report, filename);
}
