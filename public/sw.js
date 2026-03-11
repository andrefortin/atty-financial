/**
 * Service Worker for ATTY Financial
 *
 * Provides offline support, caching strategies, and
 * background sync capabilities.
 *
 * @file sw.js
 */

const CACHE_VERSION = 'v1';
const CACHE_PREFIX = 'atty-financial-';

// ============================================
// Cache Names
// ============================================

const CACHE_NAMES = {
  staticAssets: `${CACHE_PREFIX}static-assets-${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}api-${CACHE_VERSION}`,
  dynamicContent: `${CACHE_PREFIX}dynamic-content-${CACHE_VERSION}`,
  offlineFirst: `${CACHE_PREFIX}offline-first-${CACHE_VERSION}`,
} as const;

// ============================================
// Cache Strategies
// ============================================

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 */
async function cacheFirst(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(CACHE_NAMES.staticAssets);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

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
async function networkFirst(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(CACHE_NAMES.api);

    try {
      const networkResponse = await Promise.race([
        fetch(request),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 10000)
        ),
      ]);

      if (networkResponse.ok) {
        const responseToCache = networkResponse.clone();
        await cache.put(request, responseToCache);
      }

      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  } catch (error) {
    console.error('Network-first strategy failed:', error);
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 * Return cache immediately, fetch network in background
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(CACHE_NAMES.api);
    const cachedResponse = await cache.match(request);

    // Fetch network response in background
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseToCache = networkResponse.clone();
        await cache.put(request, responseToCache);
      }
      return networkResponse;
    });

    // Return cached response immediately if available
    if (cachedResponse) {
      networkPromise.catch((error) => {
        console.warn('Network fetch failed, using stale cache:', error);
      });
      return cachedResponse;
    }

    // No cache, wait for network
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
async function networkOnly(request: Request): Promise<Response> {
  return await fetch(request);
}

/**
 * Cache-only strategy
 * Only use cache, never fetch from network
 */
async function cacheOnly(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAMES.offlineFirst);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
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
function getCacheStrategy(request: Request): string {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Static assets - cache first
  if (
    pathname.match(/\.(js|css|woff|woff2|ttf|eot|otf|svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return 'cache-first';
  }

  // API endpoints - stale-while-revalidate
  if (
    pathname.startsWith('/api/') ||
    pathname.includes('/matters') ||
    pathname.includes('/transactions') ||
    pathname.includes('/reports')
  ) {
    return 'stale-while-revalidate';
  }

  // Dynamic content - network first
  if (
    pathname.includes('/dashboard') ||
    pathname.includes('/calculators') ||
    pathname.includes('/settings')
  ) {
    return 'network-first';
  }

  // HTML files - network first
  if (pathname.match(/\.html$/) || pathname === '/') {
    return 'network-first';
  }

  // Default - network first
  return 'network-first';
}

/**
 * Route request to appropriate handler
 */
async function routeRequest(request: Request): Promise<Response> {
  const strategy = getCacheStrategy(request);

  console.log(`[${strategy}]`, request.url);

  switch (strategy) {
    case 'cache-first':
      return await cacheFirst(request);
    case 'network-first':
      return await networkFirst(request);
    case 'stale-while-revalidate':
      return await staleWhileRevalidate(request);
    case 'network-only':
      return await networkOnly(request);
    case 'cache-only':
      return await cacheOnly(request);
    default:
      return await networkFirst(request);
  }
}

// ============================================
// Cache Invalidation
// ============================================

/**
 * Invalidate cache by pattern
 */
async function invalidateCacheByPattern(pattern: string): Promise<void> {
  const cacheNames = Object.values(CACHE_NAMES);

  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();

      const deletePromises = keys
        .filter((request) => request.url.includes(pattern))
        .map((request) => cache.delete(request));

      await Promise.all(deletePromises);
      console.log(`Invalidated ${deletePromises.length} cache entries for pattern: ${pattern}`);
    } catch (error) {
      console.error(`Failed to invalidate cache ${cacheName}:`, error);
    }
  }
}

/**
 * Invalidate API cache
 */
async function invalidateApiCache(): Promise<void> {
  await invalidateCacheByPattern('/api/');
  await invalidateCacheByPattern('/matters');
  await invalidateCacheByPattern('/transactions');
  await invalidateCacheByPattern('/reports');
}

/**
 * Invalidate all caches
 */
async function invalidateAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );

  console.log(`Invalidated all caches (${cacheNames.length} caches)`);
}

// ============================================
// Install Event
// ============================================

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    (async () => {
      // Cache static assets on install
      const staticCache = await caches.open(CACHE_NAMES.staticAssets);

      // Cache essential static files
      const staticUrls = [
        '/',
        '/index.html',
        '/manifest.json',
        '/robots.txt',
        '/favicon.svg',
      ];

      try {
        await staticCache.addAll(staticUrls);
        console.log('Static assets cached:', staticUrls);
      } catch (error) {
        console.error('Failed to cache static assets:', error);
      }

      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// ============================================
// Activate Event
// ============================================

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();

      const deletePromises = cacheNames
        .filter((cacheName) => {
          // Delete old caches
          return (
            !cacheName.startsWith(CACHE_PREFIX) ||
            !cacheName.includes(CACHE_VERSION)
          );
        })
        .map((cacheName) => caches.delete(cacheName));

      await Promise.all(deletePromises);

      console.log(`Cleaned up ${deletePromises.length} old caches`);

      // Take control of all clients immediately
      await self.clients.claim();
      console.log('Service Worker activated and claimed all clients');
    })()
  );
});

// ============================================
// Fetch Event
// ============================================

self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip devtools requests
  if (url.pathname.includes('/hot-update')) {
    return;
  }

  // Route request to appropriate strategy
  event.respondWith(
    routeRequest(request).catch((error) => {
      console.error('Fetch failed:', error);

      // Return offline fallback for GET requests
      if (request.method === 'GET') {
        return caches.match('/offline.html');
      }

      throw error;
    })
  );
});

// ============================================
// Message Event
// ============================================

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data;

  console.log('Service Worker received message:', data);

  switch (data.type) {
    case 'SKIP_WAITING':
      // Force activate waiting service worker
      if (self.skipWaiting) {
        self.skipWaiting();
      }
      break;

    case 'INVALIDATE_CACHE':
      // Invalidate specific cache
      if (data.pattern) {
        invalidateCacheByPattern(data.pattern);
      } else {
        invalidateAllCaches();
      }
      break;

    case 'INVALIDATE_API_CACHE':
      // Invalidate API cache
      invalidateApiCache();
      break;

    case 'GET_CACHE_STATS':
      // Get cache statistics
      event.waitUntil(
        (async () => {
          const stats = {};

          for (const [name, cacheName] of Object.entries(CACHE_NAMES)) {
            try {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              stats[name] = { count: keys.length };
            } catch (error) {
              stats[name] = { count: 0, error: error.message };
            }
          }

          event.ports[0].postMessage({ stats });
        })()
      );
      break;

    case 'CLEAR_ALL_CACHES':
      // Clear all caches
      event.waitUntil(invalidateAllCaches());
      break;

    default:
      console.warn('Unknown message type:', data.type);
  }
});

// ============================================
// Push Event (Optional)
// ============================================

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json();

  console.log('Service Worker received push message:', data);

  // Show notification
  event.waitUntil(
    self.registration.showNotification('ATTY Financial', {
      body: data?.message || 'You have a new notification',
      icon: '/favicon.svg',
      badge: '/badge-icon.png',
      data: data,
      tag: 'atty-financial-notification',
    })
  );
});

// ============================================
// Sync Event (Background Sync)
// ============================================

self.addEventListener('sync', (event: SyncEvent) => {
  console.log('Service Worker sync event:', event.tag);

  event.waitUntil(
    (async () => {
      switch (event.tag) {
        case 'sync-matters':
          // Sync matters
          await syncMatters();
          break;

        case 'sync-transactions':
          // Sync transactions
          await syncTransactions();
          break;

        case 'sync-reports':
          // Sync reports
          await syncReports();
          break;

        default:
          console.warn('Unknown sync tag:', event.tag);
      }
    })()
  );
});

// ============================================
// Background Sync Functions
// ============================================

/**
 * Sync matters from server
 */
async function syncMatters(): Promise<void> {
  try {
    const response = await fetch('/api/matters?sync=true');

    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.api);
      const data = await response.json();

      // Update cache with fresh data
      for (const matter of data) {
        const request = new Request(`/api/matters/${matter.id}`, {
          method: 'GET',
        });

        const responseToCache = new Response(JSON.stringify(matter), {
          headers: { 'Content-Type': 'application/json' },
        });

        await cache.put(request, responseToCache);
      }

      console.log('Matters synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync matters:', error);
  }
}

/**
 * Sync transactions from server
 */
async function syncTransactions(): Promise<void> {
  try {
    const response = await fetch('/api/transactions?sync=true');

    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.api);
      const data = await response.json();

      // Update cache with fresh data
      for (const transaction of data) {
        const request = new Request(`/api/transactions/${transaction.id}`, {
          method: 'GET',
        });

        const responseToCache = new Response(JSON.stringify(transaction), {
          headers: { 'Content-Type': 'application/json' },
        });

        await cache.put(request, responseToCache);
      }

      console.log('Transactions synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync transactions:', error);
  }
}

/**
 * Sync reports from server
 */
async function syncReports(): Promise<void> {
  try {
    const response = await fetch('/api/reports?sync=true');

    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.dynamicContent);
      const data = await response.json();

      // Update cache with fresh data
      for (const report of data) {
        const request = new Request(`/api/reports/${report.id}`, {
          method: 'GET',
        });

        const responseToCache = new Response(JSON.stringify(report), {
          headers: { 'Content-Type': 'application/json' },
        });

        await cache.put(request, responseToCache);
      }

      console.log('Reports synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync reports:', error);
  }
}

// ============================================
// Notification Click Event
// ============================================

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    }).then((clientList) => {
      // Focus or open the first available window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }

      // If no focused window, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// ============================================
// Types
// ============================================

interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface ExtendableMessageEvent extends MessageEvent {
  waitUntil(promise: Promise<any>): void;
  ports: MessagePort[];
}

interface SyncEvent extends Event {
  tag: string;
  waitUntil(promise: Promise<any>): void;
}

interface PushEvent extends ExtendableEvent {
  data?: {
    json(): any;
  };
}

// ============================================
// Console Messages
// ============================================

console.log('Service Worker loaded');
console.log('Cache version:', CACHE_VERSION);
console.log('Cache names:', CACHE_NAMES);
