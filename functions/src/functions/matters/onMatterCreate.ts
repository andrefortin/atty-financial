/**
 * Matter Lifecycle Functions
 *
 * Functions that handle matter creation and validation
 * in the ATTY Financial system.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Validate and process matter creation
 *
 * Checks matter number uniqueness, validates data, and creates initial allocations
 */
export const onMatterCreate = functions.firestore
  .document('matters/{matterId}')
  .onCreate(async (snap, context) => {
    try {
      const matterData = snap.data();
      const { matterId } = context.params;

      // Validate required fields
      const errors: string[] = [];

      if (!matterData.clientName || matterData.clientName.trim() === '') {
        errors.push('Client name is required');
      }

      if (!matterData.matterNumber || matterData.matterNumber.trim() === '') {
        errors.push('Matter number is required');
      }

      if (errors.length > 0) {
        // Delete invalid matter
        await snap.ref.delete();
        throw new functions.https.HttpsError(
          'invalid-argument',
          errors.join(', ')
        );
      }

      // Check for duplicate matter number
      const matterNumber = matterData.matterNumber.trim().toLowerCase();
      const duplicateQuery = await db
        .collection('matters')
        .where('matterNumberLower', '==', matterNumber)
        .where('firmId', '==', matterData.firmId)
        .limit(1)
        .get();

      if (!duplicateQuery.empty) {
        // Delete duplicate matter
        await snap.ref.delete();
        throw new functions.https.HttpsError(
          'already-exists',
          `Matter number ${matterData.matterNumber} already exists`
        );
      }

      // Update document with lowercase matter number for case-insensitive search
      await snap.ref.update({
        matterNumberLower: matterNumber,
      });

      // Create initial allocation if principal balance is set
      if (matterData.principal && matterData.principal > 0) {
        const allocationRef = db.collection('allocations').doc();
        await allocationRef.set({
          matterId: snap.id,
          matterNumber: matterData.matterNumber,
          clientName: matterData.clientName,
          allocatedAmount: matterData.principal,
          remainingAmount: matterData.principal,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Log matter creation
      await db.collection('auditLogs').add({
        userId: context.auth?.uid || 'system',
        userName: context.auth?.token?.name || 'System',
        userEmail: context.auth?.token?.email || 'system',
        action: 'matter_created',
        collection: 'matters',
        documentId: matterId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        changes: {
          before: null,
          after: matterData,
        },
        firmId: matterData.firmId,
      });

      return null;
    } catch (error) {
      console.error('Error in onMatterCreate:', error);

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
 * Process matter update
 *
 * Updates matter calculations and creates audit logs
 */
export const onMatterUpdate = functions.firestore
  .document('matters/{matterId}')
  .onUpdate(async (change, context) => {
    try {
      const { matterId } = context.params;
      const before = change.before.data();
      const after = change.after.data();

      // Skip if this is an update from this function (avoid infinite loop)
      if (after._updatedAtBy === 'onMatterUpdate') {
        return null;
      }

      const changes: Record<string, any> = {};

      // Track status changes
      if (before.status !== after.status) {
        changes.status = {
          before: before.status,
          after: after.status,
        };
      }

      // Track principal balance changes
      if (before.principal !== after.principal) {
        changes.principal = {
          before: before.principal,
          after: after.principal,
        };
      }

      // Track interest changes
      if (before.totalInterestAccrued !== after.totalInterestAccrued) {
        changes.totalInterestAccrued = {
          before: before.totalInterestAccrued,
          after: after.totalInterestAccrued,
        };
      }

      // Track total draws
      if (before.totalDraws !== after.totalDraws) {
        changes.totalDraws = {
          before: before.totalDraws,
          after: after.totalDraws,
        };
      }

      // Track total principal payments
      if (before.totalPrincipalPayments !== after.totalPrincipalPayments) {
        changes.totalPrincipalPayments = {
          before: before.totalPrincipalPayments,
          after: after.totalPrincipalPayments,
        };
      }

      // If there are changes, update the document
      if (Object.keys(changes).length > 0) {
        await change.after.ref.update({
          _updatedAtBy: 'onMatterUpdate',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...changes,
        });
      }

      // Log matter update
      await db.collection('auditLogs').add({
        userId: context.auth?.uid || 'system',
        userName: context.auth?.token?.name || 'System',
        userEmail: context.auth?.token?.email || 'system',
        action: 'matter_updated',
        collection: 'matters',
        documentId: matterId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        changes: {
          before: before,
          after: after,
        },
        firmId: after.firmId,
      });

      return null;
    } catch (error) {
      console.error('Error in onMatterUpdate:', error);
      return null;
    }
  });

/**
 * Process matter closure
 *
 * Creates closure notifications and updates firm statistics
 */
export const onMatterClose = functions.firestore
  .document('matters/{matterId}')
  .onUpdate(async (change, context) => {
    try {
      const { matterId } = context.params;
      const before = change.before.data();
      const after = change.after.data();

      // Check if status changed to Closed
      if (before.status !== 'Closed' && after.status === 'Closed') {
        const firmRef = db.collection('firms').doc(after.firmId);
        await firmRef.update({
          closedMatterCount: admin.firestore.FieldValue.increment(1),
        });

        // Create closure notification
        const notificationRef = db.collection('notifications').doc();
        await notificationRef.set({
          userId: after.assignedAttorneyId,
          firmId: after.firmId,
          type: 'info' as any,
          title: 'Matter Closed',
          message: `Matter ${after.matterNumber} (${after.clientName}) has been closed.`,
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            matterId: matterId,
            matterNumber: after.matterNumber,
            clientName: after.clientName,
            principalBalance: after.principalBalance,
          },
        });

        // Log closure
        await db.collection('auditLogs').add({
          userId: context.auth?.uid || 'system',
          userName: context.auth?.token?.name || 'System',
          userEmail: context.auth?.token?.email || 'system',
          action: 'matter_closed',
          collection: 'matters',
          documentId: matterId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          changes: {
            before: before,
            after: after,
          },
          firmId: after.firmId,
        });
      }

      return null;
    } catch (error) {
      console.error('Error in onMatterClose:', error);
      return null;
    }
  });
