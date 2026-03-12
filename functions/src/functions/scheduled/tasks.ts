/**
 * Scheduled Tasks Functions
 *
 * Daily, weekly, and monthly tasks for ATTY Financial.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Calculate daily interest for all active matters
 *
 * Runs daily at midnight to calculate interest for the previous day
 */
export const calculateDailyInterest = functions.pubsub
  .schedule('0 0 * * *')  // Daily at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Starting daily interest calculation...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active matters
      const snapshot = await db
        .collection('matters')
        .where('status', '==', 'Active')
        .get();

      const batch = db.batch();
      let mattersProcessed = 0;

      snapshot.forEach((doc) => {
        const matterData = doc.data();
        const matterRef = doc.ref;

        // Skip if no principal balance
        if (!matterData.principalBalance || matterData.principalBalance <= 0) {
          return;
        }

        // Calculate interest for yesterday
        const interestRate = matterData.interestRate || 0;
        const dailyInterest = matterData.principalBalance * (interestRate / 365 / 100);

        // Update matter with daily interest
        batch.update(matterRef, {
          totalInterestAccrued: admin.firestore.FieldValue.increment(dailyInterest),
          totalOwed: admin.firestore.FieldValue.increment(dailyInterest),
          lastInterestCalculation: admin.firestore.FieldValue.serverTimestamp(),
        });

        mattersProcessed++;
      });

      // Execute batch updates
      if (mattersProcessed > 0) {
        await batch.commit();
        console.log(`Calculated interest for ${mattersProcessed} matters`);
      }

      // Log task completion
      await db.collection('scheduledTasks').add({
        task: 'calculateDailyInterest',
        status: 'completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        mattersProcessed,
        date: yesterday.toISOString(),
      });

      console.log('Daily interest calculation completed successfully');

      return null;
    } catch (error) {
      console.error('Error in calculateDailyInterest:', error);

      // Log error
      await db.collection('scheduledTasks').add({
        task: 'calculateDailyInterest',
        status: 'failed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  });

/**
 * Send daily matter alerts
 *
 * Runs daily at 9 AM to check for matters that need attention
 */
export const sendDailyAlerts = functions.pubsub
  .schedule('0 9 * * *')  // Daily at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Starting daily alert check...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check for matters with outstanding balances
      const outstandingSnapshot = await db
        .collection('matters')
        .where('status', '==', 'Active')
        .where('principalBalance', '>', 0)
        .get();

      const mattersWithBalance = outstandingSnapshot.size;

      // Check for matters that need attention
      const attentionSnapshot = await db
        .collection('matters')
        .where('status', '==', 'Active')
        .where('totalOwed', '>', 10000) // High value matters
        .get();

      const highValueMatters = attentionSnapshot.size;

      // Check for matters with recent activity
      const recentActivitySnapshot = await db
        .collection('matters')
        .where('status', '==', 'Active')
        .where('updatedAt', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        .get();

      const recentMatters = recentActivitySnapshot.size;

      // Create summary notification
      const summaryRef = db.collection('notifications').doc();
      await summaryRef.set({
        userId: 'admin', // Send to all admins
        firmId: 'all',
        type: 'info' as any,
        title: 'Daily Summary',
        message: `Daily summary: ${mattersWithBalance} matters with outstanding balance, ${highValueMatters} high-value matters, ${recentMatters} matters with recent activity.`,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: {
          mattersWithBalance,
          highValueMatters,
          recentMatters,
        },
      });

      // Log task completion
      await db.collection('scheduledTasks').add({
        task: 'sendDailyAlerts',
        status: 'completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        mattersWithBalance,
        highValueMatters,
        recentMatters,
      });

      console.log('Daily alerts check completed successfully');

      return null;
    } catch (error) {
      console.error('Error in sendDailyAlerts:', error);

      // Log error
      await db.collection('scheduledTasks').add({
        task: 'sendDailyAlerts',
        status: 'failed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  });

/**
 * Generate daily transaction summary
 *
 * Runs daily at 8 AM to generate summary reports
 */
export const generateDailySummary = functions.pubsub
  .schedule('0 8 * * *')  // Daily at 8 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Starting daily summary generation...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Get today's date string
      const todayStr = yesterday.toISOString().split('T')[0];

      // Get all transactions from yesterday
      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const transactionsSnapshot = await db
        .collection('transactions')
        .where('date', '>=', yesterdayStart.getTime())
        .where('date', '<=', yesterdayEnd.getTime())
        .get();

      // Calculate totals
      let totalDraws = 0;
      let totalPrincipalPayments = 0;
      let totalInterest = 0;

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'Draw') {
          totalDraws += data.amount;
        } else if (data.type === 'Principal Payment') {
          totalPrincipalPayments += data.amount;
        } else if (data.type === 'Interest Autodraft') {
          totalInterest += data.amount;
        }
      });

      // Create summary document
      const summaryRef = db.collection('dailySummaries').doc(todayStr);
      await summaryRef.set({
        date: yesterdayStr,
        transactionsCount: transactionsSnapshot.size,
        totalDraws,
        totalPrincipalPayments,
        totalInterest,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log task completion
      await db.collection('scheduledTasks').add({
        task: 'generateDailySummary',
        status: 'completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        date: yesterdayStr,
        transactionsCount: transactionsSnapshot.size,
        totalDraws,
        totalPrincipalPayments,
        totalInterest,
      });

      console.log('Daily summary generation completed successfully');

      return null;
    } catch (error) {
      console.error('Error in generateDailySummary:', error);

      // Log error
      await db.collection('scheduledTasks').add({
        task: 'generateDailySummary',
        status: 'failed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  });

/**
 * Cleanup old daily summaries
 *
 * Runs weekly to remove summaries older than 90 days
 */
export const cleanupOldDailySummaries = functions.pubsub
  .schedule('0 1 * * 0')  // Sundays at 1 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Starting cleanup of old daily summaries...');

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const snapshot = await db
        .collection('dailySummaries')
        .where('date', '<', ninetyDaysAgo.toISOString().split('T')[0])
        .limit(500)
        .get();

      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Cleaned up ${snapshot.size} old daily summaries`);

      return null;
    } catch (error) {
      console.error('Error in cleanupOldDailySummaries:', error);
      return null;
    }
  });
