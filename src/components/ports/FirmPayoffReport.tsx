import React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { cn } from '../../utils/formatters';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FirmPayoffReport } from '../../types/ports';

export interface FirmPayoffReportProps {
  report: FirmPayoffReport;
  isOpen: boolean;
  onClose: () => void;
}

export const FirmPayoffReport: React.FC<FirmPayoffReportProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Firm Payoff Report</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Report Header */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</p>
            <p className="text-sm font-bold text-gray-900">{report.reportId}</p>
          </div>

          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Matter ID</p>
            <p className="text-sm font-bold text-gray-900">{report.matterId}</p>
          </div>

          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Client</p>
            <div>
              <p className="text-sm font-bold text-gray-900">John Smith</p>
              <p className="text-xs text-gray-500">john.smith@client.com</p>
            </div>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Report Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(new Date(report.reportDate))}</p>
          </div>

          <div className="col-span-1 text-right">
            <Badge variant="primary">FIRM</Badge>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-200 pt-6">
          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Balance</p>
            <p className="text-2xl font-bold text-gray-700">{formatCurrency(report.principalBalance)}</p>
            <p className="text-sm text-gray-500">At time of payoff</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Accrued</p>
            <p className="text-2xl font-bold text-error">{formatCurrency(report.interestAccrued)}</p>
            <p className="text-sm text-gray-500">Not yet paid</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Paid</p>
            <p className="text-2xl font-bold text-purple">{formatCurrency(report.interestPaid)}</p>
            <p className="text-sm text-gray-500">Paid to date</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Paid</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(report.principalPaid)}</p>
            <p className="text-sm text-gray-500">Paid to date</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Owed Next Autodraft</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(report.interestOwedNextAutodraft)}</p>
            <p className="text-sm text-gray-500">Accruing as of {formatDate(new Date(report.reportDate))}</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Firm Payoff</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(report.totalFirmPayoffAmount)}</p>
            <p className="text-sm text-gray-500">Principal + Interest</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Client Payoff</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(report.totalClientPayoffAmount)}</p>
            <p className="text-sm text-gray-500">To be determined</p>
          </div>

          <div className="col-span-1 text-right">
            <Badge variant="success">PAID</Badge>
          </div>
        </div>

        {/* Transaction Allocations */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions</h3>
          {report.transactions && report.transactions.length > 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated To</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-sm text-gray-900">{formatDate(new Date(tx.date))}</td>
                      <td className="text-sm text-gray-900">{tx.type}</td>
                      <td className="text-sm font-medium text-gray-900">{formatCurrency(tx.amount)}</td>
                      <td>
                        {tx.allocations && tx.allocations.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Matter {tx.allocations[0].matterId}</p>
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(tx.allocations[0].amount)}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mb-1">Unallocated</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 text-center">No transactions included in report</p>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};
