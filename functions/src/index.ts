/**
 * Firebase Cloud Functions for ATTY Financial
 *
 * Functions include:
 * - Audit logging triggers
 * - Document triggers for data consistency
 * - Role management
 * - Scheduled tasks
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================================
// Audit Logging Functions
// ============================================

/**
 * Audit log trigger for users collection
 */
export const onUserWrite = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const { userId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Skip if this is an audit log write (avoid infinite loop)
    if (!after || (after.role === 'System' && context.resource.name.includes('auditLogs'))) {
      return null;
    }

    const auditData = {
      userId: after ? context.auth?.uid : (before?.createdBy || 'system'),
      userName: after?.name || before?.name || 'Unknown',
      userEmail: after?.email || before?.email,
      action: change.before.exists ? (change.after.exists ? 'update' : 'delete') : 'create',
      collection: 'users',
      documentId: userId,
      timestamp: Date.now(),
      changes: {
        before: before,
        after: after,
      },
      ipAddress: context.rawRequest?.ip,
      userAgent: context.rawRequest?.headers?.['user-agent'],
      firmId: after?.firmId || before?.firmId,
    };

    return db.collection('auditLogs').add(auditData);
  });

/**
 * Audit log trigger for firms collection
 */
export const onFirmWrite = functions.firestore
  .document('firms/{firmId}')
  .onWrite(async (change, context) => {
    const { firmId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    const auditData = {
      userId: context.auth?.uid || 'system',
      userName: 'System',
      collection: 'firms',
      documentId: firmId,
      action: change.before.exists ? (change.after.exists ? 'update' : 'delete') : 'create',
      timestamp: Date.now(),
      changes: {
        before: before,
        after: after,
      },
      firmId,
    };

    return db.collection('auditLogs').add(auditData);
  });

/**
 * Audit log trigger for matters collection
 */
export const onMatterWrite = functions.firestore
  .document('matters/{matterId}')
  .onWrite(async (change, context) => {
    const { matterId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    const auditData = {
      userId: context.auth?.uid || 'system',
      userName: 'System',
      collection: 'matters',
      documentId: matterId,
      action: change.before.exists ? (change.after.exists ? 'update' : 'delete') : 'create',
      timestamp: Date.now(),
      changes: {
        before: before,
        after: after,
      },
      firmId: after?.firmId || before?.firmId,
    };

    return db.collection('auditLogs').add(auditData);
  });

/**
 * Audit log trigger for transactions collection
 */
export const onTransactionWrite = functions.firestore
  .document('transactions/{transactionId}')
  .onWrite(async (change, context) => {
    const { transactionId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    const auditData = {
      userId: context.auth?.uid || 'system',
      userName: 'System',
      collection: 'transactions',
      documentId: transactionId,
      action: change.before.exists ? (change.after.exists ? 'update' : 'delete') : 'create',
      timestamp: Date.now(),
      changes: {
        before: before,
        after: after,
      },
      firmId: after?.firmId || before?.firmId,
    };

    return db.collection('auditLogs').add(auditData);
  });

// ============================================
// Data Consistency Functions
// ============================================

/**
 * Update user count when firm members change
 */
export const onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const { firmId } = userData;

    if (!firmId) return null;

    const firmRef = db.collection('firms').doc(firmId);
    await firmRef.update({
      'memberCount': admin.firestore.FieldValue.increment(1),
    });

    return null;
  });

/**
 * Update matter count when matters change
 */
export const onMatterCreate = functions.firestore
  .document('matters/{matterId}')
  .onCreate(async (snap, context) => {
    const matterData = snap.data();
    const { firmId } = matterData;

    if (!firmId) return null;

    const firmRef = db.collection('firms').doc(firmId);
    await firmRef.update({
      'matterCount': admin.firestore.FieldValue.increment(1),
    });

    return null;
  });

/**
 * Check for matters that need alerts (closed with balance)
 */
export const checkMatterAlerts = functions.pubsub
  .schedule('0 9 * * *')  // Daily at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const thresholdDays = 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    const snapshot = await db
      .collection('matters')
      .where('status', '==', 'Closed')
      .where('closeDate', '<', thresholdDate.getTime())
      .where('principalBalance', '>', 0)
      .get();

    const batch = db.batch();

    snapshot.forEach(doc => {
      const matterRef = doc.ref;
      const matterData = doc.data();
      const daysSinceClosure = Math.floor(
        (Date.now() - matterData.closeDate) / (1000 * 60 * 60 * 24)
      );

      // Create notification for firm admins
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: matterData.assignedAttorneyId,
        firmId: matterData.firmId,
        type: 'matter_alert',
        title: 'Matter Alert',
        message: `Matter ${matterData.matterNumber} has been closed for ${daysSinceClosure} days with outstanding balance of $${matterData.principalBalance.toFixed(2)}`,
        status: 'unread',
        priority: daysSinceClosure >= 30 ? 'high' : 'normal',
        relatedMatterId: doc.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      });
    });

    await batch.commit();

    return null;
  });

// ============================================
// Role Management Functions
// ============================================

/**
 * Ensure users can only be created within their firm
 */
export const onUserBeforeCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const authUser = context.auth;

    if (!authUser) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create users'
      );
    }

    // If not admin, verify the new user is in the same firm
    if (userData.role !== 'Admin') {
      const creatorDoc = await db.collection('users').doc(authUser.uid).get();
      const creatorData = creatorDoc.data();

      if (!creatorData || creatorData.firmId !== userData.firmId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Users can only create users within their firm'
        );
      }
    }

    return null;
  });

// ============================================
// HTTP Functions
// ============================================

/**
 * Health check function
 */
export const healthCheck = functions.https.onRequest(async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    project: process.env.GCP_PROJECT || 'atty-financial-8cb16',
  });
});

/**
 * Get user role and permissions
 */
export const getUserPermissions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User not found'
    );
  }

  const userData = userDoc.data();

  return {
    userId,
    role: userData.role,
    firmId: userData.firmId,
    permissions: userData.permissions,
    isActive: userData.isActive,
  };
});

// ============================================
// Scheduled Tasks
// ============================================

/**
 * Cleanup old audit logs (older than 1 year)
 */
export const cleanupOldAuditLogs = functions.pubsub
  .schedule('0 2 * * 0')  // Sundays at 2 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);

    const snapshot = await db
      .collection('auditLogs')
      .where('timestamp', '<', oneYearAgo)
      .limit(500)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return null;
  });

/**
 * Cleanup old notifications (older than 30 days and read)
 */
export const cleanupOldNotifications = functions.pubsub
  .schedule('0 3 * * *')  // Daily at 3 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const snapshot = await db
      .collection('notifications')
      .where('status', '==', 'read')
      .where('createdAt', '<', thirtyDaysAgo)
      .limit(500)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return null;
  });
