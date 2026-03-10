import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Check,
  CheckCircle,
  ArrowRight,
  Database,
  AlertCircle,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, Column } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { cn, formatCurrency, formatDate, formatDaysAgo } from '../utils/formatters';
import {
  fetchBankTransactions,
  getAllTransactions,
  generateTransactionsWithDelay,
  subscribeToTransactions,
  getTransactionSummary,
  getMatchStatistics,
  suggestMatches,
  applyMatch,
  unmatchTransaction,
  runAutoMatch,
  exportMatchReport,
  getTransactionSummary as BankTransactionSummary,
  BankTransaction,
  BankTransactionType,
  MatchSuggestion,
  MatchedTransaction,
  getMatchConfidenceColor,
  getMatchConfidenceLabel,
  getMatchConfidenceIcon,
  formatTransactionType,
  getTransactionStatusColor,
  getTransactionStatusLabel,
} from '../services';
import { Matter } from '../types';

// ============================================
// Types for Bank Feed Page
// ============================================

type ViewMode = 'all' | 'matched' | 'unmatched';
type MatchPanelMode = 'suggestions' | 'details' | 'none';

// ============================================
// Bank Feed Page Component
// ============================================

interface BankFeedProps {
  matters?: Matter[];
}

export const BankFeed: React.FC<BankFeedProps> = ({ matters = [] }) => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<BankTransaction[]>([]);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [matchStats, setMatchStats] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [matchPanelMode, setMatchPanelMode] = useState<MatchPanelMode>('none');
  
  // Filters
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<BankTransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  // Load initial transactions
  useEffect(() => {
    const loadTransactions = async () => {
      const allTxns = getAllTransactions();
      setTransactions(allTxns);
      setFilteredTransactions(allTxns);
    };
    
    loadTransactions();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToTransactions((updatedTxns) => {
      setTransactions(updatedTxns);
      applyFilters(updatedTxns);
    });

    return unsubscribe;
  }, []);

  // Filter transactions
  const applyFilters = (txns: BankTransaction[]) => {
    let filtered = [...txns];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    // View mode filter
    if (viewMode === 'matched') {
      const matchedIds = new Set(suggestions
        .filter(s => s.suggestedAction === 'Auto-Match')
        .map(s => s.bankTransactionId)
      );
      filtered = filtered.filter(t => matchedIds.has(t.id));
    } else if (viewMode === 'unmatched') {
      const matchedIds = new Set(suggestions
        .filter(s => s.suggestedAction === 'Auto-Match')
        .map(s => s.bankTransactionId)
      );
      filtered = filtered.filter(t => !matchedIds.has(t.id));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.referenceNumber.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter(t => {
        const txnDate = new Date(t.date);
        const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : new Date(0);
        const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : new Date(2099, 11, 30);
        return txnDate >= from && txnDate <= to;
      });
    }

    setFilteredTransactions(filtered);
  };

  // Re-apply filters when filter state changes
  useEffect(() => {
    applyFilters(transactions);
  }, [statusFilter, typeFilter, searchQuery, dateFrom, dateTo, viewMode, suggestions]);

  // Get suggestions for selected transaction
  useEffect(() => {
    if (selectedTransaction && matters.length > 0) {
      const mockPayments: any[] = []; // In real app, these would come from store
      const txnSuggestions = suggestMatches(selectedTransaction, matters, mockPayments);
      setSuggestions(txnSuggestions);

      // Get match stats
      const stats = getMatchStatistics(transactions, mockPayments);
      setMatchStats(stats);
    }
  }, [selectedTransaction, matters]);

  // Calculate summary
  const summary = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        totalCredits: 0,
        totalDebits: 0,
        netAmount: 0,
        transactionCount: 0,
      };
    }

    return filteredTransactions.reduce((acc, txn) => {
      if (txn.amount > 0) {
        acc.totalCredits += txn.amount;
      } else {
        acc.totalDebits += Math.abs(txn.amount);
      }
      acc.netAmount += txn.amount;
      return acc;
    }, {
      totalCredits: 0,
      totalDebits: 0,
      netAmount: 0,
      transactionCount: filteredTransactions.length,
    });
  }, [filteredTransactions]);

  // Handle transaction selection
  const handleTransactionClick = (txn: BankTransaction) => {
    setSelectedTransaction(txn);
    setMatchPanelMode('suggestions');
  };

  // Handle match application
  const handleApplyMatch = (suggestion: MatchSuggestion) => {
    if (!selectedTransaction) return;

    applyMatch(selectedTransaction.id, suggestion, suggestion.suggestedAction === 'Auto-Match' ? 'auto' : 'manual');
    setMatchPanelMode('details');
  };

  // Handle unmatch
  const handleUnmatch = () => {
    if (!selectedTransaction) return;

    unmatchTransaction(selectedTransaction.id);
    setMatchPanelMode('details');
    // Refresh suggestions
    if (matters.length > 0) {
      const mockPayments: any[] = [];
      const txnSuggestions = suggestMatches(selectedTransaction, matters, mockPayments);
      setSuggestions(txnSuggestions);
    }
  };

  // Handle auto-match all
  const handleAutoMatchAll = async () => {
    setIsAutoMatching(true);
    
    // In real app, get actual payments
    const mockPayments: any[] = [];
    const matches = await runAutoMatch(filteredTransactions, matters, mockPayments);
    
    setIsAutoMatching(false);
    
    // Refresh suggestions
    if (selectedTransaction) {
      const txnSuggestions = suggestMatches(selectedTransaction, matters, mockPayments);
      setSuggestions(txnSuggestions);
    }
  };

  // Handle export
  const handleExportMatched = () => {
    const csv = exportMatchReport();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matched-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportUnmatched = () => {
    const data = filteredTransactions
      .filter(t => t.status === 'PENDING')
      .map(t => ({
        'Transaction ID': t.id,
        'Date': formatDate(t.date, 'short'),
        'Type': formatTransactionType(t.type),
        'Amount': formatCurrency(t.amount),
        'Description': t.description,
        'Reference': t.referenceNumber,
        'Status': t.status,
      }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unmatched-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Toggle live feed
  const toggleLiveFeed = async () => {
    if (!isLiveFeed) {
      setIsLiveFeed(true);
      // Start generating transactions with delay
      await generateTransactionsWithDelay(10);
      const newTransactions = getAllTransactions();
      setTransactions(newTransactions);
      applyFilters(newTransactions);
    } else {
      setIsLiveFeed(false);
    }
  };

  // Table columns
  const columns: Column<BankTransaction>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.date, 'short'),
      className: 'whitespace-nowrap',
    },
    { key: 'type', header: 'Type', render: (row) => formatTransactionType(row.type) },
    { key: 'description', header: 'Description' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className={cn(
          'font-medium',
          row.amount > 0 ? 'text-success' : 'text-error'
        )}>
          {formatCurrency(Math.abs(row.amount))}
        </span>
      ),
      className: 'text-right whitespace-nowrap',
    },
    { key: 'referenceNumber', header: 'Reference' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant={row.status === 'CLEARED' ? 'success' : row.status === 'FAILED' ? 'error' : 'warning'}
          size="sm"
        >
          {getTransactionStatusLabel(row.status)}
        </Badge>
      ),
      className: 'text-center',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleTransactionClick(row)}>
          View
        </Button>
      ),
      className: 'text-center',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <a href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Dashboard
          </a>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Bank Feed</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bank Transaction Feed</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor incoming bank transactions, auto-match to matters/payments, and manage reconciliation
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Total Credits
              </p>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.totalCredits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Total Debits
              </p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-600"></div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.totalDebits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Net Amount
              </p>
              <p className={cn(
                'text-3xl font-bold',
                summary.netAmount >= 0 ? 'text-success' : 'text-error'
              )}>
                {formatCurrency(summary.netAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Transactions
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {summary.transactionCount}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Statistics */}
      {matchStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Match Rate</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {matchStats.matchRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auto-Matched</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {matchStats.autoMatched}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">High Confidence</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {matchStats.highConfidenceMatches}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unmatched</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {matchStats.unmatchedTransactions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                View
              </label>
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {(['all', 'matched', 'unmatched'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize',
                      viewMode === mode
                        ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    )}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="POSTED">Posted</option>
                <option value="CLEARED">Cleared</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as BankTransactionType | 'all')}
              >
                <option value="all">All Types</option>
                <option value="ACH">ACH</option>
                <option value="WIRE">Wire Transfer</option>
                <option value="CHECK">Check</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CREDIT_CARD">Credit Card</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <Input
                placeholder="Search by reference or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateFrom(e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <Input
                  type="date"
                  placeholder="To"
                  value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDateTo(e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant={isLiveFeed ? 'primary' : 'secondary'}
                size="sm"
                onClick={toggleLiveFeed}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLiveFeed ? 'animate-spin' : ''}`} />
                {isLiveFeed ? 'Live Feed' : 'Start Feed'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAutoMatchAll}
                loading={isAutoMatching}
              >
                <Check className="w-4 h-4 mr-2" />
                Auto-Match All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  Bank Transactions
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    ({filteredTransactions.length})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportMatched()}
                  disabled={filteredTransactions.filter(t => t.status === 'CLEARED').length === 0}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Export Matched
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportUnmatched}
                  disabled={filteredTransactions.filter(t => t.status === 'PENDING').length === 0}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Export Unmatched
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            data={filteredTransactions}
            columns={columns}
            emptyMessage="No transactions found for current filters"
            onRowClick={handleTransactionClick}
          />
        </CardContent>
      </Card>

      {/* Match Panel */}
      {selectedTransaction && matchPanelMode !== 'none' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    Transaction Details
                  </div>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setMatchPanelMode('none')}>
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedTransaction.date, 'display')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTransactionType(selectedTransaction.type)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                  <span className={cn(
                    'text-2xl font-bold',
                    selectedTransaction.amount > 0 ? 'text-success' : 'text-error'
                  )}>
                    {formatCurrency(Math.abs(selectedTransaction.amount))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Description</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate" title={selectedTransaction.description}>
                    {selectedTransaction.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reference Number</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedTransaction.referenceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Badge
                    variant={selectedTransaction.status === 'CLEARED' ? 'success' : selectedTransaction.status === 'FAILED' ? 'error' : 'warning'}
                    size="md"
                  >
                    {getTransactionStatusLabel(selectedTransaction.status)}
                  </Badge>
                </div>
            </div>
            </CardContent>
          </Card>

          {/* Match Suggestions */}
          {matchPanelMode === 'suggestions' && suggestions.length > 0 && (
            <Card>
              <CardHeader className="text-gray-900 dark:text-white">
                Match Suggestions
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.map((suggestion, idx) => {
                    const confidenceColor = getMatchConfidenceColor(suggestion.confidence);
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                          suggestion.confidence === 'high' 
                            ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20' 
                            : suggestion.confidence === 'medium'
                            ? 'border-orange-500 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMatchConfidenceIcon(suggestion.confidence)}</span>
                            <Badge variant={suggestion.confidence === 'high' ? 'success' : suggestion.confidence === 'medium' ? 'warning' : 'default'} size="sm">
                              {getMatchConfidenceLabel(suggestion.confidence)}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{suggestion.score}% match</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{suggestion.matchReason}</p>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="text-gray-500 dark:text-gray-500">Matter:</span> {suggestion.matterId}
                        </div>
                        <Button
                          variant={suggestion.suggestedAction === 'Auto-Match' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => handleApplyMatch(suggestion)}
                          disabled={suggestion.suggestedAction === 'Manual-Review' && suggestion.confidence !== 'high'}
                        >
                          {suggestion.suggestedAction === 'Auto-Match' ? 'Auto-Match' : 'Match'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Match Details */}
          {matchPanelMode === 'details' && suggestions.length > 0 && (
            <Card>
              <CardHeader className="text-gray-900 dark:text-white">
                Matched To
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.filter(s => s.suggestedAction === 'Auto-Match').map((suggestion, idx) => {
                    const confidenceColor = getMatchConfidenceColor(suggestion.confidence);
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg text-green-600 dark:text-green-400">✓</span>
                            <Badge variant="success" size="sm">
                              {getMatchConfidenceLabel(suggestion.confidence)}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{suggestion.score}% match</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{suggestion.matchReason}</p>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="text-gray-500 dark:text-gray-500">Matter:</span> {suggestion.matterId}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleUnmatch}
                          className="mt-3"
                        >
                          Unmatch Transaction
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Transactions Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No transactions match your current filters. Try adjusting filters or start live feed to receive transactions.
            </p>
            <Button onClick={toggleLiveFeed} variant="primary">
              <RefreshCw className="w-5 h-5 mr-2" />
              Start Live Feed
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BankFeed;
