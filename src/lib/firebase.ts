/**
 * Firebase Initialization
 *
 * Initializes Firebase app, authentication, Firestore, and Analytics.
 * Exports configured instances for use throughout the application.
 *
 * Features:
 * - Firebase App Check integration for production security
 * - Connection status monitoring
 * - Error boundary for Firebase errors
 * - Enhanced error handling
 * - Analytics initialization (production only)
 *
 * @module lib/firebase
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence, type Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import firebaseConfig from './firebaseConfig';
import { checkFirebaseConnection, type FirebaseConnectionStatus } from './firebaseConfig';

// ============================================
// Types
// ============================================

export interface FirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  appCheck?: AppCheck;
  analytics?: Analytics;
}

// ============================================
// Firebase Initialization
// ============================================

let instances: FirebaseInstances | null = null;
let analyticsInitialized = false;

/**
 * Initialize Firebase app (singleton pattern)
 *
 * This function initializes Firebase once and returns the same instance
 * on subsequent calls. It handles both development and production configurations.
 */
const initializeFirebaseApp = (): FirebaseApp => {
  // Return existing app if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Initialize Firebase app with configuration
  const app = initializeApp(firebaseConfig);
  return app;
};

/**
 * Initialize Firebase Auth with local persistence
 */
const initializeFirebaseAuth = (app: FirebaseApp): Auth => {
  // Return existing auth if already initialized
  const existingAuth = getAuth(app);
  if (existingAuth._initialized) {
    return existingAuth;
  }

  // Initialize Firebase Auth with local persistence
  const auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });

  return auth;
};

/**
 * Initialize Firestore with local persistence
 */
const initializeFirestoreDB = (app: FirebaseApp): Firestore => {
  // Return existing DB if already initialized
  const existingDb = getFirestore(app);
  if (existingDb._initialized) {
    return existingDb;
  }

  // Initialize Firestore with persistent cache
  const db = initializeFirestore(app, {
    cache: persistentLocalCache(),
  });

  return db;
};

/**
 * Initialize Firebase App Check for production
 */
const initializeFirebaseAppCheck = (): AppCheck | undefined => {
  try {
    // Only initialize App Check in production
    if (!firebaseConfig.measurementId) {
      return undefined;
    }

    // Get App Check token from environment
    const appCheckToken = import.meta.env.VITE_FIREBASE_APPCHECK_TOKEN;

    if (!appCheckToken || appCheckToken === 'your_app_check_token') {
      console.warn('Firebase App Check token not configured. Skipping App Check initialization.');
      return undefined;
    }

    // Initialize App Check with reCAPTCHA v3
    const recaptchaProvider = new ReCaptchaV3Provider(appCheckToken);

    const appCheck = initializeAppCheck(
      instances?.app || initializeFirebaseApp(),
      {
        provider: recaptchaProvider,
        isTokenAutoRefreshEnabled: true,
      }
    );

    console.log('Firebase App Check initialized');
    return appCheck;
  } catch (error) {
    console.warn('Failed to initialize Firebase App Check:', error);
    // App Check is optional, continue without it
    return undefined;
  }
};

/**
 * Initialize Firebase Analytics for production
 */
const initializeFirebaseAnalytics = async (): Promise<void> => {
  // Only initialize analytics in production
  if (analyticsInitialized) {
    return;
  }

  if (typeof window === 'undefined' || !window.firebase) {
    return;
  }

  try {
    // Check if analytics is supported
    const supported = await isAnalyticsSupported();
    if (!supported) {
      console.log('Firebase Analytics is not supported in this environment');
      return;
    }

    // Only initialize in production
    const isProd = import.meta.env.PROD === true;
    if (!isProd) {
      console.log('Firebase Analytics is disabled in development mode');
      return;
    }

    // Check if measurement ID is configured
    if (!firebaseConfig.measurementId || firebaseConfig.measurementId === 'your_measurement_id') {
      console.warn('Firebase Analytics measurement ID not configured');
      return;
    }

    // Initialize Analytics
    const analytics = getAnalytics(instances?.app || initializeFirebaseApp());

    // Configure analytics settings
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag;
      gtag('config', firebaseConfig.measurementId, {
        send_page_view: true,
        anonymize_ip: true,
        allow_google_signals: true,
      });
    }

    console.log('Firebase Analytics initialized');
    analyticsInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize Firebase Analytics:', error);
    // Analytics is optional, continue without it
  }
};

/**
 * Initialize all Firebase services
 *
 * This function should be called once at application startup.
 * It initializes Firebase app, auth, Firestore, App Check, and Analytics.
 */
export const initializeFirebase = async (): Promise<FirebaseInstances> => {
  // Return existing instances if already initialized
  if (instances) {
    return instances;
  }

  try {
    // Initialize Firebase app
    const app = initializeFirebaseApp();

    // Initialize Auth
    const auth = initializeFirebaseAuth(app);

    // Initialize Firestore
    const db = initializeFirestoreDB(app);

    // Initialize App Check
    const appCheck = initializeFirebaseAppCheck();

    // Initialize Analytics
    await initializeFirebaseAnalytics();

    // Create instances object
    instances = {
      app,
      auth,
      db,
      appCheck,
      analytics: typeof window !== 'undefined' && 'analytics' in window ? (window as any).analytics : undefined,
    };

    // Check connection status
    await checkFirebaseConnection();

    console.log('Firebase initialized successfully');
    return instances;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

/**
 * Get Firebase instances
 *
 * Use this function to access Firebase instances throughout the application.
 * It ensures Firebase is initialized before returning instances.
 */
export const getFirebaseInstances = (): FirebaseInstances => {
  if (!instances) {
    throw new Error('Firebase is not initialized. Call initializeFirebase() first.');
  }
  return instances;
};

/**
 * Get Firebase App instance
 */
export const getFirebaseApp = (): FirebaseApp => {
  const instances = getFirebaseInstances();
  return instances.app;
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): Auth => {
  const instances = getFirebaseInstances();
  return instances.auth;
};

/**
 * Get Firebase Firestore instance (direct export)
 */
export const db = getFirebaseDB();

/**
 * Get Firebase Firestore instance (function)
 */
export const getFirebaseDB = (): Firestore => {
  const instances = getFirebaseInstances();
  return instances.db;
};

/**
 * Get Firebase App Check instance (optional)
 */
export const getFirebaseAppCheck = (): AppCheck | undefined => {
  const instances = getFirebaseInstances();
  return instances.appCheck;
};

/**
 * Get Firebase Analytics instance (optional)
 */
export const getFirebaseAnalytics = (): Analytics | undefined => {
  const instances = getFirebaseInstances();
  return instances.analytics;
};

/**
 * Get Firebase connection status
 */
const getFirebaseConnectionStatus = (): FirebaseConnectionStatus => {
  return getFirebaseConnectionStatusFromConfig();
};

// Import from firebaseConfig for consistency
import { getFirebaseConnectionStatus as getFirebaseConnectionStatusFromConfig } from './firebaseConfig';

/**
 * Reset Firebase instances (for testing)
 */
const resetFirebase = (): void => {
  instances = null;
  analyticsInitialized = false;
  // Reset connection status
  import('./firebaseConfig').then(({ resetFirebaseConnectionStatus }) => {
    resetFirebaseConnectionStatus();
  });
};

// ============================================
// Re-exports
// ============================================

// Re-export commonly used Firebase functions and types
export * from 'firebase/app';
export * from 'firebase/auth';
export * from 'firebase/firestore';
export * from 'firebase/analytics';
export * from 'firebase/app-check';

// ============================================
// Error Boundary Support
// ============================================

/**
 * Error types for Firebase errors
 */
export class FirebaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FirebaseError';
  }
}

/**
 * Convert Firebase error to FirebaseError
 */
export const convertFirebaseError = (error: any): FirebaseError => {
  if (error instanceof FirebaseError) {
    return error;
  }

  // Handle Firebase Auth errors
  if (error?.code?.startsWith('auth/')) {
    return new FirebaseError(
      getAuthErrorMessage(error.code),
      error.code,
      error
    );
  }

  // Handle Firebase Firestore errors
  if (error?.code?.startsWith('firestore/')) {
    return new FirebaseError(
      getFirestoreErrorMessage(error.code),
      error.code,
      error
    );
  }

  // Handle Firebase App Check errors
  if (error?.code?.startsWith('appcheck/')) {
    return new FirebaseError(
      getAppCheckErrorMessage(error.code),
      error.code,
      error
    );
  }

  // Generic error
  return new FirebaseError(
    error?.message || 'Unknown Firebase error',
    'UNKNOWN_ERROR',
    error
  );
};

/**
 * Get Firebase Auth error message
 */
const getAuthErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'auth/invalid-api-key': 'Invalid API key provided',
    'auth/invalid-user-token': 'The user token is no longer valid',
    'auth/user-disabled': 'The specified user account has been disabled',
    'auth/user-not-found': 'No user account found with the provided email',
    'auth/wrong-password': 'The password is incorrect',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'The password is too weak',
    'auth/invalid-email': 'The email address is invalid',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in provider',
    'auth/invalid-credential': 'The credential is malformed or has expired',
    'auth/invalid-action-code': 'The action code is invalid or has expired',
    'auth/expired-action-code': 'The action code has expired',
    'auth/invalid-continue-uri': 'The continue URL is not valid',
    'auth/unauthorized-continue-uri': 'The continue URL is not authorized',
    'auth/invalid-verification-id': 'The verification ID is invalid',
    'auth/invalid-verification-code': 'The verification code is invalid',
    'auth/missing-verification-code': 'The verification code is missing',
    'auth/missing-verification-id': 'The verification ID is missing',
    'auth/missing-continue-uri': 'The continue URL is missing',
    'auth/too-many-requests': 'Too many requests. Try again later',
    'auth/operation-not-allowed': 'The requested operation is not allowed',
    'auth/requires-recent-login': 'This operation is sensitive and requires recent authentication',
    'auth/email-change-needs-verification': 'Your email address needs to be verified before you can proceed',
    'auth/password-reset-code-expired': 'The password reset code has expired',
    'auth/invalid-password-reset-code': 'The password reset code is invalid',
  };

  return messages[code] || `Firebase Auth error: ${code}`;
};

/**
 * Get Firebase Firestore error message
 */
const getFirestoreErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'firestore/permission-denied': 'Permission denied. You don\'t have access to this document.',
    'firestore/already-exists': 'The document already exists.',
    'firestream/cancelled': 'The operation was cancelled by the user.',
    'firestore/invalid-argument': 'The specified argument is invalid.',
    'firestore/not-found': 'The document was not found.',
    'firestream/failed-precondition': 'The operation was rejected because the system state was not as expected.',
    'firestream/internal': 'An internal error has occurred.',
    'firestore/unavailable': 'The service is unavailable. Please try again later.',
    'firestream/unauthenticated': 'The operation requires authentication.',
    'firestream/unimplemented': 'The operation is not implemented or is not supported in this environment.',
    'firestream/data-loss': 'Data may have been corrupted during transmission.',
    'firestream/aborted': 'The operation was aborted.',
  };

  return messages[code] || `Firebase Firestore error: ${code}`;
};

/**
 * Get Firebase App Check error message
 */
const getAppCheckErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'appcheck/invalid-api-key': 'Invalid API key for App Check',
    'appcheck/operation-not-supported': 'App Check is not supported in this environment',
    'appcheck/unauthorized-continue-uri': 'The continue URL is not authorized',
    'appcheck/invalid-continue-uri': 'The continue URL is invalid',
  };

  return messages[code] || `Firebase App Check error: ${code}`;
};

// ============================================
// Export Types and Instances
// ============================================

export type { FirebaseApp, Auth, Firestore, Analytics, AppCheck };
export type { FirebaseInstances };
export type { FirebaseError, FirebaseConnectionStatus };

// Re-export from firebaseConfig
export { getFirebaseConnectionStatus, resetFirebaseConnectionStatus, checkFirebaseConnection };
