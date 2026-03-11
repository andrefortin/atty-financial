import React from 'react';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../utils/formatters';
import { TransactionType, TransactionStatus } from '../../types';

export interface TransactionFiltersProps {
  filters: {
    type?: TransactionType | 'All';
    status?: TransactionStatus | 'All';
    dateFrom?: Date | null;
    dateTo?: Date | null;
    category?: string;
    matterId?: string;
    searchQuery?: string;
  };
  onChange: (filters: Partial<TransactionFiltersProps['filters']>) => void;
  onClear: () => void;
  matters?: Array<{ id: string; name: string }>;
  categories?: string[];
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onChange,
  onClear,
  matters = [],
  categories = [],
}) => {
  const handleClear = () => {
    onClear();
  };

  const hasActiveFilters = () => {
    return !(
      filters.type === 'All' &&
      filters.status === 'All' &&
      !filters.dateFrom &&
      !filters.dateTo &&
      !filters.matterId &&
      !filters.category &&
      !filters.searchQuery
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <Input
          label="Search"
          placeholder="Search by ID or description..."
          value={filters.searchQuery || ''}
          onChange={(e) => onChange({ searchQuery: e.target.value })}
          fullWidth
        />

        {/* Type Filter */}
        <Select
          label="Transaction Type"
          value={filters.type || 'All'}
          onChange={(e) => onChange({ type: e.target.value as TransactionType | 'All' })}
          options={[
            { value: 'All', label: 'All Types' },
            { value: 'Draw', label: 'Draw' },
            { value: 'Principal Payment', label: 'Principal Payment' },
            { value: 'Interest Autodraft', label: 'Interest Autodraft' },
          ]}
          fullWidth
        />

        {/* Status Filter */}
        <Select
          label="Status"
          value={filters.status || 'All'}
          onChange={(e) => onChange({ status: e.target.value as TransactionStatus | 'All' })}
          options={[
            { value: 'All', label: 'All Statuses' },
            { value: 'Unassigned', label: 'Unassigned' },
            { value: 'Assigned', label: 'Assigned' },
            { value: 'Allocated', label: 'Allocated' },
          ]}
          fullWidth
        />

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="From Date"
            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              onChange({ dateFrom: date });
            }}
            fullWidth
          />
          <Input
            type="date"
            label="To Date"
            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              onChange({ dateTo: date });
            }}
            fullWidth
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <Select
            label="Category"
            value={filters.category || ''}
            onChange={(e) => onChange({ category: e.target.value })}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((cat) => ({ value: cat, label: cat })),
            ]}
            fullWidth
          />
        )}

        {/* Matter Filter */}
        {matters.length > 0 && (
          <Select
            label="Matter"
            value={filters.matterId || ''}
            onChange={(e) => onChange({ matterId: e.target.value })}
            options={[
              { value: '', label: 'All Matters' },
              ...matters.map((matter) => ({
                value: matter.id,
                label: `${matter.id} - ${matter.name}`,
              })),
            ]}
            fullWidth
          />
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {filters.type && filters.type !== 'All' && (
                <span className="px-2 py-1 bg-black/10 text-black text-xs rounded-full">
                  Type: {filters.type}
                </span>
              )}
              {filters.status && filters.status !== 'All' && (
                <span className="px-2 py-1 bg-blue-200/10 text-blue-200 text-xs rounded-full">
                  Status: {filters.status}
                </span>
              )}
              {filters.matterId && (
                <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                  Matter: {filters.matterId}
                </span>
              )}
              {filters.category && (
                <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">
                  {filters.category}
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="px-2 py-1 bg-info/10 text-info text-xs rounded-full">
                  Date Range Applied
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionFilters;
