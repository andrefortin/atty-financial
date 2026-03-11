// ============================================
// Report Service - Advanced Reporting Features
// ============================================

import { useMatterStore, useTransactionStore, useFirmStore } from '../store';
import { Matter, Transaction } from '../types';

// ============================================
// Types
// ============================================

export type ReportFormat = 'PDF' | 'Excel' | 'CSV' | 'HTML';

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  format: ReportFormat;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: Record<string, any>;
  includeDetails?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRunDate: Date;
  enabled: boolean;
  recipients: string[];
  format: ReportFormat;
}

export interface ReportResult {
  data: any;
  metadata: {
    generatedAt: Date;
    recordCount: number;
    dateRange: { startDate: Date; endDate: Date } | null;
  };
  format: ReportFormat;
}

export interface ExportOptions {
  format: ReportFormat;
  includeHeaders?: boolean;
  filename?: string;
}

// ============================================
// Error Types
// ============================================

export class ReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public reportId?: string
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

// ============================================
// Report Generators
// ============================================

/**
 * Generate a comprehensive funding report
 */
export function generateFundingReport(config: ReportConfig): ReportResult {
  try {
    const matters = useMatterStore.getState().getActiveMatters();
    const transactions = useTransactionStore.getState().getDrawTransactions();

    const reportData = matters.map((matter) => {
      const matterTransactions = transactions.filter((t) =>
        t.allocations.some((a) => a.matterId === matter.id)
      );
      const totalFunded = matterTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      return {
        matterId: matter.id,
        clientName: matter.clientName,
        caseNumber: matter.caseNumber,
        principalBalance: matter.principalBalance,
        totalFunded,
        interestRate: matter.interestRate,
        createdAt: matter.createdAt,
        status: matter.status,
      };
    });

    return {
      data: reportData,
      metadata: {
        generatedAt: new Date(),
        recordCount: reportData.length,
        dateRange: config.dateRange || null,
      },
      format: config.format,
    };
  } catch (error) {
    console.error('Error generating funding report:', error);
    throw new ReportError('Failed to generate funding report', 'GENERATION_ERROR', config.id);
  }
}

/**
 * Generate a payoff report
 */
export function generatePayoffReport(config: ReportConfig): ReportResult {
  try {
    const matters = useMatterStore.getState().getActiveMatters();

    const reportData = matters.map((matter) => ({
      matterId: matter.id,
      clientName: matter.clientName,
      caseNumber: matter.caseNumber,
      principalBalance: matter.principalBalance,
      interestOwed: matter.interestOwed,
      firmPayoff: matter.principalBalance,
      clientPayoff: matter.principalBalance + matter.interestOwed,
      interestRate: matter.interestRate,
      createdAt: matter.createdAt,
      lastActivity: matter.lastActivity,
    }));

    return {
      data: reportData,
      metadata: {
        generatedAt: new Date(),
        recordCount: reportData.length,
        dateRange: config.dateRange || null,
      },
      format: config.format,
    };
  } catch (error) {
    console.error('Error generating payoff report:', error);
    throw new ReportError('Failed to generate payoff report', 'GENERATION_ERROR', config.id);
  }
}

/**
 * Generate a finance charge report
 */
export function generateFinanceChargeReport(config: ReportConfig): ReportResult {
  try {
    const matters = useMatterStore.getState().getActiveMatters();
    const transactions = useTransactionStore.getState().getAutodraftTransactions();

    const reportData = matters.map((matter) => {
      const matterTransactions = transactions.filter((t) =>
        t.allocations.some((a) => a.matterId === matter.id)
      );
      const totalInterestCharged = matterTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      const totalInterestPaid = matterTransactions
        .filter((t) => t.status === 'Allocated')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        matterId: matter.id,
        clientName: matter.clientName,
        caseNumber: matter.caseNumber,
        principalBalance: matter.principalBalance,
        interestRate: matter.interestRate,
        totalInterestCharged,
        totalInterestPaid,
        outstandingInterest: totalInterestCharged - totalInterestPaid,
        transactionCount: matterTransactions.length,
      };
    });

    return {
      data: reportData,
      metadata: {
        generatedAt: new Date(),
        recordCount: reportData.length,
        dateRange: config.dateRange || null,
      },
      format: config.format,
    };
  } catch (error) {
    console.error('Error generating finance charge report:', error);
    throw new ReportError('Failed to generate finance charge report', 'GENERATION_ERROR', config.id);
  }
}

/**
 * Generate a transaction activity report
 */
export function generateTransactionReport(config: ReportConfig): ReportResult {
  try {
    let transactions = useTransactionStore.getState().transactions;

    // Apply date range filter
    if (config.dateRange) {
      transactions = transactions.filter(
        (t) =>
          t.date >= config.dateRange!.startDate &&
          t.date <= config.dateRange!.endDate
      );
    }

    // Apply sorting
    const { sortBy, sortOrder } = config;
    if (sortBy) {
      transactions = [...transactions].sort((a, b) => {
        let comparison = 0;
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    const reportData = transactions.map((txn) => ({
      id: txn.id,
      date: txn.date,
      type: txn.type,
      category: txn.category,
      amount: txn.amount,
      netAmount: txn.netAmount,
      status: txn.status,
      description: txn.description,
      allocations: txn.allocations,
      createdAt: txn.createdAt,
    }));

    return {
      data: reportData,
      metadata: {
        generatedAt: new Date(),
        recordCount: reportData.length,
        dateRange: config.dateRange || null,
      },
      format: config.format,
    };
  } catch (error) {
    console.error('Error generating transaction report:', error);
    throw new ReportError('Failed to generate transaction report', 'GENERATION_ERROR', config.id);
  }
}

// ============================================
// Export Functions
// ============================================

/**
 * Export report data to CSV
 */
export function exportToCSV(data: any[], filename?: string): string {
  if (!data || data.length === 0) {
    throw new ReportError('No data to export', 'NO_DATA');
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value ?? '');
      return stringValue.includes(',') || stringValue.includes('"')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Export report data to JSON
 */
export function exportToJSON(data: any[], pretty: boolean = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Export report data to HTML table
 */
export function exportToHTML(data: any[], title?: string): string {
  if (!data || data.length === 0) {
    throw new ReportError('No data to export', 'NO_DATA');
  }

  const headers = Object.keys(data[0]);

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title || 'Report'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #4CAF50;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h1>${title || 'Report'}</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <table>
        <thead>
            <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data.map(row => `
                <tr>
                    ${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

  return html;
}

/**
 * Download file with content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export report based on format
 */
export function exportReport(data: any[], options: ExportOptions): void {
  const format = options.format || 'CSV';
  const filename = options.filename || `report_${Date.now()}`;
  const includeHeaders = options.includeHeaders !== false;

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'CSV':
      content = exportToCSV(data);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    case 'Excel':
      // For Excel, we'll use CSV for now (true Excel export requires libraries)
      content = exportToCSV(data);
      mimeType = 'application/vnd.ms-excel';
      extension = 'csv';
      break;
    case 'PDF':
      // For PDF, we'll use HTML for now (true PDF export requires libraries)
      content = exportToHTML(data, filename);
      mimeType = 'text/html';
      extension = 'html';
      break;
    case 'HTML':
    default:
      content = exportToHTML(data, filename);
      mimeType = 'text/html';
      extension = 'html';
      break;
  }

  downloadFile(content, `${filename}.${extension}`, mimeType);
}

// ============================================
// Report Scheduling (Stub)
// ============================================

class ReportScheduler {
  private schedules: Map<string, ReportSchedule> = new Map();

  addSchedule(schedule: ReportSchedule): void {
    this.schedules.set(schedule.id, schedule);
    this.saveToStorage();
  }

  updateSchedule(id: string, updates: Partial<ReportSchedule>): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    const updated = { ...schedule, ...updates };
    this.schedules.set(id, updated);
    this.saveToStorage();
    return true;
  }

  removeSchedule(id: string): boolean {
    const deleted = this.schedules.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  getSchedules(): ReportSchedule[] {
    return Array.from(this.schedules.values());
  }

  getSchedule(id: string): ReportSchedule | undefined {
    return this.schedules.get(id);
  }

  toggleSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    schedule.enabled = !schedule.enabled;
    this.saveToStorage();
    return schedule.enabled;
  }

  calculateNextRunDate(frequency: ReportSchedule['frequency']): Date {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
    }

    return now;
  }

  private saveToStorage(): void {
    try {
      const schedules = Array.from(this.schedules.values());
      localStorage.setItem('report_schedules', JSON.stringify(schedules));
    } catch (error) {
      console.error('Failed to save report schedules:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('report_schedules');
      if (stored) {
        const schedules: ReportSchedule[] = JSON.parse(stored);
        schedules.forEach(s => {
          s.nextRunDate = new Date(s.nextRunDate);
          this.schedules.set(s.id, s);
        });
      }
    } catch (error) {
      console.error('Failed to load report schedules:', error);
    }
  }
}

const reportScheduler = new ReportScheduler();

// Initialize scheduler
reportScheduler['loadFromStorage']();

/**
 * Add a new report schedule
 */
export function addReportSchedule(schedule: ReportSchedule): void {
  reportScheduler.addSchedule(schedule);
}

/**
 * Update an existing report schedule
 */
export function updateReportSchedule(id: string, updates: Partial<ReportSchedule>): boolean {
  return reportScheduler.updateSchedule(id, updates);
}

/**
 * Remove a report schedule
 */
export function removeReportSchedule(id: string): boolean {
  return reportScheduler.removeSchedule(id);
}

/**
 * Get all report schedules
 */
export function getReportSchedules(): ReportSchedule[] {
  return reportScheduler.getSchedules();
}

/**
 * Toggle a schedule's enabled state
 */
export function toggleReportSchedule(id: string): boolean {
  return reportScheduler.toggleSchedule(id);
}

/**
 * Calculate next run date for a schedule
 */
export function calculateNextRunDate(frequency: ReportSchedule['frequency']): Date {
  return reportScheduler.calculateNextRunDate(frequency);
}

// ============================================
// Pre-configured Reports
// ============================================

export const PRECONFIGURED_REPORTS: ReportConfig[] = [
  {
    id: 'funding-summary',
    name: 'Funding Summary',
    description: 'Summary of all funding draws by matter',
    format: 'Excel',
  },
  {
    id: 'client-payoff',
    name: 'Client Payoff Report',
    description: 'Payoff amounts for all active matters',
    format: 'PDF',
  },
  {
    id: 'firm-payoff',
    name: 'Firm Payoff Report',
    description: 'Principal payoff amounts for firm',
    format: 'PDF',
  },
  {
    id: 'finance-charge',
    name: 'Finance Charge Report',
    description: 'Interest charges and payments by matter',
    format: 'Excel',
  },
  {
    id: 'transaction-activity',
    name: 'Transaction Activity',
    description: 'Detailed transaction log',
    format: 'CSV',
  },
];

export function getPreconfiguredReport(id: string): ReportConfig | undefined {
  return PRECONFIGURED_REPORTS.find(r => r.id === id);
}

export function getAllPreconfiguredReports(): ReportConfig[] {
  return [...PRECONFIGURED_REPORTS];
}
