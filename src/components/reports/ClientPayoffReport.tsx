import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Table, Column } from '../ui/Table';
import { cn, formatCurrency, formatDate } from '../../utils/formatters';

// ============================================
// Client Payoff Report Component
// ============================================

export const ClientPayoffReport: React.FC = () => {
  const [selectedClient, setSelectedClient] = React.useState('all');

  // Mock data
  const clientOptions = [
    { value: 'all', label: 'All Clients' },
    { value: 'M001', label: 'John Smith (M001)' },
    { value: 'M002', label: 'Jane Doe (M002)' },
    { value: 'M003', label: 'Robert Johnson (M003)' },
  ];

  const matters = [
    { id: 'M001', clientName: 'John Smith', principalBalance: 50000, interestAccrued: 5250, totalOwed: 55250 },
    { id: 'M002', clientName: 'Jane Doe', principalBalance: 75000, interestAccrued: 7875, totalOwed: 82875 },
  ];

  const transactionHistory = [
    { id: 'T001', date: new Date('2024-01-15'), type: 'Draw', amount: 50000, description: 'Initial draw' },
    { id: 'T002', date: new Date('2024-02-01'), type: 'Draw', amount: 25000, description: 'Additional funding' },
    { id: 'T003', date: new Date('2024-03-01'), type: 'Principal Payment', amount: -10000, description: 'Principal payment' },
  ];

  const totals = {
    principal: matters.reduce((sum, m) => sum + m.principalBalance, 0),
    interest: matters.reduce((sum, m) => sum + m.interestAccrued, 0),
    total: matters.reduce((sum, m) => sum + m.totalOwed, 0),
  };

  const matterColumns: Column<typeof matters[0]>[] = [
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
      className: 'text-right font-semibold text-black',
    },
  ];

  const transactionColumns: Column<typeof transactionHistory[0]>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.date, 'short'),
    },
    { key: 'type', header: 'Type' },
    { key: 'description', header: 'Description' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className={cn(row.amount > 0 ? 'text-error' : 'text-success')}>
          {formatCurrency(Math.abs(row.amount))}
        </span>
      ),
      className: 'text-right',
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
    link.download = 'client-payoff-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Client
              </label>
              <Select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                options={clientOptions}
                fullWidth
              />
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

      {/* Client Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Client Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Total Principal
              </p>
              <p className="text-2xl font-bold text-black">{formatCurrency(totals.principal)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Total Interest
              </p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(totals.interest)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Total Payoff
              </p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totals.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data={matters} columns={matterColumns} />
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data={transactionHistory} columns={transactionColumns} />
        </CardContent>
      </Card>
    </div>
  );
};
