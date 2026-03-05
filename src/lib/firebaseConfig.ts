/**
 * Firebase Configuration
 *
 * Environment-based Firebase configuration for development and production.
 * Firebase config values are loaded from environment variables.
 */

// Helper function to get environment variables
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

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', ''),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', ''),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', ''),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', ''),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', ''),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', ''),
};

// Validate required Firebase config in production
const isProduction = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD === true;
  }
  return process.env.NODE_ENV === 'production';
};

if (isProduction()) {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId',
  ] as const;

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

  if (missingFields.length > 0) {
    console.error(
      `Firebase configuration error: Missing required environment variables: ${missingFields.join(', ')}`
    );
    throw new Error(
      `Missing required Firebase configuration: ${missingFields.join(', ')}`
    );
  }
}

// Log missing config in development (non-blocking)
if (!isProduction()) {
  const missingFields = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.warn(
      `[Firebase Config] The following environment variables are not set: ${missingFields.join(', ')}. ` +
      'Firebase functionality will be limited in development.'
    );
  }
}

export default firebaseConfig;
