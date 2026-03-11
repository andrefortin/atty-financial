import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, Column } from '../ui/Table';
import { cn, formatCurrency, formatDate, formatPercentageOfTotal } from '../../utils/formatters';

// ============================================
// Funding Report Component
// ============================================

export const FundingReport: React.FC = () => {
  // Mock data
  const lineOfCreditLimit = 1000000;
  const totalDraws = 424125;
  const remainingCapacity = lineOfCreditLimit - totalDraws;
  const utilizationPercent = (totalDraws / lineOfCreditLimit) * 100;

  const drawTransactions = [
    { id: 'D001', date: new Date('2024-01-15'), matterId: 'M001', matterName: 'John Smith', amount: 50000, purpose: 'Initial funding' },
    { id: 'D002', date: new Date('2024-02-01'), matterId: 'M002', matterName: 'Jane Doe', amount: 75000, purpose: 'Court fees' },
    { id: 'D003', date: new Date('2024-02-15'), matterId: 'M003', matterName: 'Robert Johnson', amount: 125000, purpose: 'Expert witness' },
    { id: 'D004', date: new Date('2024-03-01'), matterId: 'M001', matterName: 'John Smith', amount: 25000, purpose: 'Medical records' },
    { id: 'D005', date: new Date('2024-03-10'), matterId: 'M004', matterName: 'Emily Davis', amount: 45000, purpose: 'Deposition' },
    { id: 'D006', date: new Date('2024-03-20'), matterId: 'M005', matterName: 'Michael Wilson', amount: 89000, purpose: 'Investigation' },
    { id: 'D007', date: new Date('2024-04-01'), matterId: 'M002', matterName: 'Jane Doe', amount: 15125, purpose: 'Travel expenses' },
  ];

  const cumulativeTotal = (index: number) => {
    return drawTransactions.slice(0, index + 1).reduce((sum, t) => sum + t.amount, 0);
  };

  const columns: Column<typeof drawTransactions[0]>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.date, 'short'),
    },
    { key: 'id', header: 'Draw ID' },
    { key: 'matterName', header: 'Matter' },
    { key: 'purpose', header: 'Purpose' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => formatCurrency(row.amount),
      className: 'text-right font-medium text-error',
    },
    {
      key: 'cumulative',
      header: 'Cumulative',
      render: (row, idx) => formatCurrency(cumulativeTotal(idx)),
      className: 'text-right',
    },
  ];

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvData = drawTransactions.map((t, idx) => ({
      'Date': formatDate(t.date, 'short'),
      'Draw ID': t.id,
      'Matter': t.matterName,
      'Purpose': t.purpose,
      'Amount': formatCurrency(t.amount),
      'Cumulative': formatCurrency(cumulativeTotal(idx)),
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'funding-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Line of Credit Limit
            </p>
            <p className="text-2xl font-bold text-black">{formatCurrency(lineOfCreditLimit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Total Draws
            </p>
            <p className="text-2xl font-bold text-error">{formatCurrency(totalDraws)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Remaining Capacity
            </p>
            <p className="text-2xl font-bold text-success">{formatCurrency(remainingCapacity)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Utilization
            </p>
            <p className={cn(
              'text-2xl font-bold',
              utilizationPercent > 80 ? 'text-error' : utilizationPercent > 60 ? 'text-warning' : 'text-success'
            )}>
              {utilizationPercent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Gauge */}
      <Card>
        <CardHeader>
          <CardTitle>Line of Credit Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div
                  className={cn(
                    'h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-3',
                    utilizationPercent > 80 ? 'bg-error' : utilizationPercent > 60 ? 'bg-warning' : 'bg-success'
                  )}
                  style={{ width: `${utilizationPercent}%` }}
                >
                  {utilizationPercent > 15 && (
                    <span className="text-white text-sm font-medium">{utilizationPercent.toFixed(1)}%</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-500">Drawn: </span>
                <span className="font-semibold text-error">{formatCurrency(totalDraws)}</span>
              </div>
              <div>
                <span className="text-gray-500">Available: </span>
                <span className="font-semibold text-success">{formatCurrency(remainingCapacity)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matter
              </label>
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="all">All Matters</option>
                <option value="M001">M001 - John Smith</option>
                <option value="M002">M002 - Jane Doe</option>
                <option value="M003">M003 - Robert Johnson</option>
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="secondary" onClick={handleExportPDF}>
                Print/PDF
              </Button>
              <Button variant="secondary" onClick={handleExportCSV}>
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draws Table */}
      <Card>
        <CardHeader>
          <CardTitle>Draw Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data={drawTransactions} columns={columns} />
        </CardContent>
        <CardFooter>
          <div className="text-sm text-gray-600">
            Showing {drawTransactions.length} draw transactions totaling {formatCurrency(totalDraws)}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
