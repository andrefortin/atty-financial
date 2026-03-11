import React, { useMemo, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, IconButton } from '../ui';
import { Badge } from '../ui/Badge';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';
import { useMatterStore, useTransactionStore, useFirmStore, useUIStore } from '../../store';
import { calculateMatterBalance, calculateMatterPayoff, calculateTotalInterestAccrued } from '../../services';
import { Matter } from '../../types';

export interface MatterDetailProps {
  matterId: string;
  onClose: () => void;
}

export const MatterDetail: React.FC<MatterDetailProps> = ({
  matterId,
  onClose,
}) => {
  const [view, setView] = useState<'summary' | 'transactions'>('summary');

  const getMatterById = useMatterStore((state) => state.getMatterById);
  const getTransactionsByMatterId = useTransactionStore((state) => state.getTransactionsByMatterId);
  const getEffectiveRate = useFirmStore((state) => state.getEffectiveRate);
  const openCreateReportModal = useUIStore((state) => state.openModal);

  const matter = getMatterById(matterId);
  const transactions = getTransactionsByMatterId(matterId);
  const effectiveRate = getEffectiveRate();

  const handleGenerateReports = () => {
    openCreateReportModal('FirmPayoff');
  };

  const getDaysSinceClosure = (): number | null => {
    if (!matter?.closedAt || matter?.status !== 'Closed') return null;
    const now = new Date();
    const diff = now.getTime() - matter.closedAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (): boolean => {
    if (!matter?.closedAt || matter?.status !== 'Closed') return false;
    const daysSince = getDaysSinceClosure();
    return daysSince !== null && daysSince >= 20 && matter.principalBalance > 0;
  };

  // Calculate live balance using interest calculator
  const matterBalance = useMemo(() => {
    if (!matter) return null;
    try {
      return calculateMatterBalance(matterId, new Date());
    } catch (error) {
      console.error('Error calculating matter balance:', error);
      return null;
    }
  }, [matterId, matter]);

  const payoff = useMemo(() => {
    if (!matter) return null;
    try {
      return calculateMatterPayoff(matterId, new Date());
    } catch (error) {
      console.error('Error calculating payoff:', error);
      return null;
    }
  }, [matterId, matter]);

  if (!matter) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Matter not found</p>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = [
    {
      label: 'Principal Balance',
      value: formatCurrency(matterBalance?.principalBalance || matter.principalBalance),
      subtitle: matter.principalBalance > 0 ? 'Outstanding' : 'Paid in full',
      color: matter.principalBalance > 0 ? 'error' : 'success',
    },
    {
      label: 'Interest Owed',
      value: formatCurrency(matterBalance?.interestOwed || 0),
      subtitle: `Accrued: ${formatCurrency(matterBalance?.interestAccrued || 0)}`,
      color: 'warning',
    },
    {
      label: 'Total Owed',
      value: formatCurrency(matterBalance?.totalOwed || matter.totalOwed),
      subtitle: 'Principal + Unpaid Interest',
      color: 'primary',
    },
    {
      label: 'Firm Payoff',
      value: formatCurrency(payoff?.firmPayoff || 0),
      subtitle: 'Principal balance only',
      color: 'success',
    },
  ];

  const getSummaryCardStyles = (color: 'primary' | 'success' | 'warning' | 'error') => {
    const colorStyles = {
      primary: { bg: 'bg-black/10', text: 'text-black' },
      success: { bg: 'bg-success/10', text: 'text-success' },
      warning: { bg: 'bg-warning/10', text: 'text-warning' },
      error: { bg: 'bg-error/10', text: 'text-error' },
    };
    return colorStyles[color];
  };

  const drawTransactions = transactions.filter((t) => t.type === 'Draw');
  const paymentTransactions = transactions.filter((t) => t.type === 'Principal Payment');
  const interestTransactions = transactions.filter((t) => t.type === 'Interest Autodraft');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-black">{matter.id}</h2>
                <Badge
                  variant={matter.status === 'Active' ? 'success' : matter.status === 'Closed' ? 'warning' : 'default'}
                >
                  {matter.status}
                </Badge>
                {isOverdue() && (
                  <Badge variant="error">Overdue</Badge>
                )}
              </div>
              <p className="text-lg text-gray-900 font-medium">{matter.clientName}</p>
              {matter.notes && (
                <p className="text-sm text-gray-500 mt-2">{matter.notes}</p>
              )}
            </div>
            <div className="flex gap-2">
              <IconButton variant="secondary" onClick={() => openCreateReportModal('FirmPayoff')} title="Generate Reports">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </IconButton>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created</p>
              <p className="text-sm text-gray-900 mt-1">{formatDate(matter.createdAt)}</p>
            </div>
            {matter.closedAt && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Closed</p>
                <p className="text-sm text-gray-900 mt-1">{formatDate(matter.closedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const styles = getSummaryCardStyles(card.color);
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                    <p className={cn('text-2xl font-bold mt-1', styles.text)}>
                      {card.value}
                    </p>
                    {card.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                    )}
                  </div>
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', styles.bg)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interest Info */}
      <Card>
        <CardHeader>
          <CardTitle>Interest Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Effective Rate
              </p>
              <p className="text-xl font-bold text-black">
                {effectiveRate.toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Interest Accrued
              </p>
              <p className="text-xl font-bold text-warning">
                {formatCurrency(matterBalance?.interestAccrued || 0)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Interest Paid
              </p>
              <p className="text-xl font-bold text-success">
                {formatCurrency(matterBalance?.interestPaid || 0)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Outstanding Interest
              </p>
              <p className="text-xl font-bold text-error">
                {formatCurrency(matterBalance?.interestOwed || 0)}
              </p>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Interest Calculation Method</p>
                <p className="text-xs text-blue-600 mt-1">
                  Interest is calculated using the ACT/360 day count convention at the current effective rate of{' '}
                  {effectiveRate.toFixed(2)}%. Interest accrues daily on outstanding principal balance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex border-b border-gray-200">
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            view === 'summary'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
          onClick={() => setView('summary')}
        >
          Transaction Summary
        </button>
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            view === 'transactions'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
          onClick={() => setView('transactions')}
        >
          Transaction Ledger ({transactions.length})
        </button>
      </div>

      {/* Content based on view */}
      {view === 'summary' ? (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Total Draws
                </p>
                <p className="text-xl font-bold text-black">
                  {formatCurrency(matter.totalDraws)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{drawTransactions.length} transactions</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Principal Payments
                </p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(matter.totalPrincipalPayments)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{paymentTransactions.length} transactions</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Interest Payments
                </p>
                <p className="text-xl font-bold text-warning">
                  {formatCurrency(matter.interestPaid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{interestTransactions.length} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions recorded for this matter
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Allocation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((txn) => {
                      const allocation = txn.allocations.find((a) => a.matterId === matterId);
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(txn.date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                txn.type === 'Draw'
                                  ? 'success'
                                  : txn.type === 'Principal Payment'
                                  ? 'info'
                                  : 'warning'
                              }
                            >
                              {txn.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {txn.category}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {txn.description || '-'}
                          </td>
                          <td className={cn('px-4 py-4 whitespace-nowrap text-sm font-medium text-right',
                            txn.type === 'Draw' ? 'text-error' : 'text-success')}>
                            {txn.type === 'Draw' ? '-' : '+'}
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right text-black">
                            {allocation ? formatCurrency(allocation.amount) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client Payoff Info */}
      {payoff && (
        <Card>
          <CardHeader>
            <CardTitle>Client Payoff Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-medium text-green-800 uppercase tracking-wider mb-2">
                  Firm Payoff (Principal Only)
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(payoff.firmPayoff)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Amount firm receives to fully settle principal
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-800 uppercase tracking-wider mb-2">
                  Client Payoff (Principal + Interest)
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(payoff.clientPayoff)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Total amount client pays to settle matter
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MatterDetail;
