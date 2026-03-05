/**
 * BankJoy Transactions Service
 *
 * Fetch and normalize transactions from BankJoy API.
 * Read-only access as per security requirements.
 *
 * @module services/bankjoy/transactions.service
 */

import { getBankJoyClient, type BankJoyClientConfig } from './bankjoy/client';
import {
  type BankJoyTransaction,
  type BankJoyApiResponse,
  type BankJoyTransactionQuery,
} from './bankjoy/client';

// ============================================
// Types
// ============================================

/**
 * Normalized transaction record
 */
export interface NormalizedTransaction {
  /**
   * BankJoy transaction ID
   */
  bankjoyTransactionId: string;

  /**
   * Transaction reference number
   */
  referenceNumber: string;

  /**
   * Transaction date
   */
  transactionDate: string;

  /**
   * Transaction amount
   */
  amount: number;

  /**
   * Currency (default: USD)
   */
  currency: string;

  /**
   * Transaction type (credit/debit)
   */
  type: 'credit' | 'debit';

  /**
   * Counterparty name
   */
  counterparty: string;

  /**
   * Description
   */
  description: string;

  /**
   * Account number (masked)
   */
  accountNumber: string;

  /**
   * Account type
   */
  accountType: string;

  /**
   * Account name
   */
  accountName: string;

  /**
   * Balance after transaction
   */
  balance: number;

  /**
   * Running balance
   */
  runningBalance: number;

  /**
   * Category
   */
  category: string;

  /**
   * Tags
   */
  tags: string[];

  /**
   * Reference number (if available)
   */
  reference: string;

  /**
   * Status (cleared/pending)
   */
  status: 'cleared' | 'pending';

  /**
   * Memo
   */
  memo: string;

  /**
   * Attachment URLs
   */
  attachments: string[];

  /**
   * Bank Joy bank ID (for multi-bank support)
   */
  bankJoyBankId: string;

  /**
   * Created timestamp
   */
  createdAt: number;

  /**
   * Updated timestamp
   */
  updatedAt: number;
}

/**
 * Transaction fetch result
 */
export interface TransactionFetchResult {
  transactions: NormalizedTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Transaction filter options
 */
export interface TransactionFilterOptions {
  /**
   * Account ID to filter by
   */
  accountId?: string;

  /**
   * Bank ID to filter by
   */
  bankId?: string;

  /**
   * Start date (ISO format)
   */
  startDate?: string;

  /**
   * End date (ISO format)
   */
  endDate?: string;

  /**
   * Minimum amount
   */
  minAmount?: number;

  /**
   * Maximum amount
   */
  maxAmount?: number;

  /**
   * Transaction type
   */
  type?: 'credit' | 'debit';

  /**
   * Counterparty filter
   */
  counterparty?: string;

  /**
   * Reference number search
   */
  referenceNumber?: string;

  /**
   * Page number (1-based)
   */
  page?: number;

  /**
   * Page size (default: 50)
   */
  pageSize?: number;

  /**
   * Sort field
   */
  sortBy?: 'transactionDate' | 'amount' | 'createdAt';

  /**
   * Sort direction
   */
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Service
// ============================================

/**
 * BankJoy Transactions Service
 *
 * Provides methods to fetch and normalize transactions from BankJoy API.
 * Read-only access as per security requirements.
 */
export class BankJoyTransactionsService {
  private client: ReturnType<typeof getBankJoyClient>;

  constructor() {
    this.client = getBankJoyClient();
  }

  // ============================================
  // Public Methods
  // ============================================

  /**
   * Fetch transactions from BankJoy API
   *
   * @param options - Query and filter options
   * @returns Promise with normalized transactions
   */
  async fetchTransactions(
    options: TransactionFilterOptions
  ): Promise<TransactionFetchResult> {
    try {
      // Validate inputs
      if (options.page && options.page < 1) {
        throw new Error('Page number must be >= 1');
      }

      // Build query
      const query: BankJoyTransactionQuery = {
        accountId: options.accountId,
        bankId: options.bankId,
        startDate: options.startDate,
        endDate: options.endDate,
        minAmount: options.minAmount,
        maxAmount: options.maxAmount,
        type: options.type,
        counterparty: options.counterparty,
        referenceNumber: options.referenceNumber,
        page: options.page,
        pageSize: options.pageSize,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      };

      // Fetch transactions from BankJoy
      const response = await this.client.getTransactions(query);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch transactions');
      }

      // Normalize transactions
      const normalizedTransactions = response.data.map(
        this.normalizeTransaction.bind(this)
      );

      return {
        transactions: normalizedTransactions,
        totalCount: response.pagination?.total || 0,
        page: response.pagination?.page || 1,
        pageSize: response.pagination?.pageSize || 50,
        hasMore: response.pagination?.hasMore || false,
      };
    } catch (error) {
      console.error('Failed to fetch BankJoy transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch transaction by ID
   *
   * @param transactionId - Transaction ID
   * @returns Promise with normalized transaction
   */
  async fetchTransactionById(
    transactionId: string
  ): Promise<NormalizedTransaction | null> {
    try {
      // Fetch transaction from BankJoy
      const response = await this.client.getTransactionById(transactionId);

      if (!response.success || !response.data) {
        return null;
      }

      // Normalize transaction
      return this.normalizeTransaction(response.data);
    } catch (error) {
      console.error(`Failed to fetch BankJoy transaction ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Search transactions by reference number
   *
   * @param referenceNumber - Reference number to search
   * @param options - Filter options (accountId, bankId)
   * @returns Promise with normalized transactions
   */
  async searchTransactionsByReference(
    referenceNumber: string,
    options: Pick<TransactionFilterOptions, 'accountId' | 'bankId' | 'pageSize'> = {}
  ): Promise<TransactionFetchResult> {
    try {
      // Validate inputs
      if (!referenceNumber) {
        throw new Error('Reference number is required');
      }

      // Fetch transactions
      return this.fetchTransactions({
        ...options,
        referenceNumber,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      });
    } catch (error) {
      console.error(`Failed to search transactions by reference ${referenceNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get transactions for a date range
   *
   * @param startDate - Start date (ISO format)
   * @param endDate - End date (ISO format)
   * @param options - Filter options (accountId, bankId)
   * @returns Promise with normalized transactions
   */
  async getTransactionsForDateRange(
    startDate: string,
    endDate: string,
    options: Pick<TransactionFilterOptions, 'accountId' | 'bankId' | 'pageSize'> = {}
  ): Promise<TransactionFetchResult> {
    try {
      // Validate inputs
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      // Fetch transactions
      return this.fetchTransactions({
        ...options,
        startDate,
        endDate,
        sortBy: 'transactionDate',
        sortOrder: 'asc',
      });
    } catch (error) {
      console.error(`Failed to fetch transactions for date range ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }

  /**
   * Get credit transactions
   *
   * @param options - Filter options (accountId, bankId, page)
   * @returns Promise with normalized credit transactions
   */
  async getCreditTransactions(
    options: Pick<TransactionFilterOptions, 'accountId' | 'bankId' | 'page' | 'pageSize'> = {}
  ): Promise<TransactionFetchResult> {
    try {
      // Fetch transactions
      return this.fetchTransactions({
        ...options,
        type: 'credit',
        sortBy: 'amount',
        sortOrder: 'desc',
      });
    } catch (error) {
      console.error('Failed to fetch credit transactions:', error);
      throw error;
    }
  }

  /**
   * Get debit transactions
   *
   * @param options - Filter options (accountId, bankId, page)
   * @returns Promise with normalized debit transactions
   */
  async getDebitTransactions(
    options: Pick<TransactionFilterOptions, 'accountId' | 'bankId' | 'page' | 'pageSize'> = {}
  ): Promise<TransactionFetchResult> {
    try {
      // Fetch transactions
      return this.fetchTransactions({
        ...options,
        type: 'debit',
        sortBy: 'amount',
        sortOrder: 'desc',
      });
    } catch (error) {
      console.error('Failed to fetch debit transactions:', error);
      throw error;
    }
  }

  /**
   * Get transactions by counterparty
   *
   * @param counterparty - Counterparty name to filter by
   * @param options - Filter options (accountId, bankId, page)
   * @returns Promise with normalized transactions
   */
  async getTransactionsByCounterparty(
    counterparty: string,
    options: Pick<TransactionFilterOptions, 'accountId' | 'bankId' | 'page' | 'pageSize'> = {}
  ): Promise<TransactionFetchResult> {
    try {
      // Validate inputs
      if (!counterparty) {
        throw new Error('Counterparty is required');
      }

      // Fetch transactions
      return this.fetchTransactions({
        ...options,
        counterparty,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      });
    } catch (error) {
      console.error(`Failed to fetch transactions for counterparty ${counterparty}:`, error);
      throw error;
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Normalize BankJoy transaction to our format
   *
   * @param transaction - BankJoy transaction
   * @returns Normalized transaction
   */
  private normalizeTransaction(
    transaction: BankJoyTransaction
  ): NormalizedTransaction {
    const bankJoyBankId = transaction.bankId || 'bankjoy-default';

    return {
      bankjoyTransactionId: transaction.id,
      referenceNumber: transaction.referenceNumber,
      transactionDate: transaction.transactionDate,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.type,
      counterparty: transaction.counterparty,
      description: transaction.description,
      accountNumber: transaction.accountNumber,
      accountType: transaction.accountType,
      accountName: transaction.accountName,
      balance: transaction.balance,
      runningBalance: transaction.runningBalance,
      category: transaction.category || 'Uncategorized',
      tags: transaction.tags || [],
      reference: transaction.reference || '',
      status: transaction.status,
      memo: transaction.memo || '',
      attachments: transaction.attachments || [],
      bankJoyBankId,
      createdAt: new Date(transaction.createdAt).getTime(),
      updatedAt: new Date(transaction.updatedAt).getTime(),
    };
  }

  /**
   * Get client instance for testing
   */
  getClient() {
    return this.client;
  }
}

// ============================================
// Singleton Instance
// ============================================

let transactionsServiceInstance: BankJoyTransactionsService | null = null;

/**
 * Get transactions service singleton instance
 */
export function getBankJoyTransactionsService(): BankJoyTransactionsService {
  if (!transactionsServiceInstance) {
    transactionsServiceInstance = new BankJoyTransactionsService();
  }
  return transactionsServiceInstance;
}

/**
 * Reset transactions service singleton (for testing)
 */
export function resetBankJoyTransactionsService(): void {
  transactionsServiceInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  BankJoyTransactionsService,
  getBankJoyTransactionsService,
  resetBankJoyTransactionsService,
  type NormalizedTransaction,
  type TransactionFetchResult,
  type TransactionFilterOptions,
};
