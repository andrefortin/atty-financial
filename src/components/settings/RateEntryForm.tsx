import React, { useState, useEffect } from 'react';
import { useFirmStore } from '../../store/useFirmStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button, Input, Select } from '../ui';
import { cn } from '../../utils/formatters';
import { RateCalendarEntry, RateBasis } from '../../types/ports';

export interface RateEntryFormProps {
  entry?: RateCalendarEntry;
  onClose: () => void;
  onSave: (entry: RateCalendarEntry) => void;
}

const RATE_TYPES = [
  { value: 'fixed' as const, label: 'Fixed Rate' },
  { value: 'variable' as const, label: 'Variable Rate' },
];

const RATE_BASIS = [
  { value: 'act-360' as const, label: 'ACT/360' },
  { value: 'act-365' as const, label: 'ACT/365' },
  { value: 'act-366' as const, label: 'ACT/366' },
];

export const RateEntryForm: React.FC<RateEntryFormProps> = ({
  entry,
  onClose,
  onSave,
}) => {
  const [formState, setFormState] = useState<Partial<RateCalendarEntry>>({
    rate: entry?.rate || 18.0,
    effectiveDate: entry?.effectiveDate ? new Date(entry.effectiveDate) : new Date(),
    rateType: entry?.rateType || 'fixed',
    rateBasis: entry?.rateBasis || 'act-360',
    minimumBalance: entry?.minimumBalance || 0,
    maximumBalance: entry?.maximumBalance || 50000000,
    documentation: entry?.documentation || '',
  });

  const handleChange = (field: keyof RateCalendarEntry, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEntry: RateCalendarEntry = {
      id: entry?.id || `rate-${Date.now()}`,
      ...formState,
      rate: Number(formState.rate),
    };

    onSave(newEntry);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {entry ? 'Edit Rate Entry' : 'Add New Rate Entry'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rate Type Selection */}
          <div>
            <label htmlFor="rate-type" className="text-sm font-medium text-gray-700 mb-2">
              Rate Type
            </label>
            <Select
              id="rate-type"
              value={formState.rateType}
              onChange={(e) => handleChange('rateType', e.target.value)}
              options={RATE_TYPES}
              className="w-full"
            />
          </div>

          {/* Rate Basis Selection */}
          <div>
            <label htmlFor="rate-basis" className="text-sm font-medium text-gray-700 mb-2">
              Rate Basis
            </label>
            <Select
              id="rate-basis"
              value={formState.rateBasis}
              onChange={(e) => handleChange('rateBasis', e.target.value)}
              options={RATE_BASIS}
              className="w-full"
            />
          </div>

          {/* Rate Input */}
          <div>
            <label htmlFor="rate" className="text-sm font-medium text-gray-700 mb-2">
              Rate (%)
            </label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formState.rate}
              onChange={(e) => handleChange('rate', e.target.value)}
              className="w-full"
              required
            />
          </div>

          {/* Effective Date */}
          <div>
            <label htmlFor="effective-date" className="text-sm font-medium text-gray-700 mb-2">
              Effective Date
            </label>
            <input
              id="effective-date"
              type="date"
              value={formatDate(formState.effectiveDate)}
              onChange={(e) => handleChange('effectiveDate', new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>

          {/* Balance Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="minimum-balance" className="text-sm font-medium text-gray-700 mb-2">
                Minimum Balance
              </label>
              <Input
                id="minimum-balance"
                type="number"
                min="0"
                value={formState.minimumBalance}
                onChange={(e) => handleChange('minimumBalance', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="maximum-balance" className="text-sm font-medium text-gray-700 mb-2">
                Maximum Balance
              </label>
              <Input
                id="maximum-balance"
                type="number"
                min="0"
                value={formState.maximumBalance}
                onChange={(e) => handleChange('maximumBalance', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Documentation */}
          <div>
            <label htmlFor="documentation" className="text-sm font-medium text-gray-700 mb-2">
              Documentation
            </label>
            <textarea
              id="documentation"
              value={formState.documentation}
              onChange={(e) => handleChange('documentation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={2}
              placeholder="Enter rate change documentation..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {entry ? 'Update' : 'Add'} Rate Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
