/**
 * BankJoy API Client
 *
 * HTTP client for BankJoy API with authentication and error handling.
 * Read-only access as per security requirements.
 *
 * @module services/bankjoy/client
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================
// Types
// ============================================

/**
 * BankJoy API configuration
 */
export interface BankJoyClientConfig {
  /**
   * BankJoy API key
   */
  apiKey: string;

  /**
   * BankJoy API base URL
   * @default 'https://api.bankjoy.com/v1'
   */
  baseUrl?: string;

  /**
   * API timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Whether to enable retry logic
   * @default true
   */
  retry?: boolean;

  /**
   * Maximum number of retries
   * @default 3
   */
  maxRetries?: number;

  /**
   * Whether to enable rate limiting
   * @default true
   */
  rateLimit?: boolean;
}

/**
 * Authentication token
 */
export interface BankJoyAuthToken {
  /**
   * Access token
   */
  token: string;

  /**
   * Token type (Bearer)
   */
  type: 'Bearer';

  /**
   * Token expiration timestamp
   */
  expiresAt: number;

  /**
   * Refresh token (if available)
   */
  refreshToken?: string;
}

/**
 * API error response
 */
export interface BankJoyApiError {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Error code
   */
  code: string;

  /**
   * Request ID for debugging
   */
  requestId?: string;

  /**
   * Error details (if available)
   */
  details?: any;

  /**
   * Timestamp of error
   */
  timestamp: number;
}

/**
 * API response wrapper
 */
export interface BankJoyApiResponse<T> {
  /**
   * Response data
   */
  data: T;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Request ID for debugging
   */
  requestId?: string;

  /**
   * Pagination metadata (if applicable)
   */
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

/**
 * Transaction record from BankJoy
 */
export interface BankJoyTransaction {
  /**
   * Transaction ID
   */
  id: string;

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
  category?: string;

  /**
   * Tags
   */
  tags?: string[];

  /**
   * Reference number (if available)
   */
  reference?: string;

  /**
   * Status (cleared/pending)
   */
  status: 'cleared' | 'pending' | 'failed';

  /**
   * Memo
   */
  memo?: string;

  /**
   * Attachment URLs
   */
  attachments?: string[];

  /**
   * Created timestamp
   */
  createdAt: string;

  /**
   * Updated timestamp
   */
  updatedAt: string;

  /**
   * Bank ID (for multi-bank support)
   */
  bankId?: string;
}

/**
 * Balance record from BankJoy
 */
export interface BankJoyBalance {
  /**
   * Balance ID
   */
  id: string;

  /**
   * Account ID
   */
  accountId: string;

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
   * Current balance
   */
  balance: number;

  /**
   * Currency (default: USD)
   */
  currency: string;

  /**
   * Available balance
   */
  availableBalance: number;

  /**
   * Pending transactions
   */
  pendingAmount: number;

  /**
   * Last updated timestamp
   */
  lastUpdated: string;

  /**
   * Bank ID (for multi-bank support)
   */
  bankId?: string;
}

/**
 * Account record from BankJoy
 */
export interface BankJoyAccount {
  /**
   * Account ID
   */
  id: string;

  /**
   * Account number (masked)
   */
  accountNumber: string;

  /**
   * Account type (checking, savings, etc.)
   */
  accountType: string;

  /**
   * Account name
   */
  accountName: string;

  /**
   * Current balance
   */
  balance: number;

  /**
   * Currency (default: USD)
   */
  currency: string;

  /**
   * Available balance
   */
  availableBalance: number;

  /**
   * Status (active/closed/frozen)
   */
  status: 'active' | 'closed' | 'frozen';

  /**
   * Account holder name
   */
  accountHolder?: string;

  /**
   * Institution name
   */
  institution: string;

  /**
   * Last activity timestamp
   */
  lastActivityAt: string;

  /**
   * Created timestamp
   */
  createdAt: string;

  /**
   * Updated timestamp
   */
  updatedAt: string;

  /**
   * Bank ID (for multi-bank support)
   */
  bankId?: string;

  /**
   * Custom fields (if any)
   */
  customFields?: Record<string, any>;
}

/**
 * Query parameters for transactions
 */
export interface BankJoyTransactionQuery {
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
// Constants
// ============================================

const DEFAULT_BASE_URL = 'https://api.bankjoy.com/v1';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second
const DEFAULT_PAGE_SIZE = 50;

const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================
// BankJoy API Client
// ============================================

/**
 * BankJoy API Client
 *
 * Provides HTTP client for BankJoy API with authentication,
 * error handling, retry logic, and rate limiting support.
 */
export class BankJoyClient {
  private config: BankJoyClientConfig;
  private axiosInstance: AxiosInstance;
  private token: BankJoyAuthToken | null;
  private tokenExpirationCheck: NodeJS.Timeout | null;
  private requestQueue: Map<string, Promise<any>>;
  private lastRequestTime: number;
  private rateLimitDelay: number;

  constructor(config: BankJoyClientConfig) {
    this.config = {
      baseUrl: DEFAULT_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      retry: true,
      maxRetries: DEFAULT_MAX_RETRIES,
      rateLimit: true,
      ...config,
    };

    this.token = null;
    this.tokenExpirationCheck = null;
    this.requestQueue = new Map();
    this.lastRequestTime = 0;
    this.rateLimitDelay = 0;

    // Create Axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: this.getDefaultHeaders(),
    });

    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  // ============================================
  // Authentication Methods
  // ============================================

  /**
   * Set authentication token
   *
   * @param token - Access token
   * @param expiresAt - Token expiration timestamp
   * @param refreshToken - Refresh token (optional)
   */
  setAuthToken(token: BankJoyAuthToken): void {
    this.token = token;
    this.tokenExpirationCheck = null;

    // Clear token expiration check
    if (this.tokenExpirationCheck) {
      clearTimeout(this.tokenExpirationCheck);
    }

    // Setup token auto-refresh
    if (token.expiresAt) {
      const expiresIn = token.expiresAt - Date.now();

      if (expiresIn > 0) {
        this.tokenExpirationCheck = setTimeout(() => {
          console.warn('BankJoy token expired, refreshing...');
          this.refreshToken();
        }, expiresIn);
      }
    }
  }

  /**
   * Refresh authentication token
   *
   * @returns Promise with new token
   */
  async refreshToken(): Promise<BankJoyAuthToken> {
    try {
      const refreshToken = this.token?.refreshToken;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.axiosInstance.post<{
        token: string;
        refreshToken: string;
        expiresAt: string;
      }>(`/auth/refresh`, {
        refreshToken,
      });

      const newToken: BankJoyAuthToken = {
        token: response.data.token,
        type: 'Bearer',
        expiresAt: Date.parse(response.data.expiresAt),
        refreshToken: response.data.refreshToken,
      };

      this.setAuthToken(newToken);

      return newToken;
    } catch (error) {
      console.error('Failed to refresh BankJoy token:', error);
      throw error;
    }
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.token = null;

    if (this.tokenExpirationCheck) {
      clearTimeout(this.tokenExpirationCheck);
      this.tokenExpirationCheck = null;
    }
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): BankJoyAuthToken | null {
    return this.token;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.token || !this.token.expiresAt) {
      return true;
    }

    return Date.now() >= this.token.expiresAt;
  }

  // ============================================
  // Transaction Methods
  // ============================================

  /**
   * Get transactions from BankJoy API
   *
   * @param query - Query parameters
   * @returns Promise with transactions array
   */
  async getTransactions(
    query: BankJoyTransactionQuery = {}
  ): Promise<BankJoyApiResponse<BankJoyTransaction[]>> {
    try {
      // Validate authentication
      if (!this.token || this.isTokenExpired()) {
        throw new Error('Not authenticated or token expired');
      }

      const response = await this.axiosInstance.get<BankJoyTransaction[]>(
        `/transactions`,
        {
          params: {
            accountId: query.accountId,
            bankId: query.bankId,
            startDate: query.startDate,
            endDate: query.endDate,
            minAmount: query.minAmount,
            maxAmount: query.maxAmount,
            type: query.type,
            counterparty: query.counterparty,
            referenceNumber: query.referenceNumber,
            page: query.page || 1,
            pageSize: query.pageSize || DEFAULT_PAGE_SIZE,
            sortBy: query.sortBy || 'transactionDate',
            sortOrder: query.sortOrder || 'desc',
          },
        }
      );

      return {
        success: true,
        data: response.data,
        requestId: response.headers['x-request-id'],
        pagination: {
          total: parseInt(response.headers['x-total-count'] || '0'),
          page: query.page || 1,
          pageSize: query.pageSize || DEFAULT_PAGE_SIZE,
          hasMore: response.data.length >= (query.pageSize || DEFAULT_PAGE_SIZE),
        },
      };
    } catch (error) {
      return this.handleError<BankJoyTransaction[]>(
        error as Error,
        'GET',
        '/transactions'
      );
    }
  }

  /**
   * Get transaction by ID
   *
   * @param transactionId - Transaction ID
   * @returns Promise with transaction
   */
  async getTransactionById(
    transactionId: string
  ): Promise<BankJoyApiResponse<BankJoyTransaction>> {
    try {
      // Validate authentication
      if (!this.token || this.isTokenExpired()) {
        throw new Error('Not authenticated or token expired');
      }

      const response = await this.axiosInstance.get<BankJoyTransaction>(
        `/transactions/${transactionId}`
      );

      return {
        success: true,
        data: response.data,
        requestId: response.headers['x-request-id'],
      };
    } catch (error) {
      return this.handleError<BankJoyTransaction>(
        error as Error,
        'GET',
        `/transactions/${transactionId}`
      );
    }
  }

  /**
   * Get balance by account ID
   *
   * @param accountId - Account ID
   * @returns Promise with balance
   */
  async getBalance(
    accountId: string
  ): Promise<BankJoyApiResponse<BankJoyBalance>> {
    try {
      // Validate authentication
      if (!this.token || this.isTokenExpired()) {
        throw new Error('Not authenticated or token expired');
      }

      const response = await this.axiosInstance.get<BankJoyBalance>(
        `/balances/${accountId}`
      );

      return {
        success: true,
        data: response.data,
        requestId: response.headers['x-request-id'],
      };
    } catch (error) {
      return this.handleError<BankJoyBalance>(
        error as Error,
        'GET',
        `/balances/${accountId}`
      );
    }
  }

  /**
   * Get all balances
   *
   * @returns Promise with balances array
   */
  async getBalances(): Promise<BankJoyApiResponse<BankJoyBalance[]>> {
    try {
      // Validate authentication
      if (!this.token || this.isTokenExpired()) {
        throw new Error('Not authenticated or token expired');
      }

      const response = await this.axiosInstance.get<BankJoyBalance[]>(
        '/balances'
      );

      return {
        success: true,
        data: response.data,
        requestId: response.headers['x-request-id'],
      };
    } catch (error) {
      return this.handleError<BankJoyBalance[]>(
        error as Error,
        'GET',
        '/balances'
      );
    }
  }

  /**
   * Get account by ID
   *
   * @param accountId - Account ID
   * @returns Promise with account
   */
  async getAccount(
    accountId: string
  ): Promise<BankJoyApiResponse<BankJoyAccount>> {
    try {
      // Validate authentication
      if (!this.token || this.isTokenExpired()) {
        throw new Error('Not authenticated or token expired');
      }

      const response = await this.axiosInstance.get<BankJoyAccount>(
        `/accounts/${accountId}`
      );

      return {
        success: true,
        data: response.data,
        requestId: response.headers['x-request-id'],
      };
    } catch (error) {
      return this.handleError<BankJoyAccount>(
        error as Error,
        'GET',
        `/accounts/${accountId}`
      );
    }
  }

  /**
   * Get all accounts
   *
   * @returns Promise with accounts array
   */
  async getAccounts(): Promise<BankJoyApiResponse<BankJoyAccount[]>> {
    try {
      // Validate authentication
      if (!this.token || this.isTokenExpired()) {
        throw new Error('Not authenticated or token expired');
      }

      const response = await this.axiosInstance.get<BankJoyAccount[]>(
        '/accounts'
      );

      return {
        success: true,
        data: response.data,
        requestId: response.headers['x-request-id'],
      };
    } catch (error) {
      return this.handleError<BankJoyAccount[]>(
        error as Error,
        'GET',
        '/accounts'
      );
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Get default headers for requests
   */
  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ATTY-Financial/1.0.0',
      'X-Client-ID': process.env.NEXT_PUBLIC_CLIENT_ID || 'atty-financial',
      'X-Client-Version': process.env.NEXT_PUBLIC_CLIENT_VERSION || '1.0.0',
    };

    if (this.token) {
      headers['Authorization'] = `${this.token.type} ${this.token.token}`;
    }

    return headers;
  }

  /**
   * Setup request interceptor
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add authentication token
        if (this.token) {
          config.headers = {
            ...config.headers,
            'Authorization': `${this.token.type} ${this.token.token}`,
          };
        }

        // Check token expiration
        if (this.token && this.isTokenExpired()) {
          console.warn('BankJoy token expired, refreshing...');
          await this.refreshToken();
        }

        // Rate limiting check
        if (this.config.rateLimit) {
          await this.checkRateLimit();
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor
   */
  private setupResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Update last request time
        this.lastRequestTime = Date.now();

        return response;
      },
      (error) => {
        console.error('Response interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handle API errors with retry logic
   */
  private handleError<T>(
    error: Error,
    method: string,
    url: string
  ): BankJoyApiResponse<T> {
    const axiosError = error as any;

    // Check if error is network error
    const isNetworkError = !axiosError.response && axiosError.code === 'ECONNABORTED';

    // Check if error is 429 (too many requests)
    const isRateLimitError = axiosError.response?.status === STATUS_CODES.TOO_MANY_REQUESTS;

    // Check if error is 401 (unauthorized)
    const isUnauthorizedError = axiosError.response?.status === STATUS_CODES.UNAUTHORIZED;

    // Check if error is 403 (forbidden)
    const isForbiddenError = axiosError.response?.status === STATUS_CODES.FORBIDDEN;

    // Log error
    console.error(`BankJoy API error: ${method} ${url}`, error);

    // Handle unauthorized error
    if (isUnauthorizedError) {
      return {
        success: false,
        data: null,
        error: {
          status: STATUS_CODES.UNAUTHORIZED,
          message: 'Unauthorized - Invalid or expired token',
          code: 'UNAUTHORIZED',
          timestamp: Date.now(),
        },
      } as BankJoyApiResponse<T>;
    }

    // Handle forbidden error
    if (isForbiddenError) {
      return {
        success: false,
        data: null,
        error: {
          status: STATUS_CODES.FORBIDDEN,
          message: 'Forbidden - Insufficient permissions',
          code: 'FORBIDDEN',
          timestamp: Date.now(),
        },
      } as BankJoyApiResponse<T>;
    }

    // Handle rate limit error
    if (isRateLimitError && this.config.rateLimit) {
      this.rateLimitDelay = DEFAULT_RETRY_DELAY;

      return {
        success: false,
        data: null,
        error: {
          status: STATUS_CODES.TOO_MANY_REQUESTS,
          message: 'Too many requests - Please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          timestamp: Date.now(),
        },
      } as BankJoyApiResponse<T>;
    }

    // Handle network error with retry
    if (isNetworkError && this.config.retry) {
      // Network errors are handled by axios retry logic
      return {
        success: false,
        data: null,
        error: {
          status: 0,
          message: 'Network error - Please check your connection',
          code: 'NETWORK_ERROR',
          timestamp: Date.now(),
        },
      } as BankJoyApiResponse<T>;
    }

    // Handle other errors
    const apiError: BankJoyApiError = {
      status: axiosError.response?.status || 0,
      message: axiosError.response?.data?.message || axiosError.message || 'Unknown error',
      code: axiosError.response?.data?.code || 'UNKNOWN_ERROR',
      requestId: axiosError.response?.headers?.['x-request-id'],
      timestamp: Date.now(),
    };

    return {
      success: false,
      data: null,
      error: apiError,
      requestId: apiError.requestId,
    } as BankJoyApiResponse<T>;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    if (this.rateLimitDelay > 0) {
      console.warn(`Rate limit delay: ${this.rateLimitDelay}ms`);
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
      this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 60000); // Exponential backoff, max 60 seconds
    }
  }

  /**
   * Reset rate limit delay
   */
  resetRateLimit(): void {
    this.rateLimitDelay = 0;
  }

  /**
   * Get Axios instance for direct use
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Get client configuration
   */
  getConfig(): BankJoyClientConfig {
    return this.config;
  }
}

// ============================================
// Singleton Instance
// ============================================

let bankJoyClientInstance: BankJoyClient | null = null;

/**
 * Get BankJoy client singleton instance
 *
 * @param config - Client configuration
 * @returns BankJoy client instance
 */
export function getBankJoyClient(config?: BankJoyClientConfig): BankJoyClient {
  if (!bankJoyClientInstance && config) {
    bankJoyClientInstance = new BankJoyClient(config);
  } else if (!bankJoyClientInstance) {
    // Default configuration
    bankJoyClientInstance = new BankJoyClient({
      apiKey: process.env.NEXT_PUBLIC_BANKJOY_API_KEY || '',
    });
  }

  return bankJoyClientInstance;
}

/**
 * Reset BankJoy client singleton (for testing)
 */
export function resetBankJoyClient(): void {
  bankJoyClientInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  BankJoyClient,
  getBankJoyClient,
  resetBankJoyClient,
  type BankJoyClientConfig,
  type BankJoyAuthToken,
  type BankJoyApiError,
  type BankJoyApiResponse,
  type BankJoyTransaction,
  type BankJoyBalance,
  type BankJoyAccount,
  type BankJoyTransactionQuery,
};
