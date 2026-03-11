# CI/CD Quick Reference

Quick guide for ATTY Financial's CI/CD pipelines.

## Workflows

| Workflow | Trigger | Purpose | Status Badges |
|----------|----------|----------|---------------|
| **CI** | Push to any branch / PR | Run tests, lint, build | ![CI](https://github.com/your-org/atty-financial/actions/workflows/ci.yml/badge.svg) |
| **Staging Deploy** | Push to staging/develop | Deploy to staging environment | ![Staging](https://github.com/your-org/atty-financial/actions/workflows/deploy-staging.yml/badge.svg) |
| **Production Deploy** | Push to main / Manual | Deploy to production environment | ![Production](https://github.com/your-org/atty-financial/actions/workflows/deploy.yml/badge.svg) |

## Quick Commands

### Local Development

```bash
# Run linting
npm run lint

# Run type check
npx tsc --noEmit

# Run all tests
npm test

# Run tests with coverage
npm run test:ci

# Build for production
npm run build

# Build for staging
npm run build:staging

# Validate environment
npm run validate-env:production
```

### Deployment

```bash
# Deploy to staging (automatic on push)
git push origin staging

# Deploy to production (automatic on push)
git push origin main

# Manual deployment via GitHub UI
# 1. Go to Actions tab
# 2. Select workflow
# 3. Click "Run workflow"
# 4. Configure options
# 5. Run
```

### Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Generate CI token
firebase login:ci

# Deploy to staging
firebase use atty-financial-staging
firebase deploy

# Deploy to production
firebase use atty-financial-production
firebase deploy

# List releases
firebase hosting:releases:list

# Rollback
firebase hosting:releases:rollback RELEASE_ID
```

## CI Pipeline Jobs

| Job | Command | Time | Status |
|-----|---------|------|--------|
| Lint | `npm run lint` | ~30s | Required ✅ |
| Type Check | `npx tsc --noEmit` | ~45s | Required ✅ |
| Unit Tests | `npm run test:unit` | ~2m | Required ✅ |
| Integration Tests | `npm run test:integration` | ~1m | Required ✅ |
| Component Tests | `npm run test:components` | ~1.5m | Required ✅ |
| Test Coverage | `npm run test:ci` | ~3m | Required ✅ |
| Build | `npm run build` | ~1m | Required ✅ |
| Env Validation | `npm run validate-env:*` | ~10s | Required ✅ |
| Security Scan | `npm audit` | ~20s | Optional ⚠️ |

**Total CI Time**: ~10 minutes

## Staging Deployment

### Trigger

```bash
# Automatic on push
git push origin staging

# Manual workflow dispatch
# GitHub UI → Actions → Deploy to Staging → Run workflow
```

### Process

1. ✅ Validate environment variables
2. ✅ Run tests (optional skip)
3. ✅ Build application
4. ✅ Deploy to Firebase Hosting
5. ✅ Deploy Cloud Functions
6. ✅ Run smoke tests

### URL

- **Staging**: https://atty-financial-staging.web.app
- **Custom**: https://staging.attyfinancial.com

### Environment

```bash
NODE_ENV=production
VITE_APP_ENV=staging
VITE_DEBUG_MODE=true  # Debug enabled
VITE_FEATURE_AI_INSIGHTS_ENABLED=true  # Beta features enabled
```

## Production Deployment

### Trigger

```bash
# Automatic on push to main
git push origin main

# Manual workflow dispatch
# GitHub UI → Actions → Deploy to Production → Run workflow
# Type "confirm" to proceed
```

### Process

1. ✅ Manual confirmation (required)
2. ✅ Validate environment variables
3. ✅ Create backup (optional)
4. ✅ Run tests
5. ✅ Security scan
6. ✅ Build application
7. ✅ Deploy to Firebase Hosting
8. ✅ Deploy Cloud Functions
9. ✅ Run smoke tests
10. ✅ Send notifications

### URL

- **Production**: https://attyfinancial.com
- **Firebase**: https://atty-financial-production.web.app

### Environment

```bash
NODE_ENV=production
VITE_APP_ENV=production
VITE_DEBUG_MODE=false  # Debug disabled
VITE_FEATURE_AI_INSIGHTS_ENABLED=false  # Beta features disabled
```

## Required GitHub Secrets

### Minimum for Staging

- `FIREBASE_TOKEN`
- `STAGING_FIREBASE_API_KEY`
- `STAGING_FIREBASE_AUTH_DOMAIN`
- `STAGING_FIREBASE_PROJECT_ID`
- `STAGING_FIREBASE_STORAGE_BUCKET`
- `STAGING_FIREBASE_MESSAGING_SENDER_ID`
- `STAGING_FIREBASE_APP_ID`
- `STAGING_FIREBASE_MEASUREMENT_ID`
- `STAGING_API_URL`

### Minimum for Production

- `FIREBASE_TOKEN`
- `PRODUCTION_FIREBASE_API_KEY`
- `PRODUCTION_FIREBASE_AUTH_DOMAIN`
- `PRODUCTION_FIREBASE_PROJECT_ID`
- `PRODUCTION_FIREBASE_STORAGE_BUCKET`
- `PRODUCTION_FIREBASE_MESSAGING_SENDER_ID`
- `PRODUCTION_FIREBASE_APP_ID`
- `PRODUCTION_FIREBASE_MEASUREMENT_ID`
- `PRODUCTION_API_URL`

### Optional

- `CODECOV_TOKEN` - Upload coverage to Codecov
- `SNYK_TOKEN` - Security scanning with Snyk
- `SLACK_WEBHOOK_URL` - Deployment notifications

**Full list**: See [GitHub Secrets Guide](./GITHUB_SECRETS.md)

## Troubleshooting

### CI Failures

```bash
# Lint errors
npm run lint -- --fix

# Type errors
npx tsc --noEmit
# Fix type issues

# Test failures
npm test
# Fix test issues

# Build errors
npm run build
# Check Vite logs
```

### Deployment Failures

```bash
# Firebase auth error
firebase login:ci
# Update FIREBASE_TOKEN secret

# Environment validation error
npm run validate-env:production --check
# Fix missing/invalid secrets

# Deployment timeout
# Check network
# Reduce build size
```

### Rollback

```bash
# List releases
firebase hosting:releases:list

# Rollback
firebase hosting:releases:rollback RELEASE_ID

# Deploy previous commit
git checkout <commit>
npm run build:production
firebase deploy
```

## Monitoring

### Check Status

- **GitHub Actions**: Repository → Actions tab
- **Firebase Console**: https://console.firebase.google.com/
- **Staging URL**: https://atty-financial-staging.web.app
- **Production URL**: https://attyfinancial.com

### Logs

```bash
# Firebase functions logs
firebase functions:log

# View specific function
firebase functions:log --only functionName

# Real-time logs
firebase functions:log --only functionName
```

## Checklist

### Before Push

- [ ] Code changes committed
- [ ] Tests pass locally
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Environment variables validated

### Before Production Deploy

- [ ] Merged to staging
- [ ] Tested in staging
- [ ] All CI checks pass
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Backup created
- [ ] Team notified

### After Production Deploy

- [ ] Deployment successful
- [ ] Smoke tests pass
- [ ] URL accessible
- [ ] Error tracking normal
- [ ] Analytics receiving data
- [ ] Support ready for issues

## Status Badges

Add these to your README.md:

```markdown
[![CI Pipeline](https://github.com/your-org/atty-financial/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/atty-financial/actions/workflows/ci.yml)
[![Staging Deployment](https://github.com/your-org/atty-financial/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/your-org/atty-financial/actions/workflows/deploy-staging.yml)
[![Production Deployment](https://github.com/your-org/atty-financial/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/atty-financial/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/your-org/atty-financial/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/atty-financial)
```

## Resources

- **CI/CD Guide**: [CI_CD.md](./CI_CD.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **GitHub Secrets**: [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)
- **Environment Reference**: [ENVIRONMENT_QUICK_REFERENCE.md](./ENVIRONMENT_QUICK_REFERENCE.md)
- **GitHub Actions**: https://docs.github.com/en/actions
- **Firebase CLI**: https://firebase.google.com/docs/cli

---

**Last Updated**: March 5, 2026
