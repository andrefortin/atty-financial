import React from 'react';
import { Table, Column } from '../ui/Table';
import { Button, IconButton } from '../ui/Button';
import { StatusBadge, TransactionTypeBadge } from '../ui/Badge';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';
import { Transaction } from '../../types';

export interface TransactionsTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onAllocate: (transaction: Transaction) => void;
  selectedTransactions?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  sortable?: boolean;
  onSortChange?: (sort: { key: keyof Transaction; direction: 'asc' | 'desc' }) => void;
  currentSort?: { key: keyof Transaction; direction: 'asc' | 'desc' };
  loading?: boolean;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onView,
  onEdit,
  onDelete,
  onAllocate,
  selectedTransactions = new Set(),
  onSelectionChange,
  sortable = true,
  onSortChange,
  currentSort,
  loading = false,
}) => {
  const [localSelected, setLocalSelected] = React.useState<Set<string>>(selectedTransactions);

  const handleSelectionChange = (newSelection: Set<string>) => {
    setLocalSelected(newSelection);
    onSelectionChange?.(newSelection);
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'id',
      header: 'Transaction ID',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-black">{row.id}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (row) => <TransactionTypeBadge type={row.type} />,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) => row.category,
    },
    {
      key: 'description',
      header: 'Description',
      sortable: false,
      render: (row) => (
        <div className="max-w-[200px] truncate" title={row.description}>
          {row.description || '-'}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      className: 'text-right whitespace-nowrap',
      render: (row) => {
        const amount = row.type === 'Draw' ? row.amount : -row.amount;
        return (
          <span className={cn('font-medium', row.type === 'Draw' ? 'text-error' : 'text-success')}>
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'allocations',
      header: 'Allocated To',
      sortable: false,
      render: (row) => {
        if (row.allocations.length === 0) {
          return (
            <span className="text-gray-400 italic text-sm">Unallocated</span>
          );
        }
        return (
          <div className="text-sm">
            {row.allocations.slice(0, 2).map((alloc, index) => (
              <div key={alloc.matterId} className="flex items-center gap-1">
                <span className="text-black font-medium">{alloc.matterId}</span>
                <span className="text-gray-600">{formatCurrency(alloc.amount)}</span>
              </div>
            ))}
            {row.allocations.length > 2 && (
              <span className="text-xs text-gray-500">
                +{row.allocations.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'Unassigned' && (
            <IconButton
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAllocate(row);
              }}
              title="Allocate Transaction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-2H4m2 2h8m-2 2v-2m0 2h-2" />
              </svg>
            </IconButton>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(row);
            }}
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.278 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </IconButton>
          {row.status !== 'Allocated' && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              title="Edit Transaction"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </IconButton>
          )}
          <IconButton
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.id);
            }}
            title="Delete Transaction"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h4a1 1 0 00-1 1v3M4 7h16a2 2 0 002 2v14a2 2 0 00-2 2z" />
            </svg>
          </IconButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary" />
        <span className="ml-3 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  return (
    <Table
      data={transactions}
      columns={columns}
      onRowClick={onView}
      selectable
      selectedRows={localSelected}
      onSelectionChange={handleSelectionChange}
      sortable={sortable}
      defaultSort={currentSort}
      onSortChange={onSortChange}
      emptyMessage="No transactions found matching your criteria"
    />
  );
};

export default TransactionsTable;
