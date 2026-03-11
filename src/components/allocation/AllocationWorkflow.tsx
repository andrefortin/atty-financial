import React, { useState, useMemo, useEffect } from 'react';
import { useAllocationStore, useTransactionStore, useMatterStore, useFirmStore } from '../../store';
import { AllocationMethod, AllocationMethodConfig } from '../../store/allocationStore';
import {
  calculateMatterBalance,
  allocateInterestWaterfall,
  allocateInterestToMatters,
  formatInterestAmount,
} from '../../services/interestCalculator';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/formatters';

interface AllocationWorkflowProps {
  onViewHistory: (allocationId: string) => void;
}

export const AllocationWorkflow: React.FC<AllocationWorkflowProps> = ({ onViewHistory }) => {
  // Store access
  const { getAutodraftTransactions } = useTransactionStore();
  const { getActiveMatters } = useMatterStore();
  const { getRateForDate } = useFirmStore();
  const {
    currentAllocationRequest,
    currentAllocationMethod,
    setCurrentAllocationRequest,
    setAllocationMethod,
    executeAllocation,
  } = useAllocationStore();

  // Local state
  const [selectedAutodraftId, setSelectedAutodraftId] = useState<string | null>(null);
  const [allocationPreview, setAllocationPreview] = useState<Array<{
    matterId: string;
    matterName: string;
    allocatedAmount: number;
    interestRemainingBefore: number;
    interestRemainingAfter: number;
    tier: 1 | 2;
  }> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get data
  const autodraftTransactions = getAutodraftTransactions().filter((t) => t.status === 'Unassigned');
  const activeMatters = getActiveMatters();

  // Selected autodraft transaction
  const selectedAutodraft = useMemo(() => {
    return autodraftTransactions.find((t) => t.id === selectedAutodraftId);
  }, [selectedAutodraftId, autodraftTransactions]);

  // Calculate allocation preview
  useEffect(() => {
    if (selectedAutodraft) {
      calculateAllocationPreview(selectedAutodraft);
    } else {
      setAllocationPreview(null);
    }
  }, [selectedAutodraftId, currentAllocationMethod, selectedAutodraft]);

  const calculateAllocationPreview = (transaction: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const date = transaction.date;
      const totalAmount = Math.abs(transaction.amount);

      // Calculate matter balances as of the autodraft date
      const matterBalances = activeMatters.map((matter) => {
        const balance = calculateMatterBalance(matter.id, date);
        return {
          matterId: matter.id,
          matterName: matter.clientName,
          principalBalance: balance.principalBalance,
          interestOwed: balance.interestOwed,
          tier: balance.principalBalance === 0 ? (1 as const) : (2 as const),
        };
      });

      // Calculate allocation based on method
      let allocationMap: Map<string, number>;

      if (currentAllocationMethod === 'waterfall') {
        allocationMap = allocateInterestWaterfall(totalAmount, date);
      } else {
        allocationMap = allocateInterestToMatters(totalAmount, date);
      }

      // Build preview
      const preview = matterBalances.map((matter) => {
        const allocatedAmount = allocationMap.get(matter.matterId) || 0;
        return {
          matterId: matter.matterId,
          matterName: matter.matterName,
          allocatedAmount,
          interestRemainingBefore: matter.interestOwed,
          interestRemainingAfter: Math.max(0, matter.interestOwed - allocatedAmount),
          tier: matter.tier,
        };
      }).filter((m) => m.allocatedAmount > 0);

      setAllocationPreview(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate allocation preview');
      setAllocationPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAllocation = async () => {
    if (!selectedAutodraft || !allocationPreview) return;

    setIsLoading(true);
    setError(null);

    try {
      const request = {
        autodraftTransactionId: selectedAutodraft.id,
        autodraftDate: selectedAutodraft.date,
        totalAmount: Math.abs(selectedAutodraft.amount),
      };

      setCurrentAllocationRequest(request);

      const allocation = executeAllocation(request, currentAllocationMethod);

      // Update the transaction status
      useTransactionStore.getState().allocateTransaction(
        selectedAutodraft.id,
        allocationPreview.map((p) => ({
          matterId: p.matterId,
          matterName: p.matterName,
          amount: p.allocatedAmount,
        }))
      );

      // View the allocation in history
      onViewHistory(allocation.id);

      // Reset selection
      setSelectedAutodraftId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute allocation');
    } finally {
      setIsLoading(false);
    }
  };

  const totalAllocated = allocationPreview?.reduce((sum, a) => sum + a.allocatedAmount, 0) || 0;
  const carryForward = selectedAutodraft ? Math.abs(selectedAutodraft.amount) - totalAllocated : 0;

  return (
    <div className="space-y-6">
      {/* Autodraft Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Step 1: Select Autodraft Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          {autodraftTransactions.length === 0 ? (
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
              <p className="text-lg font-medium">No pending autodrafts</p>
              <p className="text-sm mt-1">All interest autodrafts have been allocated</p>
            </div>
          ) : (
            <div className="space-y-3">
              {autodraftTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    selectedAutodraftId === txn.id
                      ? 'border-black bg-black/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => setSelectedAutodraftId(txn.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center',
                        selectedAutodraftId === txn.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                      )}>
                        {selectedAutodraftId === txn.id ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{txn.id}</div>
                        <div className="text-sm text-gray-600">
                          {txn.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {txn.description && ` • ${txn.description}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-gray-900">
                        {formatInterestAmount(txn.amount)}
                      </div>
                      <div className="text-sm text-gray-600">Interest Autodraft</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocation Method Selection */}
      {selectedAutodraft && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Step 2: Choose Allocation Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Waterfall Method */}
              <div
                className={cn(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all',
                  currentAllocationMethod === 'waterfall'
                    ? 'border-black bg-black/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => setAllocationMethod('waterfall')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    currentAllocationMethod === 'waterfall' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                  )}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <h3 className="font-semibold">Waterfall</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Tier 1: Matters with $0 principal get priority. Tier 2: Remaining amount distributed pro rata.
                </p>
              </div>

              {/* Pro Rata Method */}
              <div
                className={cn(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all',
                  currentAllocationMethod === 'pro-rata'
                    ? 'border-black bg-black/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => setAllocationMethod('pro-rata')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    currentAllocationMethod === 'pro-rata' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                  )}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold">Pro Rata</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Distributed proportionally based on each matter's principal balance.
                </p>
              </div>

              {/* Manual Method */}
              <div
                className={cn(
                  'p-4 rounded-lg border-2 cursor-pointer transition-all opacity-50',
                  currentAllocationMethod === 'manual'
                    ? 'border-black bg-black/5'
                    : 'border-gray-200'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    currentAllocationMethod === 'manual' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                  )}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold">Manual</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Manually specify allocation amounts for each matter. Coming soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allocation Preview */}
      {selectedAutodraft && allocationPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Step 3: Review & Execute Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-primary"></div>
                <span className="ml-3 text-gray-600">Calculating allocation...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatInterestAmount(Math.abs(selectedAutodraft.amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">To Allocate</p>
                      <p className="text-2xl font-bold text-black mt-1">
                        {formatInterestAmount(totalAllocated)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Carry Forward</p>
                      <p className={cn(
                        'text-2xl font-bold mt-1',
                        carryForward > 0 ? 'text-orange-600' : 'text-gray-400'
                      )}>
                        {formatInterestAmount(carryForward)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Matter Allocation Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Matter
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Principal
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interest Owed
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocated
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tier
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allocationPreview.map((allocation) => (
                        <tr key={allocation.matterId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {allocation.matterName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {formatInterestAmount(
                              activeMatters.find((m) => m.id === allocation.matterId)?.principalBalance || 0
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {formatInterestAmount(allocation.interestRemainingBefore)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            {formatInterestAmount(allocation.allocatedAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {formatInterestAmount(allocation.interestRemainingAfter)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                              allocation.tier === 1
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            )}>
                              Tier {allocation.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Execute Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleExecuteAllocation}
                    disabled={isLoading}
                    className="min-w-[200px]"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Executing...
                      </>
                    ) : (
                      'Execute Allocation'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
