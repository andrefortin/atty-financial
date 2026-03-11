/**
 * Production Firebase Configuration
 *
 * This file contains production-specific Firebase configuration.
 * It should only be used in production builds and never in development.
 *
 * Security Notes:
 * - This file is optimized for production use
 * - All sensitive values should be loaded from environment variables
 * - Never hardcode production credentials in this file
 * - Use Firebase App Check for additional security
 *
 * @module lib/firebaseConfig.prod
 */

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryCache,
  FirestoreSettings,
  type Firestore,
} from 'firebase/firestore';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check';
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
  type Analytics,
} from 'firebase/analytics';

// ============================================
// Types
// ============================================

interface ProductionFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

interface ProductionFirebaseInstances {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  appCheck?: AppCheck;
  analytics?: Analytics;
}

// ============================================
// Configuration Loading
// ============================================

/**
 * Get environment variable with production validation
 */
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (!value) {
      throw new Error(`Missing required production environment variable: ${key}`);
    }
    return value;
  }

  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key] || process.env[key.replace('VITE_', '')];
    if (!value) {
      throw new Error(`Missing required production environment variable: ${key}`);
    }
    return value;
  }

  throw new Error(`Cannot load production environment variable: ${key}`);
};

/**
 * Load production Firebase configuration
 */
const loadProductionConfig = (): ProductionFirebaseConfig => {
  const config: ProductionFirebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID'),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
  };

  // Validate required fields are not placeholder values
  const placeholderPatterns = [
    /your_/i,
    /example_/i,
    /test_/i,
    /mock_/i,
    /placeholder/i,
    /xxx/i,
  ];

  for (const [key, value] of Object.entries(config)) {
    if (placeholderPatterns.some(pattern => pattern.test(value))) {
      throw new Error(
        `Production Firebase config contains placeholder value: ${key}=${value}`
      );
    }
  }

  return config;
};

// ============================================
// Firebase Initialization
// ============================================

let productionInstances: ProductionFirebaseInstances | null = null;

/**
 * Initialize production Firebase instances
 *
 * This function should only be called once at application startup.
 * It initializes all Firebase services with production-optimized settings.
 */
export const initializeProductionFirebase = (): ProductionFirebaseInstances => {
  // Return existing instances if already initialized
  if (productionInstances) {
    return productionInstances;
  }

  // Check for existing Firebase apps
  const existingApps = getApps();
  if (existingApps.length > 0) {
    throw new Error(
      'Firebase is already initialized. Only one Firebase app instance is allowed in production.'
    );
  }

  // Load production configuration
  const config = loadProductionConfig();

  // Initialize Firebase App
  const app = initializeApp(config);

  // Initialize Firebase Auth with production settings
  const auth = initializeAuth(app, {
    // Use local persistence for better UX
    persistence: browserLocalPersistence,

    // Enable email verification for security
    emailLinkSignIn: {
      url: window.location.origin,
      handleCodeInApp: true,
    },
  });

  // Initialize Firestore with production-optimized settings
  const firestoreSettings: FirestoreSettings = {
    // Use persistent local cache for performance
    cache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),

    // Enable offline persistence
    // This allows the app to work offline and sync when connection is restored
    cacheSizeBytes: 10 * 1024 * 1024, // 10MB

    // Ignore undefined properties for security
    ignoreUndefinedProperties: true,
  };

  // Use memory cache for browsers with limited storage
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(({ usage, quota }) => {
      if (quota && usage / quota > 0.8) {
        // If using more than 80% of quota, use memory cache
        firestoreSettings.cache = memoryCache();
      }
    });
  }

  const db = initializeFirestore(app, firestoreSettings);

  // Initialize Firebase App Check for additional security
  let appCheck: AppCheck | undefined;
  try {
    // Use reCAPTCHA v3 for production
    // You must configure reCAPTCHA v3 in Firebase Console
    const recaptchaProvider = new ReCaptchaV3Provider(
      import.meta.env.VITE_FIREBASE_APPCHECK_TOKEN || ''
    );

    appCheck = initializeAppCheck(app, {
      provider: recaptchaProvider,
      isTokenAutoRefreshEnabled: true, // Auto-refresh App Check tokens
    });

    console.log('Firebase App Check initialized');
  } catch (error) {
    console.warn('Failed to initialize Firebase App Check:', error);
    // App Check is optional, continue without it
  }

  // Initialize Firebase Analytics for production
  let analytics: Analytics | undefined;

  isAnalyticsSupported().then((supported) => {
    if (supported && config.measurementId) {
      try {
        analytics = getAnalytics(app);

        // Configure analytics settings
        if (typeof window !== 'undefined' && 'gtag' in window) {
          const gtag = (window as any).gtag;
          gtag('config', config.measurementId, {
            // Enable enhanced measurement
            send_page_view: true,

            // Anonymize IP for privacy compliance
            anonymize_ip: true,

            // Enable performance monitoring
            allow_google_signals: true,
          });
        }

        console.log('Firebase Analytics initialized');
      } catch (error) {
        console.warn('Failed to initialize Firebase Analytics:', error);
      }
    }
  });

  // Store instances
  productionInstances = {
    app,
    auth,
    db,
    appCheck,
    analytics,
  };

  console.log('Production Firebase initialized successfully');

  return productionInstances;
};

/**
 * Get production Firebase instances
 *
 * Use this function to access Firebase instances throughout the application.
 * It ensures Firebase is initialized before returning instances.
 */
export const getProductionFirebase = (): ProductionFirebaseInstances => {
  if (!productionInstances) {
    return initializeProductionFirebase();
  }
  return productionInstances;
};

/**
 * Export individual Firebase instances
 */

/**
 * Firebase App instance
 */
export const getProductionApp = (): FirebaseApp => {
  return getProductionFirebase().app;
};

/**
 * Firebase Auth instance
 */
export const getProductionAuth = (): Auth => {
  return getProductionFirebase().auth;
};

/**
 * Firebase Firestore instance
 */
export const getProductionDb = (): Firestore => {
  return getProductionFirebase().db;
};

/**
 * Firebase App Check instance (optional)
 */
export const getProductionAppCheck = (): AppCheck | undefined => {
  return getProductionFirebase().appCheck;
};

/**
 * Firebase Analytics instance (optional)
 */
export const getProductionAnalytics = (): Analytics | undefined => {
  return getProductionFirebase().analytics;
};

// ============================================
// Production Configuration Validation
// ============================================

/**
 * Validate production Firebase configuration
 *
 * Call this function during app initialization to ensure
 * all required Firebase configuration is present and valid.
 */
export const validateProductionFirebaseConfig = (): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  try {
    // Try to load configuration
    const config = loadProductionConfig();

    // Validate required fields
    const requiredFields: (keyof ProductionFirebaseConfig)[] = [
      'apiKey',
      'authDomain',
      'projectId',
      'appId',
    ];

    for (const field of requiredFields) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate API key format
    if (!/^AIza[A-Za-z0-9_-]{35}$/.test(config.apiKey)) {
      errors.push('Invalid Firebase API key format');
    }

    // Validate authDomain format
    if (!/^[a-z0-9-]+\.firebaseapp\.com$/.test(config.authDomain)) {
      errors.push('Invalid Firebase auth domain format');
    }

    // Validate projectId format
    if (!/^[a-z0-9-]+$/.test(config.projectId)) {
      errors.push('Invalid Firebase project ID format');
    }

    // Validate measurementId format (if present)
    if (config.measurementId && !/^G-[A-Z0-9]+$/.test(config.measurementId)) {
      errors.push('Invalid Firebase measurement ID format');
    }
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : 'Unknown configuration error'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================
// Production Security Helpers
// ============================================

/**
 * Get Firebase App Check token
 *
 * This token should be included in requests to your backend
 * to verify requests are coming from your legitimate app.
 */
export const getAppCheckToken = async (): Promise<string | null> => {
  try {
    const appCheck = getProductionAppCheck();
    if (!appCheck) {
      console.warn('Firebase App Check is not initialized');
      return null;
    }

    const token = await appCheck.getToken(/* forceRefresh */ false);
    return token.token;
  } catch (error) {
    console.error('Failed to get App Check token:', error);
    return null;
  }
};

/**
 * Refresh Firebase App Check token
 *
 * Call this if you suspect the token is stale or invalid.
 */
export const refreshAppCheckToken = async (): Promise<string | null> => {
  try {
    const appCheck = getProductionAppCheck();
    if (!appCheck) {
      console.warn('Firebase App Check is not initialized');
      return null;
    }

    const token = await appCheck.getToken(/* forceRefresh */ true);
    return token.token;
  } catch (error) {
    console.error('Failed to refresh App Check token:', error);
    return null;
  }
};

// ============================================
// Exports
// ============================================

export type {
  ProductionFirebaseConfig,
  ProductionFirebaseInstances,
};

export default initializeProductionFirebase;
