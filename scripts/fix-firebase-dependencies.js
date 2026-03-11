#!/usr/bin/env node

/**
 * Fix Firebase Dependencies Script
 *
 * Removes the meta-package `firebase` and adds specific Firebase SDK packages
 * to fix the "Failed to resolve entry" build error.
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('Current package.json dependencies:');
console.log(Object.keys(packageJson.dependencies || {}));
console.log('');

// Update dependencies
packageJson.dependencies = {
  ...packageJson.dependencies,
  // Remove firebase meta-package
  firebase: undefined,

  // Add specific Firebase SDK packages if not already present
  'firebase/app': packageJson.dependencies['firebase/app'] || '^0.11.0',
  'firebase/auth': packageJson.dependencies['firebase/auth'] || '^0.11.0',
  'firebase/firestore': packageJson.dependencies['firebase/firestore'] || '^0.11.0',
  'firebase/analytics': packageJson.dependencies['firebase/analytics'] || '^0.11.0',
  'firebase/performance': packageJson.dependencies['firebase/performance'] || '^0.11.0',
  'firebase/app-check': packageJson.dependencies['firebase/app-check'] || '^0.11.0',
  'firebase/functions': packageJson.dependencies['firebase/functions'] || '^0.11.0',
  'firebase/messaging': packageJson.dependencies['firebase/messaging'] || '^0.11.0',
  'firebase/storage': packageJson.dependencies['firebase/storage'] || '^0.11.0',
  'firebase/database': packageJson.dependencies['firebase/database'] || '^0.11.0',
  'firebase/remote-config': packageJson.dependencies['firebase/remote-config'] || '^0.11.0',
};

console.log('Updated package.json dependencies:');
console.log(Object.keys(packageJson.dependencies).filter(dep => !dep.startsWith('@')));
console.log('');

// Remove firebase meta-package from overrides
if (packageJson.overrides && packageJson.overrides.firebase) {
  delete packageJson.overrides.firebase;
  console.log('Removed firebase override');
}

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ Package.json updated successfully');
console.log('');
console.log('Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build');
