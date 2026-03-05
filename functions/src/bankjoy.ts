/**
 * BankJoy Cloud Functions
 *
 * Firebase Cloud Functions for handling BankJoy webhooks.
 * Read-only access as per security requirements.
 *
 * @module functions/src/bankjoy
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getBankJoyClient } from '../../services/bankjoy/client';
import { getBankJoyWebhooksService } from '../../services/bankjoy/webhooks.service';
import { getBankFeedsService } from '../../services/firebase/bankFeeds.service';

// ============================================
// Initialize Firebase Admin
// ============================================

admin.initializeApp();

const db = admin.firestore();

// ============================================
// Cloud Functions
// ============================================

/**
 * Handle BankJoy webhook for transaction events
 *
 * HTTP endpoint: /webhook/bankjoy/transaction
 * @returns 200 OK
 */
export const handleBankJoyWebhook = functions.https.onRequest(
  async (req, res) => {
    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are allowed',
      });
      return;
    }

    try {
      // Verify webhook signature
      const signature = req.headers['x-bankjoy-signature'] as string;
      const timestamp = req.headers['x-bankjoy-timestamp'] as string;
      const eventType = req.headers['x-bankjoy-event-type'] as string;
      const eventId = req.headers['x-bankjoy-event-id'] as string;
      const requestId = req.headers['x-bankjoy-request-id'] as string;

      // Get webhook service
      const webhooksService = getBankJoyWebhooksService();

      // Verify signature
      const isValidSignature = webhooksService.verifySignature(
        JSON.stringify(req.body),
        signature,
        timestamp
      );

      if (!isValidSignature) {
        console.error('Invalid webhook signature for event:', eventType);
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid webhook signature',
          requestId,
        });
        return;
      }

      // Verify timestamp
      const isTimestampValid = webhooksService.verifyTimestamp(timestamp);

      if (!isTimestampValid) {
        console.error('Invalid webhook timestamp for event:', eventType);
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Webhook timestamp is too old or in the future',
          requestId,
        });
        return;
      }

      // Determine event type
      switch (eventType) {
        case 'transaction.created':
        case 'transaction.updated':
        case 'transaction.cleared':
        case 'transaction.reversed':
          await processTransactionWebhook(req.body, eventId, requestId);
          break;

        case 'balance.updated':
          await processBalanceWebhook(req.body, eventId, requestId);
          break;

        case 'account.created':
        case 'account.updated':
        case 'account.closed':
          await processAccountWebhook(req.body, eventId, requestId);
          break;

        default:
          console.error('Unknown webhook event type:', eventType);
          res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: `Unknown event type: ${eventType}`,
            requestId,
          });
          return;
      }

      // Return success response
      res.status(200).json({
        success: true,
        eventId,
        requestId,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('Error processing BankJoy webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.headers['x-bankjoy-request-id'],
      });
    }
  }
);

/**
 * Sync BankJoy bank feed
 *
 * Scheduled function: /cron/bankjoy/sync-feed
 * @returns 200 OK
 */
export const syncBankJoyBankFeed = functions.https.onRequest(
  async (req, res) => {
    try {
      // Get BankJoy client
      const bankJoyClient = getBankJoyClient();

      // Get all accounts from BankJoy
      const accountsResponse = await bankJoyClient.getAccounts();

      if (!accountsResponse.success || !accountsResponse.data) {
        throw new Error(accountsResponse.error?.message || 'Failed to fetch BankJoy accounts');
      }

      const accounts = accountsResponse.data;

      // Get bank feeds service
      const bankFeedsService = getBankFeedsService();

      // Process each account
      for (const account of accounts) {
        // Create or update bank feed record
        const bankFeed = {
          bankJoyAccountId: account.id,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          accountName: account.accountName,
          balance: account.balance,
          availableBalance: account.availableBalance,
          currency: account.currency,
          status: account.status,
          institution: account.institution,
          bankJoyBankId: account.bankId,
          accountHolder: account.accountHolder,
          lastActivityAt: account.lastActivityAt,
          syncStatus: 'syncing',
          lastSyncedAt: new Date().toISOString(),
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        };

        await bankFeedsService.upsertBankFeed(account.id, bankFeed);

        console.log(`Synced bank feed for account ${account.id}`);
      }

      res.status(200).json({
        success: true,
        message: 'BankJoy bank feed sync completed',
        accountsProcessed: accounts.length,
      });
    } catch (error) {
      console.error('Error syncing BankJoy bank feed:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Reconcile BankJoy transactions
 *
 * Scheduled function: /cron/bankjoy/reconcile-transactions
 * @returns 200 OK
 */
export const reconcileBankJoyTransactions = functions.https.onRequest(
  async (req, res) => {
    try {
      // Get BankJoy client
      const bankJoyClient = getBankJoyClient();

      // Get bank feeds service
      const bankFeedsService = getBankFeedsService();

      // Get all bank feeds
      const bankFeedsResult = await bankFeedsService.getAllBankFeeds();

      if (!bankFeedsResult.success || !bankFeedsResult.data) {
        throw new Error(bankFeedsResult.error?.message || 'Failed to fetch bank feeds');
      }

      const bankFeeds = bankFeedsResult.data;

      let reconciledCount = 0;
      let discrepancyCount = 0;

      // Process each bank feed
      for (const bankFeed of bankFeeds) {
        // Fetch recent transactions for this account
        const transactionsResult = await bankJoyClient.getTransactions({
          accountId: bankFeed.bankJoyAccountId,
          page: 1,
          pageSize: 100,
          sortBy: 'transactionDate',
          sortOrder: 'desc',
        });

        if (!transactionsResult.success || !transactionsResult.data) {
          console.error(`Failed to fetch transactions for account ${bankFeed.bankJoyAccountId}`);
          continue;
        }

        const transactions = transactionsResult.data;

        // Check for balance discrepancies
        const hasDiscrepancy = Math.abs(bankFeed.balance - transactions[0]?.balance || 0) > 0.01;

        if (hasDiscrepancy) {
          discrepancyCount++;

          // Update bank feed with discrepancy flag
          await bankFeedsService.updateBankFeed(bankFeed.id, {
            discrepancyDetected: true,
            discrepancyAmount: bankFeed.balance - (transactions[0]?.balance || 0),
            discrepancyDetectedAt: new Date().toISOString(),
          });

          console.warn(`Balance discrepancy detected for account ${bankFeed.bankJoyAccountId}`);
        } else {
          reconciledCount++;

          // Update bank feed with reconciled flag
          await bankFeedsService.updateBankFeed(bankFeed.id, {
            syncStatus: 'reconciled',
            lastReconciledAt: new Date().toISOString(),
          });

          console.log(`Reconciled transactions for account ${bankFeed.bankJoyAccountId}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'BankJoy transactions reconciled successfully',
        bankFeedsProcessed: bankFeeds.length,
        reconciledCount,
        discrepancyCount,
      });
    } catch (error) {
      console.error('Error reconciling BankJoy transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Create or update bank feed webhook
 *
 * HTTP endpoint: /webhook/bankjoy/create-bank-feed
 * @returns 200 OK
 */
export const createBankJoyBankFeed = functions.https.onRequest(
  async (req, res) => {
    // Validate request method
    if (req.method !== 'POST') {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: 'Only POST requests are allowed',
      });
      return;
    }

    try {
      const { bankJoyAccountId, accountNumber, accountType, accountName } = req.body;

      if (!bankJoyAccountId || !accountNumber) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'bankJoyAccountId and accountNumber are required',
        });
        return;
      }

      // Get BankJoy client
      const bankJoyClient = getBankJoyClient();

      // Fetch account details from BankJoy
      const accountResult = await bankJoyClient.getAccount(bankJoyAccountId);

      if (!accountResult.success || !accountResult.data) {
        throw new Error(accountResult.error?.message || 'Failed to fetch BankJoy account');
      }

      const account = accountResult.data;

      // Create or update bank feed record
      const bankFeedsService = getBankFeedsService();
      const bankFeed = {
        bankJoyAccountId: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        accountName: account.accountName,
        balance: account.balance,
        availableBalance: account.availableBalance,
        currency: account.currency,
        status: account.status,
        institution: account.institution,
        bankJoyBankId: account.bankId,
        accountHolder: account.accountHolder,
        lastActivityAt: account.lastActivityAt,
        syncStatus: 'active',
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      };

      await bankFeedsService.upsertBankFeed(account.id, bankFeed);

      res.status(200).json({
        success: true,
        message: 'BankJoy bank feed created/updated successfully',
        bankFeedId: account.id,
      });
    } catch (error) {
      console.error('Error creating BankJoy bank feed:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// ============================================
// Helper Functions
// ============================================

/**
 * Process transaction webhook
 */
async function processTransactionWebhook(
  payload: any,
  eventId: string,
  requestId: string
): Promise<void> {
  console.log('Processing transaction webhook:', { eventId, requestId });

  const bankFeedsService = getBankFeedsService();

  // Create or update transaction webhook record
  const transactionWebhook = {
    webhookId: eventId,
    requestId,
    transactionId: payload.data.transactionId,
    referenceNumber: payload.data.referenceNumber,
    transactionDate: payload.data.transactionDate,
    amount: payload.data.amount,
    currency: payload.data.currency,
    type: payload.data.type,
    counterparty: payload.data.counterparty,
    description: payload.data.description,
    accountNumber: payload.data.accountNumber,
    accountType: payload.data.accountType,
    accountName: payload.data.accountName,
    balance: payload.data.balance,
    runningBalance: payload.data.runningBalance,
    category: payload.data.category,
    status: payload.data.status,
    bankJoyTransactionId: payload.id,
    createdAt: new Date().toISOString(),
  };

  await bankFeedsService.createTransactionWebhook(transactionWebhook);

  console.log('Transaction webhook processed:', eventId);
}

/**
 * Process balance webhook
 */
async function processBalanceWebhook(
  payload: any,
  eventId: string,
  requestId: string
): Promise<void> {
  console.log('Processing balance webhook:', { eventId, requestId });

  const bankFeedsService = getBankFeedsService();

  // Update bank feed with new balance
  await bankFeedsService.updateBankFeedBalance(
    payload.data.accountId,
    payload.data.balance,
    payload.data.availableBalance
  );

  console.log('Balance webhook processed:', eventId);
}

/**
 * Process account webhook
 */
async function processAccountWebhook(
  payload: any,
  eventId: string,
  requestId: string
): Promise<void> {
  console.log('Processing account webhook:', { eventId, requestId });

  const bankFeedsService = getBankFeedsService();

  // Update bank feed with account status
  await bankFeedsService.updateBankFeedAccountStatus(
    payload.data.accountId,
    payload.data.status
  );

  console.log('Account webhook processed:', eventId);
}
