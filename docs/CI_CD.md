# CI/CD Pipeline Documentation

This document describes the continuous integration and deployment pipelines for ATTY Financial.

## Overview

ATTY Financial uses GitHub Actions for CI/CD automation with three main workflows:

1. **CI Pipeline** - Continuous integration on every push and pull request
2. **Staging Deployment** - Automated deployment to staging environment
3. **Production Deployment** - Controlled deployment to production environment

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Push / PR                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │   CI Workflow       │
         │  (.github/workflows/ │
         │      ci.yml)        │
         └──────────┬──────────┘
                    │
                    ├─ Lint
                    ├─ Type Check
                    ├─ Unit Tests
                    ├─ Integration Tests
                    ├─ Component Tests
                    ├─ Test Coverage
                    ├─ Build
                    ├─ Env Validation
                    └─ Security Scan
                    │
                    ▼
         ┌──────────────────────┐
         │  All Checks Pass?    │
         └────┬──────────┬──────┘
              │          │
         No  │          │  Yes
              │          │
              ▼          ▼
         Fail      ┌──────────────────────┐
                   │  Branch: staging/   │
                   │      develop       │
                   └──────┬─────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │ Staging Deploy      │
               │ (.github/workflows/ │
               │ deploy-staging.yml)│
               └──────────┬──────────┘
                          │
                          ├─ Env Validation
                          ├─ Tests
                          ├─ Build
                          ├─ Firebase Hosting
                          ├─ Cloud Functions
                          └─ Smoke Tests
                          │
                          ▼
                   ┌──────────────────────┐
                   │ Branch: main       │
                   └──────┬─────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │ Production Deploy    │
               │ (.github/workflows/ │
               │     deploy.yml)     │
               └──────────┬──────────┘
                          │
                          ├─ Confirmation
                          ├─ Backup
                          ├─ Env Validation
                          ├─ Tests
                          ├─ Security Scan
                          ├─ Build
                          ├─ Firebase Hosting
                          ├─ Cloud Functions
                          ├─ Smoke Tests
                          └─ Notifications
                          │
                          ▼
                   Deployed to Production
```

## Workflow 1: CI Pipeline

### File: `.github/workflows/ci.yml`

### Triggers

```yaml
on:
  push:
    branches: [main, develop, staging]
  pull_request:
    branches: [main, develop, staging]
```

### Jobs

#### Job 1: Lint
- **Purpose**: Run ESLint to check code quality
- **Tools**: ESLint, Prettier
- **Status**: Must pass for CI to succeed

```bash
npm run lint
npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}"
```

#### Job 2: Type Check
- **Purpose**: Verify TypeScript types
- **Tools**: TypeScript compiler
- **Status**: Must pass for CI to succeed

```bash
npx tsc --noEmit
```

#### Job 3: Unit Tests
- **Purpose**: Run unit tests for services and stores
- **Tools**: Jest
- **Artifacts**: Test results and coverage

```bash
npm run test:unit
```

#### Job 4: Integration Tests
- **Purpose**: Run integration tests
- **Tools**: Jest
- **Artifacts**: Test results and coverage

```bash
npm run test:integration
```

#### Job 5: Component Tests
- **Purpose**: Run component tests
- **Tools**: Jest, React Testing Library
- **Artifacts**: Test results and coverage

```bash
npm run test:components
```

#### Job 6: Test Coverage
- **Purpose**: Generate and verify test coverage
- **Tools**: Jest, Codecov
- **Artifacts**: Coverage report

```bash
npm run test:ci
```

Coverage requirements:
- Services: ≥85%
- Stores: ≥85%
- Components: ≥75%
- Global: ≥80%

#### Job 7: Build Verification
- **Purpose**: Build production bundle
- **Tools**: Vite
- **Dependencies**: lint, typecheck, tests must pass
- **Artifacts**: Build artifacts

```bash
npm run build
```

#### Job 8: Environment Validation
- **Purpose**: Validate environment variable schemas
- **Tools**: Custom validation script
- **Status**: Must pass for CI to succeed

```bash
npm run validate-env:dev
npm run validate-env:staging
npm run validate-env:production
```

#### Job 9: Security Scan
- **Purpose**: Scan for security vulnerabilities
- **Tools**: npm audit, Snyk
- **Status**: Warnings only (non-blocking)

```bash
npm audit --production
npm audit --dev
```

#### Job 10: CI Summary
- **Purpose**: Generate summary of all CI jobs
- **Status**: Reports overall CI status

### CI Summary Report

The CI workflow generates a summary in GitHub Actions:

| Job | Status |
|-----|--------|
| Lint | ✅/❌ |
| Type Check | ✅/❌ |
| Unit Tests | ✅/❌ |
| Integration Tests | ✅/❌ |
| Component Tests | ✅/❌ |
| Test Coverage | ✅/❌ |
| Build | ✅/❌ |
| Environment Validation | ✅/❌ |

### Artifact Retention

- Test results: 7 days
- Build artifacts: 7 days
- Coverage reports: 7 days

---

## Workflow 2: Staging Deployment

### File: `.github/workflows/deploy-staging.yml`

### Triggers

```yaml
on:
  push:
    branches: [staging, develop]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
      skip_tests:
        description: 'Skip tests (not recommended)'
        required: false
        default: false
        type: boolean
```

### Jobs

#### Job 1: Validate Environment
- **Purpose**: Validate staging environment variables
- **Tools**: Custom validation script

```bash
npm run validate-env:staging
```

#### Job 2: Run Tests
- **Purpose**: Run all tests before deployment
- **Tools**: Jest, ESLint, TypeScript
- **Skippable**: Via workflow input

```bash
npm run lint
npx tsc --noEmit
npm run test:ci
```

#### Job 3: Build Application
- **Purpose**: Build application for staging
- **Tools**: Vite
- **Environment**: staging

```bash
npm run build:staging
```

Build output:
- `dist/` directory
- Build artifacts uploaded
- Bundle size report generated

#### Job 4: Deploy to Firebase Hosting
- **Purpose**: Deploy frontend to Firebase Hosting
- **Tools**: Firebase CLI
- **Environment**: staging
- **URL**: https://atty-financial-staging.web.app

```bash
firebase deploy --only hosting
```

#### Job 5: Deploy Cloud Functions
- **Purpose**: Deploy backend functions
- **Tools**: Firebase CLI
- **Environment**: staging

```bash
firebase deploy --only functions
```

#### Job 6: Run Smoke Tests
- **Purpose**: Basic sanity checks after deployment
- **Tools**: Playwright, curl

```bash
curl -f https://atty-financial-staging.web.app
npx playwright test --project=chromium
```

#### Job 7: Deployment Summary
- **Purpose**: Generate deployment summary

| Component | Status |
|-----------|--------|
| Hosting | ✅/❌ |
| Cloud Functions | ✅/❌ |
| Smoke Tests | ✅/❌ |

### Deployment URL

- **Staging URL**: https://atty-financial-staging.web.app
- **Custom Domain**: https://staging.attyfinancial.com (if configured)

### PR Comments

When deploying from a PR, the workflow automatically comments with the deployment URL:

```
### 🚀 Staging Deployment Complete

**URL:** https://atty-financial-staging.web.app

**Commit:** abc123def456
**Branch:** feature/new-feature

deployed at: 2026-03-05T10:30:00Z
```

---

## Workflow 3: Production Deployment

### File: `.github/workflows/deploy.yml`

### Triggers

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'production'
        type: choice
        options:
          - production
      confirm:
        description: 'Type "confirm" to deploy to production'
        required: true
        type: string
      skip_tests:
        description: 'Skip tests (not recommended)'
        required: false
        default: false
        type: boolean
      create_backup:
        description: 'Create backup before deployment'
        required: false
        default: true
        type: boolean
```

### Jobs

#### Job 0: Confirmation Check
- **Purpose**: Require manual confirmation for production deployment
- **Trigger**: Only for `workflow_dispatch`
- **Required**: Type "confirm" in the input field

```yaml
if: github.event.inputs.confirm != "confirm"
  → Deployment aborted
```

#### Job 1: Validate Environment
- **Purpose**: Validate production environment variables
- **Tools**: Custom validation script
- **Strict**: Fails on any validation error

```bash
npm run validate-env:production --check
```

#### Job 2: Create Backup (Optional)
- **Purpose**: Create Firestore backup before deployment
- **Tools**: Firebase CLI
- **Trigger**: Via workflow input (default: true)

```bash
firebase firestore:backups create
```

#### Job 3: Run Tests
- **Purpose**: Run all tests with coverage
- **Tools**: Jest, ESLint, TypeScript
- **Coverage**: Must meet thresholds

```bash
npm run lint
npx tsc --noEmit
npm run test:ci
```

#### Job 4: Build Application
- **Purpose**: Build application for production
- **Tools**: Vite
- **Environment**: production

```bash
npm run build:production
```

Build features:
- Minification with Terser
- Console and debugger removal
- Source maps disabled
- Bundle optimization
- Asset versioning

#### Job 5: Security Scan
- **Purpose**: Scan for security vulnerabilities
- **Tools**: npm audit, Snyk, gitleaks
- **Status**: Warnings only (non-blocking)

```bash
npm audit --production
./gitleaks detect --source .
```

#### Job 6: Deploy to Firebase Hosting
- **Purpose**: Deploy frontend to Firebase Hosting
- **Tools**: Firebase CLI
- **Environment**: production
- **URL**: https://attyfinancial.com

```bash
firebase deploy --only hosting
```

Deployment process:
1. Preview deployment (optional)
2. Deploy to production
3. Verify deployment
4. Generate summary

#### Job 7: Deploy Cloud Functions
- **Purpose**: Deploy backend functions
- **Tools**: Firebase CLI
- **Environment**: production

```bash
firebase deploy --only functions
```

#### Job 8: Run Smoke Tests
- **Purpose**: Basic sanity checks after deployment
- **Tools**: Playwright, curl

```bash
curl -f https://attyfinancial.com
curl -f https://attyfinancial.com/health
npx playwright test --project=chromium
```

#### Job 9: Notify on Deployment
- **Purpose**: Send notifications about deployment status
- **Tools**: Slack webhook

Success notification:
```
✅ Production Deployment Complete
URL: https://attyfinancial.com
Commit: abc123def456
Deployed by: @username
```

Failure notification:
```
❌ Production Deployment Failed
Commit: abc123def456
Branch: main
Deployed by: @username
```

#### Job 10: Deployment Summary
- **Purpose**: Generate deployment summary

| Component | Status |
|-----------|--------|
| Hosting | ✅/❌ |
| Cloud Functions | ✅/❌ |
| Smoke Tests | ✅/❌ |

### Deployment URL

- **Production URL**: https://attyfinancial.com
- **Firebase URL**: https://atty-financial-production.web.app

### GitHub Releases

When deploying from a tag, a GitHub Release is automatically created:

```
## Production Deployment

- Deployed commit: abc123def456
- Deployment URL: https://attyfinancial.com
- Deployed by: @username
```

---

## Environment Variables

### Staging Environment

The staging deployment creates a `.env.staging` file from GitHub Secrets:

```bash
NODE_ENV=production
VITE_APP_ENV=staging
VITE_APP_VERSION=<commit-sha>

# Firebase
VITE_FIREBASE_API_KEY=${{ secrets.STAGING_FIREBASE_API_KEY }}
VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.STAGING_FIREBASE_AUTH_DOMAIN }}
# ... etc
```

### Production Environment

The production deployment creates a `.env.production` file from GitHub Secrets:

```bash
NODE_ENV=production
VITE_APP_ENV=production
VITE_APP_VERSION=<commit-sha>

# Firebase
VITE_FIREBASE_API_KEY=${{ secrets.PRODUCTION_FIREBASE_API_KEY }}
VITE_FIREBASE_AUTH_DOMAIN=${{ secrets.PRODUCTION_FIREBASE_AUTH_DOMAIN }}
# ... etc
```

For a complete list of required secrets, see [GitHub Secrets Guide](./GITHUB_SECRETS.md).

---

## Deployment Strategies

### Continuous Deployment (Staging)

- **Trigger**: Push to `staging` or `develop` branch
- **Approval**: Automatic
- **Tests**: Required
- **Rollback**: Manual via Firebase Console

### Continuous Delivery (Production)

- **Trigger**: Push to `main` branch OR manual workflow dispatch
- **Approval**: Manual confirmation required
- **Tests**: Required
- **Backup**: Optional (default: enabled)
- **Rollback**: Manual via Firebase Console

### Manual Deployment

To manually deploy to staging:

```bash
# Navigate to Actions tab
# Select "Deploy to Staging" workflow
# Click "Run workflow"
# Select branch
# Configure options
# Click "Run workflow"
```

To manually deploy to production:

```bash
# Navigate to Actions tab
# Select "Deploy to Production" workflow
# Click "Run workflow"
# Select branch
# Type "confirm" in confirmation field
# Configure options
# Click "Run workflow"
```

---

## Rollback Procedures

### Firebase Hosting Rollback

```bash
# List releases
firebase hosting:releases:list --project atty-financial-production

# Rollback to specific release
firebase hosting:releases:rollback RELEASE_ID --project atty-financial-production

# Or deploy previous commit
git checkout <previous-commit>
npm run build:production
firebase deploy --only hosting
```

### Cloud Functions Rollback

```bash
# List function versions
firebase functions:list --project atty-financial-production

# Deploy specific version
# (Requires manual deployment from previous commit)
```

### Database Rollback

If a backup was created:

```bash
# Restore from backup
firebase firestore:backups restore BACKUP_NAME --project atty-financial-production
```

---

## Monitoring and Observability

### Deployment Status

Check deployment status in:
- GitHub Actions tab
- Firebase Console
- Slack notifications (if configured)

### Post-Deployment Checks

After each deployment:

1. **Smoke Tests**: Automatically run
2. **Health Checks**: Monitor `/health` endpoint
3. **Error Tracking**: Monitor Sentry (if configured)
4. **Analytics**: Check Google Analytics events
5. **User Reports**: Monitor support channels

### Alerts

Configure alerts for:
- Deployment failures
- Increased error rates
- Performance degradation
- SSL certificate expiration

---

## Troubleshooting

### CI Failures

#### Lint Errors

```bash
# Fix linting errors locally
npm run lint

# Auto-fix where possible
npm run format
```

#### Type Errors

```bash
# Check TypeScript errors locally
npx tsc --noEmit

# Fix type issues
# Update type definitions
# Fix type annotations
```

#### Test Failures

```bash
# Run tests locally
npm test

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests in watch mode
npm run test:watch

# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### Build Failures

```bash
# Check build locally
npm run build

# Clear build cache
rm -rf node_modules/.vite
npm run build

# Check Vite logs
VITE_DEBUG=1 npm run build
```

### Deployment Failures

#### Firebase Authentication Errors

```bash
# Generate new Firebase token
firebase login:ci

# Update FIREBASE_TOKEN secret in GitHub
```

#### Firebase Deployment Errors

```bash
# Check Firebase project access
firebase use atty-financial-production
firebase projects:list

# Test deployment locally
firebase deploy --only hosting --dry-run
```

#### Environment Variable Errors

```bash
# Validate environment locally
npm run validate-env:production

# Check secret names match exactly
# Verify secrets are added to GitHub
```

#### Smoke Test Failures

```bash
# Check deployment URL
curl https://attyfinancial.com

# Check Firebase Console for deployment status
# Check Cloud Functions logs
```

### Common Issues

#### Workflow Not Triggering

**Problem**: Workflow doesn't run on push

**Solutions**:
1. Check branch name matches trigger
2. Verify workflow file is in correct location
3. Check GitHub Actions is enabled for repository

#### Secrets Not Available

**Problem**: Workflow fails with "Secret not found"

**Solutions**:
1. Verify secret name is spelled correctly
2. Check secret is added to repository
3. Verify secret is available to workflow environment

#### Artifact Upload Failures

**Problem**: Build artifacts not uploaded

**Solutions**:
1. Check dist/ directory exists
2. Verify artifact name matches
3. Check file size limits (max 10GB per artifact)

#### Timeout Errors

**Problem**: Workflow times out

**Solutions**:
1. Increase timeout in workflow
2. Optimize build process
3. Use caching for dependencies

---

## Best Practices

### Development Workflow

1. **Create feature branch** from `develop`
2. **Make changes** with proper commits
3. **Push branch** to trigger CI
4. **Review CI results** in Actions tab
5. **Fix issues** if CI fails
6. **Create pull request** to `develop`
7. **Get approval** from team
8. **Merge to develop** → deploys to staging
9. **Test in staging**
10. **Create PR to main** for production

### Commit Messages

Use conventional commits:

```
feat: add bank integration feature
fix: resolve transaction matching issue
docs: update deployment guide
test: add integration tests for allocation
chore: update dependencies
```

### Pull Request Checklist

- [ ] CI checks pass
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Code reviewed by at least one team member
- [ ] Tested in staging (if applicable)

### Before Production Deployment

- [ ] All CI checks pass
- [ ] Staging tests pass
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring configured

---

## Security Considerations

### Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use read-only API keys where possible
- Separate secrets by environment

### Branch Protection

Configure branch protection rules:

```yaml
# main branch protection
require_pull_request_before_merge: true
require_status_checks: true
required_status_checks:
  - "Lint"
  - "Type Check"
  - "Unit Tests"
  - "Integration Tests"
  - "Component Tests"
  - "Test Coverage"
  - "Build"
```

### Access Control

- Limit who can deploy to production
- Use GitHub Teams for access control
- Enable audit logging
- Require approval for production deployments

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [GitHub Secrets Guide](./GITHUB_SECRETS.md)
- [Environment Quick Reference](./ENVIRONMENT_QUICK_REFERENCE.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
