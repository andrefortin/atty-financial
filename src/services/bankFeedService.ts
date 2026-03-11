// ============================================
// Bank Transaction Feed Simulation Service
// Enhanced with better error handling and realistic data
// ============================================

// ============================================
// Types
// ============================================

export type BankTransactionType = 'ACH' | 'WIRE' | 'CHECK' | 'DEBIT_CARD' | 'CREDIT_CARD';

export interface BankTransaction {
  id: string;
  date: Date;
  type: BankTransactionType;
  amount: number;
  description: string;
  referenceNumber: string;
  status: 'PENDING' | 'POSTED' | 'CLEARED' | 'FAILED';
  fromAccount?: string;
  toAccount?: string;
  memo?: string;
  createdAt: Date;
  balanceAfter?: number; // Running balance
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface BankTransactionFilter {
  dateRange?: DateRange;
  type?: BankTransactionType;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface FetchResult<T> {
  data: T[];
  success: boolean;
  error?: string;
  hasMore?: boolean;
  totalCount?: number;
}

export interface ReconciliationResult {
  reconciled: number;
  unreconciled: number;
  totalAmount: number;
  errors: string[];
}

// ============================================
// Error Types
// ============================================

export class BankFeedError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'BankFeedError';
  }
}

// ============================================
// Mock Data Generators
// ============================================

const CLIENT_ACCOUNT = '****4521';
const LINE_OF_CREDIT = '****7890';
const OPERATING_ACCOUNT = '****3321';

const generateId = (): string => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};

const generateReferenceNumber = (): string => {
  const prefix = ['REF', 'TRN', 'BANK', 'WIRE', 'ACH', 'CHK'][Math.floor(Math.random() * 6)];
  return `${prefix}${Date.now().toString().slice(-8)}`;
};

// Enhanced realistic descriptions with matter references
const MOCK_DESCRIPTIONS = [
  { type: 'ACH' as const, description: 'Monthly Principal Payment - JON-2024-001', amount: -25000, probability: 0.8 },
  { type: 'ACH' as const, description: 'Interest Autodraft Payment', amount: -3200, probability: 0.9 },
  { type: 'ACH' as const, description: 'Wire Transfer - Client Settlement DOD-2024-003', amount: 75000, probability: 0.7 },
  { type: 'ACH' as const, description: 'ACH Credit - Attorney Fee Transfer', amount: 15000, probability: 0.6 },
  { type: 'WIRE' as const, description: 'Wire Transfer - Expert Witness Payment', amount: -12500, probability: 0.5 },
  { type: 'WIRE' as const, description: 'Wire Transfer - Court Costs JON-2024-002', amount: -8750, probability: 0.6 },
  { type: 'CHECK' as const, description: 'Check #12345 - Operating Expenses', amount: -3500, probability: 0.7 },
  { type: 'CHECK' as const, description: 'Check #12346 - Client Retainer Payment', amount: 50000, probability: 0.6 },
  { type: 'DEBIT_CARD' as const, description: 'Office Supplies - Office Depot', amount: -850, probability: 0.5 },
  { type: 'DEBIT_CARD' as const, description: 'Legal Research - Westlaw Subscription', amount: -450, probability: 0.8 },
  { type: 'CREDIT_CARD' as const, description: 'Travel - Airfare Case #2024-015', amount: -1200, probability: 0.5 },
  { type: 'CREDIT_CARD' as const, description: 'Hotel - Conference Attendance', amount: -800, probability: 0.4 },
  { type: 'ACH' as const, description: 'Monthly Interest Payment - Multiple Matters', amount: -2800, probability: 0.85 },
  { type: 'WIRE' as const, description: 'Wire In - Case Settlement', amount: 150000, probability: 0.6 },
  { type: 'ACH' as const, description: 'Line of Credit Draw - Case Funding', amount: 50000, probability: 0.7 },
  { type: 'ACH' as const, description: 'Principal Payment - Case M001', amount: -15000, probability: 0.6 },
  { type: 'WIRE' as const, description: 'Wire Transfer - Medical Records', amount: -3200, probability: 0.5 },
  { type: 'CHECK' as const, description: 'Check #12347 - Filing Fees Court', amount: -650, probability: 0.6 },
  { type: 'ACH' as const, description: 'ACH Debit - Office Lease', amount: -4200, probability: 0.9 },
  { type: 'WIRE' as const, description: 'Wire In - Partial Settlement', amount: 85000, probability: 0.5 },
  { type: 'CREDIT_CARD' as const, description: 'Client Lunch - Networking', amount: -175, probability: 0.4 },
  { type: 'DEBIT_CARD' as const, description: 'Print Shop - Documents Large Order', amount: -925, probability: 0.5 },
  { type: 'ACH' as const, description: 'Monthly Principal Payment - DOD-2024-003', amount: -30000, probability: 0.75 },
  { type: 'ACH' as const, description: 'Interest Autodraft - Q4 2024', amount: -3500, probability: 0.8 },
  { type: 'WIRE' as const, description: 'Wire Transfer - Expert Witness Fee', amount: -15000, probability: 0.5 },
  { type: 'ACH' as const, description: 'ACH Credit - Retainer Deposit New Client', amount: 100000, probability: 0.6 },
];

const generateBankTransaction = (date: Date, index: number, runningBalance: number): BankTransaction => {
  // Select description based on probability
  let selectedDesc = MOCK_DESCRIPTIONS[0];
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const desc of MOCK_DESCRIPTIONS) {
    cumulativeProbability += desc.probability * 0.1; // Normalize probability
    if (random <= cumulativeProbability) {
      selectedDesc = desc;
      break;
    }
  }

  // Vary the amount slightly for realism
  const amountVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
  const amount = Math.round(selectedDesc.amount * (1 + amountVariation));

  const newBalance = runningBalance + amount;

  return {
    id: generateId(),
    date: new Date(date),
    type: selectedDesc.type,
    amount,
    description: selectedDesc.description,
    referenceNumber: generateReferenceNumber(),
    status: Math.random() > 0.15 ? 'POSTED' : 'PENDING',
    fromAccount: amount > 0 ? undefined : CLIENT_ACCOUNT,
    toAccount: amount > 0 ? CLIENT_ACCOUNT : undefined,
    memo: index % 3 === 0 ? `Auto-generated transaction batch ${Math.floor(index / 3) + 1}` : undefined,
    createdAt: new Date(date),
    balanceAfter: newBalance,
  };
};

const generateMockTransactions = (count: number = 50): BankTransaction[] => {
  const transactions: BankTransaction[] = [];
  const now = new Date();
  let runningBalance = 250000; // Starting balance

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * (Math.random() > 0.7 ? 1 : 2)); // Skip some days

    // Only add 1-3 transactions per day
    const dailyTransactions = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < dailyTransactions; j++) {
      if (transactions.length < count) {
        const txn = generateBankTransaction(date, transactions.length, runningBalance);
        transactions.push(txn);
        runningBalance = txn.balanceAfter!;
      }
    }
  }

  return transactions;
};

// ============================================
// In-Memory Transaction Storage
// ============================================

class BankTransactionStorage {
  private transactions: BankTransaction[] = [];
  private listeners: Set<(transactions: BankTransaction[]) => void> = new Set();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.loadFromLocalStorage();
      if (this.transactions.length === 0) {
        // Generate initial mock data
        const mockData = generateMockTransactions(60);
        this.addMany(mockData);
        this.saveToLocalStorage();
      }
      this.initialized = true;
    } catch (error) {
      throw new BankFeedError(
        'Failed to initialize bank feed storage',
        'INIT_ERROR',
        false
      );
    }
  }

  getAll(): BankTransaction[] {
    return [...this.transactions];
  }

  add(transaction: BankTransaction): void {
    this.transactions.unshift(transaction);
    this.notifyListeners();
  }

  addMany(transactions: BankTransaction[]): void {
    this.transactions = [...transactions, ...this.transactions];
    this.notifyListeners();
  }

  clear(): void {
    this.transactions = [];
    this.notifyListeners();
    this.saveToLocalStorage();
  }

  subscribe(listener: (transactions: BankTransaction[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAll()));
  }

  saveToLocalStorage(): void {
    try {
      localStorage.setItem('bank_transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Failed to save bank transactions to localStorage:', error);
      throw new BankFeedError(
        'Failed to save transactions to local storage',
        'STORAGE_ERROR',
        false
      );
    }
  }

  loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('bank_transactions');
      if (stored) {
        this.transactions = JSON.parse(stored).map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load bank transactions from localStorage:', error);
      // Don't throw here, allow app to continue with empty state
    }
  }
}

const transactionStorage = new BankTransactionStorage();

// ============================================
// Service Functions
// ============================================

/**
 * Initialize the bank feed service
 * Should be called on app startup
 */
export async function initializeBankFeed(): Promise<void> {
  try {
    await transactionStorage.initialize();
  } catch (error) {
    console.error('Bank feed initialization error:', error);
    throw error;
  }
}

/**
 * Fetch bank transactions with filtering and pagination
 * @param filter Optional filters to apply
 * @param limit Maximum number of transactions to return
 * @param offset Offset for pagination
 * @returns FetchResult with transactions and metadata
 */
export async function fetchBankTransactions(
  filter?: BankTransactionFilter,
  limit: number = 50,
  offset: number = 0
): Promise<FetchResult<BankTransaction>> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200)); // Simulate network delay

    let transactions = transactionStorage.getAll();

    // Apply filters
    if (filter) {
      if (filter.dateRange) {
        transactions = transactions.filter(t =>
          t.date >= filter.dateRange!.startDate && t.date <= filter.dateRange!.endDate
        );
      }
      if (filter.type) {
        transactions = transactions.filter(t => t.type === filter.type);
      }
      if (filter.status) {
        transactions = transactions.filter(t => t.status === filter.status);
      }
      if (filter.minAmount !== undefined) {
        transactions = transactions.filter(t => Math.abs(t.amount) >= filter.minAmount!);
      }
      if (filter.maxAmount !== undefined) {
        transactions = transactions.filter(t => Math.abs(t.amount) <= filter.maxAmount!);
      }
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        transactions = transactions.filter(t =>
          t.description.toLowerCase().includes(term) ||
          t.referenceNumber.toLowerCase().includes(term)
        );
      }
    }

    // Apply pagination
    const totalCount = transactions.length;
    const paginatedTransactions = transactions.slice(offset, offset + limit);

    return {
      data: paginatedTransactions,
      success: true,
      hasMore: offset + limit < totalCount,
      totalCount,
    };
  } catch (error) {
    console.error('Error fetching bank transactions:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    };
  }
}

/**
 * Get all transactions without filtering (for internal use)
 */
export function getAllTransactions(): BankTransaction[] {
  return transactionStorage.getAll();
}

/**
 * Add a new transaction
 */
export function addTransaction(transaction: BankTransaction): void {
  transactionStorage.add(transaction);
  try {
    transactionStorage.saveToLocalStorage();
  } catch (error) {
    console.error('Failed to save new transaction:', error);
  }
}

/**
 * Generate transactions with simulated delay (for testing)
 */
export async function generateTransactionsWithDelay(
  count: number = 10,
  delay: number = 1000
): Promise<BankTransaction[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const newTransactions: BankTransaction[] = [];

      for (let i = 0; i < count; i++) {
        const date = new Date(now);
        date.setMinutes(date.getMinutes() - i * 5);

        newTransactions.push(generateBankTransaction(date, i, 0));
      }

      transactionStorage.addMany(newTransactions);
      try {
        transactionStorage.saveToLocalStorage();
      } catch (error) {
        console.error('Failed to save generated transactions:', error);
      }

      resolve(newTransactions);
    }, delay);
  });
}

/**
 * Subscribe to real-time transaction updates
 */
export function subscribeToTransactions(
  callback: (transactions: BankTransaction[]) => void
): () => void {
  return transactionStorage.subscribe(callback);
}

/**
 * Get transaction summary statistics
 */
export function getTransactionSummary(transactions: BankTransaction[]) {
  const total = transactions.length;
  const matched = transactions.filter(t => t.status === 'POSTED').length;
  const unmatched = total - matched;
  const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    total,
    matched,
    unmatched,
    totalAmount,
    matchRate: total > 0 ? (matched / total) * 100 : 0,
  };
}

/**
 * Reconcile transactions with internal records
 */
export function reconcileTransactions(
  bankTransactions: BankTransaction[],
  internalTransactions: any[]
): ReconciliationResult {
  const errors: string[] = [];
  let reconciled = 0;
  let unreconciled = 0;

  // Simple reconciliation logic - match by amount and date
  bankTransactions.forEach(bankTxn => {
    const matchingInternal = internalTransactions.find(
      internal =>
        Math.abs(internal.amount - bankTxn.amount) < 0.01 &&
        Math.abs(internal.date.getTime() - bankTxn.date.getTime()) < 86400000 // Within 24 hours
    );

    if (matchingInternal) {
      reconciled++;
    } else {
      unreconciled++;
    }
  });

  return {
    reconciled,
    unreconciled,
    totalAmount: bankTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
    errors,
  };
}

/**
 * Clear all transactions (for testing/debugging)
 */
export function clearTransactions(): void {
  transactionStorage.clear();
}

/**
 * Export transactions to CSV format
 */
export function exportTransactionsToCSV(transactions: BankTransaction[]): string {
  const headers = ['ID', 'Date', 'Type', 'Amount', 'Description', 'Reference', 'Status'];
  const rows = transactions.map(t => [
    t.id,
    t.date.toISOString(),
    t.type,
    t.amount.toFixed(2),
    `"${t.description}"`,
    t.referenceNumber,
    t.status,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Get transaction by ID
 */
export function getTransactionById(id: string): BankTransaction | undefined {
  return transactionStorage.getAll().find(t => t.id === id);
}

/**
 * Update transaction status
 */
export function updateTransactionStatus(
  id: string,
  status: BankTransaction['status']
): boolean {
  const transactions = transactionStorage.getAll();
  const index = transactions.findIndex(t => t.id === id);

  if (index !== -1) {
    transactions[index].status = status;
    transactionStorage.addMany(transactions);
    try {
      transactionStorage.saveToLocalStorage();
      return true;
    } catch (error) {
      console.error('Failed to save transaction status update:', error);
      return false;
    }
  }

  return false;
}
