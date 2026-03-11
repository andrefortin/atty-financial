import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button, Input } from '../ui';
import { cn } from '../../utils/formatters';

export const DrawCalculator: React.FC = () => {
  const [drawAmount, setDrawAmount] = useState(25000);
  const [distribution, setDistribution] = useState<'pro-rata' | 'manual'>('pro-rata');
  const [drawDate, setDrawDate] = useState(new Date());
  const [payoffDate, setPayoffDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRate, setCustomRate] = useState(11.5);
  const [result, setResult] = useState<any>(null);

  // Mock active matters
  const activeMatters = [
    { id: 'M001', clientName: 'John Smith', principalBalance: 50000 },
    { id: 'M002', clientName: 'Jane Doe', principalBalance: 75000 },
    { id: 'M003', clientName: 'Robert Johnson', principalBalance: 125000 },
  ];

  const availableBalance = activeMatters.reduce((sum, m) => sum + m.principalBalance, 0);

  const manualAllocations = activeMatters.map(m => ({
    matterId: m.id,
    clientName: m.clientName,
    amount: 0,
  }));

  const handleCalculate = () => {
    if (drawAmount <= 0 || drawAmount > availableBalance) {
      setResult({
        eligibleAmount: 0,
        minimumAmount: 0,
        maximumAmount: availableBalance,
        availableBalance: availableBalance,
        utilizedBalance: 0,
        utilizationPercentage: 0,
        eligibleMatters: [],
        messages: ['Draw amount must be between $1 and available balance'],
      });
      return;
    }

    const interestRate = useCustomRate ? customRate : 11.5;
    const days = Math.max(1, Math.ceil((payoffDate.getTime() - drawDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyInterest = (drawAmount * (interestRate / 100)) / 365;
    const totalInterest = dailyInterest * days;

    setResult({
      drawAmount,
      drawDate,
      payoffDate,
      interestRate,
      days,
      principal: drawAmount,
      interest: totalInterest,
      total: drawAmount + totalInterest,
      breakdown: [
        { label: 'Principal Amount', value: drawAmount, color: 'text-black' },
        { label: `Interest (${days} days @ ${interestRate}%)`, value: totalInterest, color: 'text-error' },
        { label: 'Total Payoff Amount', value: drawAmount + totalInterest, color: 'text-success font-bold' },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Draw Calculator</h1>
        <p className="text-gray-600">Estimate draw costs including projected interest</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>How to use:</strong> Enter the draw amount, draw date, and expected payoff date. 
          The calculator will estimate the total interest that will accrue and provide a complete payoff breakdown.
        </p>
      </div>

      {/* Calculator Input */}
      <Card>
        <CardHeader>
          <CardTitle>Draw Estimation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Draw Amount */}
          <div>
            <label htmlFor="draw-amount" className="text-sm font-medium text-gray-700 mb-1 block">
              Draw Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="draw-amount"
                type="number"
                min="0"
                max={availableBalance}
                value={drawAmount}
                onChange={(e) => setDrawAmount(parseFloat(e.target.value) || 0)}
                className="pl-8"
                helperText={`Available balance: $${availableBalance.toLocaleString()}`}
              />
            </div>
          </div>

          {/* Draw Date */}
          <div>
            <label htmlFor="draw-date" className="text-sm font-medium text-gray-700 mb-1 block">
              Draw Date
            </label>
            <Input
              id="draw-date"
              type="date"
              value={drawDate.toISOString().split('T')[0]}
              onChange={(e) => setDrawDate(new Date(e.target.value))}
            />
          </div>

          {/* Payoff Date */}
          <div>
            <label htmlFor="payoff-date" className="text-sm font-medium text-gray-700 mb-1 block">
              Expected Payoff Date
            </label>
            <Input
              id="payoff-date"
              type="date"
              value={payoffDate.toISOString().split('T')[0]}
              onChange={(e) => setPayoffDate(new Date(e.target.value))}
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Interest Rate
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="current-rate"
                  checked={!useCustomRate}
                  onChange={() => setUseCustomRate(false)}
                  className="w-4 h-4"
                />
                <label htmlFor="current-rate" className="text-sm text-gray-700">
                  Current Rate (11.5%)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="custom-rate"
                  checked={useCustomRate}
                  onChange={() => setUseCustomRate(true)}
                  className="w-4 h-4"
                />
                <label htmlFor="custom-rate" className="text-sm text-gray-700">
                  Custom Rate
                </label>
              </div>
            </div>
            {useCustomRate && (
              <Input
                type="number"
                step="0.01"
                min="0"
                max="30"
                value={customRate}
                onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 11.5"
                className="mt-2"
              />
            )}
          </div>

          {/* Calculate Button */}
          <Button onClick={handleCalculate} className="w-full">
            Calculate Estimate
          </Button>

          {/* Clear Button */}
          <Button variant="ghost" onClick={() => {
            setDrawAmount(25000);
            setDrawDate(new Date());
            setPayoffDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
            setResult(null);
          }}>
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Draw Estimate Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Principal Amount
                  </p>
                  <p className="text-2xl font-bold text-black">
                    ${result.principal.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Projected Interest
                  </p>
                  <p className="text-2xl font-bold text-error">
                    ${result.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Total Estimated Payoff
                </p>
                <p className="text-4xl font-bold text-success">
                  ${result.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Calculation Details
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Draw Date:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(result.drawDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Payoff Date:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(result.payoffDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Interest Rate:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {result.interestRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Days Until Payoff:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {result.days} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Visual Breakdown:</strong>
                </p>
                <div className="space-y-2">
                  {result.breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-gray-700">{item.label}</span>
                      <span className={cn('text-xl', item.color)}>
                        ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
