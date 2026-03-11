import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { cn, formatCurrency, formatDate, formatRate, formatPercentageOfTotal } from '../../utils/formatters';

// ============================================
// Types for Finance Charge Report
// ============================================

export type PeriodType = 'MTD' | 'QTD' | 'YTD' | 'Custom';

export interface DailyInterestEntry {
  date: Date;
  matterId: string;
  matterName: string;
  principalBalance: number;
  interestRate: number;
  dailyInterest: number;
}

export interface RateChangeEntry {
  date: Date;
  previousRate: number;
  newRate: number;
  change: number;
}

export interface AllocationDetail {
  matterId: string;
  matterName: string;
  allocatedAmount: number;
  interestRemainingBefore: number;
  interestRemainingAfter: number;
  tier: 1 | 2;
}

export interface FinanceChargeSummary {
  periodType: PeriodType;
  startDate: Date;
  endDate: Date;
  totalInterestAccrued: number;
  totalInterestPaid: number;
  totalInterestOwed: number;
  averageDailyRate: number;
  matterCount: number;
}

export interface FinanceChargeReportData {
  summary: FinanceChargeSummary;
  dailyInterest: DailyInterestEntry[];
  rateChanges: RateChangeEntry[];
  allocations: AllocationDetail[];
  interestByMatter: Array<{
    matterId: string;
    matterName: string;
    principalBalance: number;
    interestAccrued: number;
    interestPaid: number;
    interestOwed: number;
  }>;
}

// ============================================
// Finance Charge Report Component
// ============================================

interface FinanceChargeReportProps {
  className?: string;
}

export const FinanceChargeReport: React.FC<FinanceChargeReportProps> = ({ className }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('MTD');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [selectedMatter, setSelectedMatter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'matters' | 'allocations'>('daily');
  const [reportData, setReportData] = useState<FinanceChargeReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Matter options for filter
  const matterOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Matters' },
      // In a real app, these would come from the store
      { value: 'M001', label: 'M001 - John Smith' },
      { value: 'M002', label: 'M002 - Jane Doe' },
      { value: 'M003', label: 'M003 - Robert Johnson' },
      { value: 'M004', label: 'M004 - Emily Davis' },
      { value: 'M005', label: 'M005 - Michael Wilson' },
    ];
  }, []);

  // Period options
  const periodOptions: Array<{ value: PeriodType; label: string }> = [
    { value: 'MTD', label: 'Month to Date' },
    { value: 'QTD', label: 'Quarter to Date' },
    { value: 'YTD', label: 'Year to Date' },
    { value: 'Custom', label: 'Custom Range' },
  ];

  // Get date range based on period type
  const getDateRange = (period: PeriodType): { startDate: Date; endDate: Date } => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate: Date;

    switch (period) {
      case 'MTD':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'QTD':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'Custom':
        startDate = customStartDate || new Date(now.getFullYear(), now.getMonth(), 1);
        endDate.setHours(0, 0, 0, 0);
        if (customEndDate) {
          endDate.setTime(customEndDate.getTime());
        }
        break;
    }

    return { startDate, endDate };
  };

  // Mock data generation (in a real app, this would come from the service)
  const generateMockReportData = (startDate: Date, endDate: Date): FinanceChargeReportData => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const dailyInterest: DailyInterestEntry[] = [];
    const matterIds = ['M001', 'M002', 'M003', 'M004', 'M005'];
    const matterNames = ['John Smith', 'Jane Doe', 'Robert Johnson', 'Emily Davis', 'Michael Wilson'];
    
    let totalInterestAccrued = 0;
    let totalInterestPaid = 0;
    
    // Generate daily interest entries
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      matterIds.forEach((matterId, idx) => {
        const principalBalance = 50000 + Math.random() * 100000;
        const interestRate = 8.5 + Math.random() * 2;
        const dailyInterest = (principalBalance * (interestRate / 100)) / 360;
        
        dailyInterest.push({
          date: currentDate,
          matterId,
          matterName: matterNames[idx],
          principalBalance,
          interestRate,
          dailyInterest,
        });
        
        totalInterestAccrued += dailyInterest;
        
        // Simulate some interest payments
        if (Math.random() > 0.95) {
          const paymentAmount = dailyInterest * Math.random() * 10;
          totalInterestPaid += paymentAmount;
        }
      });
    }
    
    // Generate rate changes
    const rateChanges: RateChangeEntry[] = [
      {
        date: new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000),
        previousRate: 8.5,
        newRate: 9.0,
        change: 0.5,
      },
      {
        date: new Date(startDate.getTime() + 25 * 24 * 60 * 60 * 1000),
        previousRate: 9.0,
        newRate: 8.75,
        change: -0.25,
      },
    ];
    
    // Generate allocations
    const allocations: AllocationDetail[] = matterIds.map((matterId, idx) => ({
      matterId,
      matterName: matterNames[idx],
      allocatedAmount: 500 + Math.random() * 2000,
      interestRemainingBefore: 2000 + Math.random() * 5000,
      interestRemainingAfter: 1500 + Math.random() * 4000,
      tier: idx < 2 ? 1 : 2,
    }));
    
    // Generate interest by matter
    const interestByMatter = matterIds.map((matterId, idx) => {
      const accrued = totalInterestAccrued / matterIds.length * (0.8 + Math.random() * 0.4);
      const paid = accrued * (0.3 + Math.random() * 0.4);
      return {
        matterId,
        matterName: matterNames[idx],
        principalBalance: 50000 + Math.random() * 100000,
        interestAccrued: accrued,
        interestPaid: paid,
        interestOwed: accrued - paid,
      };
    });
    
    return {
      summary: {
        periodType,
        startDate,
        endDate,
        totalInterestAccrued,
        totalInterestPaid,
        totalInterestOwed: totalInterestAccrued - totalInterestPaid,
        averageDailyRate: 8.75,
        matterCount: matterIds.length,
      },
      dailyInterest,
      rateChanges,
      allocations,
      interestByMatter,
    };
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { startDate, endDate } = getDateRange(periodType);
    const data = generateMockReportData(startDate, endDate);
    setReportData(data);
    setIsLoading(false);
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    
    const csvData = reportData.dailyInterest.map(entry => ({
      Date: formatDate(entry.date, 'short'),
      'Matter ID': entry.matterId,
      'Client Name': entry.matterName,
      'Principal Balance': formatCurrency(entry.principalBalance),
      'Interest Rate': formatRate(entry.interestRate),
      'Daily Interest': formatCurrency(entry.dailyInterest),
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-charge-${reportData.summary.periodType}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ============================================
  // Render Summary Cards
  // ============================================
  
  const renderSummaryCards = () => {
    if (!reportData) return null;
    
    const cards = [
      {
        label: 'Total Interest Accrued',
        value: formatCurrency(reportData.summary.totalInterestAccrued),
        color: 'bg-black',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        label: 'Interest Paid',
        value: formatCurrency(reportData.summary.totalInterestPaid),
        color: 'bg-green-500',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      {
        label: 'Interest Owed',
        value: formatCurrency(reportData.summary.totalInterestOwed),
        color: 'bg-warning',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      },
      {
        label: 'Average Daily Rate',
        value: formatRate(reportData.summary.averageDailyRate),
        color: 'bg-secondary',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        ),
      },
    ];
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-black">{card.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white', card.color)}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ============================================
  // Render Rate History Timeline
  // ============================================
  
  const renderRateHistory = () => {
    if (!reportData || reportData.rateChanges.length === 0) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rate History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.rateChanges.map((change, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-24 text-sm text-gray-600">
                  {formatDate(change.date, 'short')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {formatRate(change.previousRate)}
                    </span>
                    <svg className={cn('w-4 h-4', change.change > 0 ? 'text-green-600 rotate-0' : 'text-red-600 rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {formatRate(change.newRate)}
                    </span>
                    <Badge variant={change.change > 0 ? 'success' : 'error'} size="sm">
                      {change.change > 0 ? '+' : ''}{formatRate(change.change)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render Interest Chart (Simple Bar Chart)
  // ============================================
  
  const renderInterestChart = () => {
    if (!reportData) return null;
    
    const maxInterest = Math.max(...reportData.interestByMatter.map(m => m.interestAccrued));
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Interest by Matter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.interestByMatter.map((matter, idx) => {
              const percentage = (matter.interestAccrued / maxInterest) * 100;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{matter.matterName}</span>
                    <span className="text-gray-600">{formatCurrency(matter.interestAccrued)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Matter ID: {matter.matterId}</span>
                    <span>{formatPercentageOfTotal(matter.interestAccrued, reportData.summary.totalInterestAccrued)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render Daily Interest Table
  // ============================================
  
  const renderDailyInterestTable = () => {
    if (!reportData || viewMode !== 'daily') return null;
    
    const columns: Column<DailyInterestEntry>[] = [
      {
        key: 'date',
        header: 'Date',
        render: (row) => formatDate(row.date, 'short'),
      },
      {
        key: 'matterId',
        header: 'Matter',
        render: (row) => (
          <div>
            <div className="font-medium">{row.matterId}</div>
            <div className="text-xs text-gray-500">{row.matterName}</div>
          </div>
        ),
      },
      {
        key: 'principalBalance',
        header: 'Principal Balance',
        render: (row) => formatCurrency(row.principalBalance),
        className: 'text-right',
      },
      {
        key: 'interestRate',
        header: 'Rate',
        render: (row) => formatRate(row.interestRate),
        className: 'text-center',
      },
      {
        key: 'dailyInterest',
        header: 'Daily Interest',
        render: (row) => formatCurrency(row.dailyInterest),
        className: 'text-right font-medium',
      },
    ];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Interest Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            data={reportData.dailyInterest.slice(0, 100)} // Limit to 100 rows for display
            columns={columns}
            emptyMessage="No interest data available for the selected period"
          />
          {reportData.dailyInterest.length > 100 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing 100 of {reportData.dailyInterest.length} entries. Export to see all data.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render Interest by Matter Table
  // ============================================
  
  const renderInterestByMatterTable = () => {
    if (!reportData || viewMode !== 'matters') return null;
    
    const columns: Column<typeof reportData.interestByMatter[0]>[] = [
      {
        key: 'matterId',
        header: 'Matter ID',
      },
      {
        key: 'matterName',
        header: 'Client Name',
      },
      {
        key: 'principalBalance',
        header: 'Principal Balance',
        render: (row) => formatCurrency(row.principalBalance),
        className: 'text-right',
      },
      {
        key: 'interestAccrued',
        header: 'Interest Accrued',
        render: (row) => formatCurrency(row.interestAccrued),
        className: 'text-right',
      },
      {
        key: 'interestPaid',
        header: 'Interest Paid',
        render: (row) => formatCurrency(row.interestPaid),
        className: 'text-right',
      },
      {
        key: 'interestOwed',
        header: 'Interest Owed',
        render: (row) => (
          <span className={cn(
            row.interestOwed > 1000 ? 'text-warning font-medium' : 'text-gray-900'
          )}>
            {formatCurrency(row.interestOwed)}
          </span>
        ),
        className: 'text-right',
      },
    ];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interest Summary by Matter</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            data={reportData.interestByMatter}
            columns={columns}
            emptyMessage="No matter data available"
          />
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Render Allocations Table
  // ============================================
  
  const renderAllocationsTable = () => {
    if (!reportData || viewMode !== 'allocations') return null;
    
    const columns: Column<AllocationDetail>[] = [
      {
        key: 'matterId',
        header: 'Matter ID',
      },
      {
        key: 'matterName',
        header: 'Client Name',
      },
      {
        key: 'allocatedAmount',
        header: 'Allocated',
        render: (row) => formatCurrency(row.allocatedAmount),
        className: 'text-right',
      },
      {
        key: 'interestRemainingBefore',
        header: 'Interest Before',
        render: (row) => formatCurrency(row.interestRemainingBefore),
        className: 'text-right',
      },
      {
        key: 'interestRemainingAfter',
        header: 'Interest After',
        render: (row) => formatCurrency(row.interestRemainingAfter),
        className: 'text-right',
      },
      {
        key: 'tier',
        header: 'Tier',
        render: (row) => (
          <Badge variant={row.tier === 1 ? 'success' : 'info'} size="sm">
            Tier {row.tier}
          </Badge>
        ),
        className: 'text-center',
      },
    ];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interest Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            data={reportData.allocations}
            columns={columns}
            emptyMessage="No allocation data available"
          />
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // Main Render
  // ============================================
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-black mb-2">Finance Charge Report</h1>
        <p className="text-gray-600">Detailed breakdown of interest calculations and allocations</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Period Selection */}
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <Select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                options={periodOptions}
                fullWidth
              />
            </div>

            {/* Custom Date Range */}
            {periodType === 'Custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <Input
                    type="date"
                    value={customStartDate ? customStartDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <Input
                    type="date"
                    value={customEndDate ? customEndDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              </>
            )}

            {/* Matter Filter */}
            <div className="w-full lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matter
              </label>
              <Select
                value={selectedMatter}
                onChange={(e) => setSelectedMatter(e.target.value)}
                options={matterOptions}
                fullWidth
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              loading={isLoading}
              className="mt-6 lg:mt-0 ml-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportData && (
        <>
          {/* Export Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleExportPDF}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / PDF
              </Button>
              <Button variant="secondary" onClick={handleExportCSV}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(['daily', 'matters', 'allocations'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                      viewMode === mode ? 'bg-white text-black shadow' : 'text-gray-600'
                    )}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Period Info */}
          <Card>
            <CardContent className="p-4 bg-black/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Report Period</p>
                    <p className="text-sm font-semibold text-black">
                      {reportData.summary.periodType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">From</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(reportData.summary.startDate, 'display')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">To</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(reportData.summary.endDate, 'display')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Matters</p>
                    <p className="text-sm font-medium text-gray-900">
                      {reportData.summary.matterCount}
                    </p>
                  </div>
                </div>
                <Badge variant="info" size="md">
                  {formatCurrency(reportData.summary.totalInterestAccrued)} Total Accrued
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {renderSummaryCards()}

          {/* Interest Chart */}
          {renderInterestChart()}

          {/* Rate History */}
          {renderRateHistory()}

          {/* Data Table */}
          {viewMode === 'daily' && renderDailyInterestTable()}
          {viewMode === 'matters' && renderInterestByMatterTable()}
          {viewMode === 'allocations' && renderAllocationsTable()}
        </>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Generated</h3>
            <p className="text-gray-600 mb-4">
              Select a period and click "Generate Report" to view finance charge details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinanceChargeReport;
