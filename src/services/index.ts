// Services exports
export {
  // Core interest calculation
  calculateDailyInterest,
  calculateDailyInterestDetailed,
  calculateAccruedInterest,
  calculateAccruedInterestWithRateChanges,
  calculateTotalInterestAccrued,
  calculateTotalInterestOwed,
  calculateTotalOwed,

  // Matter balance calculation
  calculateMatterBalance,
  calculateMatterBalanceWithRateHistory,

  // Interest allocation
  allocateInterestToMatters,
  allocateInterestWaterfall,

  // Daily balance generation
  generateDailyBalancesForMatter,

  // Payoff calculation
  calculateMatterPayoff,

  // Helper functions
  getEffectiveRate,
  getNextAutodraftDate,
  formatInterestAmount,
  formatInterestRate,
} from './interestCalculator';

// Bank feed service
export {
  fetchBankTransactions,
  generateMockTransactions,
  generateTransactionsWithDelay,
  subscribeToTransactions,
  getAllTransactions,
  addTransaction,
  clearTransactions,
  getTransactionSummary,
  initializeBankFeed,
  reconcileTransactions,
  exportTransactionsToCSV,
  getTransactionById,
  updateTransactionStatus,
} from './bankFeedService';

// Transaction matching service
export {
  suggestMatches,
  applyMatch,
  unmatchTransaction,
  runAutoMatch,
  getMatchStatistics,
  getAllMatches,
  getAllSuggestions,
  getTransactionMatch,
  clearMatchHistory,
  exportMatchReport,
  getMatchConfidenceColor,
  getMatchConfidenceLabel,
  getMatchConfidenceIcon,
  formatTransactionType,
  getTransactionStatusColor,
  getTransactionStatusLabel,
} from './transactionMatchingService';

// Re-export types
export type {
  MatterBalance,
  DailyInterestResult,
} from './interestCalculator';

export type {
  BankTransaction,
  BankTransactionType,
  DateRange,
  BankTransactionFilter,
  FetchResult,
  ReconciliationResult,
} from './bankFeedService';

export type {
  MatchSuggestion,
  MatchedTransaction,
  MatchStatistics,
  MatchConfidence,
  MatchResult,
} from './transactionMatchingService';

// Report service
export {
  generateFundingReport,
  generatePayoffReport,
  generateFinanceChargeReport,
  generateTransactionReport,
  exportToCSV,
  exportToJSON,
  exportToHTML,
  exportReport,
  addReportSchedule,
  updateReportSchedule,
  removeReportSchedule,
  getReportSchedules,
  toggleReportSchedule,
  calculateNextRunDate,
  getPreconfiguredReport,
  getAllPreconfiguredReports,
} from './reportService';

export type {
  ReportConfig,
  ReportSchedule,
  ReportResult,
  ReportFormat,
  ExportOptions,
} from './reportService';

// Real-time services
export * from './realtime';
