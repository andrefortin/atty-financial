# Firebase Test Script

This directory contains scripts for testing the Firebase connection and configuration.

## Test Firebase Connection

### Quick Test
Run a quick connection test:
```bash
npm run test:firebase:quick
```

This will:
- Check if Firebase is properly configured
- Verify the app, auth, and Firestore are initialized
- Exit with status code 0 on success, 1 on failure

### Full Test Suite
Run the complete test suite:
```bash
npm run test:firebase
```

This will test:
1. **Configuration** - Validates all required Firebase environment variables
2. **App Initialization** - Checks if Firebase app is initialized
3. **Auth Initialization** - Verifies Firebase Auth is ready
4. **Firestore Initialization** - Tests Firestore connection
5. **Analytics Initialization** - Checks Analytics (production only)
6. **Firestore Read/Write** - Tests database operations (optional)

### Output Example

```
🔥 Firebase Connection Tests
==================================================
✅ Configuration (1.23ms)
   Project: atty-financial-8cb16
✅ App Initialization (0.45ms)
   App name: [DEFAULT], Project ID: atty-financial-8cb16
✅ Auth Initialization (0.32ms)
   Not authenticated (ready for sign-in)
✅ Firestore Initialization (123.45ms)
   Database: firestore
✅ Analytics Initialization (0.12ms)
   Skipped in development (as expected)
✅ Firestore Read/Write (45.67ms)
   Skipped (permissions or configuration needed)

==================================================
✅ Passed: 6
❌ Failed: 0
📊 Total: 6
==================================================
```

## Troubleshooting

### "Missing required fields" Error
Make sure your `.env` file contains all required Firebase variables:
```bash
VITE_FIREBASE_API_KEY=AIzaSyD1ksBb-7ZUvZDzEq0GwgCbYofjq45arwA
VITE_FIREBASE_AUTH_DOMAIN=atty-financial-8cb16.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=atty-financial-8cb16
VITE_FIREBASE_STORAGE_BUCKET=atty-financial-8cb16.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=164375066359
VITE_FIREBASE_APP_ID=1:164375066359:web:d20fb751ef2567597b05f2
VITE_FIREBASE_MEASUREMENT_ID=G-4QERGV5WGC
```

### "permission-denied" Error
This is expected if:
- You haven't set up Firestore security rules
- You're trying to access collections that don't exist
- Anonymous authentication is not enabled

### Analytics not initializing in production
Analytics only initializes when:
1. Running in production mode (`import.meta.env.PROD === true`)
2. A valid measurement ID is configured
3. The browser supports Firebase Analytics

## Testing in Different Environments

### Development
Analytics is automatically disabled in development to avoid duplicate events.

### Production
To test production behavior:
```bash
npm run build
npm run preview
```

Then in another terminal:
```bash
npm run test:firebase
```

## Integration with CI/CD

Add to your CI pipeline:
```yaml
- name: Test Firebase Connection
  run: npm run test:firebase:quick
```

## Programmatic Usage

```typescript
import { quickTest, runFirebaseTests } from '@/lib/__tests__/firebase.test';

// Quick test
const isConnected = await quickTest();
if (isConnected) {
  console.log('Firebase is connected');
}

// Full test suite
const { passed, failed, results } = await runFirebaseTests();
console.log(`Passed: ${passed}, Failed: ${failed}`);
```
