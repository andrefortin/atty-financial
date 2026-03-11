import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export const PayoffCalculator: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Matter Payoff Calculator</h1>
        <p className="text-gray-600">Calculate total payoff amounts for matters including principal and interest</p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-700">
          <strong>How to use:</strong> Select a matter to calculate the payoff amount. 
          The calculator will determine the total amount owed (principal + interest) 
          and provide a breakdown by component.
        </p>
      </div>

      {/* Calculator Input */}
      <Card>
        <CardHeader>
          <CardTitle>Matter Payoff Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Matter Selection */}
          <div className="space-y-3">
            <label htmlFor="matter-selection" className="text-sm font-medium text-gray-700">Select Matter</label>
            <select
              id="matter-selection"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              defaultValue=""
            >
              <option value="">Choose a matter...</option>
              <option value="M001">Case #001 - John Smith ($100,000)</option>
              <option value="M002">Case #002 - Jane Doe ($75,000)</option>
              <option value="M003">Case #003 - Bob Johnson ($125,000)</option>
            </select>
          </div>

          {/* Calculation Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <p className="text-sm text-gray-500 mb-2">Enter principal and interest amounts:</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="principal-balance" className="text-sm font-medium text-gray-700">Principal Balance</label>
                <input
                  id="principal-balance"
                  type="number"
                  placeholder="$0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label htmlFor="interest-accrued" className="text-sm font-medium text-gray-700">Interest Accrued</label>
                <input
                  id="interest-accrued"
                  type="number"
                  placeholder="$0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label htmlFor="interest-paid" className="text-sm font-medium text-gray-700">Interest Paid</label>
                <input
                  id="interest-paid"
                  type="number"
                  placeholder="$0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div>
                <label htmlFor="total-owed" className="text-sm font-medium text-gray-700">Total Owed</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 font-bold bg-gray-100">
                  $105,000.00
                </div>
              </div>
            </div>

            {/* Result Display */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Total Payoff Amount</p>
                  <p className="text-3xl font-bold text-green-600">
                    $105,000.00
                  </p>
                  <p className="text-sm text-gray-500">Principal + Interest</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Principal Balance</span>
                      <span className="text-xl font-bold text-gray-900">$100,000.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Interest Accrued</span>
                      <span className="text-xl font-bold text-red-600">$5,000.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="primary" className="w-full">
                  Calculate Payoff
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
