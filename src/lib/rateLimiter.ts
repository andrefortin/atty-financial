/**
 * Rate Limiter
 *
 * Redis-backed or in-memory rate limiting for API endpoints.
 * Supports multiple rate limiting strategies (token bucket, sliding window, fixed window).
 *
 * @module lib/rateLimiter
 */

// ============================================
// Types
// ============================================

/**
 * Rate limit tier
 */
export type RateLimitTier = 
  | 'free'
  | 'standard'
  | 'professional'
  | 'enterprise';

/**
 * Rate limit strategy
 */
export type RateLimitStrategy =
  | 'token_bucket'      // Token bucket algorithm
  | 'sliding_window'    // Sliding window log
  | 'fixed_window'      // Fixed window counter
  | 'leaky_bucket';    // Leaky bucket algorithm

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  strategy: RateLimitStrategy;
  storage: 'memory' | 'redis' | 'firestore';
  redisUrl?: string;
  redisKeyPrefix?: string;
  defaultTiers: Record<RateLimitTier, RateLimitTierConfig>;
}

/**
 * Rate limit tier configuration
 */
export interface RateLimitTierConfig {
  requests: number;         // Maximum requests
  window: number;            // Time window in seconds
  burst: number;             // Maximum burst requests
  burstWindow: number;       // Burst window in seconds
}

/**
 * Rate limit rule
 */
export interface RateLimitRule {
  tier: RateLimitTier;
  endpoint: string;
  config: RateLimitTierConfig;
  override?: RateLimitTierConfig; // Tier-specific override
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  tier: RateLimitTier;
  windowStart: Date;
  requestsInWindow: number;
}

/**
 * Rate limit state
 */
export interface RateLimitState {
  count: number;
  windowStart: number;
  lastRequest: number;
  tier: RateLimitTier;
}

// ============================================
// Default Rate Limit Tiers
// ============================================

/**
 * Default rate limit tiers for different subscription levels
 */
export const DEFAULT_TIERS: Record<RateLimitTier, RateLimitTierConfig> = {
  free: {
    requests: 100,
    window: 3600,     // 1 hour
    burst: 10,
    burstWindow: 60,    // 1 minute
  },
  standard: {
    requests: 1000,
    window: 3600,      // 1 hour
    burst: 50,
    burstWindow: 60,     // 1 minute
  },
  professional: {
    requests: 10000,
    window: 3600,       // 1 hour
    burst: 200,
    burstWindow: 60,    // 1 minute
  },
  enterprise: {
    requests: 100000,
    window: 3600,        // 1 hour
    burst: 1000,
    burstWindow: 60,     // 1 minute
  },
};

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  strategy: 'token_bucket',
  storage: 'memory',
  defaultTiers: DEFAULT_TIERS,
};

// ============================================
// Rate Limiter Class
// ============================================

/**
 * Rate Limiter Implementation
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private state: Map<string, RateLimitState> = new Map();
  private redis: any = null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      ...DEFAULT_RATE_LIMIT_CONFIG,
      ...config,
    };
  }

  /**
   * Initialize rate limiter
   */
  async initialize(): Promise<void> {
    if (this.config.storage === 'redis' && this.config.redisUrl) {
      await this.initializeRedis();
    }
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redis = await import('redis');
      this.redis = redis.createClient({
        url: this.config.redisUrl,
        keyPrefix: this.config.redisKeyPrefix || 'ratelimit:',
      });

      await this.redis.connect();
      console.log('Redis rate limiter initialized');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      // Fall back to in-memory
      this.config.storage = 'memory';
    }
  }

  /**
   * Check rate limit for request
   */
  async checkRateLimit(
    endpoint: string,
    userId: string,
    tier: RateLimitTier = 'standard',
    override?: RateLimitTierConfig
  ): Promise<RateLimitResult> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        limit: Infinity,
        remaining: Infinity,
        reset: new Date(),
        tier,
        windowStart: new Date(),
        requestsInWindow: 0,
      };
    }

    const config = override || this.config.defaultTiers[tier] || this.config.defaultTiers.standard;
    const key = this.generateKey(endpoint, userId);

    let result: RateLimitResult;

    switch (this.config.storage) {
      case 'redis':
        result = await this.checkRedisRateLimit(key, config);
        break;
      case 'firestore':
        result = await this.checkFirestoreRateLimit(key, config);
        break;
      case 'memory':
      default:
        result = this.checkInMemoryRateLimit(key, config);
        break;
    }

    return result;
  }

  /**
   * Check in-memory rate limit (token bucket strategy)
   */
  private checkInMemoryRateLimit(
    key: string,
    config: RateLimitTierConfig,
    strategy: RateLimitStrategy = 'token_bucket'
  ): RateLimitResult {
    const now = Date.now();
    const state = this.state.get(key) || this.createState(config);

    switch (strategy) {
      case 'token_bucket':
        return this.tokenBucketLimit(key, state, config, now);
      case 'sliding_window':
        return this.slidingWindowLimit(key, state, config, now);
      case 'fixed_window':
        return this.fixedWindowLimit(key, state, config, now);
      case 'leaky_bucket':
        return this.leakyBucketLimit(key, state, config, now);
      default:
        return this.tokenBucketLimit(key, state, config, now);
    }
  }

  /**
   * Token bucket rate limiting algorithm
   */
  private tokenBucketLimit(
    key: string,
    state: RateLimitState,
    config: RateLimitTierConfig,
    now: number
  ): RateLimitResult {
    const windowElapsed = (now - state.windowStart) / 1000; // in seconds

    // Reset window if expired
    if (windowElapsed >= config.window) {
      state.count = 0;
      state.windowStart = now;
    }

    // Check if request is allowed
    const allowed = state.count < config.requests;
    const remaining = Math.max(0, config.requests - state.count);
    const reset = new Date(state.windowStart + config.window * 1000);

    // Increment count if allowed
    if (allowed) {
      state.count++;
      state.lastRequest = now;
      this.state.set(key, state);
    }

    return {
      allowed,
      limit: config.requests,
      remaining,
      reset,
      tier: state.tier,
      windowStart: new Date(state.windowStart),
      requestsInWindow: state.count,
    };
  }

  /**
   * Sliding window rate limiting algorithm
   */
  private slidingWindowLimit(
    key: string,
    state: RateLimitState,
    config: RateLimitTierConfig,
    now: number
  ): RateLimitResult {
    const windowStart = state.windowStart;
    const windowEnd = windowStart + config.window * 1000;

    // Remove requests outside the window
    // Simplified implementation (for production, use proper sliding window)
    const allowed = state.count < config.requests;
    const remaining = Math.max(0, config.requests - state.count);
    const reset = new Date(state.windowStart + config.window * 1000);

    if (allowed) {
      state.count++;
      state.lastRequest = now;
      
      // Move window start if window expired
      if (now > windowEnd) {
        state.count = 1;
        state.windowStart = now - (config.window - 1) * 1000;
      }
      
      this.state.set(key, state);
    }

    return {
      allowed,
      limit: config.requests,
      remaining,
      reset,
      tier: state.tier,
      windowStart: new Date(state.windowStart),
      requestsInWindow: state.count,
    };
  }

  /**
   * Fixed window rate limiting algorithm
   */
  private fixedWindowLimit(
    key: string,
    state: RateLimitState,
    config: RateLimitTierConfig,
    now: number
  ): RateLimitResult {
    const windowElapsed = (now - state.windowStart) / 1000; // in seconds

    // Reset window if expired
    if (windowElapsed >= config.window) {
      state.count = 0;
      state.windowStart = now;
    }

    // Check if request is allowed
    const allowed = state.count < config.requests;
    const remaining = Math.max(0, config.requests - state.count);
    const reset = new Date(state.windowStart + config.window * 1000);

    // Increment count if allowed
    if (allowed) {
      state.count++;
      state.lastRequest = now;
      this.state.set(key, state);
    }

    return {
      allowed,
      limit: config.requests,
      remaining,
      reset,
      tier: state.tier,
      windowStart: new Date(state.windowStart),
      requestsInWindow: state.count,
    };
  }

  /**
   * Leaky bucket rate limiting algorithm
   */
  private leakyBucketLimit(
    key: string,
    state: RateLimitState,
    config: RateLimitTierConfig,
    now: number
  ): RateLimitResult {
    const timeElapsed = (now - state.lastRequest) / 1000; // in seconds

    // Leak tokens if time has passed
    const leakAmount = Math.min(
      Math.floor(timeElapsed * config.requests / config.window),
      state.count
    );

    if (leakAmount > 0) {
      state.count = Math.max(0, state.count - leakAmount);
    }

    // Check if request is allowed
    const allowed = state.count < config.requests;
    const remaining = Math.max(0, config.requests - state.count);
    const reset = new Date(now + config.window * 1000); // Approximate

    // Increment count if allowed
    if (allowed) {
      state.count++;
      state.lastRequest = now;
      this.state.set(key, state);
    }

    return {
      allowed,
      limit: config.requests,
      remaining,
      reset,
      tier: state.tier,
      windowStart: new Date(state.windowStart),
      requestsInWindow: state.count,
    };
  }

  /**
   * Check Redis-backed rate limit
   */
  private async checkRedisRateLimit(
    key: string,
    config: RateLimitTierConfig
  ): Promise<RateLimitResult> {
    if (!this.redis) {
      // Fall back to in-memory
      return this.checkInMemoryRateLimit(key, config);
    }

    try {
      const now = Date.now();

      // Use Redis INCR for atomic counter
      const [count] = await this.redis
        .multi()
        .incr(`${key}:count`)
        .pexpire(`${key}:count`, config.window) // Expire key after window
        .exec();

      // Check if allowed
      const allowed = count < config.requests;
      const remaining = Math.max(0, config.requests - count);
      const reset = new Date(now + config.window * 1000);

      return {
        allowed,
        limit: config.requests,
        remaining,
        reset,
        tier: 'standard',
        windowStart: new Date(now - (config.window * 1000)),
        requestsInWindow: count,
      };
    } catch (error) {
      console.error('Redis rate limit check failed:', error);
      
      // Fall back to in-memory on error
      return this.checkInMemoryRateLimit(key, config);
    }
  }

  /**
   * Check Firestore-backed rate limit
   */
  private async checkFirestoreRateLimit(
    key: string,
    config: RateLimitTierConfig
  ): Promise<RateLimitResult> {
    try {
      const { doc, getDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { getFirestore } = await import('firebase/firestore');
      
      const db = getFirestore();
      const rateLimitRef = doc(db, 'rateLimits').doc(key);

      // Get current state
      const rateLimitDoc = await getDoc(rateLimitRef);
      const now = Date.now();
      let state: RateLimitState;

      if (rateLimitDoc.exists()) {
        state = rateLimitDoc.data() as RateLimitState;
        
        // Check if window has expired
        const windowElapsed = (now - state.windowStart) / 1000;
        if (windowElapsed >= config.window) {
          state.count = 0;
          state.windowStart = now;
        }
      } else {
        // Create new state
        state = this.createState(config);
        state.windowStart = now;
      }

      // Check if allowed
      const allowed = state.count < config.requests;
      const remaining = Math.max(0, config.requests - state.count);
      const reset = new Date(state.windowStart + config.window * 1000);

      if (allowed) {
        state.count++;
        state.lastRequest = now;
        
        await updateDoc(rateLimitRef, state);
      }

      return {
        allowed,
        limit: config.requests,
        remaining,
        reset,
        tier: state.tier,
        windowStart: new Date(state.windowStart),
        requestsInWindow: state.count,
      };
    } catch (error) {
      console.error('Firestore rate limit check failed:', error);
      
      // Fall back to in-memory on error
      return this.checkInMemoryRateLimit(key, config);
    }
  }

  /**
   * Reset rate limit state for endpoint
   */
  async resetRateLimit(
    endpoint: string,
    userId?: string
  ): Promise<void> {
    const keys = userId 
      ? [this.generateKey(endpoint, userId)]
      : Array.from(this.state.keys()).filter(k => k.startsWith(`${endpoint}:`));

    // Reset in-memory state
    for (const key of keys) {
      this.state.delete(key);
    }

    // Reset Redis state
    if (this.redis) {
      try {
        const multi = this.redis.multi();
        for (const key of keys) {
          multi.del(`${key}:count`);
        }
        await multi.exec();
      } catch (error) {
        console.error('Failed to reset Redis rate limit:', error);
      }
    }

    console.log(`Rate limit reset for endpoint: ${endpoint}${userId ? `, user: ${userId}` : ''}`);
  }

  /**
   * Get rate limit state for endpoint
   */
  getRateLimitState(
    endpoint: string,
    userId: string
  ): RateLimitState | null {
    const key = this.generateKey(endpoint, userId);
    return this.state.get(key) || null;
  }

  /**
   * Get all rate limit states
   */
  getAllRateLimitStates(): Map<string, RateLimitState> {
    return new Map(this.state);
  }

  /**
   * Clear all rate limit states
   */
  clearAllRateLimitStates(): void {
    this.state.clear();
    console.log('All rate limit states cleared');
  }

  /**
   * Create new rate limit state
   */
  private createState(config: RateLimitTierConfig): RateLimitState {
    return {
      count: 0,
      windowStart: Date.now(),
      lastRequest: Date.now(),
      tier: 'standard',
    };
  }

  /**
   * Generate unique key for rate limiting
   */
  private generateKey(endpoint: string, userId: string): string {
    return `${endpoint}:${userId}`;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      console.log('Redis rate limiter closed');
    }
  }
}

// ============================================
// Middleware Functions
// ============================================

/**
 * Create rate limiting middleware for API endpoints
 */
export function createRateLimitMiddleware(
  rateLimiter: RateLimiter,
  tierProvider: (userId: string) => RateLimitTier = () => 'standard',
  onRateLimitExceeded?: (result: RateLimitResult) => void | Response
): {
  before: [string];
  handler: any;
} {
  const prefix = '/api';

  return {
    before: [prefix],
    handler: async (request: any, response: any, next: any) => {
      // Skip rate limiting for GET requests (read-only)
      if (request.method === 'GET') {
        return next();
      }

      // Get user ID from request
      const userId = request.user?.uid || request.headers['x-user-id'] || 'anonymous';
      
      // Get user tier
      const tier = tierProvider(userId);
      
      // Check rate limit
      const endpoint = request.path.replace(prefix, '') || 'unknown';
      const result = await rateLimiter.checkRateLimit(endpoint, userId, tier);

      // Add rate limit headers to response
      if (result) {
        response.setHeader('X-RateLimit-Limit', result.limit.toString());
        response.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        response.setHeader('X-RateLimit-Reset', result.reset.toUTCString());
        response.setHeader('X-RateLimit-Tier', result.tier);
        response.setHeader('X-RateLimit-WindowStart', result.windowStart.toUTCString());
        response.setHeader('X-RateLimit-Requests', result.requestsInWindow.toString());
      }

      // Check if rate limit exceeded
      if (!result.allowed) {
        if (onRateLimitExceeded) {
          const customResponse = onRateLimitExceeded(result);
          if (customResponse instanceof Response) {
            return customResponse;
          }
        }

        // Return 429 Too Many Requests
        return response.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          tier: result.tier,
          retryAfter: result.reset,
        });
      }

      return next();
    },
  };
}

/**
 * Create Cloud Functions rate limiting middleware
 */
export function createCloudFunctionRateLimitMiddleware(
  rateLimiter: RateLimiter,
  tierProvider: (userId: string) => RateLimitTier = () => 'standard'
): any {
  return async (data: any, context: any) => {
    // Get user ID from auth
    const userId = context.auth?.uid || data.userId || 'anonymous';
    
    // Get endpoint from function name
    const endpoint = context.functionName || 'unknown';
    
    // Get user tier
    const tier = tierProvider(userId);
    
    // Check rate limit
    const result = await rateLimiter.checkRateLimit(endpoint, userId, tier);

    // Add rate limit metadata to response
    if (context.rawResponse) {
      context.rawResponse.setHeaders({
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toUTCString(),
        'X-RateLimit-Tier': result.tier,
        'X-RateLimit-WindowStart': result.windowStart.toUTCString(),
        'X-RateLimit-Requests': result.requestsInWindow.toString(),
      });
    }

    // Throw error if rate limit exceeded
    if (!result.allowed) {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      (error as any).info = {
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        tier: result.tier,
      };
      throw error;
    }

    return data;
  };
}

// ============================================
// Rate Limit Rules
// ============================================

/**
 * Default rate limit rules for different endpoints
 */
export const DEFAULT_RATE_LIMIT_RULES: RateLimitRule[] = [
  {
    tier: 'free',
    endpoint: '/api/matters',
    config: {
      requests: 100,
      window: 3600,
      burst: 10,
      burstWindow: 60,
    },
  },
  {
    tier: 'standard',
    endpoint: '/api/matters',
    config: {
      requests: 1000,
      window: 3600,
      burst: 50,
      burstWindow: 60,
    },
  },
  {
    tier: 'professional',
    endpoint: '/api/matters',
    config: {
      requests: 10000,
      window: 3600,
      burst: 200,
      burstWindow: 60,
    },
  },
  {
    tier: 'enterprise',
    endpoint: '/api/matters',
    config: {
      requests: 100000,
      window: 3600,
      burst: 1000,
      burstWindow: 60,
    },
  },
  {
    tier: 'free',
    endpoint: '/api/transactions',
    config: {
      requests: 200,
      window: 3600,
      burst: 20,
      burstWindow: 60,
    },
  },
  {
    tier: 'standard',
    endpoint: '/api/transactions',
    config: {
      requests: 2000,
      window: 3600,
      burst: 100,
      burstWindow: 60,
    },
  },
  {
    tier: 'professional',
    endpoint: '/api/transactions',
    config: {
      requests: 20000,
      window: 3600,
      burst: 400,
      burstWindow: 60,
    },
  },
  {
    tier: 'enterprise',
    endpoint: '/api/transactions',
    config: {
      requests: 200000,
      window: 3600,
      burst: 2000,
      burstWindow: 60,
    },
  },
  {
    tier: 'free',
    endpoint: '/api/allocations',
    config: {
      requests: 50,
      window: 3600,
      burst: 10,
      burstWindow: 60,
    },
  },
  {
    tier: 'standard',
    endpoint: '/api/allocations',
    config: {
      requests: 500,
      window: 3600,
      burst: 50,
      burstWindow: 60,
    },
  },
  {
    tier: 'professional',
    endpoint: '/api/allocations',
    config: {
      requests: 5000,
      window: 3600,
      burst: 200,
      burstWindow: 60,
    },
  },
  {
    tier: 'enterprise',
    endpoint: '/api/allocations',
    config: {
      requests: 50000,
      window: 3600,
      burst: 1000,
      burstWindow: 60,
    },
  },
  {
    tier: 'free',
    endpoint: '/api/reports',
    config: {
      requests: 50,
      window: 3600,
      burst: 10,
      burstWindow: 60,
    },
  },
  {
    tier: 'standard',
    endpoint: '/api/reports',
    config: {
      requests: 200,
      window: 3600,
      burst: 20,
      burstWindow: 60,
    },
  },
  {
    tier: 'professional',
    endpoint: '/api/reports',
    config: {
      requests: 500,
      window: 3600,
      burst: 100,
      burstWindow: 60,
    },
  },
  {
    tier: 'enterprise',
    endpoint: '/api/reports',
    config: {
      requests: 5000,
      window: 3600,
      burst: 200,
      burstWindow: 60,
    },
  },
];

/**
 * Rate limit configuration per endpoint
 */
export const RATE_LIMIT_BY_ENDPOINT: Record<string, Record<RateLimitTier, RateLimitTierConfig>> = {
  '/api/matters': DEFAULT_TIERS,
  '/api/transactions': {
    free: { requests: 200, window: 3600, burst: 20, burstWindow: 60 },
    standard: { requests: 2000, window: 3600, burst: 100, burstWindow: 60 },
    professional: { requests: 20000, window: 3600, burst: 400, burstWindow: 60 },
    enterprise: { requests: 200000, window: 3600, burst: 2000, burstWindow: 60 },
  },
  '/api/allocations': {
    free: { requests: 50, window: 3600, burst: 10, burstWindow: 60 },
    standard: { requests: 500, window: 3600, burst: 50, burstWindow: 60 },
    professional: { requests: 5000, window: 3600, burst: 200, burstWindow: 60 },
    enterprise: { requests: 50000, window: 3600, burst: 1000, burstWindow: 60 },
  },
  '/api/reports': {
    free: { requests: 50, window: 3600, burst: 10, burstWindow: 60 },
    standard: { requests: 200, window: 3600, burst: 20, burstWindow: 60 },
    professional: { requests: 500, window: 3600, burst: 100, burstWindow: 60 },
    enterprise: { requests: 5000, window: 3600, burst: 200, burstWindow: 60 },
  },
  '/api/auth': {
    free: { requests: 10, window: 60, burst: 5, burstWindow: 60 },
    standard: { requests: 100, window: 60, burst: 50, burstWindow: 60 },
    professional: { requests: 500, window: 60, burst: 100, burstWindow: 60 },
    enterprise: { requests: 1000, window: 60, burst: 200, burstWindow: 60 },
  },
  '/api/search': {
    free: { requests: 20, window: 60, burst: 10, burstWindow: 60 },
    standard: { requests: 100, window: 60, burst: 50, burstWindow: 60 },
    professional: { requests: 500, window: 60, burst: 100, burstWindow: 60 },
    enterprise: { requests: 2000, window: 60, burst: 200, burstWindow: 60 },
  },
  '/api/export': {
    free: { requests: 5, window: 3600, burst: 2, burstWindow: 60 },
    standard: { requests: 50, window: 3600, burst: 10, burstWindow: 60 },
    professional: { requests: 200, window: 3600, burst: 50, burstWindow: 60 },
    enterprise: { requests: 1000, window: 3600, burst: 100, burstWindow: 60 },
  },
  '/api/import': {
    free: { requests: 5, window: 3600, burst: 2, burstWindow: 60 },
    standard: { requests: 50, window: 3600, burst: 10, burstWindow: 60 },
    professional: { requests: 200, window: 3600, burst: 50, burstWindow: 60 },
    enterprise: { requests: 1000, window: 3600, burst: 100, burstWindow: 60 },
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Create rate limiter instance
 */
export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Create global rate limiter instance
 */
let globalRateLimiter: RateLimiter | null = null;

export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();
  }
  return globalRateLimiter;
}

/**
 * Check rate limit for user
 */
export async function checkRateLimit(
  endpoint: string,
  userId: string,
  tier: RateLimitTier = 'standard',
  override?: RateLimitTierConfig
): Promise<RateLimitResult> {
  const rateLimiter = getGlobalRateLimiter();
  return await rateLimiter.checkRateLimit(endpoint, userId, tier, override);
}

/**
 * Reset rate limit for user
 */
export async function resetRateLimit(
  endpoint: string,
  userId?: string
): Promise<void> {
  const rateLimiter = getGlobalRateLimiter();
  await rateLimiter.resetRateLimit(endpoint, userId);
}

/**
 * Get rate limit tier for user
 */
export function getUserTier(userId: string): RateLimitTier {
  // TODO: Get user tier from Firestore
  // For now, default to standard
  return 'standard';
}

/**
 * Check if request should be rate limited
 */
export async function isRateLimited(
  endpoint: string,
  userId: string,
  tier?: RateLimitTier
): Promise<boolean> {
  const result = await checkRateLimit(endpoint, userId, tier);
  return !result.allowed;
}

// ============================================
// Exports
// ============================================

export {
  // Types
  RateLimitTier,
  RateLimitStrategy,
  RateLimitConfig,
  RateLimitTierConfig,
  RateLimitRule,
  RateLimitResult,
  RateLimitState,

  // Rate Limiter Class
  RateLimiter,

  // Middleware
  createRateLimitMiddleware,
  createCloudFunctionRateLimitMiddleware,

  // Default Configuration
  DEFAULT_TIERS,
  DEFAULT_RATE_LIMIT_CONFIG,

  // Rules
  DEFAULT_RATE_LIMIT_RULES,
  RATE_LIMIT_BY_ENDPOINT,

  // Helper Functions
  createRateLimiter,
  getGlobalRateLimiter,
  checkRateLimit,
  resetRateLimit,
  getUserTier,
  isRateLimited,

  // Default export
  default {
    createRateLimiter,
    checkRateLimit,
    resetRateLimit,
    getUserTier,
    isRateLimited,
    createRateLimitMiddleware,
    createCloudFunctionRateLimitMiddleware,
    DEFAULT_TIERS,
    DEFAULT_RATE_LIMIT_CONFIG,
    RATE_LIMIT_BY_ENDPOINT,
  },
};
