# Deployment Guide for ATTY Financial

This guide covers all aspects of deploying ATTY Financial to development, staging, and production environments.

## Table of Contents

- [Overview](#overview)
- [Environments](#environments)
- [Environment Variables](#environment-variables)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Firebase Deployment](#firebase-deployment)
- [Environment Validation](#environment-validation)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Overview

ATTY Financial uses a three-tier environment structure:

1. **Development** - Local development environment
2. **Staging** - Pre-production testing environment
3. **Production** - Live production environment

Each environment has its own:
- Firebase project
- Environment variables
- Feature flags
- API endpoints
- Analytics configuration

---

## Environments

### Development Environment

- **Purpose**: Local development and testing
- **Firebase Project**: `atty-financial-dev` (optional - can use emulator)
- **API**: Local or staging API
- **Analytics**: Disabled or sandbox mode
- **Feature Flags**: All features enabled, including beta features

### Staging Environment

- **Purpose**: Pre-production testing and QA
- **Firebase Project**: `atty-financial-staging`
- **API**: Staging API (`https://staging-api.attyfinancial.com`)
- **Analytics**: Enabled with staging keys
- **Feature Flags**: All features enabled, including beta features
- **Debug**: Enabled for troubleshooting

### Production Environment

- **Purpose**: Live production deployment
- **Firebase Project**: `atty-financial` (or `atty-financial-production`)
- **API**: Production API (`https://api.attyfinancial.com`)
- **Analytics**: Enabled with production keys
- **Feature Flags**: Production features only (beta features disabled)
- **Debug**: Disabled

---

## Environment Variables

### Setting Up Environment Variables

1. **Copy the appropriate template**:
   ```bash
   # For development
   cp .env.example .env

   # For staging
   cp .env.staging.example .env.staging

   # For production
   cp .env.production.example .env.production
   ```

2. **Fill in the actual values** for your environment
3. **Never commit** `.env`, `.env.staging`, or `.env.production` to version control
4. **Add to .gitignore**:
   ```
   .env
   .env.local
   .env.staging
   .env.production
   ```

### Environment Variable Categories

#### 1. Firebase Configuration

Required for all environments:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_USE_EMULATOR=false
VITE_FIREBASE_ANALYTICS_ENABLED=true
```

**Getting Firebase Config**:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** > **General** > **Your Apps**
4. Select or create a **Web App**
5. Copy the configuration values

#### 2. BankJoy API Configuration

Required for bank integration:

```bash
VITE_BANKJOY_API_URL=https://api.bankjoy.com/v1
VITE_BANKJOY_API_KEY=your_bankjoy_api_key
VITE_BANKJOY_API_TIMEOUT=30000
VITE_BANKJOY_MAX_RETRIES=3
VITE_BANKJOY_RATE_LIMIT_ENABLED=true
```

**Getting BankJoy API Credentials**:

1. Contact BankJoy support for API access
2. Create an account at [BankJoy Portal](https://api.bankjoy.com/portal)
3. Generate API keys for read-only access
4. Configure webhooks for transaction updates

#### 3. Feature Flags

Control feature availability per environment:

```bash
# Production Features
VITE_FEATURE_BANK_INTEGRATION_ENABLED=true
VITE_FEATURE_AUTO_ALLOCATE_ENABLED=true
VITE_FEATURE_EMAIL_NOTIFICATIONS_ENABLED=true
VITE_FEATURE_SSO_ENABLED=true
VITE_FEATURE_MULTI_TENANT_ENABLED=true
VITE_FEATURE_ADVANCED_REPORTING_ENABLED=true
VITE_FEATURE_API_ACCESS_ENABLED=true
VITE_FEATURE_WEBHOOKS_ENABLED=true
VITE_FEATURE_BULK_IMPORT_ENABLED=true
VITE_FEATURE_CUSTOM_FIELDS_ENABLED=true

# Beta Features (disable in production)
VITE_FEATURE_AI_INSIGHTS_ENABLED=false
VITE_FEATURE_PREDICTIVE_ANALYTICS_ENABLED=false
```

#### 4. Analytics Configuration

Optional analytics providers:

```bash
# Firebase Analytics (built-in)
VITE_FIREBASE_ANALYTICS_ENABLED=true

# Google Analytics 4 (optional)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXX

# Segment Analytics (optional)
VITE_SEGMENT_WRITE_KEY=your_segment_write_key

# Mixpanel Analytics (optional)
VITE_MIXPANEL_TOKEN=your_mixpanel_token
```

#### 5. API Configuration

```bash
VITE_API_URL=https://api.attyfinancial.com/api/v1
VITE_API_TIMEOUT=30000
```

#### 6. Security Configuration

```bash
VITE_CSP_ENABLED=true
VITE_X_FRAME_OPTIONS=DENY
VITE_CONTENT_SECURITY_POLICY=upgrade-insecure-requests
```

#### 7. Performance Configuration

```bash
VITE_ENABLE_SERVICE_WORKER=true
VITE_CACHE_STRATEGY=network-first
VITE_OFFLINE_ENABLED=true
```

#### 8. Logging & Monitoring

```bash
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=production
VITE_LOG_LEVEL=error
```

#### 9. Rate Limiting

```bash
VITE_RATE_LIMIT_ENABLED=true
VITE_RATE_LIMIT_MAX_REQUESTS=100
VITE_RATE_LIMIT_WINDOW_MS=60000
```

#### 10. Support & Documentation

```bash
VITE_SUPPORT_EMAIL=support@attyfinancial.com
VITE_SUPPORT_PHONE=+1-800-ATTY-FIN
VITE_DOCS_URL=https://docs.attyfinancial.com
VITE_STATUS_PAGE_URL=https://status.attyfinancial.com
```

---

## Prerequisites

### Required Tools

- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **Firebase CLI**: 12.x or later
- **Git**: 2.x or later

### Install Dependencies

```bash
# Install project dependencies
npm install

# Install Firebase CLI globally
npm install -g firebase-tools
```

### Firebase Authentication

```bash
# Login to Firebase
firebase login

# Select your project
firebase use --project your-project-id
```

---

## Development Setup

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/atty-financial.git
   cd atty-financial
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your development values
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Open [http://localhost:5173](http://localhost:5173)

### Firebase Emulator (Optional)

For local development without using Firebase:

```bash
# Start Firebase emulators
firebase emulators:start

# In a separate terminal, start the app with emulator enabled
VITE_FIREBASE_USE_EMULATOR=true npm run dev
```

---

## Staging Deployment

### Deployment Process

1. **Prepare staging environment**:
   ```bash
   # Create staging environment file
   cp .env.staging.example .env.staging
   # Edit .env.staging with staging values
   ```

2. **Validate environment variables**:
   ```bash
   npm run validate-env:staging
   # or
   tsx scripts/validate-env.ts staging --check
   ```

3. **Build for staging**:
   ```bash
   npm run build:staging
   ```

4. **Deploy to staging Firebase project**:
   ```bash
   firebase use staging
   firebase deploy --only hosting
   ```

5. **Test staging deployment**:
   - Access: [https://staging.attyfinancial.com](https://staging.attyfinancial.com)
   - Run integration tests
   - Verify feature flags
   - Check analytics events

### Staging Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "build:staging": "vite build --mode staging",
    "preview:staging": "vite preview --mode staging",
    "deploy:staging": "firebase deploy --only hosting",
    "validate-env:staging": "tsx scripts/validate-env.ts staging",
    "validate-env:staging:check": "tsx scripts/validate-env.ts staging --check"
  }
}
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Environment variables validated
- [ ] Feature flags reviewed
- [ ] Analytics enabled with production keys
- [ ] Security settings verified
- [ ] Rate limiting configured
- [ ] CDN configured (if using)
- [ ] Error tracking configured (Sentry)
- [ ] SSL/TLS certificates valid
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Documentation updated

### Deployment Process

1. **Validate production environment**:
   ```bash
   tsx scripts/validate-env.ts production --check
   ```

2. **Create a backup** (for database):
   ```bash
   firebase firestore:backups create --project your-production-project
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Test production build locally**:
   ```bash
   npm run preview
   ```

5. **Deploy to production**:
   ```bash
   firebase use production
   firebase deploy
   ```

6. **Verify deployment**:
   ```bash
   firebase hosting:channel:deploy production
   ```

7. **Access production**:
   - [https://attyfinancial.com](https://attyfinancial.com)

### Production Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "firebase deploy",
    "deploy:production": "firebase deploy --only hosting,firestore,functions",
    "deploy:hosting": "firebase deploy --only hosting",
    "validate-env:production": "tsx scripts/validate-env.ts production",
    "validate-env:production:check": "tsx scripts/validate-env.ts production --check"
  }
}
```

### Rollback Procedure

If a deployment fails:

```bash
# 1. Identify the previous deployment
firebase hosting:releases:list

# 2. Rollback to previous release
firebase hosting:releases:rollback RELEASE_ID

# 3. Or redeploy from a specific commit
git checkout <previous-commit>
npm run build
firebase deploy
```

---

## Firebase Deployment

### Production Firebase Configuration

For detailed production Firebase configuration, see [Firebase Production Setup Guide](./FIREBASE_PRODUCTION_SETUP.md).

#### Production Files

- **Production Config**: `src/lib/firebaseConfig.prod.ts` - Production Firebase initialization
- **Production Rules**: `firestore.rules.prod` - Production security rules
- **Production Indexes**: `firestore.indexes.prod.json` - Production database indexes

#### Production Security Features

- **Tightened Access**: Role-based access control with firm isolation
- **Data Validation**: Email format, matter ID format, amount validation
- **Rate Limiting**: Cloud Functions-based rate limiting
- **Audit Logging**: Immutable audit trail for compliance
- **App Check**: reCAPTCHA v3 for additional security

#### Production Authentication Providers

- **Email/Password**: Required with strong password policy
- **Google OAuth**: Optional, requires authorized domains
- **Email Verification**: Required for all users

#### Production Firestore Settings

- **Region**: `nam5 (us-central)`
- **Point-in-Time Recovery**: 7 days
- **Data Retention**: Configurable per collection
- **Automated Backups**: Daily at 2:00 AM UTC

### Firebase Configuration

The `firebase.json` file contains deployment configuration:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### Deploy Firebase Services

```bash
# Deploy all Firebase services
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only functions

# Deploy to a specific channel (for previews)
firebase hosting:channel:deploy <channel-name>

# Promote a channel to production
firebase hosting:channel:promote <channel-name>
```

### Firestore Rules & Indexes

Deploy Firestore security rules and indexes:

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Test rules locally
firebase emulators:start --only firestore
```

---

## Environment Validation

### Using the Validation Script

The `scripts/validate-env.ts` script validates all environment variables:

```bash
# List all required variables
tsx scripts/validate-env.ts --list

# Validate development environment
tsx scripts/validate-env.ts development

# Validate staging environment
tsx scripts/validate-env.ts staging

# Validate production environment
tsx scripts/validate-env.ts production

# Check mode (exit with error if invalid)
tsx scripts/validate-env.ts production --check

# Show help
tsx scripts/validate-env.ts --help
```

### CI/CD Integration

Add validation to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Validate Environment Variables
  run: |
    tsx scripts/validate-env.ts ${{ env.ENVIRONMENT }} --check

# GitLab CI example
validate-env:
  stage: validate
  script:
    - tsx scripts/validate-env.ts $CI_ENVIRONMENT_NAME --check
```

### Pre-commit Hook

Add a pre-commit hook to validate environment before commits:

```bash
#!/bin/sh
# .git/hooks/pre-commit

tsx scripts/validate-env.ts development --check
if [ $? -ne 0 ]; then
  echo "❌ Environment validation failed. Fix issues before committing."
  exit 1
fi
```

---

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading

**Problem**: Environment variables are not available in the application.

**Solution**:
- Ensure variables are prefixed with `VITE_`
- Check that `.env` file is in the project root
- Restart the development server after changing environment variables
- Verify `.env` is not in `.gitignore`

#### 2. Firebase Authentication Errors

**Problem**: Firebase auth fails with "auth/invalid-api-key" error.

**Solution**:
- Verify `VITE_FIREBASE_API_KEY` is correct
- Check Firebase project ID matches your project
- Ensure app is registered in Firebase Console
- Verify authDomain is correct format: `project-id.firebaseapp.com`

#### 3. BankJoy API Errors

**Problem**: BankJoy API returns 401 Unauthorized.

**Solution**:
- Verify `VITE_BANKJOY_API_KEY` is correct
- Check API URL is correct for environment
- Ensure API key has read-only permissions
- Contact BankJoy support if issues persist

#### 4. Build Fails in Production

**Problem**: Build fails with missing environment variables.

**Solution**:
- Run validation script: `tsx scripts/validate-env.ts production`
- Check all required variables are set in `.env.production`
- Ensure no placeholder values (e.g., `your_api_key`)

#### 5. Analytics Not Working

**Problem**: Analytics events are not being tracked.

**Solution**:
- Verify `VITE_FIREBASE_ANALYTICS_ENABLED=true`
- Check measurement ID is correct format: `G-XXXXXXXX`
- Ensure analytics is initialized in `src/lib/firebase.ts`
- Verify Firebase Analytics is enabled in Firebase Console

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Enable debug mode
VITE_DEBUG_MODE=true
VITE_VERBOSE_LOGGING=true
VITE_DEVTOOLS=true

# Restart server with debug enabled
npm run dev
```

### Logs and Monitoring

Check Firebase logs for function errors:

```bash
# View Firebase function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only functionName

# View real-time logs
firebase functions:log --only functionName
```

---

## Security Best Practices

### 1. Never Commit Sensitive Data

- Add `.env` files to `.gitignore`
- Use environment variable templates (`.env.*.example`)
- Rotate API keys regularly

### 2. Use HTTPS in Production

All production endpoints must use HTTPS:

```bash
# Production API URLs must use HTTPS
VITE_API_URL=https://api.attyfinancial.com/api/v1
VITE_BANKJOY_API_URL=https://api.bankjoy.com/v1
```

### 3. Enable Security Headers

```bash
VITE_CSP_ENABLED=true
VITE_X_FRAME_OPTIONS=DENY
VITE_CONTENT_SECURITY_POLICY=upgrade-insecure-requests
```

### 4. Use Read-Only API Keys

- BankJoy API key should have read-only permissions
- Firebase client key is public but has limited scope
- Server-side secrets never exposed to client

### 5. Enable Rate Limiting

```bash
VITE_RATE_LIMIT_ENABLED=true
VITE_RATE_LIMIT_MAX_REQUESTS=100
VITE_RATE_LIMIT_WINDOW_MS=60000
```

### 6. Disable Debug Mode in Production

```bash
# Production
VITE_DEBUG_MODE=false
VITE_DEVTOOLS=false
VITE_VERBOSE_LOGGING=false

# Staging (for testing)
VITE_DEBUG_MODE=true
VITE_DEVTOOLS=true
VITE_VERBOSE_LOGGING=true
```

### 7. Monitor and Alert

- Set up error tracking (Sentry)
- Configure Firebase Analytics
- Set up alerts for API errors
- Monitor rate limiting triggers

### 8. Regular Security Audits

- Review Firebase security rules
- Audit API access logs
- Rotate API keys quarterly
- Update dependencies regularly

---

## Additional Resources

### Documentation

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [BankJoy API Documentation](https://api.bankjoy.com/docs)

### Support

- **Email**: support@attyfinancial.com
- **Phone**: +1-800-ATTY-FIN
- **Documentation**: https://docs.attyfinancial.com
- **Status Page**: https://status.attyfinancial.com

---

## Changelog

### Version 1.0.0 (2026-03-05)

- Initial deployment guide
- Environment variable templates for production and staging
- Environment validation script
- Security best practices
- Troubleshooting guide
