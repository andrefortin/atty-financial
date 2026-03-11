# Firebase Cloud Functions

This directory contains the Cloud Functions for the ATTY Financial application.

## Overview

Cloud Functions are deployed to Firebase and run in response to events. They handle:
- **Audit Logging**: Automatically log all database changes
- **Data Consistency**: Update counters and relationships
- **Scheduled Tasks**: Daily cleanup and alerts
- **Role Management**: Enforce security rules server-side
- **HTTP Endpoints**: API endpoints for common operations

## Deployment

### Install Dependencies
```bash
cd functions
npm install
```

### Build Functions
```bash
npm run build
```

### Deploy Functions
```bash
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:onUserWrite
```

## Available Functions

### Audit Logging Functions

| Function | Trigger | Description |
|----------|----------|-------------|
| `onUserWrite` | Firestore trigger | Logs all user changes |
| `onFirmWrite` | Firestore trigger | Logs all firm changes |
| `onMatterWrite` | Firestore trigger | Logs all matter changes |
| `onTransactionWrite` | Firestore trigger | Logs all transaction changes |

### Data Consistency Functions

| Function | Trigger | Description |
|----------|----------|-------------|
| `onUserCreate` | Firestore trigger | Increments firm member count |
| `onMatterCreate` | Firestore trigger | Increments firm matter count |
| `checkMatterAlerts` | Scheduled (daily 9 AM) | Checks for matters needing alerts |

### Role Management Functions

| Function | Trigger | Description |
|----------|----------|-------------|
| `onUserBeforeCreate` | Firestore trigger | Validates user creation permissions |

### HTTP Functions

| Function | Type | Description |
|----------|------|-------------|
| `healthCheck` | HTTPS GET | Health check endpoint |
| `getUserPermissions` | Callable | Get user role and permissions |

### Scheduled Tasks

| Function | Schedule | Description |
|----------|----------|-------------|
| `cleanupOldAuditLogs` | Sundays 2 AM | Deletes audit logs older than 1 year |
| `cleanupOldNotifications` | Daily 3 AM | Deletes read notifications older than 30 days |

## Local Development

### Start Firebase Emulators
```bash
firebase emulators:start
```

### Run Functions Locally
```bash
npm run shell
```

### Test Functions
```bash
# Test health check
curl http://localhost:5001/atty-financial-8cb16/us-central1/healthCheck

# Test callable function
firebase functions:shell
> getUserPermissions({ data: {} }, { auth: { uid: 'test-user-id' } })
```

## Structure

```
functions/
├── src/
│   └── index.ts          # Main functions file
├── lib/                  # Compiled JavaScript (generated)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── .gitignore           # Git ignore rules
```

## Adding New Functions

1. Create the function in `src/index.ts`
2. Export the function with a descriptive name
3. Build the functions: `npm run build`
4. Deploy: `firebase deploy --only functions`

### Example: New Firestore Trigger

```typescript
export const onMyDocumentWrite = functions.firestore
  .document('mycollection/{docId}')
  .onWrite(async (change, context) => {
    const { docId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Your logic here

    return null;
  });
```

### Example: New Scheduled Function

```typescript
export const myScheduledTask = functions.pubsub
  .schedule('0 9 * * *')  // Daily at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Your logic here

    return null;
  });
```

## Best Practices

1. **Keep functions small and focused**
2. **Handle errors gracefully**
3. **Use batch operations when possible**
4. **Avoid infinite loops in triggers**
5. **Test locally before deploying**
6. **Monitor function logs**: `firebase functions:log`
7. **Set appropriate memory and timeout limits**

## Monitoring

### View Logs
```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only onUserWrite

# Real-time logs
firebase functions:log --only onUserWrite
```

### View Function Status
```bash
firebase functions:list
```

## Troubleshooting

### Function Not Triggering
- Check if Firestore rules allow the write
- Verify function is deployed: `firebase functions:list`
- Check logs for errors

### Function Timeout
- Increase timeout in function definition
- Optimize function logic
- Use batch operations

### High Costs
- Review function execution count
- Optimize trigger conditions
- Add where clauses to reduce matches

## Security

Functions run with admin privileges and bypass security rules. Always:
- Validate input data
- Check authentication in callable functions
- Validate permissions before operations
- Log sensitive operations in audit logs

## Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Functions Pricing](https://firebase.google.com/docs/functions/pricing)
- [Cloud Functions Quotas](https://firebase.google.com/docs/functions/quotas)
