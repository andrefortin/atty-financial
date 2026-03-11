// Transactions List Component

import React from 'react';
import { Button, StatusBadge } from '../ui';
import { cn, formatDate, formatCurrency } from '../../utils/formatters';
import { TransactionsSortConfig, TransactionsPaginationState, TransactionRowAction, TransactionSelectionState } from '../../types/transactions';
import { EXPENSE_CATEGORIES, PAYMENT_CATEGORIES, INTEREST_CATEGORY } from '../../utils/constants';

export interface TransactionsListProps {
  transactions: any[];
  sort: TransactionsSortConfig;
  pagination: TransactionsPaginationState;
  onSort: (column: TransactionsSortConfig['column']) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowAction: (action: TransactionRowAction, transaction: any) => void;
  selectedTransactionId?: string;
  selectable?: boolean;
  onSelect?: (transactionId: string, selected: boolean) => void;
  selectedIds?: Set<string>;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const SORT_ICONS = {
  asc: (
    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ),
  desc: (
    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
    </svg>
  ),
};

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  sort,
  pagination,
  onSort,
  onPageChange,
  onPageSizeChange,
  onRowAction,
  selectedTransactionId,
  selectable = false,
  onSelect,
  selectedIds = new Set(),
}) => {
  const unassignedCount = transactions.filter((t) => t.status === 'Unassigned').length;

  const handleSort = (column: TransactionsSortConfig['column']) => {
    onSort(column);
  };

  const getSortIcon = (column: TransactionsSortConfig['column']) => {
    if (sort.column === column) {
      return SORT_ICONS[sort.direction];
    }
    return null;
  };

  const renderEmptyState = () => (
    <div className="text-center py-16 px-4">
      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 .828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
      <p className="text-gray-500 mb-6">Try adjusting your filters or add a new transaction to get started.</p>
      <Button onClick={() => onRowAction('edit', {})}>
        Add New Transaction
      </Button>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {transactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Unassigned Alert */}
          {unassignedCount > 0 && (
            <div className="bg-error/10 border-b border-error/20 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-error">
                    {unassignedCount} unassigned transaction{unassignedCount > 1 ? 's' : ''} need allocation
                  </span>
                </div>
                <Button variant="danger" size="sm" onClick={() => {}}>
                  Allocate All
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Selection */}
          {selectable && selectedIds.size > 0 && (
            <div className="bg-black/10 border-b border-black/20 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">
                  {selectedIds.size} transaction{selectedIds.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Bulk Allocate
                  </Button>
                  <Button variant="ghost" size="sm">
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {selectable && (
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={false} onChange={() => {}} className="rounded border-gray-300 text-black focus:ring-black" />
                    </th>
                  )}
                  {[
                    { key: 'date', label: 'Date' },
                    { key: 'type', label: 'Type' },
                    { key: 'category', label: 'Category' },
                    { key: 'description', label: 'Description' },
                    { key: 'amount', label: 'Amount' },
                    { key: 'status', label: 'Status' },
                    { key: 'actions', label: 'Actions', className: 'text-right' },
                  ].map((header) => (
                    <th key={header.key} className={cn('px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider', header.key === 'actions' && 'text-right')}>
                      {header.key === 'actions' ? header.label : (
                        <button onClick={() => handleSort(header.key as TransactionsSortConfig['column'])} className={cn('flex items-center gap-1 hover:text-black transition-colors', header.key === 'status' && 'cursor-default')}>
                          {header.label}
                          {getSortIcon(header.key as TransactionsSortConfig['column'])}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((txn) => {
                  const isUnassigned = txn.status === 'Unassigned';
                  const isSelected = selectedIds.has(txn.id);
                  
                  return (
                    <tr key={txn.id} className={cn('hover:bg-gray-50 transition-colors', isUnassigned && 'bg-error/5 hover:bg-error/10', isSelected && 'bg-black/5 hover:bg-black/10')}>
                      {selectable && (
                        <td className="px-4 py-4">
                          <input type="checkbox" checked={isSelected} onChange={(e) => onSelect && onSelect(txn.id, e.target.checked)} className="rounded border-gray-300 text-black focus:ring-black" />
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(txn.date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          txn.type === 'Draw'
                            ? 'bg-green-100 text-green-800'
                            : txn.type === 'Principal Payment'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        )}>
                          {txn.type === 'Interest Autodraft' ? 'Interest Payment' : txn.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.category}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {txn.description || '-'}
                        </div>
                        {txn.allocations.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {txn.allocations.length} allocation{txn.allocations.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td className={cn('px-4 py-4 whitespace-nowrap text-sm font-medium', txn.type === 'Draw' ? 'text-error' : 'text-success')}>
                        {txn.type === 'Draw' ? '-' : '+'}{formatCurrency(txn.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={txn.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onRowAction('allocate', txn)} title="Allocate Transaction">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M9 11h.01M7 21h10V5a3 3 0 002-2v-3a1 1 0 00-1h1a1 1 0 00-1 1v3M4 7h16a2 2 0 00-2 2v14a2 2 0 002-2z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onRowAction('view', txn)} title="View Details">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12c4.478 4.057-5.064 7-9.542 7-1.274 4.057-5.064 7-9.542 7z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onRowAction('edit', txn)} title="Edit Transaction">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002 2v14a2 2 0 00-2 2v5m-1.414-9.414a2 2 0 .828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onRowAction('delete', txn)} title="Delete Transaction" className="text-error hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h4a1 1 0 00-1 1v3M4 7h16a2 2 0 00-2 2v14a2 2 0 002-2z" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing</span>
              <select
                value={pagination.pageSize.toString()}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                className="w-20"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size.toString()}>{size}</option>
                ))}
              </select>
              <span>per page</span>
              <strong>
                {(pagination.currentPage - 1) * pagination.pageSize + 1}-
                {Math.min(pagination.currentPage * pagination.pageSize, transactions.length)}
              </strong>
              <span>of</span>
              <strong>{transactions.length}</strong>
              <span>transactions</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onPageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7 7-7 7" />
                </svg>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === pagination.currentPage;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.currentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      disabled={isCurrentPage}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button variant="ghost" size="sm" onClick={() => onPageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionsList;
