/**
 * Firebase Initialization
 *
 * Initializes Firebase app, authentication, Firestore, and Analytics.
 * Exports configured instances for use throughout the application.
 *
 * Analytics is only initialized in production mode to avoid
 * duplicate events during development.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import firebaseConfig from './firebaseConfig';

// Initialize Firebase app (singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with local persistence
const auth = !getApps().length
  ? initializeAuth(app, {
      persistence: browserLocalPersistence,
    })
  : getAuth(app);

// Initialize Firestore with local persistence
const db = !getApps().length
  ? initializeFirestore(app, {
      cache: persistentLocalCache(),
    })
  : getFirestore(app);

// Initialize Firebase Analytics (production only)
let analytics: ReturnType<typeof getAnalytics> | null = null;

// Helper to check if we're in production
const isProduction = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD === true;
  }
  return process.env.NODE_ENV === 'production';
};

const initializeAnalytics = async () => {
  // Only initialize analytics in production and if analytics is supported
  if (isProduction() && firebaseConfig.measurementId) {
    try {
      const supported = await isAnalyticsSupported();
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase Analytics:', error);
    }
  }
};

// Initialize analytics asynchronously
initializeAnalytics();

// Export Firebase instances
export { app, auth, db, analytics, initializeAnalytics };

// Export Firebase types for convenience
export type FirebaseApp = typeof app;
export type FirebaseAuth = typeof auth;
export type FirestoreDB = typeof db;
export type FirebaseAnalytics = typeof analytics;

// Re-export commonly used Firebase functions and types
export * from 'firebase/auth';
export * from 'firebase/firestore';
export * from 'firebase/analytics';
