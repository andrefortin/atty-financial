import React from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RateCalendar } from '../components/rate-calendar/RateCalendar';

// ============================================
// Rate Calendar Page Component
// ============================================

export const RateCalendarPage: React.FC = () => {
  const handleRateChange = (rateEntry: any) => {
    // In a real app, this would update the store or make an API call
    console.log('Rate changed:', rateEntry);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <a href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Dashboard
          </a>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Rate Calendar</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Rate Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage interest rate changes, view historical rates, and track rate adjustments
        </p>
      </div>

      {/* Rate Calendar Component */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Rate Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RateCalendar onRateChange={handleRateChange} />
        </CardContent>
      </Card>

      {/* About Rate Calendar Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center shrink-0">
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                About Rate Calendar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The rate calendar tracks all interest rate changes over time. Interest calculations
                automatically use the correct rate based on transaction date. Changes made here
                affect all matters and their interest calculations.
              </p>
              
              {/* Rate Type Legend */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Rate Types
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Current Rate
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Historical Rate
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-500">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Rate Increase
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600 dark:bg-red-500">
                      <TrendingDown className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Rate Decrease
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Total Rate Entries
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              12
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Since Jan 2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Current Rate
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              11.5%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Effective Jun 1, 2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Last Rate Change
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-500"></div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +0.25%
              </p>
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              45 days ago
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RateCalendarPage;
