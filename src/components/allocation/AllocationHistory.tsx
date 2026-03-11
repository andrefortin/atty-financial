import React, { useState, useMemo } from 'react';
import { useAllocationStore, useMatterStore } from '../../store';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/formatters';

interface AllocationHistoryProps {
  selectedAllocationId: string | null;
  onSelectAllocation: (id: string | null) => void;
}

export const AllocationHistory: React.FC<AllocationHistoryProps> = ({
  selectedAllocationId,
  onSelectAllocation,
}) => {
  // Store access
  const { getPaginatedAllocations, getFilteredCount, getTotalPages, setPagination, pagination, filters, setFilters, resetFilters, getAllocationById } = useAllocationStore();
  const { getMatterById } = useMatterStore();

  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(filters.dateFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(filters.dateTo);

  // Get allocations
  const allocations = getPaginatedAllocations();
  const totalPages = getTotalPages();
  const filteredCount = getFilteredCount();

  // Selected allocation details
  const selectedAllocation = useMemo(() => {
    return selectedAllocationId ? getAllocationById(selectedAllocationId) : null;
  }, [selectedAllocationId, getAllocationById]);

  const handleFilterApply = () => {
    setFilters({ dateFrom, dateTo });
    setShowFilters(false);
  };

  const handleFilterReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    resetFilters();
    setShowFilters(false);
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ page: newPage });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Allocation History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleFilterApply}>Apply Filters</Button>
              <Button variant="outline" onClick={handleFilterReset}>Reset</Button>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation List */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {allocations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium">No allocations found</p>
                  <p className="text-sm mt-1">
                    {filteredCount > 0
                      ? 'Try adjusting your filters'
                      : 'Allocations will appear here once you execute them'}
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Autodraft ID
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Matters
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allocations.map((allocation) => (
                        <tr
                          key={allocation.id}
                          className={cn(
                            'cursor-pointer transition-colors',
                            selectedAllocationId === allocation.id
                              ? 'bg-black/10'
                              : 'hover:bg-gray-50'
                          )}
                          onClick={() => onSelectAllocation(allocation.id)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(allocation.autodraftDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                            {allocation.autodraftId}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            {formatCurrency(allocation.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {allocation.allocations.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="border-t px-4 py-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                        {Math.min(pagination.page * pagination.pageSize, filteredCount)} of {filteredCount}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        <span className="px-3 py-2 text-sm text-gray-600">
                          Page {pagination.page} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Allocation Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Allocation Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAllocation ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Allocation ID</span>
                        <span className="font-mono text-gray-900">{selectedAllocation.id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Autodraft ID</span>
                        <span className="font-mono text-gray-900">{selectedAllocation.autodraftId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Autodraft Date</span>
                        <span className="text-gray-900">{formatDate(selectedAllocation.autodraftDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Executed At</span>
                        <span className="text-gray-900">{formatDate(selectedAllocation.executedAt)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-bold text-gray-900">{formatCurrency(selectedAllocation.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Carry Forward</span>
                        <span className={cn(
                          'font-medium',
                          selectedAllocation.carryForward > 0 ? 'text-orange-600' : 'text-gray-400'
                        )}>
                          {formatCurrency(selectedAllocation.carryForward)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Matter Breakdown</h4>
                    <div className="space-y-2">
                      {selectedAllocation.allocations.map((allocation) => (
                        <div
                          key={allocation.matterId}
                          className="bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {allocation.matterName}
                            </span>
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              allocation.tier === 1
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            )}>
                              Tier {allocation.tier}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between text-gray-600">
                              <span>Before</span>
                              <span>{formatCurrency(allocation.interestRemainingBefore)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Allocated</span>
                              <span className="text-green-600 font-medium">
                                {formatCurrency(allocation.allocatedAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Remaining</span>
                              <span>{formatCurrency(allocation.interestRemainingAfter)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onSelectAllocation(null)}
                  >
                    Clear Selection
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">Select an allocation to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
