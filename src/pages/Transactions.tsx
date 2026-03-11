import React, { useState, useMemo, Suspense, lazy } from 'react';
import {
  Check,
  Grid3x3,
  RotateCcw,
  Download,
  X,
  Search,
} from 'lucide-react';
import { Button, IconButton } from '../components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatusBadge, TransactionTypeBadge } from '../components/ui/Badge';
import { TransactionsTable } from '../components/transactions/TransactionsTable';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { AllocationModal } from '../components/transactions/AllocationModal';
import { useTransactionStore, useMatterStore, useUIStore } from '../store';
import { cn, formatCurrency, downloadCSV } from '../utils/formatters';
import { Transaction, TransactionType, TransactionStatus } from '../types';

type ViewMode = 'table' | 'cards';

export const Transactions: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  // Store hooks
  const getPaginatedTransactions = useTransactionStore((state) => state.getPaginatedTransactions);
  const getFilteredTransactions = useTransactionStore((state) => state.getFilteredTransactions);
  const getSortedTransactions = useTransactionStore((state) => state.getSortedTransactions);
  const getUnassignedTransactions = useTransactionStore((state) => state.getUnassignedTransactions);
  const filters = useTransactionStore((state) => state.filters);
  const setFilters = useTransactionStore((state) => state.setFilters);
  const setSorting = useTransactionStore((state) => state.setSorting);
  const pagination = useTransactionStore((state) => state.pagination);

  const getActiveMatters = useMatterStore((state) => state.getActiveMatters);

  // UI store hooks
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const showWarning = useUIStore((state) => state.showWarning);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);

  const handleSortChange = (sort: { key: keyof Transaction; direction: 'asc' | 'desc' }) => {
    setSorting(sort);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      useTransactionStore.getState().deleteTransaction(transactionId);
      showSuccess('Success', 'Transaction deleted successfully');
      if (selectedTransactionId === transactionId) {
        setSelectedTransactionId(null);
        setSelectedTransaction(undefined);
      }
    } catch (error) {
      showError('Error', 'Failed to delete transaction. Please try again.');
    }
  };

  const handleAllocateTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setSelectedTransactionId(transaction.id);
    setShowAllocationModal(true);
  };

  const handleBulkAllocate = async () => {
    const selectedItems = Array.from(selectedTransactions).map((id) =>
      getFilteredTransactions().find((t) => t.id === id)
    );

    // Only unassigned transactions can be bulk allocated
    const allocatable = selectedItems.filter((t) => t.status === 'Unassigned');

    if (allocatable.length === 0) {
      showWarning('No Unassigned Transactions', 'Please select unassigned transactions to allocate');
      return;
    }

    // Open allocation modal for first selected transaction
    if (allocatable.length > 0) {
      setSelectedTransaction(allocatable[0]);
      setSelectedTransactionId(allocatable[0].id);
      setShowAllocationModal(true);
    }
  };

  const handleAllocationSave = (allocations: TransactionAllocation[]) => {
    if (!selectedTransaction) return;

    try {
      useTransactionStore.getState().updateTransaction(selectedTransaction.id, {
        allocations,
        status: 'Assigned',
      });
      showSuccess('Success', 'Transaction allocated successfully');
      setShowAllocationModal(false);
      setSelectedTransaction(undefined);
      setSelectedTransactionId(null);
      setSelectedTransactions(new Set());
    } catch (error) {
      showError('Error', 'Failed to allocate transaction. Please try again.');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = getFilteredTransactions().map((txn) => ({
      'Transaction ID': txn.id,
      'Date': txn.date.toISOString().split('T')[0],
      'Type': txn.type,
      'Category': txn.category,
      'Amount': txn.amount.toFixed(2),
      'Net Amount': txn.netAmount.toFixed(2),
      'Status': txn.status,
      'Description': txn.description || '',
      'Allocated To': txn.allocations.map((a) => `${a.matterId}: ${a.amount}`).join('; '),
    }));

    downloadCSV(dataToExport, 'transactions-export.csv');
    showSuccess('Export Complete', 'Transactions data exported to CSV');
  };

  const handleClearFilters = () => {
    useTransactionStore.getState().resetFilters();
  };

  const handleResetSorting = () => {
    useTransactionStore.getState().resetSorting();
  };

  const handleSelectAllUnassigned = () => {
    const unassigned = getUnassignedTransactions();
    setSelectedTransactions(new Set(unassigned.map((t) => t.id)));
  };

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = new Set(getFilteredTransactions().map((t) => t.category));
    return Array.from(cats).sort();
  }, [getFilteredTransactions()]);

  // Transaction details state
  const showTransactionDetail = selectedTransactionId !== null && selectedTransactionId !== undefined;
  const selectedTransactionData = showTransactionDetail ? selectedTransaction : undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage transaction allocations, track draws and payments, and monitor interest drafts</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Unassigned
            </p>
            <p className="text-3xl font-bold text-error">
              {getUnassignedTransactions().length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Transactions requiring allocation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Total Draws
            </p>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(
                getFilteredTransactions()
                  .filter((t) => t.type === 'Draw')
                  .reduce((sum, t) => sum + t.amount, 0),
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getFilteredTransactions().filter((t) => t.type === 'Draw').length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Total Payments
            </p>
            <p className="text-3xl font-bold text-info">
              {formatCurrency(
                getFilteredTransactions()
                  .filter((t) => t.type === 'Principal Payment')
                  .reduce((sum, t) => sum + t.amount, 0),
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getFilteredTransactions().filter((t) => t.type === 'Principal Payment').length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Total Interest
            </p>
            <p className="text-3xl font-bold text-warning">
              {formatCurrency(
                getFilteredTransactions()
                  .filter((t) => t.type === 'Interest Autodraft')
                  .reduce((sum, t) => sum + t.amount, 0),
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getFilteredTransactions().filter((t) => t.type === 'Interest Autodraft').length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <TransactionFilters
          filters={filters}
          onChange={setFilters}
          onClear={handleClearFilters}
          matters={getActiveMatters().map((m) => ({ id: m.id, name: m.clientName }))}
          categories={categories}
        />
      </Card>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {getUnassignedTransactions().length > 0 && (
            <Button variant="secondary" onClick={handleSelectAllUnassigned}>
              <Check className="w-4 h-4" />
              Select All Unassigned ({getUnassignedTransactions().length})
            </Button>
          )}
          {selectedTransactions.size > 0 && (
            <Button
              variant="danger"
              onClick={handleBulkAllocate}
              disabled={selectedTransactions.size === 0}
            >
              <Grid3x3 className="w-4 h-4" />
              Bulk Allocate ({selectedTransactions.size})
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {filters.type !== 'All' || filters.status !== 'All' || filters.matterId || filters.category || filters.dateFrom || filters.dateTo && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <RotateCcw className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleResetSorting}>
            <RotateCcw className="w-4 h-4" />
            Reset Sort
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          Showing {getFilteredTransactions().length} of {getSortedTransactions().length} transactions
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">View:</span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                viewMode === 'table' ? 'bg-white text-black shadow' : 'text-gray-600'
              )}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
                viewMode === 'cards' ? 'bg-white text-black shadow' : 'text-gray-600'
              )}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        transactions={getPaginatedTransactions()}
        onView={handleViewTransaction}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onAllocate={handleAllocateTransaction}
        selectedTransactions={selectedTransactions}
        onSelectionChange={setSelectedTransactions}
        sortable
        onSortChange={handleSortChange}
        currentSort={sorting}
      />

      {/* Empty State */}
      {getPaginatedTransactions().length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-lg">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Transactions Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            {filters.type !== 'All' || filters.status !== 'All' || filters.matterId || filters.category || filters.dateFrom || filters.dateTo
              ? 'No transactions match your current filters. Try clearing them or adjusting your search.'
              : 'You haven\'t recorded any transactions yet. Get started by creating a draw or payment.'}
          </p>
          {filters.type !== 'All' || filters.status !== 'All' || filters.matterId || filters.category || filters.dateFrom || filters.dateTo && (
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {getPaginatedTransactions().length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center mt-6">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPagination({ page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPagination({ page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && selectedTransaction && (
        <AllocationModal
          isOpen={showAllocationModal}
          transaction={selectedTransaction}
          onSave={handleAllocationSave}
          onCancel={() => {
            setShowAllocationModal(false);
            setSelectedTransaction(undefined);
            setSelectedTransactionId(null);
          }}
        />
      )}

      {/* Transaction Detail Modal */}
      {showTransactionDetail && selectedTransactionData && !showAllocationModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setSelectedTransaction(undefined);
              setSelectedTransactionId(null);
            }}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedTransaction(undefined);
                    setSelectedTransactionId(null);
                  }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Transaction Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Transaction ID</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedTransactionData.id}</p>
                    </div>
                    <div className="text-right">
                      <TransactionTypeBadge type={selectedTransactionData.type} />
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedTransactionData.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Category</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransactionData.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Type</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransactionData.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
                      <div>
                        <StatusBadge status={selectedTransactionData.status as TransactionStatus} />
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(selectedTransactionData.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Amount</p>
                        <p className={cn('text-2xl font-bold', selectedTransactionData.netAmount >= 0 ? 'text-success' : 'text-error')}>
                          {formatCurrency(selectedTransactionData.netAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedTransactionData.description && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Description</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedTransactionData.description}
                      </p>
                    </div>
                  )}

                  {/* Allocations */}
                  {selectedTransactionData.allocations.length > 0 ? (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Allocated Matters</p>
                      <div className="space-y-2">
                        {selectedTransactionData.allocations.map((allocation) => {
                          const matter = getActiveMatters().find((m) => m.id === allocation.matterId);
                          return (
                            <div key={allocation.matterId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{matter?.clientName}</p>
                                <p className="text-xs text-gray-500">{allocation.matterId}</p>
                              </div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(allocation.amount)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 bg-yellow-200 dark:bg-yellow-800 rounded-full" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Unallocated Transaction</p>
                          <p className="text-xs text-gray-500 mt-1">
                            This transaction has not been allocated to any matter.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedTransaction(undefined);
                    setSelectedTransactionId(null);
                  }}
                >
                  Close
                </Button>
                {selectedTransactionData.allocations.length === 0 && (
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleDeleteTransaction(selectedTransactionData.id);
                      setSelectedTransaction(undefined);
                      setSelectedTransactionId(null);
                    }}
                  >
                    Delete Transaction
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
