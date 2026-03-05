/**
 * BankJoy Webhooks Service
 *
 * Handles BankJoy webhook events for transactions and balances.
 * Signature verification and event processing.
 *
 * @module services/bankjoy/webhooks.service
 */

import crypto from 'crypto';

// ============================================
// Types
// ============================================

/**
 * Webhook signature
 */
export interface WebhookSignature {
  /**
   * Timestamp
   */
  timestamp: string;

  /**
   * Token
   */
  token: string;

  /**
   * Signature (hex)
   */
  signature: string;
}

/**
 * Webhook headers
 */
export interface WebhookHeaders {
  /**
   * X-BankJoy-Signature header
   */
  'x-bankjoy-signature'?: string;

  /**
   * X-BankJoy-Timestamp header
   */
  'x-bankjoy-timestamp'?: string;

  /**
   * X-BankJoy-Token header
   */
  'x-bankjoy-token'?: string;

  /**
   * X-BankJoy-Event-Type header
   */
  'x-bankjoy-event-type'?: string;

  /**
   * X-BankJoy-Event-ID header
   */
  'x-bankjoy-event-id'?: string;

  /**
   * X-BankJoy-Request-ID header
   */
  'x-bankjoy-request-id'?: string;
}

/**
 * Webhook event types
 */
export type BankJoyWebhookEvent =
  | 'transaction.created'
  | 'transaction.updated'
  | 'transaction.cleared'
  | 'transaction.reversed'
  | 'balance.updated'
  | 'account.created'
  | 'account.updated'
  | 'account.closed';

/**
 * Transaction webhook payload
 */
export interface TransactionWebhookPayload {
  /**
   * Event type
   */
  event: BankJoyWebhookEvent;

  /**
   * Event ID
   */
  eventId: string;

  /**
   * Event timestamp
   */
  timestamp: string;

  /**
   * Request ID
   */
  requestId: string;

  /**
   * Transaction data
   */
  data: {
    /**
     * Transaction ID
     */
    transactionId: string;

    /**
     * Reference number
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
     * Currency
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
     * Reference (if available)
     */
    reference?: string;

    /**
     * Status
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
     * Bank ID (for multi-bank support)
     */
    bankId?: string;
  };

  /**
   * Webhook signature
   */
  signature: WebhookSignature;
}

/**
 * Balance webhook payload
 */
export interface BalanceWebhookPayload {
  /**
   * Event type
   */
  event: BankJoyWebhookEvent;

  /**
   * Event ID
   */
  eventId: string;

  /**
   * Event timestamp
   */
  timestamp: string;

  /**
   * Request ID
   */
  requestId: string;

  /**
   * Balance data
   */
  data: {
    /**
     * Balance ID
     */
    balanceId: string;

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
     * Available balance
     */
    availableBalance: number;

    /**
     * Pending transactions amount
     */
    pendingAmount: number;

    /**
     * Currency (default: USD)
     */
    currency: string;

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
     * Bank ID (for multi-bank support)
     */
    bankId?: string;
  };

  /**
   * Webhook signature
   */
  signature: WebhookSignature;
}

/**
 * Account webhook payload
 */
export interface AccountWebhookPayload {
  /**
   * Event type
   */
  event: BankJoyWebhookEvent;

  /**
   * Event ID
   */
  eventId: string;

  /**
   * Event timestamp
   */
  timestamp: string;

  /**
   * Request ID
   */
  requestId: string;

  /**
   * Account data
   */
  data: {
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
     * Available balance
     */
    availableBalance: number;

    /**
     * Currency (default: USD)
     */
    currency: string;

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
     * Account holder name
     */
    accountHolder?: string;

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
  };

  /**
   * Webhook signature
   */
  signature: WebhookSignature;
}

/**
 * Webhook event handler result
 */
export interface WebhookEventResult {
  /**
   * Success status
   */
  success: boolean;

  /**
   * Event ID
   */
  eventId: string;

  /**
   * Request ID
   */
  requestId: string;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Processed data (if successful)
   */
  processedData?: any;
}

/**
 * Webhook configuration
 */
export interface BankJoyWebhookConfig {
  /**
   * Webhook secret for signature verification
   */
  webhookSecret: string;

  /**
   * Webhook token for authentication
   */
  webhookToken?: string;

  /**
   * Whether to verify signatures
   * @default true
   */
  verifySignature?: boolean;

  /**
   * Whether to verify timestamp
   * @default true
   */
  verifyTimestamp?: boolean;

  /**
   * Timestamp tolerance in milliseconds
   * @default 300000 (5 minutes)
   */
  timestampTolerance?: number;

  /**
   * Logging function
   * @default console.log
   */
  onLog?: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;

  /**
   * Error handler
   * @default console.error
   */
  onError?: (error: Error, context?: any) => void;

  /**
   * Transaction webhook handler
   */
  onTransaction?: (
    event: BankJoyWebhookEvent,
    payload: TransactionWebhookPayload
  ) => Promise<WebhookEventResult>;

  /**
   * Balance webhook handler
   */
  onBalance?: (
    event: BankJoyWebhookEvent,
    payload: BalanceWebhookPayload
  ) => Promise<WebhookEventResult>;

  /**
   * Account webhook handler
   */
  onAccount?: (
    event: BankJoyWebhookEvent,
    payload: AccountWebhookPayload
  ) => Promise<WebhookEventResult>;
}

// ============================================
// Constants
// ============================================

const TIMESTAMP_TOLERANCE = 300000; // 5 minutes
const MAX_TIMESTAMP_DIFFERENCE = 600000; // 10 minutes

// ============================================
// BankJoy Webhooks Service
// ============================================

/**
 * BankJoy Webhooks Service
 *
 * Handles BankJoy webhook signature verification and event processing.
 */
export class BankJoyWebhooksService {
  private config: BankJoyWebhookConfig;

  constructor(config: BankJoyWebhookConfig) {
    this.config = {
      timestampTolerance: TIMESTAMP_TOLERANCE,
      verifySignature: true,
      verifyTimestamp: true,
      ...config,
    };
  }

  // ============================================
  // Signature Verification
  // ============================================

  /**
   * Verify webhook signature
   *
   * @param payload - Webhook payload (JSON string)
   * @param signature - Signature from X-BankJoy-Signature header
   * @param timestamp - Timestamp from X-BankJoy-Timestamp header
   * @returns Whether signature is valid
   */
  verifySignature(
    payload: string,
    signature: string,
    timestamp: string
  ): boolean {
    // Signature verification disabled
    if (!this.config.verifySignature) {
      this.config.onLog?.('info', 'Signature verification disabled');
      return true;
    }

    try {
      // Verify timestamp is not too old
      const eventTimestamp = Date.parse(timestamp);
      const now = Date.now();
      const timeDifference = now - eventTimestamp;

      if (timeDifference > MAX_TIMESTAMP_DIFFERENCE) {
        this.config.onLog?.('error', 'Timestamp too old for signature verification', {
          eventTimestamp,
          timeDifference,
          maxDifference: MAX_TIMESTAMP_DIFFERENCE,
        });
        return false;
      }

      // Check timestamp within tolerance
      if (this.config.verifyTimestamp) {
        if (timeDifference > this.config.timestampTolerance) {
          this.config.onLog?.('error', 'Timestamp outside tolerance', {
            timeDifference,
            tolerance: this.config.timestampTolerance,
          });
          return false;
        }
      }

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(timestamp + payload)
        .digest('hex');

      // Compare signatures
      const isValid = expectedSignature === signature.toLowerCase();

      if (!isValid) {
        this.config.onLog?.('error', 'Signature verification failed', {
          expected: expectedSignature,
          received: signature,
        });
      }

      return isValid;
    } catch (error) {
      this.config.onError?.(error as Error, {
        context: 'Signature verification',
        payload,
        signature,
        timestamp,
      });

      return false;
    }
  }

  /**
   * Verify webhook timestamp
   *
   * @param timestamp - Timestamp from X-BankJoy-Timestamp header
   * @returns Whether timestamp is valid
   */
  verifyTimestamp(timestamp: string): boolean {
    // Timestamp verification disabled
    if (!this.config.verifyTimestamp) {
      this.config.onLog?.('info', 'Timestamp verification disabled');
      return true;
    }

    try {
      const eventTimestamp = Date.parse(timestamp);
      const now = Date.now();
      const timeDifference = now - eventTimestamp;

      // Check timestamp is not in the future
      if (eventTimestamp > now + 1000) { // Allow 1 second clock skew
        this.config.onLog?.('error', 'Timestamp is in the future', {
          eventTimestamp,
          now,
        });
        return false;
      }

      // Check timestamp is not too old
      if (timeDifference > this.config.timestampTolerance) {
        this.config.onLog?.('error', 'Timestamp too old', {
          timeDifference,
          tolerance: this.config.timestampTolerance,
        });
        return false;
      }

      return true;
    } catch (error) {
      this.config.onError?.(error as Error, {
        context: 'Timestamp verification',
        timestamp,
      });

      return false;
    }
  }

  // ============================================
  // Event Processing
  // ============================================

  /**
   * Process transaction webhook event
   *
   * @param payload - Transaction webhook payload
   * @returns Event processing result
   */
  async processTransactionEvent(
    payload: TransactionWebhookPayload
  ): Promise<WebhookEventResult> {
    try {
      this.config.onLog?.('info', 'Processing transaction webhook event', {
        event: payload.event,
        eventId: payload.eventId,
        requestId: payload.requestId,
        transactionId: payload.data.transactionId,
        referenceNumber: payload.data.referenceNumber,
      });

      // Verify signature
      const isValid = this.verifySignature(
        JSON.stringify(payload.data),
        payload.signature.signature,
        payload.signature.timestamp
      );

      if (!isValid) {
        return {
          success: false,
          eventId: payload.eventId,
          requestId: payload.requestId,
          error: 'Invalid signature',
        };
      }

      // Verify timestamp
      const isTimestampValid = this.verifyTimestamp(payload.timestamp);

      if (!isTimestampValid) {
        return {
          success: false,
          eventId: payload.eventId,
          requestId: payload.requestId,
          error: 'Invalid timestamp',
        };
      }

      // Call transaction webhook handler
      if (this.config.onTransaction) {
        const result = await this.config.onTransaction(
          payload.event,
          payload
        );

        return {
          success: result.success,
          eventId: payload.eventId,
          requestId: payload.requestId,
          processedData: result.processedData,
          error: result.error,
        };
      }

      return {
        success: true,
        eventId: payload.eventId,
        requestId: payload.requestId,
        processedData: payload.data,
      };
    } catch (error) {
      this.config.onError?.(error as Error, {
        context: 'Transaction webhook event processing',
        payload,
      });

      return {
        success: false,
        eventId: payload.eventId,
        requestId: payload.requestId,
        error: error.message,
      };
    }
  }

  /**
   * Process balance webhook event
   *
   * @param payload - Balance webhook payload
   * @returns Event processing result
   */
  async processBalanceEvent(
    payload: BalanceWebhookPayload
  ): Promise<WebhookEventResult> {
    try {
      this.config.onLog?.('info', 'Processing balance webhook event', {
        event: payload.event,
        eventId: payload.eventId,
        requestId: payload.requestId,
        balanceId: payload.data.balanceId,
      });

      // Verify signature
      const isValid = this.verifySignature(
        JSON.stringify(payload.data),
        payload.signature.signature,
        payload.signature.timestamp
      );

      if (!isValid) {
        return {
          success: false,
          eventId: payload.eventId,
          requestId: payload.requestId,
          error: 'Invalid signature',
        };
      }

      // Verify timestamp
      const isTimestampValid = this.verifyTimestamp(payload.timestamp);

      if (!isTimestampValid) {
        return {
          success: false,
          eventId: payload.eventId,
          requestId: payload.requestId,
          error: 'Invalid timestamp',
        };
      }

      // Call balance webhook handler
      if (this.config.onBalance) {
        const result = await this.config.onBalance(
          payload.event,
          payload
        );

        return {
          success: result.success,
          eventId: payload.eventId,
          requestId: payload.requestId,
          processedData: result.processedData,
          error: result.error,
        };
      }

      return {
        success: true,
        eventId: payload.eventId,
        requestId: payload.requestId,
        processedData: payload.data,
      };
    } catch (error) {
      this.config.onError?.(error as Error, {
        context: 'Balance webhook event processing',
        payload,
      });

      return {
        success: false,
        eventId: payload.eventId,
        requestId: payload.requestId,
        error: error.message,
      };
    }
  }

  /**
   * Process account webhook event
   *
   * @param payload - Account webhook payload
   * @returns Event processing result
   */
  async processAccountEvent(
    payload: AccountWebhookPayload
  ): Promise<WebhookEventResult> {
    try {
      this.config.onLog?.('info', 'Processing account webhook event', {
        event: payload.event,
        eventId: payload.eventId,
        requestId: payload.requestId,
        accountId: payload.data.accountId,
        accountNumber: payload.data.accountNumber,
      });

      // Verify signature
      const isValid = this.verifySignature(
        JSON.stringify(payload.data),
        payload.signature.signature,
        payload.signature.timestamp
      );

      if (!isValid) {
        return {
          success: false,
          eventId: payload.eventId,
          requestId: payload.requestId,
          error: 'Invalid signature',
        };
      }

      // Verify timestamp
      const isTimestampValid = this.verifyTimestamp(payload.timestamp);

      if (!isTimestampValid) {
        return {
          success: false,
          eventId: payload.eventId,
          requestId: payload.requestId,
          error: 'Invalid timestamp',
        };
      }

      // Call account webhook handler
      if (this.config.onAccount) {
        const result = await this.config.onAccount(
          payload.event,
          payload
        );

        return {
          success: result.success,
          eventId: payload.eventId,
          requestId: payload.requestId,
          processedData: result.processedData,
          error: result.error,
        };
      }

      return {
        success: true,
        eventId: payload.eventId,
        requestId: payload.requestId,
        processedData: payload.data,
      };
    } catch (error) {
      this.config.onError?.(error as Error, {
        context: 'Account webhook event processing',
        payload,
      });

      return {
        success: false,
        eventId: payload.eventId,
        requestId: payload.requestId,
        error: error.message,
      };
    }
  }

  /**
   * Handle webhook request (for HTTP endpoints)
   *
   * @param event - Event type (transaction, balance, account)
   * @param payload - Webhook payload
   * @param headers - Webhook headers
   * @returns Promise with event processing result
   */
  async handleWebhookRequest(
    event: BankJoyWebhookEvent,
    payload: any,
    headers: WebhookHeaders
  ): Promise<WebhookEventResult> {
    try {
      // Determine event type and process
      switch (event) {
        case 'transaction.created':
        case 'transaction.updated':
        case 'transaction.cleared':
        case 'transaction.reversed':
          return this.processTransactionEvent(payload as TransactionWebhookPayload);

        case 'balance.updated':
          return this.processBalanceEvent(payload as BalanceWebhookPayload);

        case 'account.created':
        case 'account.updated':
        case 'account.closed':
          return this.processAccountEvent(payload as AccountWebhookPayload);

        default:
          this.config.onLog?.('error', 'Unknown event type', { event });
          return {
            success: false,
            eventId: payload.eventId,
            requestId: payload.requestId,
            error: 'Unknown event type',
          };
      }
    } catch (error) {
      this.config.onError?.(error as Error, {
        context: 'Webhook request handling',
        event,
        payload,
        headers,
      });

      return {
        success: false,
        eventId: payload.eventId,
        requestId: payload.requestId,
        error: error.message,
      };
    }
  }

  /**
   * Get webhook configuration
   */
  getConfig(): BankJoyWebhookConfig {
    return this.config;
  }

  /**
   * Update webhook configuration
   */
  updateConfig(updates: Partial<BankJoyWebhookConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

let bankJoyWebhooksServiceInstance: BankJoyWebhooksService | null = null;

/**
 * Get bankJoy webhooks service singleton instance
 */
export function getBankJoyWebhooksService(config?: BankJoyWebhookConfig): BankJoyWebhooksService {
  if (!bankJoyWebhooksServiceInstance && config) {
    bankJoyWebhooksServiceInstance = new BankJoyWebhooksService(config);
  }

  return bankJoyWebhooksServiceInstance;
}

/**
 * Reset bankJoy webhooks service singleton (for testing)
 */
export function resetBankJoyWebhooksService(): void {
  bankJoyWebhooksServiceInstance = null;
}

// ============================================
// Exports
// ============================================

export {
  BankJoyWebhooksService,
  getBankJoyWebhooksService,
  resetBankJoyWebhooksService,
  type BankJoyWebhookConfig,
  type WebhookSignature,
  type WebhookHeaders,
  type BankJoyWebhookEvent,
  type TransactionWebhookPayload,
  type BalanceWebhookPayload,
  type AccountWebhookPayload,
  type WebhookEventResult,
};
