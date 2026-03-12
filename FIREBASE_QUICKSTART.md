# Firebase Integration - Quick Start Guide

Get ATTY Financial up and running with Firebase in 10 minutes.

## Step 1: Set Up Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create Project"**
3. Name your project (e.g., "atty-financial-8cb16")
4. Enable **Google Analytics** (optional but recommended)
5. Wait for project creation

## Step 2: Enable Authentication (2 minutes)

1. In your Firebase project, go to **Authentication**
2. Click **Get Started**
3. Click **Sign-in method** tab
4. Enable **Email/Password** provider
5. Click **Save**

## Step 3: Create Web App (2 minutes)

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **</>** (Web) icon
4. Register app (name it "atty-financial-web")
5. Copy the configuration values

## Step 4: Configure Environment Variables (1 minute)

Create or update the `.env` file in the root directory:

```bash
# Copy these values from Firebase Console
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=atty-financial-8cb16.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=atty-financial-8cb16
VITE_FIREBASE_STORAGE_BUCKET=atty-financial-8cb16.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Step 5: Install Dependencies (1 minute)

```bash
npm install
```

## Step 6: Start Development Server (1 minute)

```bash
npm run dev
```

## Step 7: Test Authentication (2 minutes)

1. Open `http://localhost:5173` in your browser
2. You should see the login page
3. Click "Sign up" to create a test account
4. Fill in the registration form
5. You'll be redirected to the dashboard

## Step 8: Test CRUD Operations (3 minutes)

### Test Matter Creation

1. Navigate to "Matters" page
2. Click "Create Matter" (or add the button to your UI)
3. Fill in the matter details
4. Save the matter
5. Verify it appears in the list

### Test Transactions

1. Navigate to "Transactions" page
2. Create a new transaction
3. Verify it appears in the list

### Test Notifications

1. Create a notification
2. Check the "Notifications" page
3. Verify it appears

## Step 9: Deploy Cloud Functions (5 minutes)

```bash
cd functions
npm install
npm run deploy
```

This will deploy:
- Auth lifecycle functions
- Matter handlers
- Transaction handlers
- Scheduled tasks

## Step 10: Deploy Firestore Rules (2 minutes)

1. Go to [Firestore Console](https://console.firebase.google.com/project/atty-financial-8cb16/firestore)
2. Click **Rules** tab
3. Copy the rules from `FIREBASE_INTEGRATION.md`
4. Click **Deploy**

## Common Issues & Solutions

### "Firebase is not initialized"

**Solution:** Make sure all environment variables are set correctly in `.env` file.

### "Authentication required"

**Solution:** You need to be logged in. Navigate to `/login` and sign in.

### "Permission denied"

**Solution:** Check Firestore security rules and verify you have the correct role.

### "Cloud Functions not working"

**Solution:** Check Cloud Functions logs in Firebase Console.

## Testing Your Implementation

### Test Authentication Flow

```bash
# 1. Start the app
npm run dev

# 2. Test registration
# Navigate to /register and create an account

# 3. Test login
# Navigate to /login and sign in

# 4. Test logout
# Click logout in the navbar

# 5. Test session timeout
# Wait 30 minutes (or set a shorter timeout for testing)
```

### Test Matter Operations

```bash
# 1. Create a matter
# Use the createMatter function from the matters service

# 2. Get all matters
# Use the getMatters function

# 3. Update a matter
# Use the updateMatter function

# 4. Delete a matter
# Use the deleteMatter function
```

### Test Transaction Operations

```bash
# 1. Create a transaction
# Use the createTransaction function

# 2. Get transactions
# Use the getTransactions function

# 3. Update a transaction
# Use the updateTransaction function

# 4. Delete a transaction
# Use the deleteTransaction function
```

## Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Deploy Cloud Functions
cd functions && npm run deploy

# View Cloud Functions logs
firebase functions:log

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View Firestore data
firebase firestore:export ./export-dir
```

## Next Steps

1. **Customize the UI** - Update the pages to match your branding
2. **Add more features** - Implement additional functionality
3. **Set up monitoring** - Configure Firebase Analytics and Crashlytics
4. **Add email templates** - Create email notifications for users
5. **Implement file upload** - Add document upload functionality
6. **Set up automated backups** - Configure Firestore backups

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Firebase Documentation](https://firebase.google.com/docs/web/setup)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)

## Getting Help

If you encounter issues:

1. Check the [Firebase Integration Documentation](./FIREBASE_INTEGRATION.md)
2. Review the [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
3. Check Firebase Console for logs and errors
4. Review Cloud Functions logs
5. Check browser console for errors

## Success Criteria

You know everything is working when:

- ✅ You can register a new user
- ✅ You can log in with your credentials
- ✅ You can access protected routes
- ✅ You can create matters
- ✅ You can create transactions
- ✅ You can create notifications
- ✅ Real-time listeners work
- ✅ Cloud functions execute
- ✅ Session timeout works
- ✅ CSRF tokens are validated

## Troubleshooting

### Firebase not connecting

```bash
# Check environment variables
cat .env

# Verify Firebase config
npm run validate:env

# Check browser console for errors
```

### Authentication not working

```bash
# Enable Email/Password in Firebase Console
# Verify environment variables are set
# Check user role in Firestore
```

### Cloud functions not deploying

```bash
# Check functions logs
firebase functions:log

# Verify Node.js version
node --version

# Check function code for syntax errors
npm run lint
```

### Firestore rules not applying

```bash
# Verify rules are deployed
firebase deploy --only firestore:rules

# Check rules in Firebase Console
```

## Keep Learning

1. Read the [Firebase Integration Documentation](./FIREBASE_INTEGRATION.md)
2. Explore the code examples in the source files
3. Try the examples in `src/services/firebase/`
4. Experiment with Cloud Functions
5. Test different query patterns

## Quick Reference

### Authentication

```typescript
import { useAuth } from '../hooks/useAuth';

const { user, login, logout } = useAuth();

// Login
await login('user@example.com', 'password');

// Logout
await logout();
```

### Firestore Operations

```typescript
import { createMatter, getMatters } from './services/firebase';

// Create matter
const result = await createMatter({
  id: 'matter-123',
  clientName: 'John Doe',
});

// Get matters
const { matters } = await getMatters({
  status: 'Active',
});
```

### Real-time Listeners

```typescript
import { listenToMatters } from './services/firebase';

const unsubscribe = listenToMatters({
  firmId: 'firm-123',
  onUpdate: (matters) => {
    console.log('Matters:', matters);
  },
});

// Unsubscribe when done
unsubscribe();
```

## That's It! 🎉

You now have a fully functional Firebase integration for ATTY Financial. Start building your features and enjoy the power of Firebase!

For detailed information, refer to:
- [Firebase Integration Documentation](./FIREBASE_INTEGRATION.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
