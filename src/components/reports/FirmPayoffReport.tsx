import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, Column } from '../ui/Table';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';

// ============================================
// Firm Payoff Report Component
// ============================================

export const FirmPayoffReport: React.FC = () => {
  // Mock data - in real app, this would come from store/API
  const matters = [
    { id: 'M001', clientName: 'John Smith', principalBalance: 50000, interestAccrued: 5250, totalOwed: 55250 },
    { id: 'M002', clientName: 'Jane Doe', principalBalance: 75000, interestAccrued: 7875, totalOwed: 82875 },
    { id: 'M003', clientName: 'Robert Johnson', principalBalance: 125000, interestAccrued: 13125, totalOwed: 138125 },
    { id: 'M004', clientName: 'Emily Davis', principalBalance: 45000, interestAccrued: 4725, totalOwed: 49725 },
    { id: 'M005', clientName: 'Michael Wilson', principalBalance: 89000, interestAccrued: 9345, totalOwed: 98345 },
  ];

  const totals = {
    principal: matters.reduce((sum, m) => sum + m.principalBalance, 0),
    interest: matters.reduce((sum, m) => sum + m.interestAccrued, 0),
    total: matters.reduce((sum, m) => sum + m.totalOwed, 0),
  };

  const columns: Column<typeof matters[0]>[] = [
    { key: 'id', header: 'Matter ID' },
    { key: 'clientName', header: 'Client Name' },
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
      key: 'totalOwed',
      header: 'Total Payoff',
      render: (row) => formatCurrency(row.totalOwed),
      className: 'text-right font-semibold',
    },
  ];

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvData = matters.map(m => ({
      'Matter ID': m.id,
      'Client Name': m.clientName,
      'Principal Balance': formatCurrency(m.principalBalance),
      'Interest Accrued': formatCurrency(m.interestAccrued),
      'Total Payoff': formatCurrency(m.totalOwed),
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'firm-payoff-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Total Principal
            </p>
            <p className="text-2xl font-bold text-black">{formatCurrency(totals.principal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Total Interest
            </p>
            <p className="text-2xl font-bold text-warning">{formatCurrency(totals.interest)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Grand Total Payoff
            </p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totals.total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                As of Date
              </label>
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="closed">Closed Only</option>
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

      {/* Matters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matter Payoff Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data={matters} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
};
