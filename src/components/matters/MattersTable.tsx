import React, { useMemo, useState } from 'react';
import { Table, Column } from '../ui/Table';
import { Button, IconButton } from '../ui/Button';
import { StatusBadge, AlertLevelBadge } from '../ui/Badge';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';
import { Matter } from '../../types';

export interface MattersTableProps {
  matters: Matter[];
  onView: (matter: Matter) => void;
  onEdit: (matter: Matter) => void;
  onClose: (matter: Matter) => void;
  onDelete: (matterId: string) => void;
  selectedMatters?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  sortable?: boolean;
  onSortChange?: (sort: { key: keyof Matter; direction: 'asc' | 'desc' }) => void;
  currentSort?: { key: keyof Matter; direction: 'asc' | 'desc' };
  loading?: boolean;
}

export const MattersTable: React.FC<MattersTableProps> = ({
  matters,
  onView,
  onEdit,
  onClose,
  onDelete,
  selectedMatters = new Set(),
  onSelectionChange,
  sortable = true,
  onSortChange,
  currentSort,
  loading = false,
}) => {
  const [localSelected, setLocalSelected] = useState<Set<string>>(selectedMatters);

  const handleSelectionChange = (newSelection: Set<string>) => {
    setLocalSelected(newSelection);
    onSelectionChange?.(newSelection);
  };

  const getDaysSinceClosure = (matter: Matter): number | null => {
    if (!matter.closedAt || matter.status !== 'Closed') return null;
    const now = new Date();
    const diff = now.getTime() - matter.closedAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (matter: Matter): boolean => {
    const daysSince = getDaysSinceClosure(matter);
    return daysSince !== null && daysSince >= 20 && matter.principalBalance > 0;
  };

  const getOverdueAlert = (matter: Matter): { level: 'Warning' | 'Error'; days: number } | null => {
    const daysSince = getDaysSinceClosure(matter);
    if (daysSince === null || !isOverdue(matter)) return null;
    return {
      level: daysSince >= 40 ? 'Error' : 'Warning',
      days: daysSince,
    };
  };

  const columns: Column<Matter>[] = useMemo(() => [
    {
      key: 'id',
      header: 'Matter ID',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-black">{row.id}</span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.clientName}</p>
          {row.notes && (
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{row.notes}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) => {
        const alert = getOverdueAlert(row);
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={row.status} />
            {alert && (
              <AlertLevelBadge level={alert.level} days={alert.days} />
            )}
          </div>
        );
      },
    },
    {
      key: 'principalBalance',
      header: 'Principal Balance',
      sortable: true,
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <span className={cn(
          'font-medium',
          row.principalBalance > 0 ? 'text-error' : 'text-success'
        )}>
          {formatCurrency(row.principalBalance)}
        </span>
      ),
    },
    {
      key: 'totalOwed',
      header: 'Total Owed',
      sortable: true,
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.totalOwed)}
        </span>
      ),
    },
    {
      key: 'totalInterestAccrued',
      header: 'Interest Accrued',
      sortable: true,
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <span className="text-gray-600">
          {formatCurrency(row.totalInterestAccrued)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
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
          <IconButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
            title="Edit Matter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </IconButton>
          {row.status === 'Active' && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose(row);
              }}
              title="Close Matter"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </IconButton>
          )}
          {row.status === 'Closed' && (
            <IconButton
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row.id);
              }}
              title="Delete Matter"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h4a1 1 0 00-1 1v3M4 7h16a2 2 0 002 2v14a2 2 0 00-2 2z" />
              </svg>
            </IconButton>
          )}
        </div>
      ),
    },
  ], []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary" />
        <span className="ml-3 text-gray-600">Loading matters...</span>
      </div>
    );
  }

  return (
    <Table
      data={matters}
      columns={columns}
      onRowClick={onView}
      selectable
      selectedRows={localSelected}
      onSelectionChange={handleSelectionChange}
      sortable={sortable}
      defaultSort={currentSort}
      onSortChange={onSortChange}
      emptyMessage="No matters found matching your criteria"
    />
  );
};

export default MattersTable;
