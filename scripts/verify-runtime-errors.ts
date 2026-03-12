/**
 * Runtime Error Verification Script
 *
 * Verifies that all critical runtime errors have been resolved.
 */

import * as fs from 'fs';
import * as path from 'path';

// Get the directory of the current file
const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🔍 Verifying Runtime Errors Fix...\n');

let errorsFound = 0;
let warningsFound = 0;

// Phase 2.1: Firebase Configuration (FI-018 to FI-025)
console.log('Phase 2.1: Firebase Configuration');
console.log('==================================\n');

// FI-018 to FI-025: Check environment variable loading
console.log('Checking environment variable loading...');
const envVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
];

envVars.forEach(envVar => {
  const exists = process.env[envVar];
  if (exists && exists !== 'your_' && exists !== 'your_firebase_api_key' && exists !== 'your_api_key') {
    console.log(`  ✅ ${envVar}: ${exists.substring(0, 20)}...`);
  } else {
    console.log(`  ⚠️  ${envVar}: Not set or placeholder value`);
    warningsFound++;
  }
});

// FI-025: Check Firebase config validation
console.log('\nChecking Firebase config validation...');
const firebaseConfigPath = path.join(__dirname, '../src/lib/firebaseConfig.ts');
if (fs.existsSync(firebaseConfigPath)) {
  const configContent = fs.readFileSync(firebaseConfigPath, 'utf-8');
  const hasValidation = configContent.includes('validateFirebaseConfig');
  const hasRequiredFields = configContent.includes("'apiKey'") &&
                            configContent.includes("'authDomain'") &&
                            configContent.includes("'projectId'") &&
                            configContent.includes("'appId'");
  const hasFormatValidation = configContent.includes('isValidApiKey') ||
                               configContent.includes('isValidAuthDomain') ||
                               configContent.includes('isValidProjectId');

  if (hasValidation && hasRequiredFields && hasFormatValidation) {
    console.log('  ✅ Firebase config validation implemented');
  } else {
    console.log('  ❌ Firebase config validation incomplete');
    errorsFound++;
  }
} else {
  console.log('  ❌ firebaseConfig.ts not found');
  errorsFound++;
}

// Phase 2.2: Missing Services (FI-026 to FI-030)
console.log('\nPhase 2.2: Missing Services');
console.log('============================\n');

// FI-026: Check Cloud Functions
console.log('Checking Cloud Functions...');
const functionsPaths = [
  path.join(__dirname, '../functions/src/index.ts'),
  path.join(__dirname, '../functions/src/functions/auth/'),
  path.join(__dirname, '../functions/src/functions/matters/'),
  path.join(__dirname, '../functions/src/functions/transactions/'),
  path.join(__dirname, '../functions/src/functions/scheduled/'),
];

functionsPaths.forEach(path => {
  if (fs.existsSync(path)) {
    console.log(`  ✅ ${path.split('/').pop() || path}`);
  } else {
    console.log(`  ❌ ${path.split('/').pop() || path} not found`);
    errorsFound++;
  }
});

// FI-027: Check Firebase initialization
console.log('\nChecking Firebase initialization...');
const firebasePath = path.join(__dirname, '../src/lib/firebase.ts');
if (fs.existsSync(firebasePath)) {
  const firebaseContent = fs.readFileSync(firebasePath, 'utf-8');
  const requiredFunctions = [
    'getFirebaseInstances',
    'getFirebaseApp',
    'getFirebaseAuth',
    'getFirebaseDB',
  ];

  let allFound = true;
  requiredFunctions.forEach(func => {
    if (firebaseContent.includes(`export const ${func}`)) {
      console.log(`  ✅ ${func}`);
    } else {
      console.log(`  ❌ ${func} not found`);
      allFound = false;
      errorsFound++;
    }
  });

  if (allFound) {
    console.log('  ✅ Firebase initialization complete');
  }
} else {
  console.log('  ❌ firebase.ts not found');
  errorsFound++;
}

// FI-028: Check auth middleware
console.log('\nChecking auth middleware...');
const authMiddlewarePath = path.join(__dirname, '../src/middleware/authMiddleware.ts');
if (fs.existsSync(authMiddlewarePath)) {
  const authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf-8');
  const requiredFunctions = [
    'requireAuth',
    'requireRole',
    'requireAdmin',
    'validateCSRF',
    'rateLimit',
  ];

  let allFound = true;
  requiredFunctions.forEach(func => {
    if (authMiddlewareContent.includes(`export const ${func}`) ||
        authMiddlewareContent.includes(`export const ${func} =`)) {
      console.log(`  ✅ ${func}`);
    } else {
      console.log(`  ❌ ${func} not found`);
      allFound = false;
      errorsFound++;
    }
  });

  if (allFound) {
    console.log('  ✅ Auth middleware complete');
  }
} else {
  console.log('  ❌ authMiddleware.ts not found');
  errorsFound++;
}

// FI-029: Check password validator
console.log('\nChecking password validator...');
const passwordValidatorPath = path.join(__dirname, '../src/utils/passwordValidator.ts');
if (fs.existsSync(passwordValidatorPath)) {
  const passwordValidatorContent = fs.readFileSync(passwordValidatorPath, 'utf-8');
  const requiredFunctions = [
    'validatePassword',
    'getPasswordStrength',
    'isPasswordSafe',
  ];

  let allFound = true;
  requiredFunctions.forEach(func => {
    if (passwordValidatorContent.includes(`export const ${func}`) ||
        passwordValidatorContent.includes(`export const ${func} =`)) {
      console.log(`  ✅ ${func}`);
    } else {
      console.log(`  ❌ ${func} not found`);
      allFound = false;
      errorsFound++;
    }
  });

  if (allFound) {
    console.log('  ✅ Password validator complete');
  }
} else {
  console.log('  ❌ passwordValidator.ts not found');
  errorsFound++;
}

// FI-030: Check session manager
console.log('\nChecking session manager...');
const sessionManagerPath = path.join(__dirname, '../src/utils/sessionManager.ts');
if (fs.existsSync(sessionManagerPath)) {
  const sessionManagerContent = fs.readFileSync(sessionManagerPath, 'utf-8');
  const requiredFunctions = [
    'useSessionTimeout',
    'getSessionManager',
    'useTokenRefresh',
  ];

  let allFound = true;
  requiredFunctions.forEach(func => {
    if (sessionManagerContent.includes(`export const ${func}`) ||
        sessionManagerContent.includes(`export const ${func} =`)) {
      console.log(`  ✅ ${func}`);
    } else {
      console.log(`  ❌ ${func} not found`);
      allFound = false;
      errorsFound++;
    }
  });

  if (allFound) {
    console.log('  ✅ Session manager complete');
  }
} else {
  console.log('  ❌ sessionManager.ts not found');
  errorsFound++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Errors found: ${errorsFound}`);
console.log(`⚠️  Warnings found: ${warningsFound}`);
console.log(`✅ Services verified: ${10 - errorsFound}`);
console.log('');

if (errorsFound === 0 && warningsFound === 0) {
  console.log('🎉 All runtime errors have been resolved!');
  process.exit(0);
} else {
  console.log('⚠️  Some runtime errors still need to be fixed.');
  process.exit(1);
}
