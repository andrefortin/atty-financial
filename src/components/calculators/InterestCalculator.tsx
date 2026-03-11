import React, { useState } from 'react';
import { useMatterStore } from '../../store/useMatters';
import { calculateInterest } from '../../services/interestCalculator';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button, Input, Select } from '../ui';
import { cn } from '../../utils/formatters';
import { InterestCalculationResult } from '../../types/settings';

export const InterestCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState(100000);
  const [rate, setRate] = useState(18.0);
  const [startDate, setStartDate] = useState(new Date('2024-01-01'));
  const [endDate, setEndDate] = useState(new Date());
  const [rateBasis, setRateBasis] = useState<'act-360' | 'act-365' | 'act-366'>('act-360');
  const [result, setResult] = useState<InterestCalculationResult | null>(null);

  const matters = useMatterStore((state) => state.getMatters());

  const calculate = () => {
    if (principal <= 0) {
      alert('Please enter a principal balance');
      return;
    }

    if (rate <= 0) {
      alert('Please enter a valid interest rate');
      return;
    }

    try {
      const calcResult = calculateInterest({
        principal,
        rate,
        startDate,
        endDate,
        rateBasis,
      });

      setResult(calcResult);
    } catch (error) {
      console.error('Calculation error:', error);
      alert('Failed to calculate interest. Please check your inputs.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Interest Calculator</h1>
        <p className="text-gray-600">Calculate interest accrual for matters using ACT/360, ACT/365, or ACT/366 rate basis</p>
      </div>

      {/* Calculator Form */}
      <Card>
        <CardHeader>
          <CardTitle>Interest Calculation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Principal Balance */}
          <div>
            <label htmlFor="principal" className="text-sm font-medium text-gray-700">Principal Balance</label>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">$</span>
              <input
                id="principal"
                type="number"
                min="0"
                step="0.01"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-2xl font-bold text-gray-900"
              />
              <span className="text-sm text-gray-500">.00</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <label htmlFor="rate" className="text-sm font-medium text-gray-700">Annual Interest Rate (%)</label>
            <div className="flex items-center gap-3">
              <input
                id="rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xl font-bold text-gray-900"
              />
              <span className="text-sm text-gray-500">% per year</span>
            </div>
          </div>

          {/* Rate Basis */}
          <div>
            <label htmlFor="rate-basis" className="text-sm font-medium text-gray-700">Rate Basis</label>
            <Select
              id="rate-basis"
              value={rateBasis}
              onChange={(e) => setRateBasis(e.target.value as 'act-360' | 'act-365' | 'act-366')}
              options={[
                { value: 'act-360', label: 'ACT/360 (360 days per year)' },
                { value: 'act-365', label: 'ACT/365 (365 days per year)' },
                { value: 'act-366', label: 'ACT/366 (366 days per year)' },
              ]}
              className="w-full"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="text-sm font-medium text-gray-700">End Date</label>
              <input
                id="end-date"
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <div className="flex justify-end pt-4">
            <Button variant="primary" onClick={calculate} disabled={!principal || !rate}>
              Calculate Interest
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Total Interest Accrued</p>
                <p className="text-3xl font-bold text-black">
                  ${result.totalInterestAccrued.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mb-2">Daily Interest</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${result.dailyInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Average Daily Interest</p>
                <p className="text-3xl font-bold text-success">
                  ${result.averageDailyInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mb-2">Total Owed</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(result.principalBalance + result.totalInterestAccrued).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Calculation Period</p>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.ceil((result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
                <p className="text-sm text-gray-500">
                  {result.startDate.toLocaleDateString()} to {result.endDate.toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown Card */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Interest Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 border-b">Date</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2 border-b">Daily Interest</th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2 border-b">Accrued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.slice(0, 30).map((day, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 text-sm text-gray-900">{day.date}</td>
                        <td className="py-2 text-sm text-gray-900">${day.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 text-sm text-gray-900">${day.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {result.breakdown.length > 30 && (
                      <tr>
                        <td colSpan="3" className="py-2 text-sm text-gray-500 text-center">
                          ... and {result.breakdown.length - 30} more days
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matter Selection Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Tip:</strong> Select a matter from the Matters page to calculate interest for a specific case. 
          The calculator shown above is a demonstration with default values.
        </p>
      </div>
    </div>
  );
};
