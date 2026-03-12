/**
 * Firebase Configuration
 *
 * Environment-based Firebase configuration for development and production.
 * Firebase config values are loaded from environment variables.
 *
 * Features:
 * - Environment variable loading
 * - Development configuration with warnings
 * - Production validation with strict checks
 * - Connection status monitoring
 * - Error boundary support
 */

// ============================================
// Types
// ============================================

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FirebaseConnectionStatus {
  connected: boolean;
  initializing: boolean;
  error?: Error;
  lastChecked?: Date;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get environment variable with fallback
 */
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Check if we're in a Vite environment (browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }

  // Check for Node.js environment variables
  if (typeof process !== 'undefined' && process.env) {
    // VITE_ prefixed variables are uppercase in Node.js
    const nodeKey = key.replace('VITE_', '');
    return process.env[key] || process.env[nodeKey] || defaultValue;
  }

  return defaultValue;
};

/**
 * Check if value is a placeholder (not a real value)
 */
const isPlaceholder = (value: string): boolean => {
  if (!value || value.length === 0) return true;
  const placeholderPatterns = [
    /your_/i,
    /example_/i,
    /test_/i,
    /mock_/i,
    /placeholder/i,
    /xxx/i,
    /not_set/i,
  ];
  return placeholderPatterns.some(pattern => pattern.test(value));
};

/**
 * Validate Firebase API key format
 */
const isValidApiKey = (key: string): boolean => {
  return /^AIza[A-Za-z0-9_-]{35}$/.test(key);
};

/**
 * Validate authDomain format
 */
const isValidAuthDomain = (domain: string): boolean => {
  return /^[a-z0-9-]+\.firebaseapp\.com$/.test(domain);
};

/**
 * Validate projectId format
 */
const isValidProjectId = (id: string): boolean => {
  return /^[a-z0-9-]+$/.test(id);
};

// ============================================
// Configuration Loading
// ============================================

/**
 * Load Firebase configuration from environment variables
 */
const loadFirebaseConfig = (): FirebaseConfig => {
  const config: FirebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', ''),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', ''),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', ''),
  };

  return config;
};

/**
 * Validate Firebase configuration
 */
const validateFirebaseConfig = (config: FirebaseConfig): FirebaseConfigValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required fields
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId',
  ];

  for (const field of requiredFields) {
    if (!config[field] || isPlaceholder(config[field])) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate API key format
  if (config.apiKey && !isValidApiKey(config.apiKey)) {
    errors.push('Invalid Firebase API key format');
  }

  // Validate authDomain format
  if (config.authDomain && !isValidAuthDomain(config.authDomain)) {
    errors.push('Invalid Firebase auth domain format');
  }

  // Validate projectId format
  if (config.projectId && !isValidProjectId(config.projectId)) {
    errors.push('Invalid Firebase project ID format');
  }

  // Check for optional measurementId format
  if (config.measurementId && !/^G-[A-Z0-9]+$/.test(config.measurementId)) {
    warnings.push('Invalid Firebase measurement ID format (optional)');
  }

  // Check for placeholder values in production
  if (isPlaceholder(config.apiKey)) {
    errors.push('Firebase API key is a placeholder value');
  }
  if (isPlaceholder(config.projectId)) {
    errors.push('Firebase project ID is a placeholder value');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Check if we're in production mode
 */
const isProduction = (): boolean => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD === true;
  }
  return process.env.NODE_ENV === 'production';
};

// ============================================
// Connection Status Monitoring
// ============================================

let connectionStatus: FirebaseConnectionStatus = {
  connected: false,
  initializing: false,
  lastChecked: undefined,
};

/**
 * Update connection status
 */
const updateConnectionStatus = (status: Partial<FirebaseConnectionStatus>) => {
  connectionStatus = {
    ...connectionStatus,
    ...status,
    lastChecked: new Date(),
  };
};

/**
 * Get current connection status
 */
export const getFirebaseConnectionStatus = (): FirebaseConnectionStatus => {
  return connectionStatus;
};

/**
 * Reset connection status (for testing)
 */
export const resetFirebaseConnectionStatus = (): void => {
  connectionStatus = {
    connected: false,
    initializing: false,
    lastChecked: undefined,
  };
};

/**
 * Simulate checking Firebase connection
 * This should be called after Firebase is initialized
 */
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    updateConnectionStatus({ initializing: true, error: undefined });

    // Check if Firebase is initialized
    if (typeof window === 'undefined' || !window.firebase) {
      throw new Error('Firebase is not initialized');
    }

    // Simulate network check
    await new Promise(resolve => setTimeout(resolve, 100));

    updateConnectionStatus({
      connected: true,
      initializing: false,
    });

    return true;
  } catch (error) {
    const firebaseError = error instanceof Error ? error : new Error(String(error));
    updateConnectionStatus({
      connected: false,
      initializing: false,
      error: firebaseError,
    });

    return false;
  }
};

// ============================================
// Firebase Configuration
// ============================================

const firebaseConfig = loadFirebaseConfig();

const validation = validateFirebaseConfig(firebaseConfig);

// Log configuration errors in production (throw)
if (isProduction() && !validation.valid) {
  console.error(
    `[Firebase Config] Configuration errors:\n${validation.errors.join('\n')}`
  );
  throw new Error(
    `Firebase configuration errors: ${validation.errors.join(', ')}`
  );
}

// Log configuration warnings in development (non-blocking)
if (!isProduction() && validation.warnings.length > 0) {
  console.warn(
    `[Firebase Config] Configuration warnings:\n${validation.warnings.join('\n')}`
  );
}

// Log missing config in development (non-blocking)
if (!isProduction()) {
  const missingFields = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value || isPlaceholder(value))
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.warn(
      `[Firebase Config] The following environment variables are not set: ${missingFields.join(', ')}. ` +
      'Firebase functionality will be limited in development.'
    );
  }
}

// ============================================
// Export Configuration
// ============================================

export default firebaseConfig;

// Export validation result
export { validation, validateFirebaseConfig };

// Export types
export type { FirebaseConfig, FirebaseConfigValidation, FirebaseConnectionStatus };
