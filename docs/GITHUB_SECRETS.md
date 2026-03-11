# GitHub Secrets Configuration Guide

This guide documents all GitHub Secrets that need to be configured for the CI/CD pipelines.

## Overview

ATTY Financial uses GitHub Actions for continuous integration and deployment. The workflows require several secrets to be configured in your GitHub repository settings.

## Required Secrets for All Workflows

### 1. FIREBASE_TOKEN

**Purpose**: Authentication token for Firebase CLI

**Required by**:
- `deploy-staging.yml`
- `deploy.yml`

**How to generate**:

```bash
# Login to Firebase
firebase login

# Get the token
firebase login:ci

# Copy the output token
```

**Add to GitHub**:
1. Go to: Repository Settings → Secrets and variables → Actions
2. Click: New repository secret
3. Name: `FIREBASE_TOKEN`
4. Value: Paste the token from `firebase login:ci`

**Example**: `1//0gX... (long token string)`

---

### 2. NODE_VERSION

**Purpose**: Node.js version to use in CI/CD

**Required by**:
- All workflows

**Add to GitHub**:
1. Go to: Repository Settings → Secrets and variables → Actions
2. Click: New repository secret
3. Name: `NODE_VERSION`
4. Value: `18`

**Default**: `18`

---

## Required Secrets for Staging Deployment

### Staging Firebase Configuration

#### 3. STAGING_FIREBASE_API_KEY

**Purpose**: Firebase API key for staging project

**Required by**: `deploy-staging.yml`

**How to get**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select staging project: `atty-financial-staging`
3. Navigate to: Project Settings → General → Your Apps → Web App
4. Copy: API key

**Example**: `AIzaSyD1ksBb-7ZUvZDzEq0GwgCbYofjq45arwA`

#### 4. STAGING_FIREBASE_AUTH_DOMAIN

**Purpose**: Firebase auth domain for staging project

**Required by**: `deploy-staging.yml`

**How to get**: Same as above (Project Settings → Your Apps)

**Example**: `atty-financial-staging.firebaseapp.com`

#### 5. STAGING_FIREBASE_PROJECT_ID

**Purpose**: Firebase project ID for staging

**Required by**: `deploy-staging.yml`

**How to get**: Same as above (Project Settings → General)

**Example**: `atty-financial-staging`

#### 6. STAGING_FIREBASE_STORAGE_BUCKET

**Purpose**: Firebase storage bucket for staging

**Required by**: `deploy-staging.yml`

**How to get**: Same as above (Project Settings → Your Apps)

**Example**: `atty-financial-staging.appspot.com`

#### 7. STAGING_FIREBASE_MESSAGING_SENDER_ID

**Purpose**: Firebase messaging sender ID for staging

**Required by**: `deploy-staging.yml`

**How to get**: Same as above (Project Settings → Your Apps)

**Example**: `164375066359`

#### 8. STAGING_FIREBASE_APP_ID

**Purpose**: Firebase app ID for staging

**Required by**: `deploy-staging.yml`

**How to get**: Same as above (Project Settings → Your Apps)

**Example**: `1:164375066359:web:d20fb751ef2567597b05f2`

#### 9. STAGING_FIREBASE_MEASUREMENT_ID

**Purpose**: Firebase Analytics measurement ID for staging

**Required by**: `deploy-staging.yml`

**How to get**: Same as above (Project Settings → Your Apps)

**Example**: `G-4QERGV5WGC`

---

### Staging BankJoy API Configuration

#### 10. STAGING_BANKJOY_API_URL

**Purpose**: BankJoy API base URL for staging

**Required by**: `deploy-staging.yml`

**How to get**: Contact BankJoy support or use staging URL

**Example**: `https://api-staging.bankjoy.com/v1`

#### 11. STAGING_BANKJOY_API_KEY

**Purpose**: BankJoy API key for staging

**Required by**: `deploy-staging.yml`

**How to get**: Contact [BankJoy Portal](https://api.bankjoy.com/portal)

**Example**: `bkj_live_... (your API key)`

---

### Staging Feature Flags

#### 12. STAGING_FEATURE_BANK_INTEGRATION_ENABLED

**Purpose**: Enable bank integration in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

**Add to GitHub**: `true` or `false`

#### 13. STAGING_FEATURE_AUTO_ALLOCATE_ENABLED

**Purpose**: Enable auto-allocation in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 14. STAGING_FEATURE_EMAIL_NOTIFICATIONS_ENABLED

**Purpose**: Enable email notifications in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 15. STAGING_FEATURE_SSO_ENABLED

**Purpose**: Enable SSO in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 16. STAGING_FEATURE_MULTI_TENANT_ENABLED

**Purpose**: Enable multi-tenant support in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 17. STAGING_FEATURE_ADVANCED_REPORTING_ENABLED

**Purpose**: Enable advanced reporting in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 18. STAGING_FEATURE_API_ACCESS_ENABLED

**Purpose**: Enable API access in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 19. STAGING_FEATURE_WEBHOOKS_ENABLED

**Purpose**: Enable webhooks in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 20. STAGING_FEATURE_BULK_IMPORT_ENABLED

**Purpose**: Enable bulk import in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 21. STAGING_FEATURE_CUSTOM_FIELDS_ENABLED

**Purpose**: Enable custom fields in staging

**Required by**: `deploy-staging.yml`

**Default**: `true`

#### 22. STAGING_FEATURE_AI_INSIGHTS_ENABLED

**Purpose**: Enable AI insights (beta) in staging

**Required by**: `deploy-staging.yml`

**Default**: `true` (enabled for testing in staging)

#### 23. STAGING_FEATURE_PREDICTIVE_ANALYTICS_ENABLED

**Purpose**: Enable predictive analytics (beta) in staging

**Required by**: `deploy-staging.yml`

**Default**: `true` (enabled for testing in staging)

---

### Staging Analytics Configuration

#### 24. STAGING_GA4_MEASUREMENT_ID

**Purpose**: Google Analytics 4 measurement ID for staging

**Required by**: `deploy-staging.yml` (optional)

**How to get**: [Google Analytics](https://analytics.google.com/)

**Example**: `G-STAGING123`

#### 25. STAGING_SEGMENT_WRITE_KEY

**Purpose**: Segment write key for staging

**Required by**: `deploy-staging.yml` (optional)

**How to get**: [Segment](https://segment.com/)

**Example**: `staging_write_key_...`

#### 26. STAGING_MIXPANEL_TOKEN

**Purpose**: Mixpanel token for staging

**Required by**: `deploy-staging.yml` (optional)

**How to get**: [Mixpanel](https://mixpanel.com/)

**Example**: `staging_token_...`

---

### Staging API Configuration

#### 27. STAGING_API_URL

**Purpose**: Backend API URL for staging

**Required by**: `deploy-staging.yml`

**Example**: `https://staging-api.attyfinancial.com/api/v1`

---

### Staging Monitoring Configuration

#### 28. STAGING_SENTRY_DSN

**Purpose**: Sentry DSN for error tracking in staging

**Required by**: `deploy-staging.yml` (optional)

**How to get**: [Sentry](https://sentry.io/)

**Example**: `https://public@sentry.io/project-id`

---

## Required Secrets for Production Deployment

### Production Firebase Configuration

#### 29. PRODUCTION_FIREBASE_API_KEY

**Purpose**: Firebase API key for production project

**Required by**: `deploy.yml`

**How to get**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select production project: `atty-financial-production`
3. Navigate to: Project Settings → General → Your Apps → Web App
4. Copy: API key

**Example**: `AIzaSyD1ksBb-7ZUvZDzEq0GwgCbYofjq45arwA`

#### 30. PRODUCTION_FIREBASE_AUTH_DOMAIN

**Purpose**: Firebase auth domain for production

**Required by**: `deploy.yml`

**Example**: `atty-financial-production.firebaseapp.com`

#### 31. PRODUCTION_FIREBASE_PROJECT_ID

**Purpose**: Firebase project ID for production

**Required by**: `deploy.yml`

**Example**: `atty-financial-production`

#### 32. PRODUCTION_FIREBASE_STORAGE_BUCKET

**Purpose**: Firebase storage bucket for production

**Required by**: `deploy.yml`

**Example**: `atty-financial-production.appspot.com`

#### 33. PRODUCTION_FIREBASE_MESSAGING_SENDER_ID

**Purpose**: Firebase messaging sender ID for production

**Required by**: `deploy.yml`

**Example**: `164375066359`

#### 34. PRODUCTION_FIREBASE_APP_ID

**Purpose**: Firebase app ID for production

**Required by**: `deploy.yml`

**Example**: `1:164375066359:web:d20fb751ef2567597b05f2`

#### 35. PRODUCTION_FIREBASE_MEASUREMENT_ID

**Purpose**: Firebase Analytics measurement ID for production

**Required by**: `deploy.yml`

**Example**: `G-4QERGV5WGC`

---

### Production BankJoy API Configuration

#### 36. PRODUCTION_BANKJOY_API_URL

**Purpose**: BankJoy API base URL for production

**Required by**: `deploy.yml`

**Example**: `https://api.bankjoy.com/v1`

#### 37. PRODUCTION_BANKJOY_API_KEY

**Purpose**: BankJoy API key for production

**Required by**: `deploy.yml`

**Example**: `bkj_live_... (your production API key)`

---

### Production Feature Flags

#### 38. PRODUCTION_FEATURE_BANK_INTEGRATION_ENABLED

**Purpose**: Enable bank integration in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 39. PRODUCTION_FEATURE_AUTO_ALLOCATE_ENABLED

**Purpose**: Enable auto-allocation in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 40. PRODUCTION_FEATURE_EMAIL_NOTIFICATIONS_ENABLED

**Purpose**: Enable email notifications in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 41. PRODUCTION_FEATURE_SSO_ENABLED

**Purpose**: Enable SSO in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 42. PRODUCTION_FEATURE_MULTI_TENANT_ENABLED

**Purpose**: Enable multi-tenant support in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 43. PRODUCTION_FEATURE_ADVANCED_REPORTING_ENABLED

**Purpose**: Enable advanced reporting in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 44. PRODUCTION_FEATURE_API_ACCESS_ENABLED

**Purpose**: Enable API access in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 45. PRODUCTION_FEATURE_WEBHOOKS_ENABLED

**Purpose**: Enable webhooks in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 46. PRODUCTION_FEATURE_BULK_IMPORT_ENABLED

**Purpose**: Enable bulk import in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 47. PRODUCTION_FEATURE_CUSTOM_FIELDS_ENABLED

**Purpose**: Enable custom fields in production

**Required by**: `deploy.yml`

**Default**: `true`

#### 48. PRODUCTION_FEATURE_AI_INSIGHTS_ENABLED

**Purpose**: Enable AI insights (beta) in production

**Required by**: `deploy.yml`

**Default**: `false` (beta features disabled in production)

#### 49. PRODUCTION_FEATURE_PREDICTIVE_ANALYTICS_ENABLED

**Purpose**: Enable predictive analytics (beta) in production

**Required by**: `deploy.yml`

**Default**: `false` (beta features disabled in production)

---

### Production Analytics Configuration

#### 50. PRODUCTION_GA4_MEASUREMENT_ID

**Purpose**: Google Analytics 4 measurement ID for production

**Required by**: `deploy.yml`

**Example**: `G-4QERGV5WGC`

#### 51. PRODUCTION_SEGMENT_WRITE_KEY

**Purpose**: Segment write key for production

**Required by**: `deploy.yml` (optional)

**Example**: `production_write_key_...`

#### 52. PRODUCTION_MIXPANEL_TOKEN

**Purpose**: Mixpanel token for production

**Required by**: `deploy.yml` (optional)

**Example**: `production_token_...`

---

### Production API Configuration

#### 53. PRODUCTION_API_URL

**Purpose**: Backend API URL for production

**Required by**: `deploy.yml`

**Example**: `https://api.attyfinancial.com/api/v1`

---

### Production Monitoring Configuration

#### 54. PRODUCTION_SENTRY_DSN

**Purpose**: Sentry DSN for error tracking in production

**Required by**: `deploy.yml`

**Example**: `https://public@sentry.io/project-id`

---

### Production CDN Configuration

#### 55. PRODUCTION_CDN_URL

**Purpose**: CDN base URL for production assets

**Required by**: `deploy.yml` (optional)

**Example**: `https://cdn.attyfinancial.com`

---

### Production Third-Party Integrations

#### 56. PRODUCTION_STRIPE_PUBLISHABLE_KEY

**Purpose**: Stripe publishable key for production

**Required by**: `deploy.yml` (optional)

**How to get**: [Stripe Dashboard](https://dashboard.stripe.com/)

**Example**: `pk_live_...`

#### 57. PRODUCTION_WORKOS_CLIENT_ID

**Purpose**: WorkOS client ID for SSO

**Required by**: `deploy.yml` (optional)

**How to get**: [WorkOS Dashboard](https://dashboard.workos.com/)

**Example**: `client_production_...`

#### 58. PRODUCTION_SLACK_CLIENT_ID

**Purpose**: Slack client ID for integration

**Required by**: `deploy.yml` (optional)

**How to get**: [Slack API](https://api.slack.com/apps)

**Example**: `client_id_...`

---

## Optional Secrets for All Environments

### 59. CODECOV_TOKEN

**Purpose**: Token for uploading coverage reports to Codecov

**Required by**: `ci.yml`, `deploy-staging.yml`, `deploy.yml` (optional)

**How to get**: [Codecov](https://codecov.io/)

**Example**: `sha256_token_...`

### 60. SNYK_TOKEN

**Purpose**: Token for Snyk security scanning

**Required by**: `ci.yml`, `deploy.yml` (optional)

**How to get**: [Snyk](https://snyk.io/)

**Example**: `snyk_token_...`

---

## Support & Contact Information

#### 61. SUPPORT_EMAIL

**Purpose**: Support email address

**Required by**: All workflows

**Example**: `support@attyfinancial.com`

#### 62. SUPPORT_PHONE

**Purpose**: Support phone number

**Required by**: All workflows

**Example**: `+1-800-ATTY-FIN`

---

## Notification Secrets

#### 63. SLACK_WEBHOOK_URL

**Purpose**: Slack webhook URL for deployment notifications

**Required by**: `deploy.yml` (optional)

**How to get**:
1. Go to Slack App settings
2. Create Incoming Webhook
3. Copy webhook URL

**Example**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

---

## How to Add Secrets to GitHub

### Method 1: GitHub UI

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name (e.g., `FIREBASE_TOKEN`)
6. Paste the secret value
7. Click **Add secret**

### Method 2: GitHub CLI

```bash
# Install GitHub CLI (gh)
# macOS
brew install gh

# Linux
sudo apt install gh

# Windows
# Download from https://github.com/cli/cli/releases

# Login to GitHub
gh auth login

# Add secrets
gh secret set FIREBASE_TOKEN
gh secret set NODE_VERSION -b"18"
gh secret set STAGING_FIREBASE_API_KEY
```

### Method 3: Environment-Specific Secrets

For better organization, you can use environment-specific secrets:

1. Go to: Repository Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Click **Configure environments**
4. Create environments: `staging`, `production`
5. Add secrets to specific environments

---

## Secret Management Best Practices

### 1. Rotate Secrets Regularly

- Firebase tokens: Rotate every 90 days
- API keys: Rotate every 6 months
- Database credentials: Rotate every 3 months

### 2. Use Read-Only Keys

- BankJoy API: Use read-only keys
- Firebase: Use client-side keys for frontend
- Analytics: Use public keys only

### 3. Separate Secrets by Environment

- Never use production secrets in staging
- Never use staging secrets in production
- Use different keys for each environment

### 4. Use Strong, Unique Values

- Minimum 32 characters for sensitive keys
- Use random strings for API keys
- Never reuse secrets across projects

### 5. Audit Access

- Review who has access to secrets
- Use GitHub Teams for access control
- Enable audit logging for secret access

### 6. Use Secret Scanning

- GitHub automatically scans for secrets in commits
- Use tools like `gitleaks` for local scanning
- Configure branch protection rules

---

## Troubleshooting

### Secret Not Found Error

**Problem**: Workflow fails with `Secret not found` error

**Solution**:
1. Verify secret name is spelled correctly
2. Check secret is added to the correct repository
3. Verify secret is available to the workflow environment

### Invalid Firebase Token

**Problem**: Firebase deployment fails with authentication error

**Solution**:
1. Generate new token: `firebase login:ci`
2. Update `FIREBASE_TOKEN` secret
3. Verify Firebase project access

### Missing Environment Variable

**Problem**: Build fails with missing environment variable

**Solution**:
1. Check `deploy-staging.yml` or `deploy.yml`
2. Verify secret is added for the correct environment
3. Check variable name matches exactly

### Secrets Not Available in PRs

**Problem**: Secrets don't work in pull requests from forks

**Solution**:
1. This is a GitHub security feature
2. Only secrets from the target repository are available
3. Use environment-specific secrets if needed

---

## Quick Setup Checklist

### Minimum Required Secrets for Staging

- [ ] `FIREBASE_TOKEN`
- [ ] `STAGING_FIREBASE_API_KEY`
- [ ] `STAGING_FIREBASE_AUTH_DOMAIN`
- [ ] `STAGING_FIREBASE_PROJECT_ID`
- [ ] `STAGING_FIREBASE_STORAGE_BUCKET`
- [ ] `STAGING_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `STAGING_FIREBASE_APP_ID`
- [ ] `STAGING_FIREBASE_MEASUREMENT_ID`
- [ ] `STAGING_API_URL`

### Minimum Required Secrets for Production

- [ ] `FIREBASE_TOKEN`
- [ ] `PRODUCTION_FIREBASE_API_KEY`
- [ ] `PRODUCTION_FIREBASE_AUTH_DOMAIN`
- [ ] `PRODUCTION_FIREBASE_PROJECT_ID`
- [ ] `PRODUCTION_FIREBASE_STORAGE_BUCKET`
- [ ] `PRODUCTION_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `PRODUCTION_FIREBASE_APP_ID`
- [ ] `PRODUCTION_FIREBASE_MEASUREMENT_ID`
- [ ] `PRODUCTION_API_URL`

### Optional Secrets

- [ ] `CODECOV_TOKEN`
- [ ] `SNYK_TOKEN`
- [ ] `SLACK_WEBHOOK_URL`
- [ ] `STAGING_BANKJOY_API_URL`
- [ ] `STAGING_BANKJOY_API_KEY`
- [ ] `PRODUCTION_BANKJOY_API_URL`
- [ ] `PRODUCTION_BANKJOY_API_KEY`
- [ ] `STAGING_SENTRY_DSN`
- [ ] `PRODUCTION_SENTRY_DSN`

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Quick Reference](./ENVIRONMENT_QUICK_REFERENCE.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Secrets Management Best Practices](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
