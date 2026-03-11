import React from 'react';
import { Input, Select, Button } from '../ui';
import { Card, CardHeader, CardTitle, CardContent, CardProps } from '../ui/Card';
import { cn } from '../../utils/formatters';
import { MattersFilterState, MattersSortConfig } from '../../types/matters';

export interface MattersFiltersProps {
  filters: MattersFilterState;
  sort: MattersSortConfig;
  onFilterChange: (filters: MattersFilterState) => void;
  onSortChange: (sort: MattersSortConfig) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Archive', label: 'Archive' },
];

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Created (Newest First)' },
  { value: 'createdAt-asc', label: 'Created (Oldest First)' },
  { value: 'clientName-asc', label: 'Client Name (A-Z)' },
  { value: 'clientName-desc', label: 'Client Name (Z-A)' },
  { value: 'principalBalance-desc', label: 'Principal Balance (High-Low)' },
  { value: 'principalBalance-asc', label: 'Principal Balance (Low-High)' },
  { value: 'totalOwed-desc', label: 'Total Owed (High-Low)' },
  { value: 'totalOwed-asc', label: 'Total Owed (Low-High)' },
];

export const MattersFilters: React.FC<MattersFiltersProps> = ({
  filters,
  sort,
  onFilterChange,
  onSortChange,
  onClearFilters,
  activeFiltersCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handleBalanceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;
    onFilterChange({ ...filters, balanceMin: value });
  };

  const handleBalanceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;
    onFilterChange({ ...filters, balanceMax: value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [column, direction] = e.target.value.split('-') as [
      MattersSortConfig['column'],
      MattersSortConfig['direction']
    ];
    onSortChange({ column, direction });
  };

  const handleClearFilters = () => {
    onClearFilters();
  };

  const isSortValueValid = (value: string): value is typeof SORT_OPTIONS[number]['value'] => {
    return SORT_OPTIONS.some(opt => opt.value === value);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* First Row: Search and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by Matter ID or Client Name..."
                value={filters.search}
                onChange={handleSearchChange}
                fullWidth
              />
            </div>
            <Select
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={handleStatusChange}
              placeholder="All Statuses"
              fullWidth
            />
          </div>

          {/* Second Row: Balance Range and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="number"
              placeholder="Min Balance"
              value={filters.balanceMin || ''}
              onChange={handleBalanceMinChange}
              min="0"
              step="0.01"
              fullWidth
            />
            <Input
              type="number"
              placeholder="Max Balance"
              value={filters.balanceMax || ''}
              onChange={handleBalanceMaxChange}
              min="0"
              step="0.01"
              fullWidth
            />
            <Select
              options={SORT_OPTIONS}
              value={
                isSortValueValid(`${sort.column}-${sort.direction}`)
                  ? `${sort.column}-${sort.direction}`
                  : ''
              }
              onChange={handleSortChange}
              placeholder="Sort By"
              fullWidth
            />
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                disabled={activeFiltersCount === 0}
                fullWidth
                className={cn(
                  'flex items-center justify-center gap-2',
                  activeFiltersCount === 0 && 'opacity-50 cursor-not-allowed'
                )}
              >
                {activeFiltersCount > 0 && (
                  <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MattersFilters;
