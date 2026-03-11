/**
 * Cache Configuration
 *
 * Comprehensive cache settings and strategies for ATTY Financial.
 * Includes Service Worker registration, cache strategies,
 * and cache invalidation management.
 *
 * @module lib/cacheConfig
 */

// ============================================
// Types
// ============================================

/**
 * Cache strategy types
 */
export type CacheStrategy =
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  name: string;
  strategy: CacheStrategy;
  maxAge: number; // in seconds
  maxEntries: number;
  networkTimeout: number; // in milliseconds
  staleWhileRevalidateAge?: number; // in seconds
}

/**
 * Cache entry interface
 */
export interface CacheEntry {
  url: string;
  response: Response;
  timestamp: number;
  strategy: CacheStrategy;
  maxAge: number;
}

/**
 * Service Worker registration options
 */
export interface ServiceWorkerRegistration {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

// ============================================
// Cache Strategy Configurations
// ============================================

/**
 * Static assets configuration
 * Images, fonts, CSS, JS files that rarely change
 */
export const STATIC_ASSETS_CACHE: CacheConfig = {
  name: 'static-assets',
  strategy: 'cache-first',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  maxEntries: 100,
  networkTimeout: 3000, // 3 seconds
};

/**
 * API responses configuration
 * Matters, transactions, and other API data
 */
export const API_CACHE: CacheConfig = {
  name: 'api-cache',
  strategy: 'stale-while-revalidate',
  maxAge: 60 * 5, // 5 minutes
  maxEntries: 50,
  networkTimeout: 10000, // 10 seconds
  staleWhileRevalidateAge: 60 * 1, // 1 minute
};

/**
 * Dynamic content configuration
 * Reports, calculations, user-specific data
 */
export const DYNAMIC_CONTENT_CACHE: CacheConfig = {
  name: 'dynamic-content',
  strategy: 'network-first',
  maxAge: 60 * 1, // 1 minute
  maxEntries: 30,
  networkTimeout: 10000, // 10 seconds
};

/**
 * Offline-first configuration
 * Critical UI and configuration data
 */
export const OFFLINE_FIRST_CACHE: CacheConfig = {
  name: 'offline-first',
  strategy: 'cache-first',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  maxEntries: 20,
  networkTimeout: 2000, // 2 seconds
};

/**
 * No-cache configuration
 * Real-time data that should never be cached
 */
export const NO_CACHE: CacheConfig = {
  name: 'no-cache',
  strategy: 'network-only',
  maxAge: 0,
  maxEntries: 0,
  networkTimeout: 10000,
};

/**
 * Cache strategy presets
 */
export const CACHE_STRATEGIES: Record<string, CacheConfig> = {
  staticAssets: STATIC_ASSETS_CACHE,
  api: API_CACHE,
  dynamicContent: DYNAMIC_CONTENT_CACHE,
  offlineFirst: OFFLINE_FIRST_CACHE,
  noCache: NO_CACHE,
};

/**
 * Cache strategy for specific content types
 */
export const CACHE_STRATEGY_FOR_PATH: Record<string, string> = {
  // Static assets
  '/assets/': 'staticAssets',
  '/images/': 'staticAssets',
  '/fonts/': 'staticAssets',
  '/icons/': 'staticAssets',
  '/logo-': 'staticAssets',
  
  // API endpoints
  '/api/': 'api',
  '/matters': 'api',
  '/transactions': 'api',
  '/reports': 'api',
  '/allocations': 'api',
  
  // Dynamic content
  '/calculators': 'dynamicContent',
  '/dashboard': 'dynamicContent',
  '/settings': 'dynamicContent',
  
  // No cache (real-time)
  '/auth': 'noCache',
  '/notifications': 'noCache',
};

// ============================================
// CDN Configuration
// ============================================

/**
 * CDN edge locations
 */
export const CDN_EDGE_LOCATIONS = [
  'us-east1',
  'us-east4',
  'us-central',
  'us-west1',
  'us-west2',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'asia-east1',
  'asia-east2',
  'asia-southeast1',
  'australia-southeast1',
] as const;

/**
 * CDN configuration
 */
export const CDN_CONFIG = {
  enabled: import.meta.env.VITE_CDN_ENABLED === 'true',
  url: import.meta.env.VITE_CDN_URL || '',
  assetVersion: import.meta.env.VITE_ASSET_VERSION || '1.0.0',
  edgeLocations: CDN_EDGE_LOCATIONS,
  cacheVersion: 'v1',
} as const;

/**
 * Get CDN URL for an asset
 */
export function getCdnUrl(path: string): string {
  if (!CDN_CONFIG.enabled || !CDN_CONFIG.url) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Construct CDN URL
  return `${CDN_CONFIG.url}/${cleanPath}?v=${CDN_CONFIG.assetVersion}`;
}

/**
 * Get asset URL (with or without CDN)
 */
export function getAssetUrl(path: string): string {
  const cdnUrl = getCdnUrl(path);
  
  // In development, use local assets
  if (import.meta.env.DEV) {
    return path;
  }

  // In production, use CDN if enabled
  return cdnUrl;
}

// ============================================
// Cache Management Functions
// ============================================

/**
 * Get cache strategy for a URL
 */
export function getCacheStrategyForUrl(url: string): string {
  for (const [pattern, strategy] of Object.entries(CACHE_STRATEGY_FOR_PATH)) {
    if (url.includes(pattern)) {
      return strategy;
    }
  }

  // Default to API cache
  return 'api';
}

/**
 * Get cache configuration for a strategy
 */
export function getCacheConfig(strategy: string): CacheConfig {
  return CACHE_STRATEGIES[strategy] || API_CACHE;
}

/**
 * Check if cache entry is stale
 */
export function isCacheEntryStale(entry: CacheEntry): boolean {
  const now = Date.now();
  const age = (now - entry.timestamp) / 1000; // Convert to seconds
  return age > entry.maxAge;
}

/**
 * Check if cache entry should be refreshed (for stale-while-revalidate)
 */
export function shouldRefreshCacheEntry(entry: CacheEntry): boolean {
  const now = Date.now();
  const age = (now - entry.timestamp) / 1000; // Convert to seconds
  const staleAge = entry.staleWhileRevalidateAge || entry.maxAge / 2;
  return age > staleAge;
}

/**
 * Create cache key for a request
 */
export function createCacheKey(url: string, options?: RequestInit): string {
  const key = `${url}:${options?.method || 'GET'}`;
  return key;
}

/**
 * Get cache entry age in seconds
 */
export function getCacheEntryAge(entry: CacheEntry): number {
  const now = Date.now();
  return (now - entry.timestamp) / 1000;
}

// ============================================
// Service Worker Functions
// ============================================

/**
 * Register Service Worker
 */
export async function registerServiceWorker(
  options?: ServiceWorkerRegistration
): Promise<ServiceWorkerRegistration | null> {
  // Check if Service Worker is supported
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser');
    return null;
  }

  // Don't register in development unless explicitly enabled
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_SERVICE_WORKER !== 'true') {
    console.info('Service Worker registration skipped in development');
    return null;
  }

  try {
    // Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered:', registration);

    // Handle updates
    if (registration.waiting) {
      if (options?.onUpdate) {
        options.onUpdate(registration);
      } else {
        // Ask user to refresh for new version
        if (window.confirm('A new version is available. Would you like to update?')) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } else if (registration.active) {
      if (options?.onSuccess) {
        options.onSuccess(registration);
      }
    }

    // Listen for controller changes
    registration.addEventListener('controllerchange', () => {
      // Reload page when new controller is activated
      window.location.reload();
    });

    return registration;
  } catch (error) {
    const err = error as Error;
    console.error('Service Worker registration failed:', err);

    if (options?.onError) {
      options.onError(err);
    }

    return null;
  }
}

/**
 * Unregister Service Worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  if (registration) {
    await registration.unregister();
    console.log('Service Worker unregistered');
  }
}

/**
 * Check if Service Worker is ready
 */
export async function isServiceWorkerReady(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  return registration !== undefined;
}

// ============================================
// Cache Strategy Implementations
// ============================================

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 */
export async function cacheFirstStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
  try {
    // Try to get from cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('Cache miss:', request.url);

    // Fall back to network
    const networkResponse = await fetch(request);

    // Cache the response for future use
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    throw error;
  }
}

/**
 * Network-first strategy
 * Try network first, fall back to cache
 */
export async function networkFirstStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
  try {
    // Try network first
    const networkResponsePromise = fetch(request);

    // Get cached response (in case network fails)
    const cachedResponse = await cache.match(request);

    // Wait for network response with timeout
    const networkResponse = await Promise.race([
      networkResponsePromise,
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 10000)
      ),
    ]) as Promise<Response>;

    console.log('Network success:', request.url);

    // Update cache with network response
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch (error) {
    console.log('Network failed, using cache:', request.url);

    // Fall back to cache
    if (cachedResponse) {
      return cachedResponse;
    }

    // Network failed and no cache
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 * Return cache immediately, fetch network in background
 */
export async function staleWhileRevalidateStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
  try {
    // Get cached response
    const cachedResponse = await cache.match(request);

    // Fetch network response in background
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        // Update cache with network response
        const responseToCache = networkResponse.clone();
        await cache.put(request, responseToCache);
        console.log('Cache updated:', request.url);
      }
      return networkResponse;
    });

    // If cache exists, return it immediately
    if (cachedResponse) {
      console.log('Stale cache returned:', request.url);
      return cachedResponse;
    }

    // No cache, wait for network
    console.log('No cache, waiting for network:', request.url);
    return await networkPromise;
  } catch (error) {
    console.error('Stale-while-revalidate strategy failed:', error);
    throw error;
  }
}

/**
 * Network-only strategy
 * Always fetch from network, never cache
 */
export async function networkOnlyStrategy(
  request: Request,
  _cache: Cache
): Promise<Response> {
  console.log('Network-only (no cache):', request.url);
  return await fetch(request);
}

/**
 * Cache-only strategy
 * Only use cache, never fetch from network
 */
export async function cacheOnlyStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('Cache-only hit:', request.url);
    return cachedResponse;
  }

  throw new Error('No cached response available');
}

// ============================================
// Cache Strategy Router
// ============================================

/**
 * Route request to appropriate cache strategy
 */
export async function routeCacheStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
  const strategyName = getCacheStrategyForUrl(request.url);
  const config = getCacheConfig(strategyName);

  console.log('Cache strategy:', strategyName, 'for:', request.url);

  switch (config.strategy) {
    case 'cache-first':
      return await cacheFirstStrategy(request, cache);
    case 'network-first':
      return await networkFirstStrategy(request, cache);
    case 'stale-while-revalidate':
      return await staleWhileRevalidateStrategy(request, cache);
    case 'network-only':
      return await networkOnlyStrategy(request, cache);
    case 'cache-only':
      return await cacheOnlyStrategy(request, cache);
    default:
      // Default to network-first
      return await networkFirstStrategy(request, cache);
  }
}

// ============================================
// Cache Invalidation
// ============================================

/**
 * Invalidate cache by URL pattern
 */
export async function invalidateCacheByPattern(
  cacheName: string,
  pattern: string
): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    // Delete all keys matching pattern
    const deletePromises = keys
      .filter((request) => request.url.includes(pattern))
      .map((request) => cache.delete(request));

    await Promise.all(deletePromises);

    console.log(`Invalidated ${deletePromises.length} cache entries for pattern: ${pattern}`);
  } catch (error) {
    console.error('Cache invalidation failed:', error);
  }
}

/**
 * Invalidate cache by exact URL
 */
export async function invalidateCacheByUrl(cacheName: string, url: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(cacheName);
    const request = new Request(url);
    const deleted = await cache.delete(request);

    console.log(`Invalidated cache entry: ${url} (deleted: ${deleted})`);
  } catch (error) {
    console.error('Cache invalidation failed:', error);
  }
}

/**
 * Clear entire cache
 */
export async function clearCache(cacheName: string): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    await caches.delete(cacheName);
    console.log(`Cleared cache: ${cacheName}`);
  } catch (error) {
    console.error('Cache clear failed:', error);
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );

    console.log(`Cleared all caches (${cacheNames.length} caches)`);
  } catch (error) {
    console.error('Clear all caches failed:', error);
  }
}

/**
 * Invalidate API cache (common patterns)
 */
export async function invalidateApiCache(): Promise<void> {
  await invalidateCacheByPattern('api-cache', '/api/');
  await invalidateCacheByPattern('api-cache', '/matters');
  await invalidateCacheByPattern('api-cache', '/transactions');
  await invalidateCacheByPattern('api-cache', '/reports');
}

/**
 * Invalidate dynamic content cache
 */
export async function invalidateDynamicCache(): Promise<void> {
  await invalidateCacheByPattern('dynamic-content', '/dashboard');
  await invalidateCacheByPattern('dynamic-content', '/calculators');
  await invalidateCacheByPattern('dynamic-content', '/settings');
}

// ============================================
// Cache Statistics
// ============================================

/**
 * Get cache statistics
 */
export async function getCacheStats(cacheName: string): Promise<{
  name: string;
  count: number;
  size?: number;
}> {
  if (!('caches' in window)) {
    return { name: cacheName, count: 0 };
  }

  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const count = keys.length;

    // Note: Cache size is not available in all browsers
    let size: number | undefined;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      size = estimate.usage;
    }

    return { name: cacheName, count, size };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return { name: cacheName, count: 0 };
  }
}

/**
 * Get all cache statistics
 */
export async function getAllCacheStats(): Promise<Array<{
  name: string;
  count: number;
  size?: number
}>> {
  if (!('caches' in window)) {
    return [];
  }

  try {
    const cacheNames = await caches.keys();
    const stats = await Promise.all(
      cacheNames.map(async (cacheName) => {
        return await getCacheStats(cacheName);
      })
    );

    return stats;
  } catch (error) {
    console.error('Failed to get all cache stats:', error);
    return [];
  }
}

// ============================================
// Cache Utils
// ============================================

/**
 * Check if response should be cached
 */
export function shouldCacheResponse(response: Response): boolean {
  // Don't cache error responses
  if (!response.ok) {
    return false;
  }

  // Don't cache no-store or no-cache responses
  const cacheControl = response.headers.get('Cache-Control');
  if (cacheControl?.includes('no-store') || cacheControl?.includes('no-cache')) {
    return false;
  }

  // Cache by default
  return true;
}

/**
 * Get cache age for a response
 */
export function getCacheAge(response: Response): number | null {
  const ageHeader = response.headers.get('Age');
  if (!ageHeader) {
    return null;
  }

  return parseInt(ageHeader, 10);
}

/**
 * Get max age from Cache-Control header
 */
export function getMaxAgeFromCacheControl(response: Response): number | null {
  const cacheControl = response.headers.get('Cache-Control');
  if (!cacheControl) {
    return null;
  }

  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  if (!maxAgeMatch) {
    return null;
  }

  return parseInt(maxAgeMatch[1], 10);
}

// ============================================
// Exports
// ============================================

export {
  CacheStrategy,
  CacheConfig,
  CacheEntry,
  ServiceWorkerRegistration,
  CACHE_STRATEGIES,
  CACHE_STRATEGY_FOR_PATH,
  CDN_CONFIG,
  CDN_EDGE_LOCATIONS,

  // Cache strategy functions
  getCacheStrategyForUrl,
  getCacheConfig,
  isCacheEntryStale,
  shouldRefreshCacheEntry,
  createCacheKey,
  getCacheEntryAge,

  // Service Worker functions
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerReady,

  // Strategy implementations
  cacheFirstStrategy,
  networkFirstStrategy,
  staleWhileRevalidateStrategy,
  networkOnlyStrategy,
  cacheOnlyStrategy,
  routeCacheStrategy,

  // Cache invalidation
  invalidateCacheByPattern,
  invalidateCacheByUrl,
  clearCache,
  clearAllCaches,
  invalidateApiCache,
  invalidateDynamicCache,

  // Cache statistics
  getCacheStats,
  getAllCacheStats,

  // Cache utils
  shouldCacheResponse,
  getCacheAge,
  getMaxAgeFromCacheControl,

  // CDN functions
  getCdnUrl,
  getAssetUrl,
};

// Default export
export default {
  CACHE_STRATEGIES,
  CACHE_STRATEGY_FOR_PATH,
  CDN_CONFIG,
  registerServiceWorker,
  routeCacheStrategy,
  clearAllCaches,
};
