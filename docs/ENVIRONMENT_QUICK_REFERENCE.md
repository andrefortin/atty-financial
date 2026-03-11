# Environment Variables Quick Reference

Quick guide for setting up environment variables for ATTY Financial.

## Quick Setup

```bash
# Copy the appropriate template
cp .env.production.example .env.production  # For production
cp .env.staging.example .env.staging        # For staging
cp .env.example .env                         # For development

# Validate your setup
npm run validate-env:production
```

## Required Variables

### Firebase (All Environments)

| Variable | Format | Example |
|----------|--------|---------|
| `VITE_FIREBASE_API_KEY` | `AIza[A-Za-z0-9_-]{35}` | `AIzaSyD1ksBb-7ZUvZDzEq0GwgCbYofjq45arwA` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `project-id.firebaseapp.com` | `atty-financial.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `[a-z0-9-]+` | `atty-financial` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `project.appspot.com` | `atty-financial.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Numeric | `164375066359` |
| `VITE_FIREBASE_APP_ID` | `1:123:web:abc` | `1:164375066359:web:d20fb751ef2567597b05f2` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXX` | `G-4QERGV5WGC` |

### BankJoy API (Required for Bank Integration)

| Variable | Example |
|----------|---------|
| `VITE_BANKJOY_API_URL` | `https://api.bankjoy.com/v1` |
| `VITE_BANKJOY_API_KEY` | `your_api_key_here` |

### API Configuration

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://api.attyfinancial.com/api/v1` |

## Environment-Specific URLs

| Environment | API URL | Firebase Project |
|-------------|---------|------------------|
| Development | `http://localhost:3001/api/v1` | `atty-financial-dev` |
| Staging | `https://staging-api.attyfinancial.com/api/v1` | `atty-financial-staging` |
| Production | `https://api.attyfinancial.com/api/v1` | `atty-financial` |

## Feature Flags

### Production Features (Enable in Production)
- `VITE_FEATURE_BANK_INTEGRATION_ENABLED=true`
- `VITE_FEATURE_AUTO_ALLOCATE_ENABLED=true`
- `VITE_FEATURE_EMAIL_NOTIFICATIONS_ENABLED=true`
- `VITE_FEATURE_SSO_ENABLED=true`
- `VITE_FEATURE_MULTI_TENANT_ENABLED=true`
- `VITE_FEATURE_ADVANCED_REPORTING_ENABLED=true`
- `VITE_FEATURE_API_ACCESS_ENABLED=true`
- `VITE_FEATURE_WEBHOOKS_ENABLED=true`
- `VITE_FEATURE_BULK_IMPORT_ENABLED=true`
- `VITE_FEATURE_CUSTOM_FIELDS_ENABLED=true`

### Beta Features (Disable in Production)
- `VITE_FEATURE_AI_INSIGHTS_ENABLED=false`
- `VITE_FEATURE_PREDICTIVE_ANALYTICS_ENABLED=false`

## Validation Commands

```bash
# List all required variables
npm run validate-env:list

# Validate development environment
npm run validate-env:dev

# Validate staging environment
npm run validate-env:staging

# Validate production environment
npm run validate-env:production

# Exit with error code if invalid (for CI/CD)
npm run validate-env:check
```

## Security Notes

1. **Never commit** `.env` files to version control
2. **Always use HTTPS** in production
3. **Rotate API keys** regularly
4. **Use read-only** API keys for BankJoy
5. **Disable debug mode** in production

## Getting Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** > **General** > **Your Apps**
4. Select or create a **Web App**
5. Copy the configuration values

## Getting BankJoy API Keys

1. Contact [BankJoy Support](https://api.bankjoy.com/portal)
2. Create an account
3. Generate API keys with read-only permissions

## Common Issues

### "Environment variable not found"
- Ensure variable is prefixed with `VITE_`
- Restart dev server after changing `.env`
- Check `.env` is in project root

### "Invalid format"
- Check format against the table above
- Remove any extra quotes or spaces
- Ensure values match expected patterns

### "Placeholder value detected"
- Replace placeholder values like `your_api_key` with actual values
- Never use test values in production

## Support

For more information, see:
- [Full Deployment Guide](./DEPLOYMENT.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [BankJoy API Documentation](https://api.bankjoy.com/docs)

---

**Last Updated**: March 5, 2026
