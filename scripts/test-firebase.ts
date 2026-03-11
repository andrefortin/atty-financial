#!/usr/bin/env node
/**
 * Firebase Test Script
 *
 * Usage:
 *   npm run test:firebase
 *   npx tsx scripts/test-firebase.ts
 *
 * This script tests the Firebase connection and configuration.
 */

import { runFirebaseTests, quickTest } from '../src/lib/__tests__/firebase.test';

// Get command line arguments
const args = process.argv.slice(2);
const isQuick = args.includes('--quick') || args.includes('-q');

async function main() {
  console.log('🔥 Firebase Connection Test\n');

  if (isQuick) {
    console.log('Running quick test...\n');
    const success = await quickTest();
    process.exit(success ? 0 : 1);
  } else {
    console.log('Running full test suite...\n');
    const { passed, failed, results } = await runFirebaseTests();

    // Print individual results
    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration.toFixed(2)}ms)` : '';
      console.log(`${icon} ${result.name}${duration}`);
      if (!result.passed || process.env.DEBUG) {
        console.log(`   ${result.message}`);
      }
    });

    process.exit(failed === 0 ? 0 : 1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
