import React from 'react';
import { Button, StatusBadge, IconButton } from '../ui';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';
import { Matter, MattersSortConfig, MattersPaginationState, MatterRowAction } from '../../types/matters';

export interface MattersListProps {
  matters: Matter[];
  sort: MattersSortConfig;
  pagination: MattersPaginationState;
  onSort: (column: MattersSortConfig['column']) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowAction: (action: MatterRowAction, matter: Matter) => void;
  selectedMatterId?: string;
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

export const MattersList: React.FC<MattersListProps> = ({
  matters,
  sort,
  pagination,
  onSort,
  onPageChange,
  onPageSizeChange,
  onRowAction,
  selectedMatterId,
}) => {
  const handleSort = (column: MattersSortConfig['column']) => {
    if (sort.column === column) {
      onSort(column);
    } else {
      onSort(column);
    }
  };

  const getSortIcon = (column: MattersSortConfig['column']) => {
    if (sort.column === column) {
      return SORT_ICONS[sort.direction];
    }
    return null;
  };

  const renderEmptyState = () => (
    <div className="text-center py-16 px-4">
      <svg
        className="w-16 h-16 text-gray-300 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No matters found</h3>
      <p className="text-gray-500 mb-6">
        Try adjusting your filters or create a new matter to get started.
      </p>
      <Button onClick={() => onRowAction('edit', {} as Matter)}>
        Create New Matter
      </Button>
    </div>
  );

  return (
    <Card>
      {matters.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {[
                    { key: 'id', label: 'Matter ID' },
                    { key: 'clientName', label: 'Client Name' },
                    { key: 'status', label: 'Status' },
                    { key: 'principalBalance', label: 'Principal Balance' },
                    { key: 'totalOwed', label: 'Total Owed' },
                    { key: 'createdAt', label: 'Created' },
                    { key: 'actions', label: 'Actions' },
                  ].map((header) => (
                    <th
                      key={header.key}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                        header.key === 'actions' && 'text-right'
                      )}
                    >
                      {header.key === 'actions' ? (
                        header.label
                      ) : (
                        <button
                          onClick={() => header.key !== 'status' && handleSort(header.key as MattersSortConfig['column'])}
                          className={cn(
                            'flex items-center gap-1 hover:text-black transition-colors',
                            header.key === 'status' && 'cursor-default'
                          )}
                        >
                          {header.label}
                          {getSortIcon(header.key as MattersSortConfig['column'])}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {matters.map((matter) => (
                  <tr
                    key={matter.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      selectedMatterId === matter.id && 'bg-black/5 hover:bg-black/10'
                    )}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-black">
                        {matter.id}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {matter.clientName}
                      </div>
                      {matter.notes && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {matter.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={matter.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(matter.principalBalance)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(matter.totalOwed)}
                      </div>
                      {matter.totalInterestAccrued > matter.interestPaid && (
                        <div className="text-xs text-warning">
                          +{formatCurrency(matter.totalInterestAccrued - matter.interestPaid)} interest
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(matter.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onRowAction('view', matter)}
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onRowAction('edit', matter)}
                          title="Edit Matter"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </IconButton>
                        {matter.status === 'Active' && (
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onRowAction('close', matter)}
                            title="Close Matter"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </IconButton>
                        )}
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onRowAction('reports', matter)}
                          title="Generate Reports"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing</span>
              <Select
                options={PAGE_SIZE_OPTIONS.map((size) => ({
                  value: size.toString(),
                  label: size.toString(),
                }))}
                value={pagination.pageSize.toString()}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                className="w-20"
              />
              <span>
                per page •{' '}
                <strong>
                  {(pagination.currentPage - 1) * pagination.pageSize + 1}-
                  {Math.min(pagination.currentPage * pagination.pageSize, matters.length)}
                </strong>{' '}
                of <strong>{matters.length}</strong> matters
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.currentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default MattersList;
