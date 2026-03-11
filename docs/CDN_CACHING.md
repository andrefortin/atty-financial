# CDN and Caching Setup

This guide covers CDN configuration, caching strategies, and cache invalidation for ATTY Financial.

## Table of Contents

- [Overview](#overview)
- [Firebase Hosting CDN](#firebase-hosting-cdn)
- [Cache Configuration](#cache-configuration)
- [Cache Strategies](#cache-strategies)
- [Service Worker Setup](#service-worker-setup)
- [Cache Invalidation](#cache-invalidation)
- [CDN Edge Locations](#cdn-edge-locations)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Overview

ATTY Financial uses Firebase Hosting's global CDN for content delivery, with intelligent caching strategies for optimal performance.

### Key Features

- **Global CDN**: Firebase's global CDN with 13+ edge locations
- **Automatic SSL**: Free SSL certificates with TLS 1.2/1.3
- **Smart Caching**: Multiple caching strategies for different content types
- **Service Worker**: Offline support and background sync
- **Cache Invalidation**: Granular cache management
- **Performance Monitoring**: Cache performance tracking

### Cache Strategies

| Strategy | Use Case | Description |
|----------|-----------|-------------|
| **Cache-First** | Static assets | Serve from cache, fall back to network |
| **Network-First** | Dynamic content | Try network, fall back to cache |
| **Stale-While-Revalidate** | API data | Serve stale cache, revalidate in background |
| **Network-Only** | Real-time data | Never cache, always fetch from network |
| **Cache-Only** | Offline data | Only serve from cache |

---

## Firebase Hosting CDN

### CDN Features

Firebase Hosting provides a global Content Delivery Network:

**Automatic CDN**:
- ✅ 13+ edge locations worldwide
- ✅ Automatic content distribution
- ✅ Edge caching with 10-second TTL
- ✅ Smart routing based on user location
- ✅ No additional configuration needed

**Cache Headers**:
```json
{
  "headers": [
    {
      "source": "**/*.@(js|css|jpg|jpeg|png|gif|webp|svg|ico|woff|woff2)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Cache-Control Values**:

| Content Type | Cache-Control | Purpose |
|-------------|----------------|---------|
| JS, CSS, Images, Fonts | `public, max-age=31536000, immutable` | 1 year cache, immutable |
| JSON | `public, max-age=3600` | 1 hour cache |
| index.html | `no-cache, no-store, must-revalidate` | No cache |
| Service Worker | `public, max-age=0, must-revalidate` | No cache |

### CDN Edge Locations

Firebase Hosting has edge locations in:

| Region | Edge Locations |
|--------|----------------|
| **North America** | us-east1, us-east4, us-central, us-west1, us-west2 |
| **Europe** | europe-west1, europe-west2, europe-west3, europe-west6 |
| **Asia** | asia-east1, asia-east2, asia-southeast1 |
| **Oceania** | australia-southeast1 |
| **South America** | southamerica-east1 |

### CDN Cache Hierarchy

```
User Request
    ↓
DNS Resolution (to nearest edge)
    ↓
Edge Cache (10-second TTL)
    ↓
Origin (Firebase Hosting)
    ↓
Cache-Control Headers
    ↓
Browser Cache
```

---

## Cache Configuration

### Firebase Hosting Headers

Complete `firebase.json` configuration:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|png|gif|webp|svg|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(woff|woff2|ttf|eot|otf)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.json",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      },
      {
        "source": "index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=0, must-revalidate"
          },
          {
            "key": "Service-Worker-Allowed",
            "value": "/"
          }
        ]
      },
      {
        "source": "/manifest.json",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600"
          }
        ]
      },
      {
        "source": "/robots.txt",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400"
          }
        ]
      },
      {
        "source": "/sitemap.xml",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          }
        ]
      }
    ]
  }
}
```

### Cache Configuration File

`src/lib/cacheConfig.ts` provides cache settings:

```typescript
import {
  CACHE_STRATEGIES,
  CACHE_STRATEGY_FOR_PATH,
  registerServiceWorker,
  routeCacheStrategy,
  clearAllCaches,
  invalidateApiCache,
} from '@/lib/cacheConfig';

// Register Service Worker
registerServiceWorker({
  onUpdate: (registration) => {
    console.log('New version available:', registration);
    // Show update notification
  },
  onSuccess: (registration) => {
    console.log('Service Worker registered:', registration);
  },
  onError: (error) => {
    console.error('Service Worker registration failed:', error);
  },
});
```

---

## Cache Strategies

### Cache-First Strategy

**Use Case**: Static assets (images, fonts, CSS, JS)

**Behavior**:
1. Check cache
2. If cache hit: return cached response
3. If cache miss: fetch from network
4. Cache network response for future use

**Configuration**:
```typescript
export const STATIC_ASSETS_CACHE = {
  name: 'static-assets',
  strategy: 'cache-first',
  maxAge: 60 * 60 * 24 * 365, // 1 year
  maxEntries: 100,
  networkTimeout: 3000, // 3 seconds
};
```

**Implementation**:
```typescript
async function cacheFirstStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
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
}
```

### Network-First Strategy

**Use Case**: Dynamic content (dashboard, calculators, settings)

**Behavior**:
1. Try to fetch from network
2. If network succeeds: update cache, return response
3. If network fails: return cached response
4. If no cache: return error

**Configuration**:
```typescript
export const DYNAMIC_CONTENT_CACHE = {
  name: 'dynamic-content',
  strategy: 'network-first',
  maxAge: 60 * 1, // 1 minute
  maxEntries: 30,
  networkTimeout: 10000, // 10 seconds
};
```

**Implementation**:
```typescript
async function networkFirstStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
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
}
```

### Stale-While-Revalidate Strategy

**Use Case**: API data (matters, transactions, reports)

**Behavior**:
1. Return cached response immediately (if available)
2. Fetch from network in background
3. Update cache with network response
4. Future requests get fresh data

**Configuration**:
```typescript
export const API_CACHE = {
  name: 'api-cache',
  strategy: 'stale-while-revalidate',
  maxAge: 60 * 5, // 5 minutes
  maxEntries: 50,
  networkTimeout: 10000, // 10 seconds
  staleWhileRevalidateAge: 60 * 1, // 1 minute
};
```

**Implementation**:
```typescript
async function staleWhileRevalidateStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    return networkResponse;
  });

  if (cachedResponse) {
    networkPromise.catch((error) => {
      console.warn('Network fetch failed, using stale cache:', error);
    });
    return cachedResponse;
  }

  return await networkPromise;
}
```

### Network-Only Strategy

**Use Case**: Real-time data (notifications, auth)

**Behavior**:
1. Always fetch from network
2. Never cache response
3. Return network response or error

**Implementation**:
```typescript
async function networkOnlyStrategy(
  request: Request,
  _cache: Cache
): Promise<Response> {
  return await fetch(request);
}
```

### Cache-Only Strategy

**Use Case**: Offline data (app shell, critical UI)

**Behavior**:
1. Only serve from cache
2. Never fetch from network
3. Return error if not in cache

**Implementation**:
```typescript
async function cacheOnlyStrategy(
  request: Request,
  cache: Cache
): Promise<Response> {
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  throw new Error('No cached response available');
}
```

---

## Service Worker Setup

### Service Worker Registration

Register Service Worker in your app:

```typescript
import { registerServiceWorker } from '@/lib/cacheConfig';

// Register Service Worker
if ('serviceWorker' in navigator) {
  registerServiceWorker({
    onUpdate: (registration) => {
      console.log('New version available:', registration);
      // Show update notification to user
      if (window.confirm('A new version is available. Would you like to update?')) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    },
    onSuccess: (registration) => {
      console.log('Service Worker registered:', registration);
    },
    onError: (error) => {
      console.error('Service Worker registration failed:', error);
    },
  });
}
```

### Service Worker Files

Create `public/sw.js`:

1. Install event: Cache static assets
2. Activate event: Clean up old caches
3. Fetch event: Route requests to strategies
4. Message event: Handle cache invalidation
5. Sync event: Background sync support

See `public/sw.js` for complete implementation.

### Service Worker Scope

Service Worker scope configuration:

```javascript
// In public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.staticAssets).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.svg',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(routeRequest(event.request));
});
```

---

## Cache Invalidation

### Invalidation Strategies

| Strategy | When to Use | Description |
|----------|-------------|-------------|
| **By Pattern** | After content update | Invalidate all URLs matching pattern |
| **By Exact URL** | After specific change | Invalidate specific URL |
| **Entire Cache** | After major update | Clear all caches |
| **API Cache** | After data mutation | Invalidate API responses |

### Cache Invalidation Functions

```typescript
import {
  invalidateCacheByPattern,
  invalidateCacheByUrl,
  clearCache,
  clearAllCaches,
  invalidateApiCache,
} from '@/lib/cacheConfig';

// Invalidate all API cache
await invalidateApiCache();

// Invalidate specific pattern
await invalidateCacheByPattern('api-cache', '/matters');

// Invalidate specific URL
await invalidateCacheByUrl('api-cache', '/api/matters/123');

// Clear entire cache
await clearCache('api-cache');

// Clear all caches
await clearAllCaches();
```

### Service Worker Message API

Send messages to Service Worker:

```typescript
// Send message to Service Worker
if (navigator.serviceWorker && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'INVALIDATE_CACHE',
    pattern: '/matters',
  });
}

// Invalidate all caches
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAR_ALL_CACHES',
});

// Get cache statistics
navigator.serviceWorker.controller.postMessage({
  type: 'GET_CACHE_STATS',
});
```

### Automatic Invalidation

Invalidate cache after data mutations:

```typescript
import { useState } from 'react';
import { invalidateApiCache } from '@/lib/cacheConfig';

function CreateMatterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Create matter
      await api.createMatter(data);

      // Invalidate API cache
      await invalidateApiCache();

      console.log('Matter created, cache invalidated');
    } catch (error) {
      console.error('Failed to create matter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## CDN Edge Locations

### Firebase Hosting Edges

Firebase Hosting has edge locations worldwide:

| Location | Region | Cities |
|-----------|--------|---------|
| **us-east1** | North America | Virginia, South Carolina |
| **us-east4** | North America | Northern Virginia |
| **us-central** | North America | Iowa |
| **us-west1** | North America | Oregon |
| **us-west2** | North America | Los Angeles |
| **europe-west1** | Europe | Belgium |
| **europe-west2** | Europe | London |
| **europe-west3** | Europe | Frankfurt |
| **europe-west6** | Europe | Zurich |
| **asia-east1** | Asia | Taiwan |
| **asia-east2** | Asia | Hong Kong |
| **asia-southeast1** | Asia | Singapore |
| **australia-southeast1** | Oceania | Sydney |

### Edge Selection

Firebase automatically selects the nearest edge:

```typescript
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
```

### Cache Hierarchy

```
┌─────────────────────────────────────────┐
│          User Request                  │
└─────────────────┬─────────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  DNS Resolution  │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   Nearest Edge   │
        │   (10s TTL)      │
        └────────┬────────┘
                 │
      ┌──────────┴──────────┐
      │                    │
   Cache Miss           Cache Hit
      │                    │
      ▼                    ▼
┌──────────────┐    ┌──────────────┐
│   Origin     │    │   Edge Cache │
│  (Firebase)  │    │   Response   │
└──────┬───────┘    └──────┬───────┘
       │                   │
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  Update Edge │    │ Return Cached │
│    Cache     │    │   Response   │
└──────┬───────┘    └──────────────┘
       │
       ▼
┌──────────────┐
│ Browser     │
│   Cache     │
└──────────────┘
```

---

## Performance Optimization

### Cache Optimization Strategies

1. **Immutable Cache**:
   - Use `immutable` directive for assets that never change
   - Browser never checks for updates
   - Faster page loads

2. **Long Cache for Static Assets**:
   - Cache static assets for 1 year
   - Use versioning for updates
   - Reduces network requests

3. **Short Cache for Dynamic Content**:
   - Cache dynamic content for short periods
   - Revalidate frequently
   - Balances freshness and performance

4. **Stale-While-Revalidate for API**:
   - Serve stale data immediately
   - Revalidate in background
   - Better perceived performance

### Asset Versioning

Use asset versioning for cache busting:

```typescript
import { CDN_CONFIG } from '@/lib/cacheConfig';

export function getAssetUrl(path: string): string {
  if (!CDN_CONFIG.enabled) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${CDN_CONFIG.url}/${cleanPath}?v=${CDN_CONFIG.assetVersion}`;
}

// Usage
import { getAssetUrl } from '@/lib/cacheConfig';

function Logo() {
  return (
    <img src={getAssetUrl('/logo-atty-financial-banner-dark.png')} alt="ATTY Financial" />
  );
}
```

### Cache Warming

Pre-warm critical caches on Service Worker install:

```javascript
// In public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAMES.staticAssets);

      // Cache critical assets
      await cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.svg',
        '/assets/logo-atty-financial-banner-dark.png',
      ]);

      // Pre-fetch critical API data
      const apiCache = await caches.open(CACHE_NAMES.api);
      await apiCache.addAll([
        '/api/matters?limit=10',
        '/api/transactions?limit=20',
      ]);
    })()
  );
});
```

---

## Monitoring

### Cache Performance Monitoring

Monitor cache hit rates:

```typescript
import { getAllCacheStats } from '@/lib/cacheConfig';

async function logCacheStats() {
  const stats = await getAllCacheStats();

  console.table(stats);

  const totalEntries = stats.reduce((sum, stat) => sum + stat.count, 0);
  console.log(`Total cache entries: ${totalEntries}`);
}

// Log stats periodically
setInterval(logCacheStats, 60000); // Every minute
```

### Performance Metrics

Track cache performance:

```typescript
// Track cache hit rate
let cacheHits = 0;
let cacheMisses = 0;

function recordCacheHit() {
  cacheHits++;
  const hitRate = cacheHits / (cacheHits + cacheMisses) * 100;
  console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);
}

function recordCacheMiss() {
  cacheMisses++;
  const hitRate = cacheHits / (cacheHits + cacheMisses) * 100;
  console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);
}

// In Service Worker fetch handler
self.addEventListener('fetch', (event) => {
  const cache = await caches.open(CACHE_NAMES.api);
  const cachedResponse = await cache.match(event.request);

  if (cachedResponse) {
    recordCacheHit();
  } else {
    recordCacheMiss();
  }
});
```

### Firebase Analytics Tracking

Track cache performance with Firebase Analytics:

```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics();

function logCacheEvent(eventName: string, data: any) {
  logEvent(analytics, eventName, data);
}

// Log cache hit
logCacheEvent('cache_hit', {
  url: request.url,
  strategy: strategyName,
});

// Log cache miss
logCacheEvent('cache_miss', {
  url: request.url,
  strategy: strategyName,
});
```

---

## Troubleshooting

### Cache Not Working

**Problem**: Resources not being cached

**Solutions**:

1. **Check Cache-Control headers**:
   ```bash
   curl -I https://attyfinancial.com/main.js
   # Should include: Cache-Control: public, max-age=31536000, immutable
   ```

2. **Check Service Worker is registered**:
   ```typescript
   const registration = await navigator.serviceWorker.getRegistration();
   console.log('Service Worker registered:', !!registration);
   ```

3. **Check Service Worker scope**:
   ```javascript
   console.log('Service Worker scope:', registration.scope);
   // Should be: https://attyfinancial.com/
   ```

4. **Check Service Worker is activated**:
   ```javascript
   self.addEventListener('activate', (event) => {
     console.log('Service Worker activated');
   });
   ```

### Old Content Still Showing

**Problem**: Updated content not displaying

**Solutions**:

1. **Clear browser cache**:
   - Chrome: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Firefox: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Safari: Cmd+Option+E

2. **Clear Service Worker cache**:
   ```typescript
   await clearAllCaches();
   ```

3. **Update asset version**:
   - Increment `VITE_ASSET_VERSION`
   - Redeploy application

4. **Skip waiting Service Worker**:
   ```typescript
   registration.waiting.postMessage({ type: 'SKIP_WAITING' });
   ```

### Service Worker Not Updating

**Problem**: New Service Worker version not activating

**Solutions**:

1. **Unregister old Service Worker**:
   ```bash
   # In browser DevTools
   # Application → Service Workers → Unregister
   ```

2. **Skip waiting**:
   ```javascript
   self.addEventListener('install', (event) => {
     self.skipWaiting();
   });
   ```

3. **Check for update**:
   ```typescript
   registration.addEventListener('updatefound', (registration) => {
     console.log('New Service Worker found:', registration);
   });
   ```

### CDN Not Delivering

**Problem**: Content not served from CDN edge

**Solutions**:

1. **Check DNS propagation**:
   ```bash
   dig attyfinancial.com
   # Should resolve to Firebase Hosting IPs
   ```

2. **Check Firebase CDN status**:
   - Firebase Console → Hosting → Domains
   - Check domain status

3. **Check Cache-Control headers**:
   ```bash
   curl -I https://attyfinancial.com/main.js
   # Should include Cache-Control
   ```

4. **Verify DNS records**:
   - Check A records
   - Check CNAME records
   - Verify no proxy interference

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [SSL and DNS Configuration](./SSL_DNS.md)
- [Firebase Production Setup](./FIREBASE_PRODUCTION_SETUP.md)
- [Environment Quick Reference](./ENVIRONMENT_QUICK_REFERENCE.md)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
