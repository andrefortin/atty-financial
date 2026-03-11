import React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/formatters';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  PayoffReport,
  FundingReport,
  FinanceChargeReport,
  MatterSummaryReport,
  ClientPayoffReport,
  FirmPayoffReport,
} from '../../types/ports';
import { generatePayoffReport } from '../../services/reportGenerator';
import { useTransactionStore } from '../../store';
import { useUIStore } from '../../store';

export interface ReportPreviewProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
  onExport?: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  isOpen,
  onClose,
  onExport,
}) => {
  const transactions = useTransactionStore((state) => state.getTransactions());
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);

  const handleExport = () => {
    setGlobalLoading(true);
    try {
      if (onExport) {
        onExport();
      }
      // For now, just show success
      showSuccess('Export Started', 'Report generation in progress...');
    } catch (error) {
      setGlobalLoading(false);
      showError('Export Failed', 'Failed to generate report. Please try again.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const formatAllocation = (alloc: any) => {
    if (!alloc || alloc.length === 0) {
      return 'None';
    }
    const first = alloc[0];
    return `${formatCurrency(first.amount)}${alloc.length > 1 ? ` + ${alloc.length - 1} more` : ''}`;
  };

  const renderReportContent = () => {
    if (!report) return null;

    switch (report.reportType) {
      case 'MatterSummary': {
        const summary = report as MatterSummaryReport;
        return (
          <ModalBody className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Matter Summary Report</h3>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Matters</p>
                <p className="text-2xl font-bold text-black">{summary.totalMatters}</p>
                <p className="text-sm text-gray-500">Generated on {formatDate(summary.generationDate)}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Active Matters</p>
                <p className="text-2xl font-bold text-success">{summary.activeMatters}</p>
                <p className="text-sm text-gray-500">Currently active</p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Closed Matters</p>
                <p className="text-2xl font-bold text-warning">{summary.closedMatters}</p>
                <p className="text-sm text-gray-500">Closed within period</p>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Principal Balance</p>
                <p className="text-2xl font-bold text-gray-700">{formatCurrency(summary.totalPrincipalBalance)}</p>
                <p className="text-sm text-gray-500">Across all matters</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Interest Accrued</p>
                <p className="text-2xl font-bold text-error">{formatCurrency(summary.totalInterestAccrued)}</p>
                <p className="text-sm text-gray-500">Not yet paid</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Interest Paid</p>
                <p className="text-2xl font-bold text-purple">{formatCurrency(summary.totalInterestPaid)}</p>
                <p className="text-sm text-gray-500">Paid to date</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Owed</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(summary.totalOwed)}</p>
                <p className="text-sm text-gray-500">Principal + Interest</p>
              </div>
            </div>
          </ModalBody>
        );
      }

      case 'FirmPayoff': {
        const firm = report as FirmPayoffReport;
        return (
          <ModalBody className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Firm Payoff Report</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Matter ID</p>
              <p className="text-lg font-bold text-black">{firm.matterId}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Report Date</p>
              <p className="text-base font-medium text-gray-900">{formatDate(firm.reportDate)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Principal Balance</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(firm.principalBalance)}</p>
                <p className="text-sm text-gray-500">At time of payoff</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Interest Accrued</p>
                <p className="text-2xl font-bold text-error">{formatCurrency(firm.interestAccrued)}</p>
                <p className="text-sm text-gray-500">Not yet paid</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Interest Paid</p>
                <p className="text-2xl font-bold text-purple">{formatCurrency(firm.interestPaid)}</p>
                <p className="text-sm text-gray-500">Paid to date</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Firm Payoff</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(firm.totalFirmPayoffAmount)}</p>
                <p className="text-sm text-gray-500">Principal + Interest</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Client Payoff</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(firm.totalClientPayoffAmount)}</p>
                <p className="text-sm text-gray-500">To be determined</p>
              </div>
            </div>
          </ModalBody>
        );
      }

      case 'ClientPayoff': {
        const client = report as ClientPayoffReport;
        return (
          <ModalBody className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Payoff Report</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Matter ID</p>
              <p className="text-lg font-bold text-black">{client.matterId}</p>
              <p className="text-sm text-gray-500">Client</p>
              <p className="text-base font-medium text-gray-900">John Smith</p>
              <p className="text-sm text-gray-500">john.smith@client.com</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Principal Balance</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(client.principalBalance)}</p>
                <p className="text-sm text-gray-500">At time of payoff</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Interest Accrued</p>
                <p className="text-2xl font-bold text-error">{formatCurrency(client.interestAccrued)}</p>
                <p className="text-sm text-gray-500">Not yet paid</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Interest Paid</p>
                <p className="text-2xl font-bold text-purple">{formatCurrency(client.interestPaid)}</p>
                <p className="text-sm text-gray-500">Paid to date</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Total Client Payoff</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(client.totalClientPayoffAmount)}</p>
                  <p className="text-sm text-gray-500">Principal + Interest</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Remaining Firm Payoff</p>
                  <p className="text-2xl font-bold text-indigo-600">{formatCurrency(client.totalFirmPayoffAmount - client.totalClientPayoffAmount)}</p>
                  <p className="text-sm text-gray-500">Firm Payoff - Client Payoff</p>
                </div>
              </div>
            </div>
          </ModalBody>
        );
      }

      case 'Funding': {
        const funding = report as FundingReport;
        return (
          <ModalBody className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Report</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Funding ID</p>
              <p className="text-lg font-bold text-black">{funding.reportId}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Total Draw Amount</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(funding.drawAmount)}</p>
              <p className="text-sm text-gray-500">Draw from operating account</p>
            </div>

            <div className="mb-4">
              <p className="text-base font-medium text-gray-900 mb-2">Allocations</p>
              {funding.allocations.map((allocation) => (
                <div key={allocation.matterId} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Matter</p>
                      <p className="text-base font-bold text-black">{allocation.matterId}</p>
                      <p className="text-xs text-gray-500">Case #12345</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Allocated</p>
                      <p className="text-xl font-bold text-success">{formatCurrency(allocation.amount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
        );
      }

      case 'FinanceCharge': {
        const charge = report as FinanceChargeReport;
        return (
          <ModalBody className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Finance Charge Report</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Charge ID</p>
              <p className="text-lg font-bold text-black">{charge.reportId}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Interest Amount</p>
                <p className="text-2xl font-bold text-purple">{formatCurrency(charge.totalInterestAmount)}</p>
                <p className="text-sm text-gray-500">Interest collected across all matters</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Charge Date</p>
                <p className="text-base font-medium text-gray-900">{formatDate(charge.chargeDate)}</p>
                <p className="text-sm text-gray-500">Posted to operating account</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-base font-medium text-gray-900 mb-2">Allocations</p>
              {charge.allocations.map((allocation) => (
                <div key={allocation.matterId} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Matter</p>
                      <p className="text-base font-bold text-black">{allocation.matterId}</p>
                      <p className="text-xs text-gray-500">Interest Payment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Allocated</p>
                      <p className="text-xl font-bold text-purple">{formatCurrency(allocation.interestAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
        );
      }

      default:
        return (
          <ModalBody className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                Unsupported Report Type: {report?.reportType || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                Please select a valid report type from the options.
              </p>
            </div>
          </ModalBody>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>
          {report?.reportType === 'MatterSummary' && 'Matter Summary'}
          {report?.reportType === 'FirmPayoff' && 'Firm Payoff'}
          {report?.reportType === 'ClientPayoff' && 'Client Payoff'}
          {report?.reportType === 'Funding' && 'Funding'}
          {report?.reportType === 'FinanceCharge' && 'Finance Charge'}
          Report Preview
        </ModalTitle>
        <ModalFooter>
          <div className="flex items-center justify-between">
            {onExport && (
              <Button
                variant="secondary"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a1 1.992 0 1 1.992a1 1.992-1.01V19a2 2 2 003a1 2.003a1 2.003a1 2.007a1 2.007V19a2 2.007v-2.006a2 2.006v2.005a2 2.005z" />
                </svg>
                Export as CSV
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </ModalFooter>

        {renderReportContent()}
      </Modal>
  );
};

export default ReportPreview;
