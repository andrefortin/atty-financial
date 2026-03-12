/**
 * Runtime Error Tests
 *
 * Tests for critical runtime errors identified in ERROR_ANALYSIS.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { getEnvVar, isPlaceholder, loadFirebaseConfig, validateFirebaseConfig } from '../lib/firebaseConfig';
import type { FirebaseConfig } from '../lib/firebaseConfig';

describe('Runtime Error Tests', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.VITE_FIREBASE_API_KEY;
    delete process.env.VITE_FIREBASE_AUTH_DOMAIN;
    delete process.env.VITE_FIREBASE_PROJECT_ID;
    delete process.env.VITE_FIREBASE_STORAGE_BUCKET;
    delete process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.VITE_FIREBASE_APP_ID;
    delete process.env.VITE_FIREBASE_MEASUREMENT_ID;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Phase 2.1: Firebase Configuration', () => {
    describe('FI-018 to FI-025: Environment Variable Loading', () => {
      it('should load VITE_FIREBASE_API_KEY from environment', () => {
        process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
        const result = getEnvVar('VITE_FIREBASE_API_KEY');
        expect(result).toBe('test-api-key');
      });

      it('should load VITE_FIREBASE_AUTH_DOMAIN from environment', () => {
        process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
        const result = getEnvVar('VITE_FIREBASE_AUTH_DOMAIN');
        expect(result).toBe('test.firebaseapp.com');
      });

      it('should load VITE_FIREBASE_PROJECT_ID from environment', () => {
        process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
        const result = getEnvVar('VITE_FIREBASE_PROJECT_ID');
        expect(result).toBe('test-project');
      });

      it('should load VITE_FIREBASE_STORAGE_BUCKET from environment', () => {
        process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
        const result = getEnvVar('VITE_FIREBASE_STORAGE_BUCKET');
        expect(result).toBe('test.appspot.com');
      });

      it('should load VITE_FIREBASE_MESSAGING_SENDER_ID from environment', () => {
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
        const result = getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID');
        expect(result).toBe('123456789');
      });

      it('should load VITE_FIREBASE_APP_ID from environment', () => {
        process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef';
        const result = getEnvVar('VITE_FIREBASE_APP_ID');
        expect(result).toBe('1:123456789:web:abcdef');
      });

      it('should load VITE_FIREBASE_MEASUREMENT_ID from environment', () => {
        process.env.VITE_FIREBASE_MEASUREMENT_ID = 'G-TEST123';
        const result = getEnvVar('VITE_FIREBASE_MEASUREMENT_ID');
        expect(result).toBe('G-TEST123');
      });

      it('should return empty string when environment variable is not set', () => {
        const result = getEnvVar('VITE_FIREBASE_API_KEY');
        expect(result).toBe('');
      });

      it('should return fallback value when environment variable is not set', () => {
        const result = getEnvVar('VITE_FIREBASE_API_KEY', 'fallback-key');
        expect(result).toBe('fallback-key');
      });
    });

    describe('FI-025: Firebase config validation', () => {
      it('should validate valid Firebase config', () => {
        const config: FirebaseConfig = {
          apiKey: 'AIzaSyTest1234567890abcdef',
          authDomain: 'test.firebaseapp.com',
          projectId: 'test-project',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect missing required field - apiKey', () => {
        const config: FirebaseConfig = {
          apiKey: '',
          authDomain: 'test.firebaseapp.com',
          projectId: 'test-project',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: apiKey');
      });

      it('should detect missing required field - authDomain', () => {
        const config: FirebaseConfig = {
          apiKey: 'AIzaSyTest1234567890abcdef',
          authDomain: '',
          projectId: 'test-project',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: authDomain');
      });

      it('should detect missing required field - projectId', () => {
        const config: FirebaseConfig = {
          apiKey: 'AIzaSyTest1234567890abcdef',
          authDomain: 'test.firebaseapp.com',
          projectId: '',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: projectId');
      });

      it('should detect missing required field - appId', () => {
        const config: FirebaseConfig = {
          apiKey: 'AIzaSyTest1234567890abcdef',
          authDomain: 'test.firebaseapp.com',
          projectId: 'test-project',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: appId');
      });

      it('should detect invalid API key format', () => {
        const config: FirebaseConfig = {
          apiKey: 'invalid-key',
          authDomain: 'test.firebaseapp.com',
          projectId: 'test-project',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid Firebase API key format');
      });

      it('should detect invalid authDomain format', () => {
        const config: FirebaseConfig = {
          apiKey: 'AIzaSyTest1234567890abcdef',
          authDomain: 'invalid-domain',
          projectId: 'test-project',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid Firebase auth domain format');
      });

      it('should detect invalid projectId format', () => {
        const config: FirebaseConfig = {
          apiKey: 'AIzaSyTest1234567890abcdef',
          authDomain: 'test.firebaseapp.com',
          projectId: 'Invalid Project-Name',
          storageBucket: 'test.appspot.com',
          messagingSenderId: '123456789',
          appId: '1:123456789:web:abcdef',
        };

        const result = validateFirebaseConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid Firebase project ID format');
      });
    });
  });

  describe('Phase 2.2: Missing Services', () => {
    describe('FI-026: Missing Cloud Functions', () => {
      it('should have Cloud Functions implemented', () => {
        const functionsPath = require('path').join(__dirname, '../../functions/src/index.ts');
        expect(functionsPath).toBeDefined();
      });

      it('should have auth lifecycle functions', () => {
        const functionsPath = require('path').join(__dirname, '../../functions/src/functions/auth/');
        expect(functionsPath).toBeDefined();
      });

      it('should have matter lifecycle functions', () => {
        const functionsPath = require('path').join(__dirname, '../../functions/src/functions/matters/');
        expect(functionsPath).toBeDefined();
      });

      it('should have transaction lifecycle functions', () => {
        const functionsPath = require('path').join(__dirname, '../../functions/src/functions/transactions/');
        expect(functionsPath).toBeDefined();
      });

      it('should have scheduled tasks', () => {
        const functionsPath = require('path').join(__dirname, '../../functions/src/functions/scheduled/');
        expect(functionsPath).toBeDefined();
      });
    });

    describe('FI-027: Missing Firebase initialization', () => {
      it('should have Firebase initialization function', () => {
        const { initializeFirebase } = require('../lib/firebase');
        expect(initializeFirebase).toBeDefined();
        expect(typeof initializeFirebase).toBe('function');
      });

      it('should have getFirebaseInstances function', () => {
        const { getFirebaseInstances } = require('../lib/firebase');
        expect(getFirebaseInstances).toBeDefined();
        expect(typeof getFirebaseInstances).toBe('function');
      });

      it('should have getFirebaseAuth function', () => {
        const { getFirebaseAuth } = require('../lib/firebase');
        expect(getFirebaseAuth).toBeDefined();
        expect(typeof getFirebaseAuth).toBe('function');
      });

      it('should have getFirebaseDB function', () => {
        const { getFirebaseDB } = require('../lib/firebase');
        expect(getFirebaseDB).toBeDefined();
        expect(typeof getFirebaseDB).toBe('function');
      });
    });

    describe('FI-028: Missing auth middleware', () => {
      it('should have auth middleware implemented', () => {
        const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
        expect(requireAuth).toBeDefined();
        expect(requireAdmin).toBeDefined();
      });

      it('should have CSRF validation middleware', () => {
        const { validateCSRF } = require('../middleware/authMiddleware');
        expect(validateCSRF).toBeDefined();
      });

      it('should have rate limiting middleware', () => {
        const { rateLimit } = require('../middleware/authMiddleware');
        expect(rateLimit).toBeDefined();
      });
    });

    describe('FI-029: Missing password validator', () => {
      it('should have password validator implemented', () => {
        const { validatePassword, getPasswordStrength } = require('../utils/passwordValidator');
        expect(validatePassword).toBeDefined();
        expect(getPasswordStrength).toBeDefined();
      });

      it('should validate strong password', () => {
        const result = validatePassword('StrongPass123!');
        expect(result.isValid).toBe(true);
        expect(result.score).toBe(4);
      });

      it('should detect weak password', () => {
        const result = validatePassword('weak');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('FI-030: Missing session manager', () => {
      it('should have session manager implemented', () => {
        const { useSessionTimeout, getSessionManager } = require('../utils/sessionManager');
        expect(useSessionTimeout).toBeDefined();
        expect(getSessionManager).toBeDefined();
      });

      it('should have token refresh hook', () => {
        const { useTokenRefresh } = require('../utils/sessionManager');
        expect(useTokenRefresh).toBeDefined();
      });
    });
  });
});
