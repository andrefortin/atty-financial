import React, { useState } from 'react';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';
import { Button, IconButton } from './Button';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selectedRows: Set<string>) => void;
  sortable?: boolean;
  defaultSort?: { key: keyof T; direction: 'asc' | 'desc' };
  onSortChange?: (sort: { key: keyof T; direction: 'asc' | 'desc' }) => void;
  emptyMessage?: string;
  className?: string;
}

export const Table = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  sortable = false,
  defaultSort,
  onSortChange,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState(defaultSort || null);
  const [allSelected, setAllSelected] = useState(false);

  const handleSort = (column: Column<T>) => {
    if (!sortable || !column.sortable) return;

    const key = column.key as keyof T;
    let direction: 'asc' | 'desc' = 'asc';

    if (sortConfig?.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    setSortConfig({ key, direction });
    onSortChange?.({ key, direction });
  };

  const handleSelectAll = (checked: boolean) => {
    setAllSelected(checked);
    const newSelection = checked
      ? new Set(data.map((row) => row.id as string))
      : new Set();
    onSelectionChange?.(newSelection);
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    onSelectionChange?.(newSelection);
  };

  const getSortIcon = (column: Column<T>) => {
    if (!sortable || !column.sortable) return null;

    const key = column.key as keyof T;
    if (sortConfig?.key !== key) return null;

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15l4-4 4 4" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6l4 4-4 4" />
      </svg>
    );
  };

  const renderCell = (column: Column<T>, row: T) => {
    if (column.render) {
      return column.render(row);
    }
    return String(row[column.key as keyof T] ?? '');
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            {selectable && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected || (data.length > 0 && selectedRows.size === data.length)}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap',
                  sortable && column.sortable && 'cursor-pointer hover:bg-gray-100',
                  column.className
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center">
                  {column.header}
                  {getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowId = row.id as string;
              const isSelected = selectedRows.has(rowId);
              return (
                <tr
                  key={rowId}
                  className={cn(
                    'hover:bg-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-black/5'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn('px-4 py-3 text-sm text-gray-900', column.className)}
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
