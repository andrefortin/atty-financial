/**
 * Cloud Functions Rate Limiting Middleware
 *
 * Rate limiting middleware for Firebase Cloud Functions.
 * Supports multiple rate limiting strategies and storage backends.
 *
 * @module middleware/rateLimiter
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Import rate limiter library
// Note: In production, this would import from @atty-financial/rateLimiter
import {
  RateLimiter,
  RateLimitTier,
  RateLimitResult,
  RateLimitConfig,
  RateLimitStrategy,
  DEFAULT_RATE_LIMIT_CONFIG,
  createRateLimiter,
} from '../../src/lib/rateLimiter';

// ============================================
// Configuration
// ============================================

/**
 * Rate limiter configuration for Cloud Functions
 */
const RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  strategy: 'token_bucket', // Token bucket algorithm
  storage: 'firestore', // Use Firestore for distributed rate limiting
  firestore: admin.firestore(),
  defaultTiers: {
    free: {
      requests: 100,
      window: 3600, // 1 hour
      burst: 10,
      burstWindow: 60, // 1 minute
    },
    standard: {
      requests: 1000,
      window: 3600, // 1 hour
      burst: 50,
      burstWindow: 60, // 1 minute
    },
    professional: {
      requests: 10000,
      window: 3600, // 1 hour
      burst: 200,
      burstWindow: 60, // 1 minute
    },
    enterprise: {
      requests: 100000,
      window: 3600, // 1 hour
      burst: 1000,
      burstWindow: 60, // 1 minute
    },
  },
};

// ============================================
// Rate Limiter Instance
// ============================================

let globalRateLimiter: RateLimiter | null = null;

/**
 * Get global rate limiter instance
 */
function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = createRateLimiter(RATE_LIMIT_CONFIG);
  }
  return globalRateLimiter;
}

// ============================================
// Rate Limiting Middleware
// ============================================

/**
 * Create rate limiting middleware for Cloud Functions
 */
export function createRateLimitingMiddleware(options?: {
  tierProvider?: (userId: string) => RateLimitTier;
  onRateLimitExceeded?: (result: RateLimitResult) => functions.HttpsError;
}) {
  const {
    tierProvider = (userId: string) => 'standard',
    onRateLimitExceeded = defaultOnRateLimitExceeded,
  } = options || {};

  return async (
    data: any,
    context: functions.EventContext<functions.HttpsCallableData>
  ) => {
    // Get user ID from auth
    const userId = context.auth?.uid || data.userId || 'anonymous';
    
    // Get endpoint from function name
    const endpoint = getEndpointName(context);
    
    // Get user tier
    const tier = tierProvider(userId);
    
    // Check rate limit
    const result = await getGlobalRateLimiter().checkRateLimit(
      endpoint,
      userId,
      tier
    );

    // Log rate limit check
    console.log('[Rate Limit]', {
      userId,
      endpoint,
      tier,
      allowed: result.allowed,
      limit: result.limit,
      remaining: result.remaining,
      requestsInWindow: result.requestsInWindow,
    });

    // Throw error if rate limit exceeded
    if (!result.allowed) {
      throw onRateLimitExceeded(result);
    }

    // Add rate limit metadata to response
    return {
      ...data,
      _rateLimit: {
        allowed: result.allowed,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        tier: result.tier,
        requestsInWindow: result.requestsInWindow,
      },
    };
  };
}

/**
 * Default rate limit exceeded handler
 */
function defaultOnRateLimitExceeded(
  result: RateLimitResult
): functions.HttpsError {
  return new functions.https.HttpsError(
    'resource-exhausted',
    'Rate limit exceeded. Please try again later.',
    {
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      tier: result.tier,
      requestsInWindow: result.requestsInWindow,
      retryAfter: result.reset,
    }
  );
}

/**
 * Get endpoint name from function context
 */
function getEndpointName(
  context: functions.EventContext<functions.HttpsCallableData>
): string {
  return context.functionName || 'unknown';
}

// ============================================
// Rate Limit Rules by Endpoint
// ============================================

/**
 * Rate limit rules for different endpoints
 */
export const RATE_LIMIT_RULES: Record<string, {
  tiers: RateLimitTier[];
  defaultTier: RateLimitTier;
}> = {
  'api-getMatters': {
    tiers: ['free', 'standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-createMatter': {
    tiers: ['free', 'standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-updateMatter': {
    tiers: ['standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-deleteMatter': {
    tiers: ['professional', 'enterprise'],
    defaultTier: 'professional',
  },
  'api-getTransactions': {
    tiers: ['free', 'standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-createTransaction': {
    tiers: ['free', 'standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-updateTransaction': {
    tiers: ['free', 'standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-deleteTransaction': {
    tiers: ['professional', 'enterprise'],
    defaultTier: 'professional',
  },
  'api-runAllocation': {
    tiers: ['standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-generateReport': {
    tiers: ['standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-exportData': {
    tiers: ['standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
  'api-search': {
    tiers: ['free', 'standard', 'professional', 'enterprise'],
    defaultTier: 'standard',
  },
};

/**
 * Tier provider function
 */
export async function getTierFromUserId(
  userId: string
): Promise<RateLimitTier> {
  if (!userId || userId === 'anonymous') {
    return 'free';
  }

  try {
    // Get user from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists()) {
      return 'standard';
    }

    const user = userDoc.data();
    const subscription = user.subscription;

    // Return tier based on subscription
    switch (subscription?.plan) {
      case 'enterprise':
        return 'enterprise';
      case 'professional':
        return 'professional';
      case 'standard':
        return 'standard';
      case 'free':
      default:
        return 'standard';
    }
  } catch (error) {
    console.error('Failed to get user tier:', error);
    return 'standard';
  }
}

// ============================================
// Rate Limit Monitoring
// ============================================

/**
 * Log rate limit violation
 */
export async function logRateLimitViolation(
  userId: string,
  endpoint: string,
  result: RateLimitResult
): Promise<void> {
  const firestore = admin.firestore();

  await firestore.collection('rateLimitViolations').add({
    userId,
    endpoint,
    tier: result.tier,
    limit: result.limit,
    requestsInWindow: result.requestsInWindow,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('[Rate Limit Violation]', {
    userId,
    endpoint,
    tier: result.tier,
    limit: result.limit,
    requestsInWindow: result.requestsInWindow,
  });
}

/**
 * Monitor rate limit violations
 */
export const monitorRateLimitViolations = functions.pubsub
  .schedule('0 * * * *') // Every hour
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const firestore = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Get violations in the last hour
    const oneHourAgo = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().getTime() - 60 * 60 * 1000)
    );

    const snapshot = await firestore
      .collection('rateLimitViolations')
      .where('timestamp', '>=', oneHourAgo)
      .get();

    if (snapshot.empty) {
      console.log('No rate limit violations in the last hour');
      return null;
    }

    // Group violations by user
    const violationsByUser = new Map<string, any[]>();
    snapshot.docs.forEach(doc => {
      const violation = doc.data();
      const userId = violation.userId;

      if (!violationsByUser.has(userId)) {
        violationsByUser.set(userId, []);
      }

      violationsByUser.get(userId)!.push(violation);
    });

    // Identify users with excessive violations
    const excessiveViolators: Array.from(violationsByUser.entries())
      .filter(([_, violations]) => violations.length > 10);

    if (excessiveViolators.length > 0) {
      console.warn(`Found ${excessiveViolators.length} users with excessive rate limit violations`);

      // Log to monitoring
      for (const [userId, violations] of excessiveViolators) {
        console.warn(`User ${userId} has ${violations.length} violations:`);

        violations.forEach((violation: any) => {
          console.warn(`  - Endpoint: ${violation.endpoint}, Tier: ${violation.tier}, Limit: ${violation.limit}`);
        });
      }

      // Send alert if many excessive violators
      if (excessiveViolators.length > 50) {
        await sendExcessiveViolatorsAlert(excessiveViolators);
      }
    }

    return null;
  });

/**
 * Send alert for excessive rate limit violators
 */
async function sendExcessiveViolatorsAlert(
  violators: Array<[string, any[]]>
): Promise<void> {
  // TODO: Send Slack alert
  console.log('Excessive rate limit violators:', violators.length);
}

// ============================================
// Rate Limit Reset
// ============================================

/**
 * Reset rate limits for a user
 */
export async function resetUserRateLimits(userId: string): Promise<void> {
  const rateLimiter = getGlobalRateLimiter();

  // Get all endpoints
  const endpoints = Object.keys(RATE_LIMIT_RULES);

  // Reset each endpoint
  for (const endpoint of endpoints) {
    await rateLimiter.resetRateLimit(endpoint, userId);
  }

  console.log(`Rate limits reset for user: ${userId}`);
}

/**
 * Reset rate limits for an endpoint
 */
export async function resetEndpointRateLimit(endpoint: string): Promise<void> {
  const rateLimiter = getGlobalRateLimiter();
  await rateLimiter.resetRateLimit(endpoint);

  console.log(`Rate limits reset for endpoint: ${endpoint}`);
}

/**
 * Reset all rate limits
 */
export const resetAllRateLimits = functions.https.onCall(
  async (data, context) => {
    // Verify admin role
    const userId = context.auth?.uid;
    if (!userId) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required.'
      );
    }

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (userDoc.data()?.role !== 'Admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin role required.'
      );
    }

    // Reset all rate limits
    const rateLimiter = getGlobalRateLimiter();
    rateLimiter.clearAllRateLimitStates();

    console.log('All rate limits reset by admin');

    return { success: true };
  }
);

// ============================================
// Rate Limit Status
// ============================================

/**
 * Get rate limit status for a user
 */
export const getRateLimitStatus = functions.https.onCall(
  async (data: { userId?: string }, context) => {
    const userId = data.userId || context.auth?.uid;

    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User ID required.'
      );
    }

    const rateLimiter = getGlobalRateLimiter();

    // Get all endpoints
    const endpoints = Object.keys(RATE_LIMIT_RULES);

    // Get rate limit status for each endpoint
    const status: Record<string, any> = {};
    const tier = await getTierFromUserId(userId);

    for (const endpoint of endpoints) {
      const result = await rateLimiter.checkRateLimit(
        endpoint,
        userId,
        tier
      );

      status[endpoint] = {
        allowed: result.allowed,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        tier: result.tier,
        requestsInWindow: result.requestsInWindow,
      };
    }

    return {
      userId,
      tier,
      status,
    };
  }
);

/**
 * Get rate limit statistics
 */
export const getRateLimitStatistics = functions.https.onCall(
  async (_data, context) => {
    // Verify admin role
    const userId = context.auth?.uid;
    if (!userId) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required.'
      );
    }

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (userDoc.data()?.role !== 'Admin') {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin role required."
      );
    }

    const rateLimiter = getGlobalRateLimiter();

    // Get all rate limit states
    const states = rateLimiter.getAllRateLimitStates();

    // Calculate statistics
    const totalRequests = Array.from(states.values())
      .reduce((sum, state) => sum + state.count, 0);

    const endpoints = Object.keys(states);

    return {
      totalRequests,
      totalEndpoints: endpoints.length,
      endpoints,
    };
  }
);

// ============================================
// Exports
// ============================================

export {
  // Middleware
  createRateLimitingMiddleware,

  // Tier Provider
  getTierFromUserId,

  // Monitoring
  logRateLimitViolation,
  monitorRateLimitViolations,

  // Reset Functions
  resetUserRateLimits,
  resetEndpointRateLimit,
  resetAllRateLimits,

  // Status Functions
  getRateLimitStatus,
  getRateLimitStatistics,

  // Rules
  RATE_LIMIT_RULES,
};
