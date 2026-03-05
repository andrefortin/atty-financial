/**
 * Firebase Services Index
 *
 * Central export point for all Firebase service modules.
 *
 * @module services/firebase
 */

// Base service
export * from './firestore.service';

// Collection services
export * from './users.service';
export * from './firms.service';
export * from './matters.service';
export * from './transactions.service';
export * from './rateEntries.service';
export * from './dailyBalances.service';

// High-level services
export * from './interest.service';
export * from './allocations.service';
export * from './allocationDetails.service';
export * from './allocationWorkflow.service';
export * from './allocationReports.service';
export * from './realtime.service';
export * from './offline.service';
export * from './auditLogs.service';
export * from './compliance.service';
export * from './allocations.service';
export * from './allocationDetails.service';
export * from './allocationWorkflow.service';
export * from './allocationReports.service';
