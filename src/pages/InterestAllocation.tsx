import React, { useState } from 'react';
import {
  ChevronRight,
  Check,
  TrendingUp,
  DollarSign,
  ArrowRight,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useAllocationStore, useTransactionStore } from '../store';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Tab } from './allocation/Tab';
import { AllocationWorkflow } from '../components/allocation/AllocationWorkflow';
import { AllocationHistory } from '../components/allocation/AllocationHistory';
import { AllocationReview } from '../components/allocation/AllocationReview';
import { formatCurrency } from '../utils/formatters';

type AllocationTab = 'allocate' | 'history' | 'review';

export const InterestAllocationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AllocationTab>('allocate');
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

  const { allocations } = useAllocationStore();
  const { getAutodraftTransactions } = useTransactionStore();

  const autodraftTransactions = getAutodraftTransactions();
  const hasPendingAllocations = autodraftTransactions.filter(
    (t) => t.status === 'Unassigned'
  ).length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Interest Allocation
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Allocate interest autodrafts to matters using waterfall, pro rata, or manual methods
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Pending Autodrafts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {autodraftTransactions.filter((t) => t.status === 'Unassigned').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  awaiting allocation
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Total Allocations
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allocations.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  across all matters
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Total Allocated
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allocations
                    .filter((a) => a.allocations?.length > 0)
                    .reduce((sum, a) => sum + a.totalAmount, 0)
                    .toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Last Updated
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  Today
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  last allocation
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Navigation Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
          <Tab
            id="allocate"
            label="Allocate"
            icon={<ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            badge={hasPendingAllocations ? autodraftTransactions.filter((t) => t.status === 'Unassigned').length : undefined}
            isActive={activeTab === 'allocate'}
            onTabChange={() => setActiveTab('allocate')}
          />
          <Tab
            id="history"
            label="History"
            icon={<ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            isActive={activeTab === 'history'}
            onTabChange={() => setActiveTab('history')}
          />
          <Tab
            id="review"
            label="Review"
            icon={<CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            isActive={activeTab === 'review'}
            onTabChange={() => setActiveTab('review')}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'allocate' && (
          <AllocationWorkflow
            onViewHistory={(id) => {
              setSelectedAllocationId(id);
              setActiveTab('history');
            }}
          />
        )}
        {activeTab === 'history' && (
          <AllocationHistory
            selectedAllocationId={selectedAllocationId}
            onSelectAllocation={setSelectedAllocationId}
          />
        )}
        {activeTab === 'review' && <AllocationReview />}
      </div>
    </div>
  );
};

export default InterestAllocationPage;
