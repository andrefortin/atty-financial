import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  LineChart,
  Plus,
  Calculator,
  FileText,
  Upload,
  Settings,
  AlertTriangle,
  Calendar,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { mockFirm, mockDashboardSummary } from '../data/mockFirm';
import { formatCurrency, formatDate } from '../utils/formatters';
import { mockMatterAlerts } from '../data/mockMatters';
import { getUnassignedTransactions } from '../data/mockTransactions';

const formatRate = (rate: number): string => `${rate.toFixed(2)}%`;

export const Dashboard: React.FC = () => {
  const {
    totalPrincipalBalance,
    totalInterestAccrued,
    activeMattersCount,
    currentEffectiveRate,
  } = mockDashboardSummary;
  const alerts = mockMatterAlerts;
  const unassignedTransactions = getUnassignedTransactions();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your case cost line of credit portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export Data</Button>
          <Button>Add Transaction</Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-50 text-base">Action Required</h3>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                {alerts.length} matter{alerts.length > 1 ? 's' : ''} require attention due to overdue principal balances
              </p>
              <div className="mt-2 space-y-1">
                {alerts.map((alert) => (
                  <div key={alert.matterId} className="text-sm flex items-center justify-between bg-white dark:bg-gray-800/50 rounded px-2 py-1">
                    <span className="font-medium text-gray-900 dark:text-white">{alert.clientName}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(alert.principalBalance)} overdue</span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="danger" size="sm">View Matters</Button>
          </div>
        </div>
      )}

      {/* Summary Section - 2 Columns */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Total Principal Balance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black/10 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Principal Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalPrincipalBalance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      of {formatCurrency(mockFirm.lineOfCreditLimit)} available
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Interest Accrued */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-warning/10 dark:bg-warning/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Interest Accrued</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalInterestAccrued)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      across all active matters
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Active Matters & Current Rate Section - 2 Columns */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Active Matters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success/10 dark:bg-success/20 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Matters</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {activeMattersCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      currently being tracked
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">View All Matters</Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Effective Rate */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-200/10 dark:bg-blue-200/20 rounded-lg flex items-center justify-center">
                    <LineChart className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatRate(currentEffectiveRate)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Prime + {mockFirm.primeRateModifier}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">Rate Calculator</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Unassigned Transactions & Quick Actions Section - 2 Columns */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Unassigned Transactions - Full Height Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unassigned Transactions</CardTitle>
                <Badge variant="warning">{unassignedTransactions.length} pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {unassignedTransactions.length > 0 ? (
                <div className="space-y-2">
                  {unassignedTransactions.slice(0, 5).map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-red/10 dark:bg-red/20 rounded-full flex items-center justify-center">
                          <Upload className="w-5 h-5 text-red" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{txn.description || txn.category}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(txn.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{formatCurrency(txn.amount)}</p>
                        <Badge variant="error" size="sm">Unassigned</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No unassigned transactions</p>
                </div>
              )}
              {unassignedTransactions.length > 5 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button variant="ghost" size="sm" className="w-full">View all {unassignedTransactions.length} transactions</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Action Cards - 3 Columns in Right Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New Matter */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black/10 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-gray-900 dark:text-white">New Matter</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add a new client matter</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Draw Calculator */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-gray-900 dark:text-white">Draw Calculator</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Calculate anticipated draws</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Report */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-200/10 dark:bg-blue-200/20 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-gray-900 dark:text-white">Generate Report</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create payoff reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row of Action Cards - 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import Transaction */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-200/10 dark:bg-blue-200/20 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-200" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-gray-900 dark:text-white">Import Transaction</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Import from bank or QIF</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200/10 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-gray-900 dark:text-white">Settings</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage preferences</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Next Autodraft Info - Full Width Card */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment</h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Next Interest Payment</CardTitle>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <Badge variant="info">Scheduled</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-warning/10 dark:bg-warning/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scheduled Autodraft</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {formatDate(mockDashboardSummary.nextAutodraftDate)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Amount</p>
                <p className="text-2xl font-bold text-warning mt-1">
                  {formatCurrency(mockDashboardSummary.nextAutodraftAmount)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                  This amount will be automatically drafted from your operating account. Ensure sufficient funds are available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
