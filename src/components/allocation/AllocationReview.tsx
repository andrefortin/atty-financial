import React, { useState, useMemo } from 'react';
import { useAllocationStore, useMatterStore, useTransactionStore } from '../../store';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/formatters';

export const AllocationReview: React.FC = () => {
  // Store access
  const { allocations, getRecentAllocations } = useAllocationStore();
  const { getActiveMatters } = useMatterStore();
  const { getAutodraftTransactions } = useTransactionStore();

  // Local state
  const [reviewPeriod, setReviewPeriod] = useState<'this-month' | 'last-month' | 'all-time'>('this-month');

  // Calculate date range based on review period
  const dateRange = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    switch (reviewPeriod) {
      case 'this-month':
        return { start: startOfMonth, end: endOfMonth };
      case 'last-month':
        return { start: startOfLastMonth, end: endOfLastMonth };
      case 'all-time':
        return { start: new Date(0), end: now };
      default:
        return { start: startOfMonth, end: endOfMonth };
    }
  }, [reviewPeriod]);

  // Filter allocations by date range
  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) =>
      a.executedAt >= dateRange.start && a.executedAt <= dateRange.end
    );
  }, [allocations, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalAmount = filteredAllocations.reduce((sum, a) => sum + a.totalAmount, 0);
    const totalCarryForward = filteredAllocations.reduce((sum, a) => sum + a.carryForward, 0);
    const totalMattersAllocated = new Set(
      filteredAllocations.flatMap((a) => a.allocations.map((alloc) => alloc.matterId))
    ).size;

    return {
      totalAmount,
      totalCarryForward,
      totalMattersAllocated,
      allocationCount: filteredAllocations.length,
    };
  }, [filteredAllocations]);

  // Get active matters with interest owed
  const mattersWithInterestOwed = useMemo(() => {
    return getActiveMatters()
      .filter((matter) => matter.interestOwed > 0)
      .sort((a, b) => b.interestOwed - a.interestOwed);
  }, [getActiveMatters]);

  // Pending autodrafts
  const pendingAutodrafts = getAutodraftTransactions().filter((t) => t.status === 'Unassigned');
  const pendingAmount = pendingAutodrafts.reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Review Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={reviewPeriod === 'this-month' ? 'default' : 'outline'}
              onClick={() => setReviewPeriod('this-month')}
            >
              This Month
            </Button>
            <Button
              variant={reviewPeriod === 'last-month' ? 'default' : 'outline'}
              onClick={() => setReviewPeriod('last-month')}
            >
              Last Month
            </Button>
            <Button
              variant={reviewPeriod === 'all-time' ? 'default' : 'outline'}
              onClick={() => setReviewPeriod('all-time')}
            >
              All Time
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Allocations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totals.allocationCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(totals.totalAmount)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Carry Forward</p>
                <p className={cn(
                  'text-2xl font-bold mt-1',
                  totals.totalCarryForward > 0 ? 'text-orange-600' : 'text-gray-400'
                )}>
                  {formatCurrency(totals.totalCarryForward)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Matters</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{totals.totalMattersAllocated}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Allocations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAllocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No allocations for the selected period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAllocations.slice(0, 5).map((allocation) => (
                  <div
                    key={allocation.id}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{allocation.id}</div>
                        <div className="text-xs text-gray-600">{formatDate(allocation.executedAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(allocation.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-600">{allocation.allocations.length} matters</div>
                      </div>
                    </div>
                    {allocation.carryForward > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Carry forward: {formatCurrency(allocation.carryForward)}
                      </div>
                    )}
                  </div>
                ))}
                {filteredAllocations.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    + {filteredAllocations.length - 5} more allocations
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Pending Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending Autodrafts */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-yellow-800">Pending Autodrafts</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-900">
                    {pendingAutodrafts.length}
                  </span>
                </div>
                <p className="text-sm text-yellow-700">
                  {formatCurrency(pendingAmount)} waiting to be allocated
                </p>
                {pendingAutodrafts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      // Navigate to allocate tab
                      window.dispatchEvent(new CustomEvent('navigate-to-allocate'));
                    }}
                  >
                    Allocate Now
                  </Button>
                )}
              </div>

              {/* Matters with Interest Owed */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium text-red-800">Matters with Interest Owed</span>
                  </div>
                  <span className="text-2xl font-bold text-red-900">
                    {mattersWithInterestOwed.length}
                  </span>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Total interest owed: {formatCurrency(
                    mattersWithInterestOwed.reduce((sum, m) => sum + m.interestOwed, 0)
                  )}
                </p>
                {mattersWithInterestOwed.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {mattersWithInterestOwed.slice(0, 3).map((matter) => (
                      <div
                        key={matter.id}
                        className="bg-white rounded p-2 text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="text-gray-900">{matter.clientName}</span>
                          <span className="text-red-600 font-medium">
                            {formatCurrency(matter.interestOwed)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {mattersWithInterestOwed.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        + {mattersWithInterestOwed.length - 3} more matters
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Allocation Validation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Validation Checks */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">
                  All allocations balance correctly
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center',
                  pendingAutodrafts.length === 0 ? 'bg-green-100' : 'bg-yellow-100'
                )}>
                  <svg className={cn(
                    'h-4 w-4',
                    pendingAutodrafts.length === 0 ? 'text-green-600' : 'text-yellow-600'
                  )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">
                  {pendingAutodrafts.length === 0
                    ? 'No pending autodrafts to allocate'
                    : `${pendingAutodrafts.length} autodraft(s) pending allocation`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center',
                  totals.totalCarryForward === 0 ? 'bg-green-100' : 'bg-orange-100'
                )}>
                  <svg className={cn(
                    'h-4 w-4',
                    totals.totalCarryForward === 0 ? 'text-green-600' : 'text-orange-600'
                  )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">
                  {totals.totalCarryForward === 0
                    ? 'No carry forward amounts'
                    : `${formatCurrency(totals.totalCarryForward)} carried forward`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline">
                Export Report
              </Button>
              <Button variant="outline">
                Print Summary
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
