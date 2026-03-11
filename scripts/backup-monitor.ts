/**
 * Backup Monitoring Scripts
 *
 * Real-time backup health monitoring, verification,
 * and alerting for ATTY Financial.
 *
 * @module scripts/backup-monitor
 */

// ============================================
// Imports
// ============================================

import { admin } from 'firebase-functions';

// ============================================
// Types
// ============================================

/**
 * Backup health status
 */
export interface BackupHealth {
  healthy: boolean;
  lastBackup: BackupMetadata | null;
  lastBackupAge: number | null; // in hours
  backupCount: number;
  failedBackups: BackupMetadata[];
  warningMessages: string[];
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  backupId: string;
  timestamp: admin.firestore.Timestamp;
  type: 'daily' | 'manual' | 'export';
  status: 'running' | 'success' | 'failed';
  collections: string[];
  totalDocuments: number;
  totalSize: number;
  duration?: number; // in seconds
  error?: string;
  verification?: BackupVerification;
}

/**
 * Backup verification
 */
export interface BackupVerification {
  status: 'pending' | 'running' | 'passed' | 'failed';
  countsMatch: boolean;
  hashesMatch: boolean;
  samplesMatch: boolean;
  crossRegionAccessible: boolean;
  details: {
    counts: Record<string, { expected: number; actual: number }>;
    hashes: Record<string, { total: number; matched: number; percentage: number }>;
    samples: Record<string, { total: number; matched: number; percentage: number }>;
  };
}

/**
 * Backup metrics
 */
export interface BackupMetrics {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  averageBackupDuration: number;
  averageBackupSize: number;
  lastBackupTimestamp: admin.firestore.Timestamp | null;
  lastSuccessfulBackupTimestamp: admin.firestore.Timestamp | null;
}

// ============================================
// Backup Health Monitoring
// ============================================

/**
 * Get backup health status
 */
export async function getBackupHealth(): Promise<BackupHealth> {
  const firestore = admin.firestore();

  // Get latest backup
  const latestBackupSnapshot = await firestore
    .collection('backups')
    .where('type', '==', 'daily')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  let lastBackup: BackupMetadata | null = null;
  let lastBackupAge: number | null = null;

  if (!latestBackupSnapshot.empty) {
    lastBackup = latestBackupSnapshot.docs[0].data() as BackupMetadata;
    const now = admin.firestore.Timestamp.now();
    lastBackupAge = calculateBackupAge(lastBackup.timestamp, now);
  }

  // Get total backup count
  const totalBackups = await firestore
    .collection('backups')
    .count();

  // Get failed backups from last 7 days
  const sevenDaysAgo = admin.firestore.Timestamp.now();
  const failedBackupsQuery = await firestore
    .collection('backups')
    .where('status', '==', 'failed')
    .where('timestamp', '>=', sevenDaysAgo)
    .get();

  const failedBackups = failedBackupsQuery.docs.map(doc => doc.data() as BackupMetadata);

  // Generate warning messages
  const warningMessages: string[] = [];

  if (lastBackupAge !== null && lastBackupAge > 24) {
    warningMessages.push(`Last backup is ${lastBackupAge.toFixed(2)} hours old`);
  }

  if (failedBackups.length > 3) {
    warningMessages.push(`${failedBackups.length} backups failed in the last 7 days`);
  }

  const healthy = lastBackupAge !== null && lastBackupAge < 24 && failedBackups.length === 0;

  return {
    healthy,
    lastBackup,
    lastBackupAge,
    backupCount: totalBackups,
    failedBackups,
    warningMessages,
  };
}

/**
 * Check backup health and alert if needed
 */
export async function checkBackupHealthAndAlert(): Promise<void> {
  const health = await getBackupHealth();

  console.log('Backup Health Status:', health);

  // Send alerts if not healthy
  if (!health.healthy) {
    await sendBackupAlert('unhealthy', health);
  }
}

/**
 * Calculate backup age in hours
 */
function calculateBackupAge(
  timestamp: admin.firestore.Timestamp,
  now: admin.firestore.Timestamp
): number {
  const ageMillis = now.toMillis() - timestamp.toMillis();
  const ageHours = ageMillis / (1000 * 60 * 60);
  return ageHours;
}

// ============================================
// Backup Metrics Collection

/**
 * Collect backup metrics
 */
export async function collectBackupMetrics(): Promise<BackupMetrics> {
  const firestore = admin.firestore();

  // Get total backups
  const totalBackups = await firestore.collection('backups').count();

  // Get successful backups
  const successfulBackups = await firestore
    .collection('backups')
    .where('status', '==', 'success')
    .count();

  // Get failed backups
  const failedBackups = await firestore
    .collection('backups')
    .where('status', '==', 'failed')
    .count();

  // Get average backup duration
  const durationSnapshot = await firestore
    .collection('backups')
    .where('status', '==', 'success')
    .where('duration', '>', 0)
    .get();

  let averageBackupDuration = 0;
  if (!durationSnapshot.empty) {
    const durations = durationSnapshot.docs.map(doc => doc.data().duration || 0);
    averageBackupDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  // Get average backup size
  const sizeSnapshot = await firestore
    .collection('backups')
    .where('status', '==', 'success')
    .get();

  let averageBackupSize = 0;
  if (!sizeSnapshot.empty) {
    const sizes = sizeSnapshot.docs.map(doc => doc.data().totalSize || 0);
    averageBackupSize = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
  }

  // Get last backup timestamp
  const lastBackupSnapshot = await firestore
    .collection('backups')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  let lastBackupTimestamp: admin.firestore.Timestamp | null = null;
  if (!lastBackupSnapshot.empty) {
    lastBackupTimestamp = lastBackupSnapshot.docs[0].data().timestamp;
  }

  // Get last successful backup timestamp
  const lastSuccessfulSnapshot = await firestore
    .collection('backups')
    .where('status', '==', 'success')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  let lastSuccessfulBackupTimestamp: admin.firestore.Timestamp | null = null;
  if (!lastSuccessfulSnapshot.empty) {
    lastSuccessfulBackupTimestamp = lastSuccessfulSnapshot.docs[0].data().timestamp;
  }

  return {
    totalBackups,
    successfulBackups,
    failedBackups,
    averageBackupDuration,
    averageBackupSize,
    lastBackupTimestamp,
    lastSuccessfulBackupTimestamp,
  };
}

/**
 * Record backup metrics
 */
export async function recordBackupMetrics(backupId: string): Promise<void> {
  const metrics = await collectBackupMetrics();

  const firestore = admin.firestore();

  await firestore.collection('backup-metrics').add({
    backupId,
    ...metrics,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ============================================
// Backup Verification

/**
 * Verify backup integrity
 */
export async function verifyBackup(backupId: string): Promise<BackupVerification> {
  const firestore = admin.firestore();
  const storage = admin.storage();

  // Get backup metadata
  const backupDoc = await firestore.collection('backups').doc(backupId).get();
  if (!backupDoc.exists) {
    throw new Error('Backup not found');
  }

  const backup = backupDoc.data() as BackupMetadata;

  // Initialize verification status
  const verification: BackupVerification = {
    status: 'running',
    countsMatch: false,
    hashesMatch: false,
    samplesMatch: false,
    crossRegionAccessible: false,
    details: {
      counts: {},
      hashes: {},
      samples: {},
    },
  };

  try {
    // Update verification status to running
    await firestore.collection('backups').doc(backupId).update({
      verification,
      verificationStatus: 'running',
    });

    // 1. Verify document counts
    verification.details.counts = await verifyDocumentCounts(backup, firestore);

    // 2. Verify document hashes (sample 100 documents per collection)
    verification.details.hashes = await verifyDocumentHashes(backup, firestore, storage);

    // 3. Verify random samples
    verification.details.samples = await verifyDocumentSamples(backup, firestore, storage);

    // 4. Verify cross-region accessibility
    verification.crossRegionAccessible = await verifyCrossRegionAccessibility(backup, storage);

    // Determine overall status
    const allPassed =
      verification.details.counts.match &&
      verification.details.hashes.match &&
      verification.details.samples.match;

    verification.status = allPassed ? 'passed' : 'failed';

    // Update backup metadata
    await firestore.collection('backups').doc(backupId).update({
      verification,
      verificationStatus: verification.status,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Backup ${backupId} verification: ${verification.status}`);

    return verification;
  } catch (error) {
    const err = error as Error;
    console.error('Backup verification failed:', err);

    verification.status = 'failed';

    // Update backup metadata with error
    await firestore.collection('backups').doc(backupId).update({
      verification,
      verificationStatus: 'failed',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationError: err.message,
    });

    return verification;
  }
}

/**
 * Verify document counts match
 */
async function verifyDocumentCounts(
  backup: BackupMetadata,
  firestore: admin.firestore.App
): Promise<BackupVerification['details']['counts']> {
  const counts: BackupVerification['details']['counts'] = {};
  let allMatch = true;

  for (const collectionName of backup.collections) {
    // Get count from backup
    const backupCount = backup.totalDocuments;

    // Get count from live database
    const liveCount = await firestore.collection(collectionName).count();

    counts[collectionName] = {
      expected: backupCount,
      actual: liveCount,
      match: backupCount === liveCount,
    };

    if (backupCount !== liveCount) {
      allMatch = false;
    }
  }

  return {
    ...counts,
    match: allMatch,
  };
}

/**
 * Verify document hashes (sample)
 */
async function verifyDocumentHashes(
  backup: BackupMetadata,
  firestore: admin.firestore.App,
  storage: admin.storage.Storage
): Promise<BackupVerification['details']['hashes']> {
  const hashes: BackupVerification['details']['hashes'] = {};
  let allPassed = true;

  for (const collectionName of backup.collections) {
    // Sample 100 documents
    const snapshot = await firestore.collection(collectionName).limit(100).get();
    const total = snapshot.docs.length;
    let matched = 0;

    // Get backup data
    const bucket = storage.bucket();
    const backupFile = bucket.file(`${backup.backupId}/${collectionName}.json.gz`);

    let backupDocuments: any[] = [];
    try {
      const [fileContents] = await backupFile.download();

      // Decompress and parse
      const { gunzipSync } = require('gunzip-sync');
      const decompressed = gunzipSync(fileContents);
      const json = JSON.parse(decompressed.toString('utf8'));

      backupDocuments = json;
    } catch (error) {
      console.warn(`Failed to read backup for ${collectionName}:`, error);
      hashes[collectionName] = {
        total: 0,
        matched: 0,
        percentage: 0,
      };
      allPassed = false;
      continue;
    }

    // Verify hashes
    for (const doc of snapshot.docs) {
      const backupDoc = backupDocuments.find((d: any) => d.id === doc.id);
      if (backupDoc) {
        const liveHash = calculateHash(doc.data());
        const backupHash = calculateHash(backupDoc);

        if (liveHash === backupHash) {
          matched++;
        }
      }
    }

    hashes[collectionName] = {
      total,
      matched,
      percentage: total > 0 ? (matched / total) * 100 : 0,
    };

    if (total > 0 && (matched / total) < 0.95) {
      allPassed = false;
    }
  }

  return {
    ...hashes,
    match: allPassed,
  };
}

/**
 * Verify random samples
 */
async function verifyDocumentSamples(
  backup: BackupMetadata,
  firestore: admin.firestore.App,
  storage: admin.storage.Storage
): Promise<BackupVerification['details']['samples']> {
  const samples: BackupVerification['details']['samples'] = {};
  let allPassed = true;

  for (const collectionName of backup.collections) {
    // Sample 20 random documents
    const snapshot = await firestore.collection(collectionName).limit(20).get();
    const total = snapshot.docs.length;
    let matched = 0;

    // Get backup data
    const bucket = storage.bucket();
    const backupFile = bucket.file(`${backup.backupId}/${collectionName}.json.gz`);

    let backupDocuments: any[] = [];
    try {
      const [fileContents] = await backupFile.download();

      // Decompress and parse
      const { gunzipSync } = require('gunzip-sync');
      const decompressed = gunzipSync(fileContents);
      const json = JSON.parse(decompressed.toString('utf8'));

      backupDocuments = json;
    } catch (error) {
      console.warn(`Failed to read backup for ${collectionName}:`, error);
      samples[collectionName] = {
        total: 0,
        matched: 0,
        percentage: 0,
      };
      allPassed = false;
      continue;
    }

    // Verify samples
    for (const doc of snapshot.docs) {
      const backupDoc = backupDocuments.find((d: any) => d.id === doc.id);
      if (backupDoc) {
        const liveData = doc.data();
        const backupData = backupDoc;

        // Compare all fields
        const match = JSON.stringify(liveData) === JSON.stringify(backupData);
        if (match) {
          matched++;
        }
      }
    }

    samples[collectionName] = {
      total,
      matched,
      percentage: total > 0 ? (matched / total) * 100 : 0,
    };

    if (total > 0 && (matched / total) < 0.95) {
      allPassed = false;
    }
  }

  return {
    ...samples,
    match: allPassed,
  };
}

/**
 * Verify cross-region accessibility
 */
async function verifyCrossRegionAccessibility(
  backup: BackupMetadata,
  storage: admin.storage.Storage
): Promise<boolean> {
  // Check if backup file exists and is accessible
  const bucket = storage.bucket();

  for (const collectionName of backup.collections) {
    const backupFile = bucket.file(`${backup.backupId}/${collectionName}.json.gz`);

    try {
      const [metadata] = await backupFile.get();
      if (!metadata) {
        return false;
      }
    } catch (error) {
      console.warn(`Backup file ${collectionName} not accessible:`, error);
      return false;
    }
  }

  return true;
}

/**
 * Calculate hash for data
 */
function calculateHash(data: any): string {
  const crypto = require('crypto');
  const json = JSON.stringify(data);
  return crypto.createHash('sha256').update(json).digest('hex');
}

// ============================================
// Backup Alerting

/**
 * Send backup alert
 */
export async function sendBackupAlert(
  type: 'backup_success' | 'backup_failed' | 'backup_overdue' | 'backup_unhealthy',
  data: any
): Promise<void> {
  const firestore = admin.firestore();

  // Create alert record
  const alert = {
    type,
    ...data,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Save to alerts collection
  await firestore.collection('alerts').add(alert);

  console.log(`Backup alert sent: ${type}`, data);

  // TODO: Send to Slack, email, or webhook
  // await sendSlackAlert(type, data);
}

// ============================================
// Backup Monitoring Schedule

/**
 * Schedule backup health monitoring (every hour)
 */
export const scheduleBackupMonitoring = functions.pubsub
  .schedule('0 * * * *') // Every hour
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Running backup health check...');

      // Check backup health and alert if needed
      await checkBackupHealthAndAlert();

      console.log('Backup health check completed');
    } catch (error) {
      const err = error as Error;
      console.error('Backup health check failed:', err);

      // Send alert on failure
      await sendBackupAlert('backup_monitoring_failed', {
        error: err.message,
        stack: err.stack,
      });
    }
  });

/**
 * Schedule backup metrics collection (every 6 hours)
 */
export const scheduleBackupMetricsCollection = functions.pubsub
  .schedule('0 */6 * * *') // Every 6 hours
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Collecting backup metrics...');

      // Get latest backup
      const health = await getBackupHealth();

      if (health.lastBackup) {
        // Record metrics for latest backup
        await recordBackupMetrics(health.lastBackup.backupId);
      }

      console.log('Backup metrics collection completed');
    } catch (error) {
      const err = error as Error;
      console.error('Backup metrics collection failed:', err);

      // Send alert on failure
      await sendBackupAlert('backup_metrics_failed', {
        error: err.message,
        stack: err.stack,
      });
    }
  });

// ============================================
// Exports
// ============================================

export {
  // Health monitoring
  getBackupHealth,
  checkBackupHealthAndAlert,

  // Metrics
  collectBackupMetrics,
  recordBackupMetrics,

  // Verification
  verifyBackup,
  verifyDocumentCounts,
  verifyDocumentHashes,
  verifyDocumentSamples,
  verifyCrossRegionAccessibility,

  // Alerting
  sendBackupAlert,

  // Schedules
  scheduleBackupMonitoring,
  scheduleBackupMetricsCollection,

  // Types
  BackupHealth,
  BackupMetadata,
  BackupVerification,
  BackupMetrics,
};
