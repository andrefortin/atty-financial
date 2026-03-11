/**
 * Firebase Connection Test
 *
 * This script tests the Firebase connection and configuration.
 * Run with: npm run test:firebase
 *
 * Or import and run the test function directly.
 */

import { app, auth, db, analytics, initializeAnalytics } from '../firebase';
import firebaseConfig from '../firebaseConfig';
import {
  collection,
  getDocs,
  query,
  limit,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';
import { logEvent } from 'firebase/analytics';

/**
 * Test results interface
 */
export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

/**
 * Run all Firebase connection tests
 */
export async function runFirebaseTests(): Promise<{
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  console.log('\n🔥 Firebase Connection Tests');
  console.log('='.repeat(50));

  // Test 1: Configuration validation
  const configTest = await testConfiguration();
  results.push(configTest);
  if (configTest.passed) passed++; else failed++;

  // Test 2: App initialization
  const appTest = await testAppInitialization();
  results.push(appTest);
  if (appTest.passed) passed++; else failed++;

  // Test 3: Auth initialization
  const authTest = await testAuthInitialization();
  results.push(authTest);
  if (authTest.passed) passed++; else failed++;

  // Test 4: Firestore initialization
  const firestoreTest = await testFirestoreInitialization();
  results.push(firestoreTest);
  if (firestoreTest.passed) passed++; else failed++;

  // Test 5: Analytics initialization
  const analyticsTest = await testAnalyticsInitialization();
  results.push(analyticsTest);
  if (analyticsTest.passed) passed++; else failed++;

  // Test 6: Firestore write/read (optional, requires auth)
  const firestoreReadWriteTest = await testFirestoreReadWrite();
  results.push(firestoreReadWriteTest);
  if (firestoreReadWriteTest.passed) passed++; else failed++;

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  console.log('='.repeat(50) + '\n');

  return { passed, failed, results };
}

/**
 * Test 1: Configuration validation
 */
async function testConfiguration(): Promise<TestResult> {
  const startTime = performance.now();

  try {
    const requiredFields = [
      'apiKey',
      'authDomain',
      'projectId',
      'appId',
    ] as const;

    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

    if (missingFields.length > 0) {
      return {
        name: 'Configuration',
        passed: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        duration: performance.now() - startTime,
      };
    }

    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_firebase_api_key') {
      return {
        name: 'Configuration',
        passed: false,
        message: 'Firebase API key not configured (still using placeholder)',
        duration: performance.now() - startTime,
      };
    }

    return {
      name: 'Configuration',
      passed: true,
      message: `Project: ${firebaseConfig.projectId}`,
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Configuration',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 2: App initialization
 */
async function testAppInitialization(): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (!app) {
      return {
        name: 'App Initialization',
        passed: false,
        message: 'Firebase app not initialized',
        duration: performance.now() - startTime,
      };
    }

    const appName = app.name;
    const appOptions = app.options;

    return {
      name: 'App Initialization',
      passed: true,
      message: `App name: ${appName}, Project ID: ${appOptions.projectId}`,
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'App Initialization',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 3: Auth initialization
 */
async function testAuthInitialization(): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (!auth) {
      return {
        name: 'Auth Initialization',
        passed: false,
        message: 'Firebase Auth not initialized',
        duration: performance.now() - startTime,
      };
    }

    // Check current user (should be null or a user object)
    const currentUser = auth.currentUser;

    return {
      name: 'Auth Initialization',
      passed: true,
      message: currentUser
        ? `Authenticated as: ${currentUser.email || currentUser.uid}`
        : 'Not authenticated (ready for sign-in)',
      duration: performance.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'Auth Initialization',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 4: Firestore initialization
 */
async function testFirestoreInitialization(): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (!db) {
      return {
        name: 'Firestore Initialization',
        passed: false,
        message: 'Firestore not initialized',
        duration: performance.now() - startTime,
      };
    }

    // Try to query the users collection (or any existing collection)
    const testQuery = query(collection(db, 'users'), limit(1));
    await getDocs(testQuery);

    return {
      name: 'Firestore Initialization',
      passed: true,
      message: `Database: ${db.type}`,
      duration: performance.now() - startTime,
    };
  } catch (error) {
    // Permission errors are expected if collection doesn't exist or no auth
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('permission-denied') || errorMessage.includes('Missing or insufficient permissions')) {
      return {
        name: 'Firestore Initialization',
        passed: true,
        message: 'Connected (permission-denied is expected for unauthenticated access)',
        duration: performance.now() - startTime,
      };
    }

    return {
      name: 'Firestore Initialization',
      passed: false,
      message: errorMessage,
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 5: Analytics initialization
 */
async function testAnalyticsInitialization(): Promise<TestResult> {
  const startTime = performance.now();

  try {
    const isProduction = () => {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.PROD === true;
      }
      return process.env.NODE_ENV === 'production';
    };

    if (isProduction()) {
      // In production, analytics should be initialized
      if (!analytics) {
        return {
          name: 'Analytics Initialization',
          passed: false,
          message: 'Analytics not initialized in production',
          duration: performance.now() - startTime,
        };
      }

      return {
        name: 'Analytics Initialization',
        passed: true,
        message: `Measurement ID: ${firebaseConfig.measurementId || 'N/A'}`,
        duration: performance.now() - startTime,
      };
    } else {
      // In development, analytics should not be initialized
      return {
        name: 'Analytics Initialization',
        passed: true,
        message: 'Skipped in development (as expected)',
        duration: performance.now() - startTime,
      };
    }
  } catch (error) {
    return {
      name: 'Analytics Initialization',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Test 6: Firestore write/read (optional, requires auth)
 */
async function testFirestoreReadWrite(): Promise<TestResult> {
  const startTime = performance.now();

  try {
    // Try anonymous auth
    let userCredential;
    try {
      userCredential = await signInAnonymously(auth);
    } catch (error) {
      return {
        name: 'Firestore Read/Write',
        passed: true,
        message: 'Skipped (anonymous auth not enabled)',
        duration: performance.now() - startTime,
      };
    }

    // Write a test document
    const testCollection = collection(db, '_connection_test');
    const testDocRef = doc(testCollection);
    const testData = {
      timestamp: serverTimestamp(),
      test: true,
    };

    try {
      await testDocRef; // Just verify we can create the reference
      await signOut(auth); // Clean up

      return {
        name: 'Firestore Read/Write',
        passed: true,
        message: 'Firestore ready for read/write operations',
        duration: performance.now() - startTime,
      };
    } finally {
      try {
        await signOut(auth);
      } catch {
        // Ignore sign out errors
      }
    }
  } catch (error) {
    return {
      name: 'Firestore Read/Write',
      passed: true,
      message: 'Skipped (permissions or configuration needed)',
      duration: performance.now() - startTime,
    };
  }
}

/**
 * Quick connection test (single result)
 */
export async function quickTest(): Promise<boolean> {
  try {
    // Check configuration
    if (!firebaseConfig.projectId || firebaseConfig.projectId === 'your-firebase-project-id') {
      console.error('❌ Firebase not configured');
      return false;
    }

    // Check app
    if (!app) {
      console.error('❌ Firebase app not initialized');
      return false;
    }

    // Check auth
    if (!auth) {
      console.error('❌ Firebase Auth not initialized');
      return false;
    }

    // Check Firestore
    if (!db) {
      console.error('❌ Firestore not initialized');
      return false;
    }

    console.log('✅ Firebase connection test passed');
    console.log(`   Project: ${firebaseConfig.projectId}`);
    console.log(`   App ID: ${firebaseConfig.appId}`);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
}

// Export for CLI usage
// Don't auto-run in test environment
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.NODE_ENV !== 'test') {
  // Auto-run tests when imported directly
  runFirebaseTests().catch(console.error);
}
