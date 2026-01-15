import { cacheManager } from '@/lib/cache-manager';

// Define cache policies for different data types
export const CACHE_POLICIES = {
  CHATS: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 50,
    strategy: 'lru' as const,
  },
  MESSAGES: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 100,
    strategy: 'lru' as const,
  },
  KNOWLEDGE: {
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    maxSize: 100,
    strategy: 'lru' as const,
  },
  PROFILE: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 10,
    strategy: 'lru' as const,
  },
};

// Critical routes to pre-cache for offline support and faster navigation
export const CRITICAL_ROUTES = [
  '/',
  '/dashboard',
  '/search',
  '/manage',
  '/settings',
  '/profile',
  '/offline'
];

// Route prefetch priorities (lower = higher priority)
export const ROUTE_PRIORITIES: Record<string, number> = {
  '/': 1,
  '/dashboard': 2,
  '/search': 3,
  '/manage': 4,
  '/auth': 5,
  '/settings': 6,
  '/profile': 7,
  '/status': 8
};

// Route relationships for predictive prefetching
export const ROUTE_RELATIONS: Record<string, string[]> = {
  '/': ['/dashboard', '/auth', '/why', '/how'],
  '/dashboard': ['/search', '/manage', '/settings'],
  '/search': ['/dashboard', '/manage'],
  '/manage': ['/dashboard', '/import'],
  '/settings': ['/profile', '/dashboard'],
  '/profile': ['/settings', '/dashboard'],
  '/auth': ['/dashboard']
};

/**
 * Prefetch critical route chunks for faster navigation
 */
export const prefetchCriticalRoutes = (): void => {
  if (typeof window === 'undefined') return;
  
  const prefetch = () => {
    const routes = Object.entries(ROUTE_PRIORITIES)
      .sort(([, a], [, b]) => a - b)
      .map(([route]) => route);
    
    routes.forEach((route, index) => {
      // Stagger prefetch to avoid overwhelming the network
      setTimeout(() => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        document.head.appendChild(link);
      }, index * 100);
    });
  };
  
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 1000);
  }
};

/**
 * Initialize cache warming for related routes
 */
export const initializeCacheWarming = (): void => {
  if (typeof window === 'undefined') return;
  
  const warmCache = (pathname: string) => {
    const relatedRoutes = ROUTE_RELATIONS[pathname] || [];
    relatedRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      link.as = 'document';
      document.head.appendChild(link);
    });
  };
  
  // Listen for route changes via history API
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    const result = originalPushState.apply(this, args);
    warmCache(window.location.pathname);
    return result;
  };
};

/**
 * Check if service worker is supported and active
 */
export const isServiceWorkerActive = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;
  
  const registration = await navigator.serviceWorker.getRegistration();
  return registration?.active !== undefined;
};

/**
 * Force update service worker cache
 */
export const updateServiceWorkerCache = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;
  
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
  }
};

/**
 * Clear specific cache by name
 */
export const clearCache = async (cacheName: string): Promise<boolean> => {
  if (!('caches' in window)) return false;
  return caches.delete(cacheName);
};

/**
 * Clear all caches
 */
export const clearAllCaches = async (): Promise<void> => {
  if (!('caches' in window)) return;
  
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
};

/**
 * Get cache storage usage
 */
export const getCacheUsage = async (): Promise<{ used: number; quota: number } | null> => {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }
  
  const estimate = await navigator.storage.estimate();
  return {
    used: estimate.usage || 0,
    quota: estimate.quota || 0
  };
};

// Initialize cache policies
export function initializeCachePolicies() {
  cacheManager.setPolicy('chats', CACHE_POLICIES.CHATS);
  cacheManager.setPolicy('messages', CACHE_POLICIES.MESSAGES);
  cacheManager.setPolicy('knowledge', CACHE_POLICIES.KNOWLEDGE);
  cacheManager.setPolicy('profile', CACHE_POLICIES.PROFILE);
  
  // Prefetch critical routes after initial load
  if (document.readyState === 'complete') {
    prefetchCriticalRoutes();
  } else {
    window.addEventListener('load', () => {
      setTimeout(prefetchCriticalRoutes, 2000);
    });
  }
  
  // Initialize cache warming
  initializeCacheWarming();
  
  // Log cache status in development
  if (import.meta.env.DEV) {
    getCacheUsage().then(usage => {
      if (usage) {
        console.log(`[Cache] Usage: ${(usage.used / 1024 / 1024).toFixed(2)}MB / ${(usage.quota / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  }
}
