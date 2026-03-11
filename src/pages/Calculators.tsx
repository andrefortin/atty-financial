import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  Percent,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DrawCalculator } from '../components/calculators/DrawCalculator';
import { PayoffCalculator } from '../components/calculators/PayoffCalculator';
import { cn } from '../utils/formatters';

// ============================================
// Types
// ============================================

type CalculatorView = 'draw' | 'payoff';

// ============================================
// Calculators Page Component
// ============================================

export const Calculators: React.FC = () => {
  const [activeView, setActiveView] = useState<CalculatorView>('draw');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <a href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Dashboard
          </a>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Calculators</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Calculators
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Estimate draws, calculate payoffs, and plan your financing strategy
        </p>
      </div>

      {/* View Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Calculator:
            </span>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {(['draw', 'payoff'] as CalculatorView[]).map((view) => (
                <button
                  key={view}
                  className={cn(
                    'px-6 py-2 rounded-md text-sm font-medium transition-colors capitalize',
                    activeView === view
                      ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                  onClick={() => setActiveView(view)}
                >
                  {view === 'draw' ? 'Draw Calculator' : 'Payoff Calculator'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculator Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            {activeView === 'draw' ? 'Draw Calculator' : 'Payoff Calculator'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {activeView === 'draw' ? <DrawCalculator /> : <PayoffCalculator />}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center shrink-0">
                <Calculator className="w-7 h-7 text-white dark:text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  About Draw Calculator
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estimate total cost of a draw including accrued interest. Input draw amount, 
                  dates, and current rate to get an accurate projection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  About Payoff Calculator
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calculate total payoff amount including principal and accrued interest. 
                  Filter by specific matters or view firm-wide totals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calculators;
