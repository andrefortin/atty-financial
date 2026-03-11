/**
 * DDoS Protection Middleware
 *
 * Cloud Functions middleware for DDoS protection.
 * Includes rate limiting, request throttling, and suspicious IP detection.
 *
 * @module middleware/ddos
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Import rate limiter
// Note: In production, this would import from @atty-financial/rateLimiter
import {
  RateLimiter,
  RateLimitTier,
  RateLimitResult,
  DEFAULT_TIERS,
  createRateLimiter,
} from '../../src/lib/rateLimiter';

// ============================================
// Types
// ============================================

/**
 * DDoS protection configuration
 */
export interface DDoSProtectionConfig {
  enabled: boolean;
  rateLimiting: boolean;
  ipBlacklist: boolean;
  ipWhitelist: string[];
  suspiciousActivityThreshold: number; // Violations per hour
  maxConcurrentRequests: number;
  requestTimeout: number; // seconds
  geoblockingEnabled: boolean;
  blockedCountries: string[];
  blockedRegions: string[];
}

/**
 * Suspicious activity data
 */
export interface SuspiciousActivity {
  ip: string;
  userId: string;
  violations: number;
  lastViolation: admin.firestore.Timestamp;
  blocked: boolean;
  blockedUntil: admin.firestore.Timestamp | null;
  blockReason: string;
}

/**
 * Request metadata
 */
export interface RequestMetadata {
  ip: string;
  userId: string;
  tier: RateLimitTier;
  endpoint: string;
  timestamp: admin.firestore.Timestamp;
  suspicious: boolean;
}

/**
 * DDoS check result
 */
export interface DDoSCheckResult {
  allowed: boolean;
  reason?: string;
  blockReason?: string;
  blockedUntil?: Date;
  rateLimitResult?: RateLimitResult;
  suspiciousActivity?: SuspiciousActivity;
}

// ============================================
// DDoS Protection Middleware
// ============================================

/**
 * Create DDoS protection middleware
 */
export function createDDoSProtectionMiddleware(config: DDoSProtectionConfig) {
  const rateLimiter = createRateLimiter({
    enabled: config.rateLimiting,
    storage: 'firestore',
  });

  const {
    checkRateLimit,
    resetRateLimit,
  } = createRateLimitingMiddleware(rateLimiter);

  return {
    before: [ddosMiddleware(rateLimiter, config)],
    handler: async (request: any, response: any, next: any) => {
      try {
        // Skip rate limiting for GET requests (read-only)
        if (request.method === 'GET') {
          return next();
        }

        // Get request metadata
        const metadata = await getRequestMetadata(request);

        // Check DDoS protection
        const ddosResult = await checkDDoSProtection(metadata, config);

        // Add DDoS headers to response
        addDDoSHeaders(response, ddosResult);

        // Block request if DDoS detected
        if (!ddosResult.allowed) {
          return response.status(429).json({
            error: 'Too many requests',
            message: ddosResult.reason || 'Request blocked due to suspicious activity',
            reason: ddosResult.blockReason,
            blockedUntil: ddosResult.blockedUntil,
            tier: metadata.tier,
            endpoint: metadata.endpoint,
          });
        }

        // Check rate limit
        const rateLimitResult = await checkRateLimit(
          metadata.endpoint,
          metadata.userId,
          metadata.tier
        );

        // Block request if rate limit exceeded
        if (!rateLimitResult.allowed) {
          return response.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            ...rateLimitResult,
          });
        }

        // Allow request
        return next();
      } catch (error) {
        const err = error as Error;
        console.error('DDoS protection middleware error:', err);

        // Allow request on error (fail open)
        return next();
      }
    },
  };
}

/**
 * DDoS protection middleware function
 */
async function ddosMiddleware(
  rateLimiter: RateLimiter,
  config: DDoSProtectionConfig
) {
  return async (
    request: any,
    response: any,
    next: any
  ): Promise<void> => {
    // Skip DDoS protection if disabled
    if (!config.enabled) {
      return next();
    }

    // Skip for GET requests
    if (request.method === 'GET') {
      return next();
    }

    // Get request metadata
    const metadata = await getRequestMetadata(request);

    // Check IP blacklist
    if (config.ipBlacklist && isIPBlacklisted(metadata.ip, config)) {
      const result: DDoSCheckResult = {
        allowed: false,
        reason: 'IP is blacklisted',
        blockReason: 'ip_blacklisted',
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        suspiciousActivity: await logSuspiciousActivity(metadata, 'ip_blacklisted'),
      };

      addDDoSHeaders(response, result);
      return response.status(403).json({
        error: 'Forbidden',
        message: 'Your IP address has been blocked.',
        ...result,
      });
    }

    // Check IP whitelist
    if (config.ipWhitelist.length > 0 && config.ipWhitelist.includes(metadata.ip)) {
      // Allow whitelisted IPs
      return next();
    }

    // Check geoblocking
    if (config.geoblockingEnabled) {
      const geoBlockResult = await checkGeoblocking(metadata, config);
      if (!geoBlockResult.allowed) {
        addDDoSHeaders(response, geoBlockResult);
        return response.status(403).json({
          error: 'Forbidden',
          message: 'Requests from your location are not allowed.',
          ...geoBlockResult,
        });
      }
    }

    // Check suspicious activity
    if (await hasExcessiveViolations(metadata, config)) {
      const result: DDoSCheckResult = {
        allowed: false,
        reason: 'Excessive suspicious activity detected',
        blockReason: 'suspicious_activity',
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        suspiciousActivity: await getSuspiciousActivity(metadata),
      };

      addDDoSHeaders(response, result);
      return response.status(429).json({
        error: 'Too many requests',
        message: 'Your account has been temporarily blocked due to suspicious activity.',
        ...result,
      });
    }

    // Allow request
    next();
  };
}

/**
 * Check DDoS protection
 */
async function checkDDoSProtection(
  metadata: RequestMetadata,
  config: DDoSProtectionConfig
): Promise<DDoSCheckResult> {
  // Check IP blacklist
  if (config.ipBlacklist && isIPBlacklisted(metadata.ip, config)) {
    return {
      allowed: false,
      reason: 'IP is blacklisted',
      blockReason: 'ip_blacklisted',
      blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      suspiciousActivity: await logSuspiciousActivity(metadata, 'ip_blacklisted'),
    };
  }

  // Check geoblocking
  if (config.geoblockingEnabled) {
    const geoBlockResult = await checkGeoblocking(metadata, config);
    if (!geoBlockResult.allowed) {
      return geoBlockResult;
    }
  }

  // Check suspicious activity
  const suspiciousActivity = await getSuspiciousActivity(metadata);
  if (suspiciousActivity && suspiciousActivity.blocked && suspiciousActivity.blockedUntil) {
    const now = Date.now();
    const blockedUntil = suspiciousActivity.blockedUntil.toDate().getTime();

    if (now < blockedUntil) {
      return {
        allowed: false,
        reason: 'Account is temporarily blocked',
        blockReason: 'suspicious_activity',
        blockedUntil: suspiciousActivity.blockedUntil.toDate(),
        suspiciousActivity,
      };
    } else {
      // Unblock if block expired
      await unblockUser(metadata.userId, 'block_expired');
    }
  }

  // Allow request
  return {
    allowed: true,
  };
}

// ============================================
// Request Metadata Functions
// ============================================

/**
 * Get request metadata
 */
async function getRequestMetadata(request: any): Promise<RequestMetadata> {
  // Get IP address
  const ip = getIpAddress(request);

  // Get user ID from auth
  const userId = request.user?.uid || request.headers['x-user-id'] || 'anonymous';

  // Get user tier
  const tier = await getUserTier(userId);

  // Get endpoint from request
  const endpoint = getEndpointName(request);

  // Check if request is suspicious
  const suspicious = await isRequestSuspicious(request, ip, userId);

  return {
    ip,
    userId,
    tier,
    endpoint,
    timestamp: admin.firestore.Timestamp.now(),
    suspicious,
  };
}

/**
 * Get IP address from request
 */
function getIpAddress(request: any): string {
  // Try various headers for IP
  const ip =
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers['x-real-ip'] ||
    request.connection?.remoteAddress ||
    request.socket?.remoteAddress ||
    request.ip ||
    request.info?.remoteAddress ||
    'unknown';

  return ip;
}

/**
 * Get endpoint name from request
 */
function getEndpointName(request: any): string {
  const path = request.path || request.url || '/api/unknown';
  return path.replace('/api/', '').split('?')[0];
}

/**
 * Get user tier
 */
async function getUserTier(userId: string): Promise<RateLimitTier> {
  if (!userId || userId === 'anonymous') {
    return 'free';
  }

  try {
    const admin = require('firebase-admin');
    const firestore = admin.firestore();
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists()) {
      return 'standard';
    }

    const user = userDoc.data();
    const subscription = user.subscription;

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

/**
 * Check if request is suspicious
 */
async function isRequestSuspicious(
  request: any,
  ip: string,
  userId: string
): Promise<boolean> {
  // Check for common attack patterns
  const userAgent = request.headers['user-agent'] || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return true;
  }

  // Check for missing required headers
  const requiredHeaders = ['content-type', 'accept'];
  const missingHeaders = requiredHeaders.some(header => !request.headers[header]);
  if (missingHeaders) {
    return true;
  }

  // Check for excessive headers
  const headerCount = Object.keys(request.headers).length;
  if (headerCount > 50) {
    return true;
  }

  // Check for suspicious IP ranges
  if (isSuspiciousIP(ip)) {
    return true;
  }

  return false;
}

// ============================================
// IP Blocking Functions
// ============================================

/**
 * Check if IP is blacklisted
 */
function isIPBlacklisted(ip: string, config: DDoSProtectionConfig): boolean {
  // Check against known malicious IPs
  const maliciousIPs = getMaliciousIPs();
  if (maliciousIPs.has(ip)) {
    return true;
  }

  // Check against IP ranges
  const maliciousIPRanges = getMaliciousIPRanges();
  const ipNum = ipToNumber(ip);
  for (const [start, end] of maliciousIPRanges) {
    if (ipNum >= start && ipNum <= end) {
      return true;
    }
  }

  return false;
}

/**
 * Check if IP is suspicious
 */
function isSuspiciousIP(ip: string): boolean {
  // Check if IP is from hosting provider
  const hostingProviders = getHostingProviderIPs();
  if (hostingProviders.has(ip)) {
    return true;
  }

  // Check if IP is from proxy/VPN
  const proxyIPs = getProxyIPs();
  if (proxyIPs.has(ip)) {
    return true;
  }

  return false;
}

/**
 * Convert IP to number
 */
function ipToNumber(ip: string): number {
  return ip.split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// ============================================
// Geoblocking Functions
// ============================================

/**
 * Check geoblocking
 */
async function checkGeoblocking(
  metadata: RequestMetadata,
  config: DDoSProtectionConfig
): Promise<DDoSCheckResult> {
  if (!config.geoblockingEnabled) {
    return { allowed: true };
  }

  // Get IP geolocation
  const geo = await getIPGeolocation(metadata.ip);

  // Check if country is blocked
  if (config.blockedCountries.includes(geo.countryCode)) {
    return {
      allowed: false,
      reason: 'Requests from your country are not allowed',
      blockReason: 'country_blocked',
      blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // Check if region is blocked
  if (config.blockedRegions.includes(geo.region)) {
    return {
      allowed: false,
      reason: 'Requests from your region are not allowed',
      blockReason: 'region_blocked',
      blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // Allow request
  return { allowed: true };
}

/**
 * Get IP geolocation
 */
async function getIPGeolocation(ip: string): Promise<{
  country: string;
  countryName: string;
  region: string;
  city: string;
}> {
  try {
    // Use IP geolocation API
    const response = await fetch(`https://ipapi.co/json/${ip}`);
    const data = await response.json();

    return {
      country: data.country_code || 'unknown',
      countryName: data.country_name || 'unknown',
      region: data.region || 'unknown',
      city: data.city || 'unknown',
    };
  } catch (error) {
    console.error('Failed to get IP geolocation:', error);

    return {
      country: 'unknown',
      countryName: 'unknown',
      region: 'unknown',
      city: 'unknown',
    };
  }
}

// ============================================
// Suspicious Activity Functions
// ============================================

/**
 * Log suspicious activity
 */
async function logSuspiciousActivity(
  metadata: RequestMetadata,
  reason: string
): Promise<SuspiciousActivity> {
  const admin = require('firebase-admin');
  const firestore = admin.firestore();

  const activity: SuspiciousActivity = {
    ip: metadata.ip,
    userId: metadata.userId,
    violations: admin.firestore.FieldValue.increment(1),
    lastViolation: admin.firestore.FieldValue.serverTimestamp(),
    blocked: false,
    blockedUntil: null,
    blockReason: reason,
  };

  // Save to Firestore
  const docRef = await firestore.collection('suspiciousActivity').doc(
    `${metadata.userId}:${metadata.ip}`
  ).set(activity);

  return docRef.data();
}

/**
 * Get suspicious activity for user
 */
async function getSuspiciousActivity(
  metadata: RequestMetadata
): Promise<SuspiciousActivity | null> {
  const admin = require('firebase-admin');
  const firestore = admin.firestore();

  const docRef = firestore
    .collection('suspiciousActivity')
    .doc(`${metadata.userId}:${metadata.ip}`);

  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as SuspiciousActivity;
}

/**
 * Check for excessive violations
 */
async function hasExcessiveViolations(
  metadata: RequestMetadata,
  config: DDoSProtectionConfig
): Promise<boolean> {
  const activity = await getSuspiciousActivity(metadata);

  if (!activity) {
    return false;
  }

  // Check if user is blocked
  if (activity.blocked) {
    const now = Date.now();
    const blockedUntil = activity.blockedUntil?.toDate()?.getTime() || 0;

    if (now < blockedUntil) {
      return true;
    }
  }

  // Check for excessive violations
  return activity.violations >= config.suspiciousActivityThreshold;
}

/**
 * Block user for suspicious activity
 */
async function blockUserForSuspiciousActivity(
  metadata: RequestMetadata,
  reason: string,
  duration: number // in hours
): Promise<void> {
  const admin = require('firebase-admin');
  const firestore = admin.firestore();

  const blockedUntil = new Date(Date.now() + duration * 60 * 60 * 1000);

  await firestore
    .collection('suspiciousActivity')
    .doc(`${metadata.userId}:${metadata.ip}`)
    .update({
      blocked: true,
      blockedUntil: admin.firestore.Timestamp.fromDate(blockedUntil),
      blockReason: reason,
    });

  console.log(`User ${metadata.userId} blocked for ${reason}`);
}

/**
 * Unblock user
 */
async function unblockUser(
  userId: string,
  reason: string
): Promise<void> {
  const admin = require('firebase-admin');
  const firestore = admin.firestore();

  // Update all suspicious activity documents for user
  const snapshot = await firestore
    .collection('suspiciousActivity')
    .where('userId', '==', userId)
    .get();

  const batch = firestore.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      blocked: false,
      blockedUntil: null,
      blockReason: `unblocked: ${reason}`,
    });
  });

  await batch.commit();

  console.log(`User ${userId} unblocked: ${reason}`);
}

// ============================================
// Header Functions
// ============================================

/**
 * Add DDoS protection headers to response
 */
function addDDoSHeaders(
  response: any,
  result: DDoSCheckResult
): void {
  response.setHeader('X-DDoS-Protection', 'enabled');
  response.setHeader('X-DDoS-Allowed', result.allowed.toString());
  response.setHeader('X-DDoS-Reason', result.reason || 'none');
  response.setHeader('X-DDoS-Block-Reason', result.blockReason || 'none');
  response.setHeader('X-DDoS-Blocked-Until', result.blockedUntil?.toUTCString() || '');
  response.setHeader('X-DDoS-Tier', result.rateLimitResult?.tier || 'none');
  response.setHeader('X-DDoS-Limit', result.rateLimitResult?.limit?.toString() || '0');
  response.setHeader('X-DDoS-Remaining', result.rateLimitResult?.remaining?.toString() || '0');
  response.setHeader('X-DDoS-Reset', result.rateLimitResult?.reset?.toUTCString() || '');
}

// ============================================
// Data Storage Functions
// ============================================

/**
 * Get malicious IPs from Firestore
 */
function getMaliciousIPs(): Set<string> {
  // Load from Firestore or use hardcoded list
  // For simplicity, return empty set
  return new Set();
}

/**
 * Get malicious IP ranges
 */
function getMaliciousIPRanges(): [number, number][] {
  // Load from Firestore or use hardcoded ranges
  // For simplicity, return empty array
  return [];
}

/**
 * Get hosting provider IPs
 */
function getHostingProviderIPs(): Set<string> {
  // Load from Firestore or use hardcoded list
  // For simplicity, return empty set
  return new Set();
}

/**
 * Get proxy/VPN IPs
 */
function getProxyIPs(): Set<string> {
  // Load from Firestore or use hardcoded list
  // For simplicity, return empty set
  return new Set();
}

// ============================================
// Configuration Functions
// ============================================

/**
 * Get default DDoS protection configuration
 */
export function getDefaultDDoSConfig(): DDoSProtectionConfig {
  return {
    enabled: true,
    rateLimiting: true,
    ipBlacklist: true,
    ipWhitelist: [],
    suspiciousActivityThreshold: 10, // violations per hour
    maxConcurrentRequests: 100,
    requestTimeout: 30, // seconds
    geoblockingEnabled: false,
    blockedCountries: [],
    blockedRegions: [],
  };
}

// ============================================
// Exports
// ============================================

export {
  // Middleware
  createDDoSProtectionMiddleware,

  // DDoS Protection
  checkDDoSProtection,
  resetRateLimit,

  // Request Metadata
  getRequestMetadata,
  getIpAddress,
  getEndpointName,
  getUserTier,

  // IP Blocking
  isIPBlacklisted,
  isSuspiciousIP,

  // Geoblocking
  checkGeoblocking,
  getIPGeolocation,

  // Suspicious Activity
  logSuspiciousActivity,
  getSuspiciousActivity,
  hasExcessiveViolations,
  blockUserForSuspiciousActivity,
  unblockUser,

  // Headers
  addDDoSHeaders,

  // Configuration
  getDefaultDDoSConfig,

  // Types
  DDoSProtectionConfig,
  SuspiciousActivity,
  RequestMetadata,
  DDoSCheckResult,
};
