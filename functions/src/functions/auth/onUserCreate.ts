/**
 * Auth Lifecycle Functions - User Onboarding
 *
 * Functions that handle user creation and onboarding
 * in the ATTY Financial system.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { NotificationType } from '../../../src/services/firebase/notifications.service';

const db = admin.firestore();

/**
 * User onboarding after successful authentication
 *
 * Creates initial user profile, firm assignment, and welcome notification
 */
export const onUserAfterCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Get user's custom claims (if any)
    const customClaims = user.customClaims || {};

    // Create user document in Firestore
    const userDoc = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: customClaims.role || 'User',
      firmId: customClaims.firmId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(user.uid).set(userDoc, { merge: true });

    // Send welcome notification if role is User
    if (userDoc.role === 'User') {
      const notificationRef = db.collection('notifications').doc();
      await notificationRef.set({
        userId: user.uid,
        type: 'info' as NotificationType,
        title: 'Welcome to ATTY Financial!',
        message: `Thank you for joining ATTY Financial. Your account has been created successfully.`,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          onboardingComplete: true,
        },
      });
    }

    // Log user creation in audit logs
    await db.collection('auditLogs').add({
      userId: user.uid,
      userName: user.displayName || user.email,
      userEmail: user.email,
      action: 'user_created',
      collection: 'users',
      documentId: user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      changes: {
        before: null,
        after: userDoc,
      },
      ipAddress: '',
      userAgent: '',
    });

    return null;
  } catch (error) {
    console.error('Error in onUserAfterCreate:', error);
    // Don't throw error - this could prevent user creation
    return null;
  }
});

/**
 * User after login
 *
 * Updates last login timestamp and tracks login activity
 */
export const onUserAfterLogin = functions.auth.user().onCreate(async (user) => {
  try {
    const userDocRef = db.collection('users').doc(user.uid);

    // Update last login
    await userDocRef.update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginIp: functions.config().client_ip || '',
    });

    // Log login activity
    await db.collection('auditLogs').add({
      userId: user.uid,
      userName: user.displayName || user.email,
      userEmail: user.email,
      action: 'user_login',
      collection: 'users',
      documentId: user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      changes: {
        before: null,
        after: {
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      ipAddress: functions.config().client_ip || '',
      userAgent: '',
    });

    return null;
  } catch (error) {
    console.error('Error in onUserAfterLogin:', error);
    return null;
  }
});

/**
 * User before delete
 *
 * Soft delete user and log the action
 */
export const onUserBeforeDelete = functions.auth.user().beforeDelete(async (user, context) => {
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();

    // Log user deletion
    await db.collection('auditLogs').add({
      userId: user.uid,
      userName: userData.displayName || userData.email,
      userEmail: userData.email,
      action: 'user_deleted',
      collection: 'users',
      documentId: user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      changes: {
        before: userData,
        after: null,
      },
      ipAddress: functions.config().client_ip || '',
      userAgent: '',
    });

    // Mark user as inactive instead of deleting
    await db.collection('users').doc(user.uid).update({
      isActive: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  } catch (error) {
    console.error('Error in onUserBeforeDelete:', error);
    return null;
  }
});

/**
 * User after password reset
 *
 * Logs password reset events
 */
export const onUserAfterPasswordReset = functions.auth.user().onCreate(async (user) => {
  try {
    // Log password reset
    await db.collection('auditLogs').add({
      userId: user.uid,
      userName: user.displayName || user.email,
      userEmail: user.email,
      action: 'password_reset',
      collection: 'users',
      documentId: user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      changes: {
        before: null,
        after: {
          lastPasswordChange: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      ipAddress: functions.config().client_ip || '',
      userAgent: '',
    });

    return null;
  } catch (error) {
    console.error('Error in onUserAfterPasswordReset:', error);
    return null;
  }
});
