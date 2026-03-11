import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cn, formatCurrency, formatDate, formatRate } from '../../utils/formatters';
import { RateEntry } from '../../types';

// ============================================
// Types for Rate Calendar
// ============================================

export interface RateFormData {
  id?: string;
  effectiveDate: Date;
  primeRate: number;
  modifier: number;
  source?: string;
  notes?: string;
}

export interface RateFormDataErrors {
  effectiveDate?: string;
  primeRate?: string;
  modifier?: string;
}

// ============================================
// Rate Calendar Component
// ============================================

interface RateCalendarProps {
  className?: string;
  onRateChange?: (rateEntry: RateEntry) => void;
}

export const RateCalendar: React.FC<RateCalendarProps> = ({ 
  className,
  onRateChange 
}) => {
  // State
  const [rateEntries, setRateEntries] = useState<RateEntry[]>([
    {
      id: '1',
      effectiveDate: new Date('2024-01-01'),
      primeRate: 8.5,
      modifier: 2.5,
      totalRate: 11.0,
      source: 'Federal Reserve',
      notes: 'Initial rate setup',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      effectiveDate: new Date('2024-03-15'),
      primeRate: 8.75,
      modifier: 2.5,
      totalRate: 11.25,
      source: 'Federal Reserve',
      notes: 'Rate increase due to market conditions',
      createdAt: new Date('2024-03-15'),
    },
    {
      id: '3',
      effectiveDate: new Date('2024-06-01'),
      primeRate: 9.0,
      modifier: 2.5,
      totalRate: 11.5,
      source: 'Federal Reserve',
      notes: 'Fed rate hike',
      createdAt: new Date('2024-06-01'),
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRate, setEditingRate] = useState<RateEntry | null>(null);
  const [formData, setFormData] = useState<RateFormData>({
    effectiveDate: new Date(),
    primeRate: 8.5,
    modifier: 2.5,
  });
  const [errors, setErrors] = useState<RateFormDataErrors>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Get current rate
  const currentRate = useMemo(() => {
    const sortedEntries = [...rateEntries].sort(
      (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
    return sortedEntries[0] || null;
  }, [rateEntries]);

  // Validate form
  const validateForm = (data: RateFormData): RateFormDataErrors => {
    const newErrors: RateFormDataErrors = {};

    if (!data.effectiveDate) {
      newErrors.effectiveDate = 'Effective date is required';
    } else if (data.effectiveDate > new Date()) {
      newErrors.effectiveDate = 'Effective date cannot be in the future';
    }

    if (!data.primeRate || data.primeRate <= 0) {
      newErrors.primeRate = 'Prime rate must be greater than 0';
    } else if (data.primeRate > 30) {
      newErrors.primeRate = 'Prime rate seems unusually high';
    }

    if (data.modifier === undefined || data.modifier === null) {
      newErrors.modifier = 'Modifier is required';
    } else if (data.modifier < -10 || data.modifier > 10) {
      newErrors.modifier = 'Modifier must be between -10% and +10%';
    }

    // Check for overlapping dates when adding new rate
    if (!data.id) {
      const hasOverlap = rateEntries.some(entry => {
        const entryDate = new Date(entry.effectiveDate).toDateString();
        const newDate = new Date(data.effectiveDate).toDateString();
        return entryDate === newDate;
      });

      if (hasOverlap) {
        newErrors.effectiveDate = 'A rate already exists for this date';
      }
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = () => {
    const newErrors = validateForm(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const totalRate = formData.primeRate + formData.modifier;

    if (editingRate) {
      // Update existing rate
      setRateEntries(entries =>
        entries.map(entry =>
          entry.id === editingRate.id
            ? {
                ...entry,
                effectiveDate: formData.effectiveDate!,
                primeRate: formData.primeRate!,
                modifier: formData.modifier!,
                totalRate,
                source: formData.source,
                notes: formData.notes,
              }
            : entry
        )
      );
      onRateChange?.({
        ...editingRate,
        effectiveDate: formData.effectiveDate!,
        primeRate: formData.primeRate!,
        modifier: formData.modifier!,
        totalRate,
        source: formData.source,
        notes: formData.notes,
      });
      setShowEditModal(false);
      setEditingRate(null);
    } else {
      // Add new rate
      const newEntry: RateEntry = {
        id: Date.now().toString(),
        effectiveDate: formData.effectiveDate!,
        primeRate: formData.primeRate!,
        modifier: formData.modifier!,
        totalRate,
        source: formData.source,
        notes: formData.notes,
        createdAt: new Date(),
      };
      setRateEntries([...rateEntries, newEntry]);
      onRateChange?.(newEntry);
      setShowAddModal(false);
    }

    setFormData({
      effectiveDate: new Date(),
      primeRate: 8.5,
      modifier: 2.5,
    });
    setErrors({});
  };

  // Handle edit
  const handleEdit = (rateEntry: RateEntry) => {
    setEditingRate(rateEntry);
    setFormData({
      id: rateEntry.id,
      effectiveDate: rateEntry.effectiveDate,
      primeRate: rateEntry.primeRate,
      modifier: rateEntry.modifier,
      source: rateEntry.source,
      notes: rateEntry.notes,
    });
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = (rateId: string) => {
    setRateEntries(entries => entries.filter(entry => entry.id !== rateId));
    setDeleteConfirm(null);
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      effectiveDate: new Date(),
      primeRate: 8.5,
      modifier: 2.5,
    });
    setErrors({});
    setEditingRate(null);
  };

  // Export rate history
  const handleExportCSV = () => {
    const csvData = rateEntries.map(entry => ({
      'Effective Date': formatDate(entry.effectiveDate, 'short'),
      'Prime Rate': formatRate(entry.primeRate),
      Modifier: formatRate(entry.modifier),
      'Total Rate': formatRate(entry.totalRate),
      Source: entry.source || '',
      Notes: entry.notes || '',
      'Created At': formatDate(entry.createdAt, 'short'),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rate-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============================================
  // Render Current Rate Card
  // ============================================
  
  const renderCurrentRateCard = () => {
    if (!currentRate) return null;

    return (
      <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-black-light text-sm font-medium uppercase tracking-wider mb-2">
                Current Interest Rate
              </p>
              <p className="text-5xl font-bold mb-2">
                {formatRate(currentRate.totalRate)}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-black-light">
                  Prime: {formatRate(currentRate.primeRate)}
                </span>
                <span className="text-black-light">
                  Modifier: {currentRate.modifier >= 0 ? '+' : ''}{formatRate(currentRate.modifier)}
                </span>
              </div>
              <p className="text-black-light text-xs mt-3">
                Effective: {formatDate(currentRate.effectiveDate, 'display')}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="success" className="bg-white/20 text-white border-0">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render Rate Timeline
  // ============================================
  
  const renderRateTimeline = () => {
    const sortedEntries = [...rateEntries].sort(
      (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate History Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            <div className="space-y-6">
              {sortedEntries.map((entry, idx) => {
                const prevRate = idx < sortedEntries.length - 1 ? sortedEntries[idx + 1] : null;
                const rateChange = prevRate ? entry.totalRate - prevRate.totalRate : 0;
                
                return (
                  <div key={entry.id} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10',
                      idx === 0 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
                    )}>
                      {idx + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-black">
                          {formatDate(entry.effectiveDate, 'display')}
                        </span>
                        {rateChange !== 0 && (
                          <Badge 
                            variant={rateChange > 0 ? 'error' : 'success'} 
                            size="sm"
                          >
                            {rateChange > 0 ? '+' : ''}{formatRate(rateChange)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatRate(entry.totalRate)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Prime: {formatRate(entry.primeRate)} + {formatRate(entry.modifier)}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600">{entry.notes}</p>
                      )}
                      {entry.source && (
                        <p className="text-xs text-gray-500 mt-1">Source: {entry.source}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render Rate History Table
  // ============================================
  
  const renderRateHistoryTable = () => {
    const sortedEntries = [...rateEntries].sort(
      (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );

    const columns: Column<RateEntry>[] = [
      {
        key: 'effectiveDate',
        header: 'Effective Date',
        render: (row) => (
          <div>
            <div className="font-medium">{formatDate(row.effectiveDate, 'display')}</div>
            <div className="text-xs text-gray-500">
              {formatDate(row.createdAt, 'short')}
            </div>
          </div>
        ),
      },
      {
        key: 'primeRate',
        header: 'Prime Rate',
        render: (row) => formatRate(row.primeRate),
      },
      {
        key: 'modifier',
        header: 'Modifier',
        render: (row) => (
          <span className={cn(
            row.modifier > 0 ? 'text-error' : row.modifier < 0 ? 'text-success' : 'text-gray-900'
          )}>
            {row.modifier >= 0 ? '+' : ''}{formatRate(row.modifier)}
          </span>
        ),
      },
      {
        key: 'totalRate',
        header: 'Total Rate',
        render: (row) => (
          <span className="font-semibold text-black">{formatRate(row.totalRate)}</span>
        ),
      },
      {
        key: 'source',
        header: 'Source',
        render: (row) => row.source || '-',
      },
      {
        key: 'notes',
        header: 'Notes',
        render: (row) => (
          <span className="max-w-xs truncate block" title={row.notes}>
            {row.notes || '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(row)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteConfirm(row.id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            data={sortedEntries}
            columns={columns}
            emptyMessage="No rate entries found"
          />
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render Add/Edit Modal
  // ============================================
  
  const renderRateFormModal = () => {
    const isEditing = !!editingRate;

    return (
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingRate(null);
          handleReset();
        }}
        title={isEditing ? 'Edit Rate Entry' : 'Add New Rate Entry'}
      >
        <div className="space-y-4">
          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date *
            </label>
            <Input
              type="date"
              value={formData.effectiveDate ? formData.effectiveDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFormData({
                ...formData,
                effectiveDate: e.target.value ? new Date(e.target.value) : undefined,
              })}
              error={errors.effectiveDate}
            />
          </div>

          {/* Prime Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prime Rate (%) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="30"
              value={formData.primeRate ?? ''}
              onChange={(e) => setFormData({
                ...formData,
                primeRate: parseFloat(e.target.value) || 0,
              })}
              placeholder="e.g., 8.5"
              error={errors.primeRate}
            />
          </div>

          {/* Modifier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Modifier (%) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="-10"
              max="10"
              value={formData.modifier ?? ''}
              onChange={(e) => setFormData({
                ...formData,
                modifier: parseFloat(e.target.value) || 0,
              })}
              placeholder="e.g., 2.5"
              error={errors.modifier}
            />
            <p className="text-xs text-gray-500 mt-1">
              Firm-specific adjustment to prime rate (e.g., +2.5%)
            </p>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source
            </label>
            <Input
              type="text"
              value={formData.source || ''}
              onChange={(e) => setFormData({
                ...formData,
                source: e.target.value,
              })}
              placeholder="e.g., Federal Reserve"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({
                ...formData,
                notes: e.target.value,
              })}
              placeholder="Reason for rate change..."
            />
          </div>

          {/* Preview */}
          {(formData.primeRate !== undefined && formData.modifier !== undefined) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Rate Preview:</p>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-lg font-bold text-black">
                    {formatRate((formData.primeRate || 0) + (formData.modifier || 0))}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    (Prime {formatRate(formData.primeRate || 0)} + {formatRate(formData.modifier || 0)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditingRate(null);
              handleReset();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Update Rate' : 'Add Rate Entry'}
          </Button>
        </div>
      </Modal>
    );
  };

  // ============================================
  // Render Delete Confirmation Modal
  // ============================================
  
  const renderDeleteModal = () => {
    if (!deleteConfirm) return null;

    const entryToDelete = rateEntries.find(e => e.id === deleteConfirm);

    return (
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this rate entry?
          </p>
          
          {entryToDelete && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(entryToDelete.effectiveDate, 'display')}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Prime Rate:</span>
                <span className="font-medium">{formatRate(entryToDelete.primeRate)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Modifier:</span>
                <span className="font-medium">{formatRate(entryToDelete.modifier)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Rate:</span>
                <span className="font-bold text-black">{formatRate(entryToDelete.totalRate)}</span>
              </div>
            </div>
          )}

          <p className="text-sm text-warning">
            Warning: Deleting rate entries may affect interest calculations. This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={() => setDeleteConfirm(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete(deleteConfirm)}
          >
            Delete Rate Entry
          </Button>
        </div>
      </Modal>
    );
  };

  // ============================================
  // Main Render
  // ============================================
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Rate Calendar</h1>
          <p className="text-gray-600">Manage interest rate changes and history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export History
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-2H4m2 2h8m-2 2v-2m0 2h-2" />
            </svg>
            Add Rate Entry
          </Button>
        </div>
      </div>

      {/* Current Rate Card */}
      {renderCurrentRateCard()}

      {/* Rate History Timeline */}
      {renderRateTimeline()}

      {/* Rate History Table */}
      {renderRateHistoryTable()}

      {/* Modals */}
      {renderRateFormModal()}
      {renderDeleteModal()}
    </div>
  );
};

export default RateCalendar;
