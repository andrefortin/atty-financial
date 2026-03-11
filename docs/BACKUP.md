# Backup Strategy

This guide covers comprehensive backup strategy for ATTY Financial, including automated backups, point-in-time recovery, disaster recovery, and monitoring.

## Table of Contents

- [Overview](#overview)
- [Backup Architecture](#backup-architecture)
- [Data Classification](#data-classification)
- [Backup Policies](#backup-policies)
- [Automated Backups](#automated-backups)
- [Point-in-Time Recovery](#point-in-time-recovery)
- [Backup Retention](#backup-retention)
- [Restore Procedures](#restore-procedures)
- [Backup Verification](#backup-verification)
- [Disaster Recovery](#disaster-recovery)
- [Offline Backups](#offline-backups)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [RTO Targets](#rpo-targets)
- [Compliance Requirements](#compliance-requirements)

---

## Overview

ATTY Financial implements a comprehensive backup strategy to ensure data availability, durability, and rapid recovery from disasters.

### Backup Goals

- **Data Availability**: 99.999% availability
- **Data Durability**: 100% durability (no data loss)
- **Rapid Recovery**: RTO < 1 hour for critical data
- **Rapid Recovery**: RTO < 4 hours for all data
- **Data Integrity**: 100% data integrity
- **Compliance**: SO 2, HIPAA, GDPR compliance

### Backup Strategy

1. **Automated Backups**: Daily automated backups of all critical data
2. **Point-in-Time Recovery**: 30-day recovery window for all collections
3. **Data Retention**: Configurable retention per data type
4. **Geo-Redundancy**: Multi-region backup copies
5. **Continuous Protection**: Real-time data streaming to backup
6. **Monitoring**: Backup health monitoring and alerting

---

## Backup Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Firestore                       │
│  - Primary Database (us-central)                              │
│  - Multi-region replication (nam5)                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┬─────────────────┐
        │                             │                 │
        ▼                             ▼                 ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Daily Backups   │    │  Point-in-Time   │    │  Backup Monitor   │
│  (Scheduled)     │    │  Recovery (30d)  │    │  (Real-time)       │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                 │
         ▼                       ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Cloud Storage (Bucket)                      │
│  - Daily snapshots (retained 90 days)                       │
│  - Exported data (retained per policy)                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Monitoring & Alerting                       │
│  - Backup health monitoring                                      │
│  - Alerting on failures                                          │
│  - Backup success notifications                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **Primary Database**: Firebase Firestore (us-central)
   - Real-time data synchronization
   - Multi-region replication (nam5)
   - Automatic failover

2. **Daily Backups**:
   - Automated via Cloud Functions
   - Scheduled: Daily at 2:00 AM UTC
   - Export to Cloud Storage

3. **Point-in-Time Recovery**:
   - 30-day recovery window
   - Restore to any point in time
   - Granular collection-level recovery

4. **Backup Monitor**:
   - Real-time backup health monitoring
   - Automatic failure detection
   - Alerting via Slack/webhook/email

5. **Cloud Storage**:
   - Primary backup destination
   - 90-day retention for daily backups
   - Exported data retention per policy

---

## Data Classification

### Data Categories

| Category | Data Types | Backup Frequency | Retention | RPO Target |
|-----------|------------|------------------|-----------|-------------|
| **Critical** | Firms, Users, Roles | Daily (2:00 AM UTC) | 7 years | < 1 hour |
| **Important** | Matters, Transactions | Daily (2:00 AM UTC) | 7 years | < 4 hours |
| **Sensitive** | Allocations, Reports | Daily (2:00 AM UTC) | 5 years | < 8 hours |
| **Business** | Bank Feeds, Notifications | Daily (2:00 AM UTC) | 2 years | < 24 hours |
| **Transitory** | Daily Balances, Cache | Hourly (via PITR) | 90 days | N/A |
| **Metadata** | Audit Logs, Statistics | Daily (2:00 AM UTC) | 1 year | N/A |

### Collections by Category

#### Critical
- `firms`
- `users`
- `roles`

#### Important
- `matters`
- `transactions`

#### Sensitive
- `interestAllocations`
- `reports`

#### Business
- `bankFeeds`
- `notifications`

#### Transitory
- `dailyBalances`

#### Metadata
- `auditLogs`
- `rateEntries`

---

## Backup Policies

### RPO (Recovery Point Objective) Targets

| Data Category | RPO Target | Description |
|---------------|-------------|-------------|
| **Critical** | < 1 hour | Maximum acceptable downtime for firm data |
| **Important** | < 4 hours | Maximum acceptable downtime for matters/transactions |
| **Sensitive** | < 8 hours | Maximum acceptable downtime for allocations/reports |
| **Business** | < 24 hours | Maximum acceptable downtime for bank feeds/notifications |
| **Transitory** | PITR | Continuous recovery via point-in-time |
| **Metadata** | N/A | Rebuild from live data |

### RTO (Recovery Time Objective) Targets

| Scenario | RTO Target | Description |
|-----------|-------------|-------------|
| **Data Corruption** | < 4 hours | Restore from daily backup |
| **Accidental Deletion** | < 4 hours | Restore from daily backup |
| **Region Outage** | < 4 hours | Recover from multi-region copy |
| **Catastrophic Failure** | < 24 hours | Restore from cold backup |
| **Partial Data Loss** | < 1 hour | Restore from latest backup |

### Backup Retention Policy

| Data Type | Daily Backup | PITR | Archive |
|-----------|---------------|------|---------|
| **Critical** | 7 years | 30 days | 7 years |
| **Important** | 7 years | 30 days | 7 years |
| **Sensitive** | 5 years | 7 days | 5 years |
| **Business** | 2 years | 30 days | 2 years |
| **Transitory** | 90 days | 30 days | N/A |
| **Metadata** | 1 year | 30 days | N/A |

### Backup Verification

All backups must pass verification before being considered successful:

1. **Data Integrity Check**: Hash verification of backup data
2. **Count Verification**: Verify document counts match source
3. **Sample Verification**: Random sample verification of 100 documents
4. **Cross-Region Verification**: Verify backup in secondary region

---

## Automated Backups

### Scheduled Daily Backups

Backup schedule:

| Backup Type | Schedule | Time (UTC) | Duration |
|-------------|----------|---------------|----------|
| **Critical Data** | Daily | 02:00 AM | ~30 minutes |
| **Important Data** | Daily | 02:00 AM | ~1 hour |
| **Sensitive Data** | Daily | 02:00 AM | ~45 minutes |
| **Business Data** | Daily | 02:00 AM | ~15 minutes |

### Backup Process

1. **Start Time**: 02:00 AM UTC
2. **Scope**: All critical, important, and sensitive data
3. **Destination**: Cloud Storage bucket
4. **Format**: JSON export with gzip compression
5. **Verification**: Hash verification after export
6. **Retention**: 90 days for daily backups
7. **Monitoring**: Real-time progress tracking
8. **Alerting**: Success/failure notifications

### Backup Configuration

Cloud Function configuration:

```typescript
// functions/backup/index.ts
export const scheduleDailyBackup = functions.pubsub
  .schedule('0 2 * * *') // 02:00 AM UTC
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const admin = require('firebase-admin');
    const firestore = admin.firestore();
    const storage = admin.storage();

    console.log('Starting daily backup...');

    // Create backup metadata
    const backupMetadata = {
      backupId: `backup_${Date.now()}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      triggeredBy: 'system',
      collections: [
        'users',
        'firms',
        'roles',
        'matters',
        'transactions',
        'interestAllocations',
        'reports',
        'bankFeeds',
        'notifications',
      ],
      status: 'running',
    };

    // Save backup metadata
    await firestore.collection('backups').doc(backupMetadata.backupId).set({
      ...backupMetadata,
      startTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      // Export all collections
      const backupResults = await exportCollections(firestore, backupMetadata);

      // Update backup status to success
      await firestore.collection('backups').doc(backupMetadata.backupId).update({
        status: 'success',
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        ...backupResults,
      });

      // Send success notification
      await sendBackupNotification('success', backupMetadata, backupResults);

      console.log('Daily backup completed successfully');
    } catch (error) {
      // Update backup status to failed
      await firestore.collection('backups').doc(backupMetadata.backupId).update({
        status: 'failed',
        endTime: admin.firestore.FieldValue.serverTimestamp(),
        error: error.message,
        stack: error.stack,
      });

      // Send failure notification
      await sendBackupNotification('failed', backupMetadata, error);

      console.error('Daily backup failed:', error);
      throw error;
    }

    return null;
  });
```

### Export Functions

```typescript
// functions/backup/export.ts
export async function exportCollections(
  firestore: admin.firestore.Firestore,
  metadata: any
): Promise<any> {
  const results = {
    totalDocuments: 0,
    totalSize: 0,
    collections: {},
  };

  // Export each collection
  for (const collectionName of metadata.collections) {
    console.log(`Exporting collection: ${collectionName}`);

    const collectionSnapshot = await firestore.collection(collectionName).get();

    if (collectionSnapshot.empty) {
      results.collections[collectionName] = {
        exported: 0,
        skipped: 0,
        size: 0,
      };
      continue;
    }

    // Export to Cloud Storage
    const exportResult = await exportCollectionToStorage(
      firestore,
      collectionName,
      collectionSnapshot,
      metadata.backupId
    );

    results.collections[collectionName] = exportResult;
    results.totalDocuments += exportResult.exported;
    results.totalSize += exportResult.size;
  }

  return results;
}

async function exportCollectionToStorage(
  firestore: admin.firestore.Firestore,
  collectionName: string,
  snapshot: admin.firestore.QuerySnapshot<admin.firestore.DocumentData>,
  backupId: string
): Promise<any> {
  const storage = admin.storage();
  const bucket = storage.bucket();
  const filename = `${backupId}/${collectionName}.json.gz`;

  // Convert snapshot to array
  const documents = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Convert to JSON
  const json = JSON.stringify(documents);

  // Compress with gzip
  const { promisify } = require('util');
  const gzip = promisify(require('zlib').gzip);
  const compressed = await gzip(json);

  // Upload to Cloud Storage
  const file = bucket.file(filename);
  await file.save(compressed, {
    gzip: true,
    metadata: {
      contentType: 'application/json',
      contentEncoding: 'gzip',
      collectionName,
      backupId,
      exportedAt: new Date().toISOString(),
    },
  });

  // Get file size
  const [metadata] = await file.getMetadata();

  return {
    exported: documents.length,
    skipped: 0,
    size: metadata.size,
    filename,
  };
}
```

---

## Point-in-Time Recovery

### PITR Configuration

Configure Point-in-Time Recovery in Firebase Console:

1. **Go to Firebase Console** → Firestore
2. **Enable Point-in-Time Recovery**:
   - Retention period: 30 days
   - Region: nam5 (us-central)

### Recovery Window

| Collection | PITR Window | Purpose |
|------------|--------------|---------|
| **All Collections** | 30 days | Restore any collection to any point in 30 days |
| **Critical Data** | 30 days | Restore critical data quickly |
| **Important Data** | 30 days | Restore matters/transactions |

### Recovery Procedure

1. **Identify Point-in-Time**:
   - Determine the point-in-time to restore to
   - Format: `YYYY-MM-DD HH:MM:SS` UTC

2. **Select Collections**:
   - Choose which collections to restore
   - All collections or specific collections

3. **Restore Data**:
   ```bash
   # Restore to specific point-in-time
   firebase firestore:restore --project atty-financial-production \
     --collection-name matters \
     --time "2026-03-01 12:00:00"
   ```

4. **Verify Restoration**:
   - Check document counts
   - Verify data integrity
   - Verify relationships

### Granular Recovery

Restore specific subsets:

```typescript
// Restore specific matter
export async function restoreMatter(
  matterId: string,
  pointInTime: Date
): Promise<void> {
  // Get backup from specific point-in-time
  const snapshot = await getBackupAtTime(pointInTime);
  const matterData = snapshot.matters.find(m => m.id === matterId);

  if (matterData) {
    // Restore to Firestore
    await admin.firestore().collection('matters').doc(matterId).set(matterData);

    console.log(`Matter ${matterId} restored to ${pointInTime.toISOString()}`);
  }
}
```

### Bulk Recovery

Restore multiple collections at once:

```typescript
// Restore all data from specific point-in-time
export async function restoreAllCollections(
  pointInTime: Date
): Promise<void> {
  // Get backup from specific point-in-time
  const snapshot = await getBackupAtTime(pointInTime);

  // Restore each collection
  const batch = admin.firestore().batch();

  for (const [collectionName, documents] of Object.entries(snapshot)) {
    for (const doc of documents) {
      batch.set(
        admin.firestore().collection(collectionName).doc(doc.id),
        doc
      );
    }
  }

  // Commit batch
  await batch.commit();

  console.log(`All collections restored to ${pointInTime.toISOString()}`);
}
```

---

## Backup Retention

### Retention Policy

| Data Category | Daily Backup | PITR | Archive |
|---------------|---------------|------|---------|
| **Critical** | 7 years | 30 days | 7 years |
| **Important** | 7 years | 30 days | 7 years |
| **Sensitive** | 5 years | 7 days | 5 years |
| **Business** | 2 years | 30 days | 2 years |
| **Transitory** | 90 days | 30 days | N/A |
| **Metadata** | 1 year | 30 days | N/A |

### Automatic Cleanup

Old backups are automatically deleted:

```typescript
// functions/backup/cleanup.ts
export const scheduleBackupCleanup = functions.pubsub
  .schedule('0 3 * * *') // 03:00 AM UTC
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const admin = require('firebase-admin');
    const firestore = admin.firestore();

    console.log('Starting backup cleanup...');

    // Get retention policy
    const retentionPolicy = getRetentionPolicy();

    // Get old backups
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - retentionPolicy.dailyBackup * 24 * 60 * 60 * 1000);

    const query = firestore
      .collection('backups')
      .where('timestamp', '<', cutoffDate)
      .where('type', '==', 'daily');

    const snapshot = await query.get();

    // Delete old backups
    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Delete from Cloud Storage
    await deleteBackupsFromStorage(snapshot.docs.map(doc => doc.data.backupId));

    console.log(`Cleaned up ${snapshot.size} old backups`);
  });
}

function getRetentionPolicy() {
  return {
    dailyBackup: 90, // days
    export: 365, // days
    archive: 2555, // days (7 years)
  };
}
```

### Archive Process

Backups older than retention policy are archived:

1. **Move to Archive Storage**: Move to separate bucket with longer retention
2. **Compress Data**: Use additional compression for long-term storage
3. **Index Archives**: Maintain index of archived backups
4. **Version Control**: Keep last 7 years of archives
5. **Cost Optimization**: Use lower-cost storage tier for archives

---

## Restore Procedures

### Daily Backup Restore

Restore from daily backup:

```bash
# List all backups
firebase firestore:backups:list --project atty-financial-production

# Get specific backup
firebase firestore:backups:get backup_1234567890

# Restore from backup
firebase firestore:restore backup_1234567890 --project atty-financial-production
```

### Granular Collection Restore

Restore specific collection:

```bash
# Restore specific collection from backup
firebase firestore:restore backup_1234567890 \
  --collection-name matters \
  --project atty-financial-production
```

### Point-in-Time Recovery

Restore to specific point-in-time:

```bash
# Restore to specific date/time
firebase firestore:restore --project atty-financial-production \
  --time "2026-03-01 12:00:00"
```

### Document-Level Restore

Restore specific document:

```typescript
import { admin } from 'firebase-admin';

async function restoreDocument(
  collectionName: string,
  documentId: string,
  backupId: string
): Promise<void> {
  const firestore = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket();

  // Get backup
  const backupData = await getBackupById(backupId);
  const documentData = backupData.collections[collectionName].find(
    doc => doc.id === documentId
  );

  if (documentData) {
    // Restore to Firestore
    await firestore.collection(collectionName).doc(documentId).set(documentData);

    console.log(`Document ${documentId} restored`);
  }
}
```

### Verification After Restore

Verify restore was successful:

```typescript
import { admin } from 'firebase-admin';

async function verifyRestore(backupId: string): Promise<boolean> {
  const firestore = admin.firestore();

  // Get backup metadata
  const backupDoc = await firestore.collection('backups').doc(backupId).get();

  if (!backupDoc.exists) {
    console.error('Backup metadata not found');
    return false;
  }

  const backupData = backupDoc.data();

  // Verify document counts
  for (const [collectionName, metadata] of Object.entries(backupData.collections)) {
    const count = await firestore.collection(collectionName).count();
    if (count !== metadata.exported) {
      console.error(`Collection ${collectionName} count mismatch: expected ${metadata.exported}, got ${count}`);
      return false;
    }
  }

  console.log('Restore verified successfully');
  return true;
}
```

---

## Backup Verification

### Automatic Verification

All backups are automatically verified:

```typescript
// functions/backup/verify.ts
export async function verifyBackup(backupId: string): Promise<boolean> {
  const firestore = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket();

  // Get backup metadata
  const backupDoc = await firestore.collection('backups').doc(backupId).get();
  if (!backupDoc.exists) {
    throw new Error('Backup metadata not found');
  }

  const backupData = backupDoc.data();

  // Verify document counts
  const verificationResults = {
    counts: {},
    hashes: {},
    samples: {},
  };

  // Verify each collection
  for (const [collectionName, metadata] of Object.entries(backupData.collections)) {
    const count = await firestore.collection(collectionName).count();
    const countMatch = count === metadata.exported;

    verificationResults.counts[collectionName] = {
      expected: metadata.exported,
      actual: count,
      match: countMatch,
    };

    // Verify hash of 100 sample documents
    const sample = await firestore.collection(collectionName).limit(100).get();
    const sampleDocs = sample.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
      hash: calculateHash(doc.data()),
    }));

    // Get backup data for verification
    const backupFile = bucket.file(`${backupId}/${collectionName}.json.gz`);
    const [fileContents] = await backupFile.download();

    // Decompress and parse
    const { gunzipSync } = require('gunzip-sync');
    const decompressed = gunzipSync(fileContents);
    const backupData = JSON.parse(decompressed.toString('utf8'));

    // Verify hashes
    let hashMatches = 0;
    for (const doc of sampleDocs) {
      const backupDoc = backupData.find(d => d.id === doc.id);
      if (backupDoc && calculateHash(backupDoc) === doc.hash) {
        hashMatches++;
      }
    }

    verificationResults.hashes[collectionName] = {
      total: sampleDocs.length,
      matched: hashMatches,
      percentage: (hashMatches / sampleDocs.length) * 100,
    };
  }

  // Update backup metadata with verification results
  await firestore.collection('backups').doc(backupId).update({
    verification: verificationResults,
    verificationStatus: Object.values(verificationResults.hashes).every(h => h.percentage >= 95),
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('Backup verification completed:', verificationResults);

  return Object.values(verificationResults.hashes).every(h => h.percentage >= 95);
}
```

### Verification Criteria

A backup is considered verified when:

1. **Document Count Match**: All collection counts match expected counts
2. **Hash Verification**: ≥ 95% of sample documents match expected hash
3. **Sample Verification**: 100 random sample documents verify successfully
4. **Cross-Region Verification**: Backup is accessible from secondary region

### Verification Thresholds

| Verification Type | Threshold | Action |
|------------------|-----------|--------|
| **Count Match** | 100% | Must match exactly |
| **Hash Match** | ≥ 95% | ≥ 95% of samples must match |
| **Sample Verification** | 100% | All samples must match |
| **Cross-Region** | Accessible | Must be accessible from secondary region |

---

## Disaster Recovery

### Disaster Recovery Plan

#### Scenarios

1. **Data Corruption**: Database corruption detected
   - RTO: < 4 hours
   - Action: Restore from most recent daily backup

2. **Accidental Deletion**: Data accidentally deleted
   - RTO: < 4 hours
   - Action: Restore from daily backup

3. **Region Outage**: Firebase region outage
   - RTO: < 4 hours
   - Action: Use multi-region copy

4. **Catastrophic Failure**: Complete data loss
   - RTO: < 24 hours
   - Action: Restore from cold backup

5. **Partial Data Loss**: Some data lost/missing
   - RTO: < 1 hour
   - Action: Restore from latest backup

#### Recovery Procedures

##### Scenario 1: Data Corruption

```bash
# 1. Identify corruption time
# 2. Find backup before corruption time
firebase firestore:backups:list --project atty-financial-production

# 3. Restore from backup
firebase firestore:restore backup_1234567890 --project atty-financial-production

# 4. Verify restore
firebase firestore:backups:get backup_1234567890
# Check verificationResults field

# 5. RTO Target: < 4 hours
```

##### Scenario 2: Accidental Deletion

```bash
# 1. Identify deletion time
# 2. Find backup before deletion time
firebase firestore:backups:list --project atty-financial-production

# 3. Restore from backup
firebase firestore:restore backup_1234567890 --project atty-financial-production

# 4. Verify restore
# 5. RTO Target: < 4 hours
```

##### Scenario 3: Region Outage

```bash
# 1. Check region status
firebase firestore:backups:list --project atty-financial-production

# 2. Use multi-region copy
firebase use atty-financial-production-region2

# 3. RTO Target: < 4 hours
```

##### Scenario 4: Catastrophic Failure

```bash
# 1. Check cold backup availability
# 2. Restore from cold backup
firebase firestore:restore backup_cold_backup_1234567890 --project atty-financial-production

# 3. Verify restore
# 4. RTO Target: < 24 hours
```

### Disaster Recovery Team

**Roles and Responsibilities**:

| Role | Name | Responsibilities |
|------|------|-----------------|
| **Incident Commander** | CTO | Overall coordination, decision making |
| **Database Admin** | DevOps Lead | Technical execution, restore procedures |
| **Application Lead** | Tech Lead | Application recovery, testing |
| **Communications** | Marketing | Stakeholder communications |
| **Support** | Support Lead | User support, status updates |

### Disaster Recovery Checklist

- [ ] Identify disaster type and scope
- [ ] Declare disaster incident
- [ ] Assemble disaster recovery team
- [ ] Identify recovery point in time
- [ ] Select appropriate backup
- [ ] Execute restore procedure
- [ ] Verify data integrity
- [ ] Test application functionality
- [ ] Monitor for issues
- [ ] Document incident and recovery
- [ ] Conduct post-incident review
- [ ] Update disaster recovery plan

---

## Offline Backups

### Offline Backup Strategy

For critical data, maintain offline backup copies:

1. **Offline Storage**: Encrypted external hard drive
2. **Frequency**: Monthly
3. **Encryption**: AES-256 encryption
4. **Location**: Secure offsite location
5. **Testing**: Quarterly restore testing

### Offline Backup Process

```bash
# 1. Create monthly backup
firebase firestore:export --json > backup_monthly.json

# 2. Compress and encrypt
gzip backup_monthly.json > backup_monthly.json.gz
openssl enc -aes-256-cbc -pb passcode -in backup_monthly.json.gz -out backup_monthly.enc

# 3. Store securely
cp backup_monthly.enc /path/to/secure/location/

# 4. Test backup (quarterly)
# Decompress and verify
openssl enc -aes-256-cbc -d -in backup_monthly.enc -out backup_monthly.json.gz
gunzip -c backup_monthly.json.gz | jq '.collections.matters' | head -20
```

### Offline Backup Retention

- **Primary**: 3 offline copies (1 per month for last 3 months)
- **Archive**: 1 offline copy per year for last 7 years
- **Location**: Secure offsite location
- **Encryption**: AES-256
- **Access**: Limited to 2-3 authorized personnel

---

## Monitoring and Alerts

### Backup Monitoring

Real-time backup health monitoring:

```typescript
// scripts/backup-monitor.ts
export async function monitorBackupHealth(): Promise<BackupHealth> {
  const firestore = admin.firestore();

  // Get latest backup
  const latestBackup = await firestore
    .collection('backups')
    .where('type', '==', 'daily')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  if (latestBackup.empty) {
    return {
      healthy: false,
      lastBackup: null,
      lastBackupTime: null,
      age: null,
    };
  }

  const backup = latestBackup.docs[0].data();
  const lastBackupTime = backup.timestamp.toDate();
  const now = new Date();
  const age = (now.getTime() - lastBackupTime.getTime()) / (1000 * 60 * 60 * 24); // days

  return {
    healthy: backup.status === 'success' && age < 2,
    lastBackup: backup.backupId,
    lastBackupTime,
    age,
    collections: backup.collections,
  };
}
```

### Backup Alerts

Configure alerts for backup failures:

```typescript
import { initializeAlerts } from '@/lib/monitoring';

// Send backup success alert
async function sendBackupSuccessAlert(backupId: string, metadata: any): Promise<void> {
  await sendAlert('backup_success', {
    type: 'daily',
    backupId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

// Send backup failure alert
async function sendBackupFailureAlert(backupId: string, error: Error): Promise<void> {
  await sendAlert('backup_failed', {
    backupId,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
}
```

### Backup Status Dashboard

Monitor backup status in Firebase Console:

1. Go to Firebase Console → Firestore → Backups
2. View backup history
3. Check backup status (success/failed)
4. View verification results
5. Monitor backup size and duration

---

## RPO/RTO Targets

### Recovery Objectives

| Scenario | RPO Target | RTO Target | Actual RPO | Actual RTO |
|----------|-------------|------------|------------|------------|
| **Data Corruption** | < 1 hour | < 4 hours | TBD | TBD |
| **Accidental Deletion** | < 1 hour | < 4 hours | TBD | TBD |
| **Region Outage** | < 1 hour | < 4 hours | TBD | TBD |
| **Catastrophic Failure** | N/A | < 24 hours | TBD | TBD |
| **Partial Data Loss** | < 1 hour | N/A | TBD | TBD |

### Recovery Metrics

Track recovery metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| **Critical Data RPO** | < 1 hour | TBD |
| **All Data RPO** | < 4 hours | TBD |
| **Critical Data RTO** | < 1 hour | TBD |
| **All Data RTO** | < 4 hours | TBD |
| **Data Integrity** | 100% | TBD |
| **Backup Success Rate** | > 99% | TBD |

---

## RPO/RTO Targets

### RPO (Recovery Point Objective) Targets

Maximum acceptable data loss:

| Data Category | Maximum Data Loss | Description |
|---------------|-------------------|-------------|
| **Critical** | < 5 minutes | Maximum acceptable time without firm data |
| **Important** | < 1 hour | Maximum acceptable time without matters/transactions |
| **Sensitive** | < 4 hours | Maximum acceptable time without allocations/reports |
| **Business** | < 24 hours | Maximum acceptable time without bank feeds/notifications |

### RTO (Recovery Time Objective) Targets

Maximum acceptable recovery time:

| Scenario | RTO Target | Maximum Acceptable Time |
|-----------|-------------|------------------------|
| **Data Corruption** | < 4 hours | Maximum acceptable downtime |
| **Accidental Deletion** | < 4 hours | Maximum acceptable downtime |
| **Region Outage** | < 4 hours | Maximum acceptable downtime |
| **Catastrophic Failure** | < 24 hours | Maximum acceptable downtime |

### Recovery Metrics Tracking

Track actual recovery metrics:

```typescript
// functions/backup/metrics.ts
export function recordRecoveryMetrics(
  scenario: string,
  rpo: number, // actual data loss in minutes
  rto: number,  // actual recovery time in minutes
): void {
  const firestore = admin.firestore();

  firestore.collection('recovery-metrics').add({
    scenario,
    rpo,
    rto,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Recovery metrics recorded: ${scenario}, RPO: ${rpo}min, RTO: ${rto}min`);
}
```

---

## Compliance Requirements

### SO 2 Compliance

- **Data Availability**: 99.999% availability
- **Data Durability**: 100% durability (no data loss)
- **Data Integrity**: 100% data integrity
- **Change Management**: Controlled change management
- **Monitoring**: 24/7 monitoring and alerting
- **Incident Response**: Documented incident response procedures
- **Testing**: Regular testing of backup and restore procedures

### HIPAA Compliance

- **Data Protection**: Secure storage and transmission
- **Access Control**: Restricted access to backup data
- **Audit Trail**: Complete audit trail of backup and restore operations
- **Breach Notification**: Notification of any data breach within 72 hours
- **Risk Assessment**: Regular risk assessment

### GDPR Compliance

- **Right to be Forgotten**: Data deletion on request
- **Data Portability**: Data export in machine-readable format
- **Data Minimization**: Only collect necessary data
- **Data Accuracy**: Maintain accurate data
- **Storage Limitation**: Defined retention periods
- **Security**: Appropriate security measures

---

## Appendix

### Backup Commands

```bash
# List backups
firebase firestore:backups:list --project atty-financial-production

# Get backup details
firebase firestore:backups:get backup_1234567890 --project atty-financial-production

# Restore from backup
firebase firestore:restore backup_1234567890 --project atty-financial-production

# Restore to specific date/time
firebase firestore:restore --project atty-financial-production \
  --time "2026-03-01 12:00:00"

# Restore specific collection
firebase firestore:restore backup_1234567890 \
  --collection-name matters \
  --project atty-financial-production

# Enable PITR
firebase firestore:enable-pitr --project atty-financial-production

# Export data
firebase firestore:export --json > backup.json

# Import data
firebase firestore:import backup.json
```

### Firebase CLI Commands

```bash
# Create backup
firebase firestore:backups:create --project atty-financial-production

# List backups
firebase firestore:backups:list --project atty-financial-production

# Restore backup
firebase firestore:restore backup_1234567890 --project atty-financial-production
```

### Monitoring Commands

```bash
# Get backup health
npm run backup:monitor

# List backups
npm run backup:list

# Get backup status
npm run backup:status backup_1234567890
```

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Monitoring and Alerts](./MONITORING.md)
- [Firebase Production Setup](./FIREBASE_PRODUCTION_SETUP.md)
- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
