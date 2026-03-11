import React from 'react';
import { Select, Button } from '../ui';
import { cn } from '../../utils/formatters';
import { ReportType, ReportOptions } from '../../types/ports';

export interface ReportFiltersProps {
  reportType: ReportType;
  fromDate?: Date;
  toDate?: Date;
  status?: string;
  category?: string;
  onFilterChange: (config: ReportOptions) => void;
  onGenerate: () => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const REPORT_TYPES = [
  { value: 'MatterSummary', label: 'Matter Summary' },
  { value: 'FirmPayoff', label: 'Firm Payoff' },
  { value: 'ClientPayoff', label: 'Client Payoff' },
  { value: 'Funding', label: 'Funding' },
  { value: 'FinanceCharge', label: 'Finance Charge' },
];

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType = 'MatterSummary',
  fromDate,
  toDate,
  status,
  category,
  onFilterChange,
  onGenerate,
}) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* Report Type Selection */}
      <div className="flex items-center gap-3">
        <label htmlFor="report-type" className="text-sm font-medium text-gray-700">
          Report Type
        </label>
        <Select
          id="report-type"
          value={reportType}
          onChange={(e) => onFilterChange({ reportType: e.target.value as ReportType })}
          options={REPORT_TYPES}
          className="w-48"
        />
      </div>

      {/* Report Date Range */}
      {(reportType === 'MatterSummary' || reportType === 'FirmPayoff' || reportType === 'ClientPayoff') && (
        <div className="flex items-center gap-6">
          <div>
            <label htmlFor="from-date" className="text-sm font-medium text-gray-700">
              From Date
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate ? new Date(fromDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onFilterChange({ fromDate: e.target.value ? new Date(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label htmlFor="to-date" className="text-sm font-medium text-gray-700">
              To Date
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate ? new Date(toDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onFilterChange({ toDate: e.target.value ? new Date(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      )}

      {/* Status Filter - Only for Payoff Reports */}
      {(reportType === 'FirmPayoff' || reportType === 'ClientPayoff') && (
        <div className="flex items-center gap-3">
          <label htmlFor="status" className="text-sm font-medium text-gray-700">
            Status
          </label>
          <Select
            id="status"
            value={status || 'all'}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            options={STATUS_OPTIONS}
            className="w-32"
          />
        </div>
      )}

      {/* Category Filter - Only for Matter Summary */}
      {reportType === 'MatterSummary' && (
        <div className="flex items-center gap-3">
          <label htmlFor="category" className="text-sm font-medium text-gray-700">
            Category
          </label>
          <Select
            id="category"
            value={category || 'all'}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'personal-injury', label: 'Personal Injury' },
              { value: 'medical-malpractice', label: 'Medical Malpractice' },
              { value: 'mass-tort', label: 'Mass Tort' },
              { value: 'commercial-litigation', label: 'Commercial Litigation' },
              { value: 'other', label: 'Other' },
            ]}
            className="w-40"
          />
        </div>
      )}

      {/* Generate Button */}
      <Button
        variant="primary"
        onClick={onGenerate}
        className="flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16m1.1a3.01 3.01 6.384 2.045-1.452 2.045 3.01 3.012 3.012 4.043 4.044-.5.5 0M9 9v-2.045l4.043-.5.5 3.012 3.012 4.043" />
        </svg>
        Generate Report
      </Button>
    </div>
  );
};
