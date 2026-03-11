import React, { useState } from 'react';
import {
  DollarSign,
  User,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { FirmPayoffReport } from '../components/reports/FirmPayoffReport';
import { ClientPayoffReport } from '../components/reports/ClientPayoffReport';
import { FundingReport } from '../components/reports/FundingReport';
import { FinanceChargeReport } from '../components/reports/FinanceChargeReport';
import { cn } from '../utils/formatters';

// ============================================
// Types
// ============================================

type ReportType = 'firm-payoff' | 'client-payoff' | 'funding' | 'finance-charge';

// ============================================
// Reports Page Component
// ============================================

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('firm-payoff');

  const reportOptions = [
    {
      value: 'firm-payoff' as ReportType,
      label: 'Firm Payoff',
      description: 'Total payoff amounts for all matters',
    },
    {
      value: 'client-payoff' as ReportType,
      label: 'Client Payoff',
      description: 'Individual client payoff statements',
    },
    {
      value: 'funding' as ReportType,
      label: 'Funding Report',
      description: 'Line of credit draws and capacity',
    },
    {
      value: 'finance-charge' as ReportType,
      label: 'Finance Charge',
      description: 'Interest calculations and allocations',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/" className="hover:text-black transition-colors">
            Dashboard
          </a>
          <span>/</span>
          <span className="text-gray-900">Reports</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate and export detailed financial reports for matters, clients, and firm operations
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportOptions.map((option) => (
          <Card
            key={option.value}
            className={cn(
              'cursor-pointer transition-all',
              activeReport === option.value
                ? 'border-black ring-2 ring-primary ring-opacity-20'
                : 'hover:border-gray-300 hover:shadow-lg'
            )}
            onClick={() => setActiveReport(option.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    activeReport === option.value ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {getReportIcon(option.value)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'font-semibold mb-1',
                      activeReport === option.value ? 'text-black' : 'text-gray-900'
                    )}
                  >
                    {option.label}
                  </h3>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportOptions.find((o) => o.value === activeReport)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeReport === 'firm-payoff' && <FirmPayoffReport />}
          {activeReport === 'client-payoff' && <ClientPayoffReport />}
          {activeReport === 'funding' && <FundingReport />}
          {activeReport === 'finance-charge' && <FinanceChargeReport />}
        </CardContent>
      </Card>

      {/* Report Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">4</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Report Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 mb-2 mx-auto">
              <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">PDF</p>
            <p className="text-xs text-gray-500">Print Report</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-200 dark:bg-blue-900/20 mb-2 mx-auto">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CSV</p>
            <p className="text-xs text-gray-500">Data Export</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-200 dark:bg-green-900/20 mb-2 mx-auto">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Audit</p>
            <p className="text-xs text-gray-500">Ready Format</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Utility function
function getReportIcon(type: ReportType): React.ReactNode {
  const icons = {
    'firm-payoff': <DollarSign className="w-5 h-5" />,
    'client-payoff': <User className="w-5 h-5" />,
    'funding': <Wallet className="w-5 h-5" />,
    'finance-charge': <TrendingUp className="w-5 h-5" />,
  };
  return icons[type];
}

export default Reports;
