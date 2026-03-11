import React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../ui/Modal';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { cn } from '../../utils/formatters';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { ClientPayoffReport } from '../../types/ports';

export interface ClientPayoffReportProps {
  report: ClientPayoffReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPayoffReport: React.FC<ClientPayoffReportProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Client Payoff Report</ModalTitle>
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
            <p className="text-base font-medium text-gray-900">John Smith</p>
            <p className="text-xs text-gray-500">john.smith@client.com</p>
          </div>

          <div className="col-span-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Report Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(new Date(report.reportDate))}</p>
          </div>

          <div className="col-span-1 text-right">
            <Badge variant="primary">CLIENT</Badge>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Principal Balance</p>
            <p className="text-2xl font-bold text-warning">{formatCurrency(report.principalBalance)}</p>
            <p className="text-sm text-gray-500">At time of payoff</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Interest Accrued</p>
            <p className="text-2xl font-bold text-error">{formatCurrency(report.interestAccrued)}</p>
            <p className="text-sm text-gray-500">Not yet paid</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Principal Paid</p>
            <p className="text-2xl font-bold text-purple">{formatCurrency(report.principalPaid)}</p>
            <p className="text-sm text-gray-500">Paid to date</p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Interest Owed</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCurrency(report.interestOwedNextAutodraft)}</p>
            <p className="text-sm text-gray-500">Principal + Interest</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Total Client Payoff</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(report.totalClientPayoffAmount)}</p>
            <p className="text-sm text-gray-500">Principal + Interest</p>
          </div>

          <div className="col-span-1 text-right">
            <Badge variant="success">PAYOFF</Badge>
          </div>
        </div>

        {/* Transaction Allocations */}
        {report.transactions && report.transactions.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions</h3>
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
                      <td className="text-sm text-gray-900 text-right">{formatCurrency(tx.amount)}</td>
                      <td>
                        {tx.allocations && tx.allocations.length > 0 ? (
                          <p className="text-xs font-medium text-gray-500 mb-1">Matter {tx.allocations[0].matterId}</p>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(tx.allocations[0].amount)}</p>
                        ) : (
                          <p className="text-xs font-medium text-gray-500 mb-1">Unallocated</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 text-center">No transactions included in report</p>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};

export default ClientPayoffReport;
