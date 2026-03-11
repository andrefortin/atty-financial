# DDoS Protection and Rate Limiting

This guide covers DDoS protection, rate limiting, and security measures for ATTY Financial.

## Table of Contents

- [Overview](#overview)
- [Rate Limiting Strategy](#rate-limiting-strategy)
- [DDoS Protection](#ddos-protection)
- [Rate Limiting Implementation](#rate-limiting-implementation)
- [DDoS Protection Implementation](#ddos-protection-implementation)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

ATTY Financial implements a comprehensive rate limiting and DDoS protection strategy to ensure API availability and prevent abuse.

### Protection Goals

- **Rate Limiting**: Prevent API abuse and ensure fair usage
- **DDoS Protection**: Mitigate distributed denial-of-service attacks
- **Security**: Protect against malicious activity
- **Performance**: Maintain API performance for legitimate users
- **Availability**: Ensure 99.999% availability

### Protection Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┬─────────────────┐
        │                             │                 │
        ▼                             ▼                 ▼
┌──────────────┐    ┌──────────────┐     ┌──────────────┐
│  Rate Limiter   │    │  DDoS        │     │  API Firewall│
│  (per user)     │    │  Protection    │     │  (global)     │
└──────┬─────────┘    └──────┬─────────┘     └──────┬─────────┘
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Firebase Firestore                       │
│  - Rate limit state (per user)                                  │
│  - Blocked IPs (global)                                          │
│  - Suspicious activity (per user)                                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Decision Layer                        │
│  - Allow request                                                 │
│  - Block request (rate limit)                                     │
│  - Block request (DDoS)                                          │
│  - Return 429 Too Many Requests                                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Monitoring & Alerting                       │
│  - Rate limit violations                                         │
│  - DDoS attack detection                                          │
│  - Suspicious activity                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Rate Limiting Strategy

### Rate Limiting Objectives

- **Fair Usage**: Ensure all users have fair access to API resources
- **Prevent Abuse**: Prevent automated API abuse and scraping
- **Performance**: Maintain API performance for legitimate users
- **Flexibility**: Support different subscription tiers with different limits
- **Scalability**: Handle growth in users and API usage

### Rate Limiting Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Token Bucket** | Decrement tokens on each request, refill at window start | General API rate limiting |
| **Sliding Window** | Count requests in sliding time window | Precise rate limiting |
| **Fixed Window** | Count requests in fixed time windows | Simple rate limiting |
| **Leaky Bucket** | Refill tokens at constant rate | Burst traffic management |

### Rate Limiting Tiers

| Tier | Requests per Hour | Burst (per minute) | Monthly Limit |
|-------|-------------------|----------------------|---------------|
| **Free** | 100 | 10 | 10,000 |
| **Standard** | 1,000 | 50 | 100,000 |
| **Professional** | 10,000 | 200 | 1,000,000 |
| **Enterprise** | 100,000 | 1,000 | 10,000,000 |

### Rate Limit Rules

| Endpoint | Free | Standard | Professional | Enterprise |
|----------|------|----------|-------------|-------------|
| `/api/matters` | 100/h | 1,000/h | 10,000/h | 100,000/h |
| `/api/transactions` | 200/h | 2,000/h | 20,000/h | 200,000/h |
| `/api/allocations` | 50/h | 500/h | 5,000/h | 50,000/h |
| `/api/reports` | 50/h | 200/h | 500/h | 5,000/h |
| `/api/auth` | 10/m | 100/m | 500/m | 1,000/m |
| `/api/search` | 20/m | 100/m | 500/m | 1,000/m |
| `/api/export` | 5/h | 50/h | 200/h | 1,000/h |
| `/api/import` | 5/h | 50/h | 200/h | 1,000/h |

---

## DDoS Protection

### DDoS Protection Objectives

- **Availability**: Ensure API remains available during DDoS attacks
- **Mitigation**: Reduce impact of DDoS attacks on legitimate users
- **Detection**: Identify DDoS attacks in real-time
- **Response**: Respond appropriately to DDoS attacks

### DDoS Attack Types

| Attack Type | Description | Mitigation Strategy |
|------------|-------------|---------------------|
| **Volume Attack** | Overwhelm with request volume | Rate limiting, IP blocking |
| **Protocol Attack** | Exploit protocol weaknesses | WAF rules, protocol validation |
| **Application Layer Attack** | Target application vulnerabilities | Rate limiting, WAF rules |
| **Amplification Attack** | Reflectors, amplifiers | Rate limiting, IP blocking |
| **Slowloris Attack** | Slow connections to exhaust resources | Connection timeout |

### DDoS Protection Layers

1. **Rate Limiting**:
   - User-based rate limiting
   - IP-based rate limiting
   - Endpoint-based rate limiting

2. **IP Blacklisting**:
   - Known malicious IPs
   - Proxy/VPN IPs
   - Hosting provider IPs

3. **Suspicious Activity Detection**:
   - Excessive API calls
   - Unusual request patterns
   - Automated detection

4. **IP Whitelisting**:
   - Known legitimate IPs
   - Partner organizations
   - Internal systems

5. **Geoblocking** (optional):
   - Country-level blocking
   - Region-level blocking
   - Used for compliance

6. **Request Validation**:
   - User agent validation
   - Header validation
   - Payload validation

---

## Rate Limiting Implementation

### Rate Limiter Library

`src/lib/rateLimiter.ts` provides comprehensive rate limiting:

#### Features

1. **Rate Limit Strategies**:
   - Token bucket (default)
   - Sliding window
   - Fixed window
   - Leaky bucket

2. **Storage Backends**:
   - In-memory (default)
   - Redis (distributed)
   - Firestore (persistent)

3. **Tier-Based Limiting**:
   - Free tier: 100 requests/hour
   - Standard tier: 1,000 requests/hour
   - Professional tier: 10,000 requests/hour
   - Enterprise tier: 100,000 requests/hour

4. **Endpoint-Specific Limits**:
   - Different limits per endpoint
   - Custom override per endpoint
   - Burst support

#### Usage

```typescript
import {
  RateLimiter,
  createRateLimiter,
  checkRateLimit,
  resetRateLimit,
  getUserTier,
} from '@/lib/rateLimiter';

// Create rate limiter instance
const rateLimiter = createRateLimiter({
  enabled: true,
  strategy: 'token_bucket',
  storage: 'memory', // or 'redis'
  defaultTiers: {
    free: { requests: 100, window: 3600, burst: 10, burstWindow: 60 },
    standard: { requests: 1000, window: 3600, burst: 50, burstWindow: 60 },
    professional: { requests: 10000, window: 3600, burst: 200, burstWindow: 60 },
    enterprise: { requests: 100000, window: 3600, burst: 1000, burstWindow: 60 },
  },
});

// Check rate limit
const result = await checkRateLimit('/api/matters', userId, 'standard');

if (!result.allowed) {
  console.log('Rate limit exceeded:', result);
  throw new Error('Rate limit exceeded. Please try again later.');
}

// Reset rate limit
await resetRateLimit('/api/matters', userId);
```

### Rate Limiting Middleware

`functions/middleware/rateLimiter.ts` provides Cloud Functions middleware:

#### Features

1. **Middleware Functions**:
   - `createRateLimitingMiddleware()` - For Express API
   - `createCloudFunctionRateLimitMiddleware()` - For Cloud Functions

2. **Tier Provider**:
   - Get user tier from Firestore
   - Default to 'standard'

3. **Rate Limit Rules**:
   - Endpoint-specific rules
   - Tier-specific limits
   - Custom overrides

#### Usage

```typescript
import {
  createRateLimitingMiddleware,
  createCloudFunctionRateLimitMiddleware,
} from '@/lib/rateLimiter';

// Express middleware
const rateLimitMiddleware = createRateLimitingMiddleware(
  rateLimiter,
  (userId) => 'standard', // Get user tier
  (result) => {
    // Custom action when rate limit exceeded
    console.log('Rate limit exceeded:', result);
  }
);

// Cloud Functions middleware
export const apiGetMatters = functions.https.onCall(
  createCloudFunctionRateLimitMiddleware(
    rateLimiter,
    (userId) => 'standard', // Get user tier
    async (result) => {
      // Send alert when rate limit exceeded
      await sendRateLimitAlert(userId, result);
    }
  ),
  async (data, context) => {
    // API logic
    return { matters: [] };
  }
);
```

### Cloud Functions Integration

Rate limiting is integrated into all Cloud Functions:

```typescript
import { createCloudFunctionRateLimitMiddleware } from '@/lib/rateLimiter';

// Apply rate limiting to all API endpoints
export const apiGetMatters = functions.https.onCall(
  createCloudFunctionRateLimitMiddleware(
    rateLimiter,
    async (userId) => {
      const tier = await getUserTier(userId);
      return tier;
    },
    async (result) => {
      // Log rate limit violation
      await logRateLimitViolation(userId, '/api/matters', result);
    }
  ),
  async (data, context) => {
    // API logic
  }
);
```

---

## DDoS Protection Implementation

### DDoS Protection Middleware

`functions/middleware/ddos.ts` provides comprehensive DDoS protection:

#### Features

1. **IP Blocking**:
   - Blacklisted IPs
   - Malicious IPs
   - Proxy/VPN IPs

2. **IP Whitelisting**:
   - Known legitimate IPs
   - Partner organizations
   - Internal systems

3. **Suspicious Activity Detection**:
   - Excessive API calls
   - Unusual request patterns
   - Automated detection

4. **Geoblocking** (optional):
   - Country-level blocking
   - Region-level blocking
   - Used for compliance

5. **Request Validation**:
   - User agent validation
   - Header validation
   - Payload validation

#### Usage

```typescript
import {
  createDDoSProtectionMiddleware,
  isIPBlacklisted,
  logSuspiciousActivity,
} from '@/lib/ddosProtection';

// Create DDoS protection middleware
const ddosProtectionMiddleware = createDDoSProtectionMiddleware({
  enabled: true,
  rateLimiting: true,
  ipBlacklist: true,
  ipWhitelist: ['192.168.1.1', '10.0.0.1'],
  suspiciousActivityThreshold: 10,
  maxConcurrentRequests: 100,
  requestTimeout: 30,
  geoblockingEnabled: false,
});

// Apply DDoS protection to all API endpoints
export const apiGetMatters = functions.https.onCall(
  ddosProtectionMiddleware,
  async (data, context) => {
    // API logic
    return { matters: [] };
  }
);
```

### DDoS Detection

DDoS attacks are detected through:

1. **Rate Limiting**:
   - Excessive requests from single IP
   - Excessive requests from single user
   - Rate limit violations across multiple users

2. **Suspicious Activity**:
   - 10+ rate limit violations in 1 hour
   - Pattern of abusive behavior
   - Automated detection

3. **IP Analysis**:
   - Known malicious IPs
   - Hosting provider IPs
   - Proxy/VPN IPs

4. **Request Analysis**:
   - User agent patterns
   - Header anomalies
   - Payload size analysis

---

## Monitoring and Alerting

### Rate Limit Monitoring

Monitor rate limit violations:

```typescript
import { getMonitoringMetrics, sendAlert } from '@/lib/monitoring';

// Monitor rate limit violations
export const monitorRateLimits = functions.pubsub
  .schedule('0 */10 * * *') // Every 10 minutes
  .onRun(async (context) => {
    const metrics = await getMonitoringMetrics();

    // Check for high error rate
    if (metrics.errorRate > 10) {
      await sendAlert('high_error_rate', {
        errorRate: metrics.errorRate,
        threshold: 10,
      });
    }

    // Check for high API failure rate
    if (metrics.apiFailureRate > 5) {
      await sendAlert('high_api_failure_rate', {
        apiFailureRate: metrics.apiFailureRate,
        threshold: 5,
      });
    }
  });
```

### DDoS Monitoring

Monitor DDoS attacks:

```typescript
// Monitor DDoS attacks
export const monitorDDoSAttacks = functions.pubsub
  .schedule('0 * * * *') // Every hour
  .onRun(async (context) => {
    const ddosStats = await getDDoSStats();

    // Check for high violation rate
    if (ddosStats.violationsPerHour > 100) {
      await sendAlert('ddos_attack_detected', {
        violationsPerHour: ddosStats.violationsPerHour,
        threshold: 100,
      });
    }

    // Check for multiple violators
    if (ddosStats.uniqueViolators > 50) {
      await sendAlert('multiple_violators', {
        uniqueViolators: ddosStats.uniqueViolators,
        threshold: 50,
      });
    }
  });
```

### Rate Limit Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| **Error Rate** | > 10/min | High error rate |
| **API Failure Rate** | > 5/min | High API failure rate |
| **Rate Limit Violations** | > 100/hour | DDoS attack detected |
| **Unique Violators** | > 50 users | Multiple violators |

---

## Security Best Practices

### Rate Limiting

1. **Use Multiple Strategies**:
   - Token bucket for general rate limiting
   - Sliding window for precise rate limiting
   - Fixed window for simple rate limiting

2. **Tier-Based Limits**:
   - Implement different limits per subscription tier
   - Allow enterprise customers higher limits
   - Provide upgrade path for higher limits

3. **Endpoint-Specific Limits**:
   - Different limits for different endpoints
   - Higher limits for read endpoints
   - Lower limits for write endpoints

4. **Burst Capacity**:
   - Allow short burst of requests
   - Separate burst limit from hourly limit
   - Prevent burst abuse

5. **Graceful Degradation**:
   - Gradually reduce limits under heavy load
   - Prioritize critical operations
   - Communicate limits to users

### DDoS Protection

1. **Layered Defense**:
   - Rate limiting (first line of defense)
   - IP blocking (second line of defense)
   - Suspicious activity detection (third line)

2. **Automated Detection**:
   - Real-time monitoring
   - Automatic IP blocking
   - Automatic alerting

3. **Manual Override**:
   - Admin can manually block IPs
   - Admin can manually whitelist IPs
   - Admin can reset rate limits

4. **Geographic Considerations**:
   - Respect user location preferences
   - Don't block based on geography unless necessary
   - Document geographic blocking policy

5. **Legal Compliance**:
   - Follow GDPR requirements
   - Provide incident response
   - Document DDoS response procedures

---

## Troubleshooting

### Rate Limiting Issues

**Problem**: Rate limit triggered incorrectly

**Solutions**:
1. Check rate limit configuration
2. Check user tier assignment
3. Check endpoint-specific limits
4. Check burst capacity

**Problem**: Rate limit not working

**Solutions**:
1. Check rate limiter initialization
2. Check storage backend configuration
3. Check tier provider function
4. Check middleware registration

### DDoS Protection Issues

**Problem**: Legitimate users blocked

**Solutions**:
1. Check IP blacklist
2. Check suspicious activity threshold
3. Check geoblocking configuration
4. Add user to IP whitelist

**Problem**: DDoS attack not detected

**Solutions**:
1. Check DDoS protection configuration
2. Check suspicious activity threshold
3. Check rate limiting configuration
4. Check monitoring configuration

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Monitoring and Alerts](./MONITORING.md)
- [Firebase Production Setup](./FIREBASE_PRODUCTION_SETUP.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security-rules)

---

## Appendix

### Rate Limit Configuration

```json
{
  "rateLimit": {
    "enabled": true,
    "defaultStrategy": "token_bucket",
    "defaultStorage": "memory",
    "defaultTiers": {
      "free": {
        "requests": 100,
        "window": 3600,
        "burst": 10,
        "burstWindow": 60
      },
      "standard": {
        "requests": 1000,
        "window": 3600,
        "burst": 50,
        "burstWindow": 60
      },
      "professional": {
        "requests": 10000,
        "window": 3600,
        "burst": 200,
        "burstWindow": 60
      },
      "enterprise": {
        "requests": 100000,
        "window": 3600,
        "burst": 1000,
        "burstWindow": 60
      }
    },
    "byEndpoint": {
      "/api/matters": {
        "free": { "requests": 100, "window": 3600 },
        "standard": { "requests": 1000, "window": 3600 },
        "professional": { "requests": 10000, "window": 3600 },
        "enterprise": { "requests": 100000, "window": 3600 }
      },
      "/api/transactions": {
        "free": { "requests": 200, "window": 3600 },
        "standard": { "requests": 2000, "window": 3600 },
        "professional": { "requests": 20000, "window": 3600 },
        "enterprise": { "requests": 200000, "window": 3600 }
      }
    }
  },
  "ddos": {
    "enabled": true,
    "rateLimiting": true,
    "ipBlacklist": {
      "enabled": true,
      "provider": "firestore",
      "collection": "blacklistedIPs"
    },
    "ipWhitelist": {
      "enabled": true,
      "ips": []
    },
    "suspiciousActivity": {
      "enabled": true,
      "threshold": 10,
      "window": 3600
    },
    "geoblocking": {
      "enabled": false,
      "blockedCountries": [],
      "blockedRegions": []
    },
    "maxConcurrentRequests": 100,
    "requestTimeout": 30,
    "alertThreshold": 100
  }
}
```

### Rate Limit Headers

The following headers are added to API responses:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Request limit per window | `1000` |
| `X-RateLimit-Remaining` | Remaining requests in window | `999` |
| `X-RateLimit-Reset` | Time when window resets | `2026-03-05T10:00:00Z` |
| `X-RateLimit-Tier` | User's rate limit tier | `standard` |
| `X-RateLimit-WindowStart` | Window start time | `2026-03-05T10:00:00Z` |
| `X-RateLimit-Requests` | Requests in window | `1` |
| `X-DDoS-Protection` | DDoS protection status | `enabled` |
| `X-DDoS-Allowed` | Request allowed | `true` |
| `X-DDoS-Reason` | DDoS check result | `none` |
| `X-DDoS-Block-Reason` | DDoS block reason | `none` |
| `X-DDoS-Blocked-Until` | Block expiration time | `null` |
| `X-DDoS-Tier` | User tier for DDoS check | `standard` |

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
