/**
 * Transaction Lifecycle Functions
 *
 * Functions that handle transaction creation and allocation
 * in the ATTY Financial system.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Process transaction creation
 *
 * Validates transaction data, creates initial allocations, and updates matter totals
 */
export const onTransactionCreate = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    try {
      const transactionData = snap.data();
      const { transactionId } = context.params;

      // Validate required fields
      const errors: string[] = [];

      if (!transactionData.matterId) {
        errors.push('Matter ID is required');
      }

      if (!transactionData.amount || transactionData.amount <= 0) {
        errors.push('Amount must be greater than 0');
      }

      if (!transactionData.type) {
        errors.push('Transaction type is required');
      }

      if (errors.length > 0) {
        // Delete invalid transaction
        await snap.ref.delete();
        throw new functions.https.HttpsError(
          'invalid-argument',
          errors.join(', ')
        );
      }

      // Get matter data
      const matterDoc = await db.collection('matters').doc(transactionData.matterId).get();

      if (!matterDoc.exists) {
        await snap.ref.delete();
        throw new functions.https.HttpsError(
          'not-found',
          'Matter not found'
        );
      }

      const matterData = matterDoc.data();

      // Update matter totals based on transaction type
      const updates: Record<string, any> = {};

      switch (transactionData.type) {
        case 'Draw':
          updates.totalDraws = admin.firestore.FieldValue.increment(transactionData.amount);
          break;

        case 'Principal Payment':
          updates.totalPrincipalPayments = admin.firestore.FieldValue.increment(transactionData.amount);
          updates.principalBalance = admin.firestore.FieldValue.increment(-transactionData.amount);
          break;

        case 'Interest Autodraft':
          updates.totalInterestAccrued = admin.firestore.FieldValue.increment(transactionData.amount);
          updates.totalOwed = admin.firestore.FieldValue.increment(transactionData.amount);
          break;
      }

      // Update matter document
      await matterDoc.ref.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create allocation if needed
      if (transactionData.allocations && transactionData.allocations.length > 0) {
        for (const allocation of transactionData.allocations) {
          const allocationRef = db.collection('allocations').doc();
          await allocationRef.set({
            transactionId: transactionId,
            matterId: transactionData.matterId,
            matterNumber: matterData?.matterNumber,
            clientName: matterData?.clientName,
            allocatedAmount: allocation.amount,
            remainingAmount: allocation.amount,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Log transaction creation
      await db.collection('auditLogs').add({
        userId: context.auth?.uid || 'system',
        userName: context.auth?.token?.name || 'System',
        userEmail: context.auth?.token?.email || 'system',
        action: 'transaction_created',
        collection: 'transactions',
        documentId: transactionId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        changes: {
          before: null,
          after: transactionData,
        },
        firmId: transactionData.firmId,
      });

      return null;
    } catch (error) {
      console.error('Error in onTransactionCreate:', error);

      // Re-throw known errors
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // For other errors, delete the invalid document
      if (snap) {
        await snap.ref.delete();
      }

      return null;
    }
  });

/**
 * Process transaction update
 *
 * Handles status changes and updates allocations
 */
export const onTransactionUpdate = functions.firestore
  .document('transactions/{transactionId}')
  .onUpdate(async (change, context) => {
    try {
      const { transactionId } = context.params;
      const before = change.before.data();
      const after = change.after.data();

      // Skip if this is an update from this function (avoid infinite loop)
      if (after._updatedAtBy === 'onTransactionUpdate') {
        return null;
      }

      const changes: Record<string, any> = {};

      // Track status changes
      if (before.status !== after.status) {
        changes.status = {
          before: before.status,
          after: after.status,
        };

        // Create status change notification
        if (after.status === 'Allocated' || after.status === 'Assigned') {
          const notificationRef = db.collection('notifications').doc();
          await notificationRef.set({
            userId: after.assignedAttorneyId,
            firmId: after.firmId,
            type: 'info' as any,
            title: 'Transaction Updated',
            message: `Transaction ${transactionId} has been ${after.status.toLowerCase()}.`,
            status: 'unread',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            data: {
              transactionId: transactionId,
              status: after.status,
              amount: after.amount,
            },
          });
        }
      }

      // Track amount changes
      if (before.amount !== after.amount) {
        changes.amount = {
          before: before.amount,
          after: after.amount,
        };
      }

      // Track description changes
      if (before.description !== after.description) {
        changes.description = {
          before: before.description,
          after: after.description,
        };
      }

      // If there are changes, update the document
      if (Object.keys(changes).length > 0) {
        await change.after.ref.update({
          _updatedAtBy: 'onTransactionUpdate',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...changes,
        });
      }

      // Log transaction update
      await db.collection('auditLogs').add({
        userId: context.auth?.uid || 'system',
        userName: context.auth?.token?.name || 'System',
        userEmail: context.auth?.token?.email || 'system',
        action: 'transaction_updated',
        collection: 'transactions',
        documentId: transactionId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        changes: {
          before: before,
          after: after,
        },
        firmId: after.firmId,
      });

      return null;
    } catch (error) {
      console.error('Error in onTransactionUpdate:', error);
      return null;
    }
  });
