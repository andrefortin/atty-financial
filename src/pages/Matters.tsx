import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Download,
  Trash2,
  X,
  ArrowUpDown,
  Search,
  FileText,
} from 'lucide-react';
import { Button, IconButton } from '../components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { MattersTable } from '../components/matters/MatterCard';
import { MattersTable } from '../components/matters/MattersTable';
import { AddMatterModal } from '../components/matters/AddMatterModal';
import { EditMatterModal } from '../components/matters/EditMatterModal';
import { MatterDetail } from '../components/matters/MatterDetail';
import { useMatterStore, useUIStore } from '../store';
import { cn, formatCurrency, downloadCSV } from '../utils/formatters';
import { Matter, MatterStatus } from '../types';
import { openCreateMatterModal, openEditMatterModal, openBulkCloseMattersModal } from '../store';

type ViewMode = 'table' | 'card';

export interface MattersProps {
  onMatterDetail?: (matterId: string) => void;
}

export const Matters: React.FC<MattersProps> = ({ onMatterDetail }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Store hooks
  const getPaginatedMatters = useMatterStore((state) => state.getPaginatedMatters);
  const getFilteredMatters = useMatterStore((state) => state.getFilteredMatters);
  const getSortedMatters = useMatterStore((state) => state.getSortedMatters);
  const getActiveMatters = useMatterStore((state) => state.getActiveMatters);
  const getClosedMatters = useMatterStore((state) => state.getClosedMatters);
  const getMatterAlerts = useMatterStore((state) => state.getMatterAlerts);
  const getTotalPrincipalBalance = useMatterStore((state) => state.getTotalPrincipalBalance);
  const getTotalInterestAccrued = useMatterStore((state) => state.getTotalInterestAccrued);
  const getTotalOwed = useMatterStore((state) => state.getTotalOwed);
  const deleteMatter = useMatterStore((state) => state.deleteMatter);
  const closeMatter = useMatterStore((state) => state.closeMatter);
  const bulkDeleteMatters = useMatterStore((state) => state.bulkDeleteMatters);
  const bulkCloseMatters = useMatterStore((state) => state.bulkCloseMatters);
  const filters = useMatterStore((state) => state.filters);
  const setFilters = useMatterStore((state) => state.setFilters);
  const setSorting = useMatterStore((state) => state.setSorting);
  const sorting = useMatterStore((state) => state.sorting);
  const pagination = useMatterStore((state) => state.pagination);

  // UI store hooks
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const showWarning = useUIStore((state) => state.showWarning);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);

  const handleSortChange = (sort: { key: keyof Matter; direction: 'asc' | 'desc' }) => {
    setSorting(sort);
  };

  const handleViewMatter = (matter: Matter) => {
    setSelectedMatterId(matter.id);
    if (onMatterDetail) {
      onMatterDetail(matter.id);
    }
  };

  const handleEditMatter = (matter: Matter) => {
    setSelectedMatterId(matter.id);
    setShowEditModal(true);
  };

  const handleCloseMatter = async (matter: Matter) => {
    try {
      closeMatter(matter.id);
      showSuccess('Success', `Matter ${matter.id} has been closed`);
      if (selectedMatterId === matter.id) {
        setSelectedMatterId(null);
      }
    } catch (error) {
      showError('Error', 'Failed to close matter. Please try again.');
    }
  };

  const handleDeleteMatter = async (matterId: string) => {
    if (!confirm('Are you sure you want to delete this matter? This action cannot be undone.')) {
      return;
    }

    try {
      deleteMatter(matterId);
      showSuccess('Success', 'Matter deleted successfully');
      if (selectedMatterId === matterId) {
        setSelectedMatterId(null);
      }
    } catch (error) {
      showError('Error', 'Failed to delete matter. Please try again.');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = getFilteredMatters().map((matter) => ({
      'Matter ID': matter.id,
      'Client Name': matter.clientName,
      'Status': matter.status,
      'Principal Balance': matter.principalBalance.toFixed(2),
      'Interest Accrued': matter.totalInterestAccrued.toFixed(2),
      'Interest Paid': matter.interestPaid.toFixed(2),
      'Total Owed': matter.totalOwed.toFixed(2),
      'Created': matter.createdAt.toISOString().split('T')[0],
      'Closed': matter.closedAt?.toISOString().split('T')[0] || '',
    }));

    downloadCSV(dataToExport, 'matters-export.csv');
    showSuccess('Export Complete', 'Matters data exported to CSV');
  };

  const alerts = getMatterAlerts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Matters</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your legal matters, track balances, and monitor interest accrual
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={openCreateMatterModal}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Matter
        </Button>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-50 text-base">
                {alerts.length} Overdue Matter{alerts.length > 1 ? 's' : ''} Detected
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {alerts.length} matter{alerts.length > 1 ? 's' : ''} have outstanding principal balances past the 20-day threshold.
              </p>
              <div className="mt-2 space-y-1">
                {alerts.map((alert) => (
                  <div key={alert.matterId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-2 py-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.clientName}
                    </span>
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      {formatCurrency(alert.principalBalance)} overdue
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="secondary" onClick={() => setFilters({ overdue: true })}>
              View Overdue Matters
            </Button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Active Matters
            </p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {getActiveMatters().length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              currently being tracked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Total Principal Balance
            </p>
            <p className="text-4xl font-bold text-error">
              {formatCurrency(getTotalPrincipalBalance())}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              across all matters
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Total Interest Accrued
            </p>
            <p className="text-4xl font-bold text-warning">
              {formatCurrency(getTotalInterestAccrued())}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              accrued on all matters
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Total Owed
            </p>
            <p className="text-4xl font-bold text-success">
              {formatCurrency(getTotalOwed())}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              principal plus interest
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Matters
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by client name, matter ID, or file number..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:ring-offset-0 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                value={filters.status || 'All'}
                onChange={(e) => setFilters({ status: e.target.value as MatterStatus | 'All' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:ring-offset-0 transition-all"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Suspended">Suspended</option>
                <option value="Archive">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">
              {getFilteredMatters().length}
            </span> of <span className="font-semibold text-gray-900 dark:text-white">
              {getSortedMatters().length}
            </span> matters
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
            <ArrowUpDown className="w-4 h-4" />
            Reset Filters
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSorting({ key: 'createdAt', direction: 'desc' })}>
            Sort: {sorting.key} {sorting.direction === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            View:
          </span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'table' ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow' : 'text-gray-600 dark:text-gray-400'
              )}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'card' ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow' : 'text-gray-600 dark:text-gray-400'
              )}
              onClick={() => setViewMode('card')}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Matters Display */}
      {viewMode === 'table' ? (
        <MattersTable
          matters={getPaginatedMatters()}
          onView={handleViewMatter}
          onEdit={handleEditMatter}
          onClose={handleCloseMatter}
          onDelete={handleDeleteMatter}
          selectedMatters={selectedRows}
          onSelectionChange={setSelectedRows}
          sortable
          onSortChange={handleSortChange}
          currentSort={sorting}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getPaginatedMatters().map((matter) => (
            <MatterCard
              key={matter.id}
              matter={matter}
              onView={() => handleViewMatter(matter)}
              onEdit={() => handleEditMatter(matter)}
              onClose={() => handleCloseMatter(matter)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {getPaginatedMatters().length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Matters Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filters.searchQuery || filters.status || filters.dueDate ? 'No matters match your current filters. Try clearing them or adjusting your search.' : 'You haven\'t created any matters yet. Get started by creating your first matter.'}
            </p>
            <Button onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {getPaginatedMatters().length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
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

      {/* Add Matter Modal */}
      <AddMatterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Matter Modal */}
      {selectedMatterId && showEditModal && (
        <EditMatterModal
          isOpen={showEditModal}
          matterId={selectedMatterId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMatterId(null);
          }}
        />
      )}

      {/* Bulk Close Matters Modal */}
      {selectedRows.size > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => {
              setSelectedRows(new Set());
            }}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Confirm Bulk Close
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Are you sure you want to close {selectedRows.size} matter(s)?
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedRows(new Set())}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-red-200 dark:bg-red-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">!</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-red-900 dark:text-red-50 mb-1">
                      This action cannot be undone
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                      All selected matters will be permanently closed and their balances will be archived.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Matters can be reopened from the archive if needed.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 bg-blue-200 dark:bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">i</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-blue-900 dark:text-blue-50 mb-1">
                      What happens when matters are closed?
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Principal balances are archived and interest accrual stops.
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      Matters can be viewed but not modified while closed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={() => setSelectedRows(new Set())}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    bulkDeleteMatters(Array.from(selectedRows));
                    showSuccess('Success', `${selectedRows.size} matter(s) closed successfully`);
                    setSelectedRows(new Set());
                  } catch (error) {
                    showError('Error', 'Failed to close matters. Please try again.');
                  }
                }}
              >
                Yes, Close {selectedRows.size} Matter{selectedRows.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matters;
