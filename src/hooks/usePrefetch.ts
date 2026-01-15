import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatService } from '@/services/chat.service';
import { KnowledgeService } from '@/services/knowledge.service';
import { cacheManager } from '@/lib/cache-manager';
import { ROUTE_RELATIONS } from '@/config/cache-policies';

interface PrefetchConfig {
  enabled?: boolean;
  delay?: number; // Delay before prefetching (ms)
  prefetchOnHover?: boolean;
  prefetchOnIdle?: boolean;
}

interface UserBehavior {
  lastVisitedRoutes: string[];
  chatInteractions: number;
  knowledgeViews: number;
  lastPrefetchTime: number;
}

const DEFAULT_CONFIG: PrefetchConfig = {
  enabled: true,
  delay: 500,
  prefetchOnHover: true,
  prefetchOnIdle: true,
};

export function usePrefetch(userId: string | null, config: PrefetchConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const location = useLocation();
  const behaviorRef = useRef<UserBehavior>({
    lastVisitedRoutes: [],
    chatInteractions: 0,
    knowledgeViews: 0,
    lastPrefetchTime: 0,
  });
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  // Track route history for predictive prefetching
  useEffect(() => {
    const behavior = behaviorRef.current;
    if (!behavior.lastVisitedRoutes.includes(location.pathname)) {
      behavior.lastVisitedRoutes.push(location.pathname);
      if (behavior.lastVisitedRoutes.length > 5) {
        behavior.lastVisitedRoutes.shift();
      }
    }
  }, [location.pathname]);

  // Prefetch a route document
  const prefetchRoute = useCallback((href: string, priority: 'high' | 'low' = 'low') => {
    if (prefetchedRoutesRef.current.has(href)) return;

    const doPrefetch = () => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'document';
      
      if (priority === 'high') {
        link.setAttribute('fetchpriority', 'high');
      }

      document.head.appendChild(link);
      prefetchedRoutesRef.current.add(href);
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(doPrefetch);
    } else {
      setTimeout(doPrefetch, 100);
    }
  }, []);

  // Prefetch related routes based on current location
  const prefetchRelatedRoutes = useCallback(() => {
    const relatedRoutes = ROUTE_RELATIONS[location.pathname] || [];
    relatedRoutes.forEach((route, index) => {
      setTimeout(() => prefetchRoute(route), 200 + index * 100);
    });
  }, [location.pathname, prefetchRoute]);

  // Prefetch chat data
  const prefetchChats = useCallback(async () => {
    if (!userId || !finalConfig.enabled) return;

    const now = Date.now();
    if (now - behaviorRef.current.lastPrefetchTime < 10000) {
      return; // Don't prefetch more than once every 10 seconds
    }

    try {
      console.log('[Prefetch] Loading chats in background...');
      const chats = await ChatService.loadChats(userId);
      cacheManager.set(userId + '_chats', chats);
      behaviorRef.current.lastPrefetchTime = now;
    } catch (error) {
      console.error('[Prefetch] Error prefetching chats:', error);
    }
  }, [userId, finalConfig.enabled]);

  // Prefetch knowledge data
  const prefetchKnowledge = useCallback(async () => {
    if (!userId || !finalConfig.enabled) return;

    const now = Date.now();
    if (now - behaviorRef.current.lastPrefetchTime < 10000) {
      return;
    }

    try {
      console.log('[Prefetch] Loading knowledge in background...');
      const knowledge = await KnowledgeService.loadKnowledge(userId);
      cacheManager.set(userId + '_knowledge', knowledge);
      behaviorRef.current.lastPrefetchTime = now;
    } catch (error) {
      console.error('[Prefetch] Error prefetching knowledge:', error);
    }
  }, [userId, finalConfig.enabled]);

  // Prefetch image
  const prefetchImage = useCallback((src: string) => {
    if (prefetchedRoutesRef.current.has(src)) return;

    const img = new Image();
    img.src = src;
    prefetchedRoutesRef.current.add(src);
  }, []);

  // Prefetch multiple images
  const prefetchImages = useCallback((srcs: string[]) => {
    srcs.forEach(src => prefetchImage(src));
  }, [prefetchImage]);

  // Handler for hover-based prefetching
  const prefetchOnHover = useCallback((href: string) => {
    return {
      onMouseEnter: () => prefetchRoute(href, 'high'),
      onFocus: () => prefetchRoute(href, 'high'),
      onTouchStart: () => prefetchRoute(href, 'high')
    };
  }, [prefetchRoute]);

  // Predictive prefetching based on current route
  useEffect(() => {
    if (!finalConfig.enabled || !userId) return;

    const currentPath = location.pathname;

    // Clear any existing timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Predict next likely action based on current route
    prefetchTimeoutRef.current = setTimeout(() => {
      // Prefetch related routes
      prefetchRelatedRoutes();

      if (currentPath === '/dashboard' || currentPath === '/') {
        // User on dashboard likely to view chats or knowledge
        prefetchChats();
        prefetchKnowledge();
      } else if (currentPath.startsWith('/search')) {
        // User in search/chat view
        behaviorRef.current.chatInteractions++;
        prefetchChats();
      } else if (currentPath === '/import') {
        // User likely to interact with knowledge base
        behaviorRef.current.knowledgeViews++;
        prefetchKnowledge();
      }
    }, finalConfig.delay);

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [location.pathname, userId, finalConfig.enabled, finalConfig.delay, prefetchChats, prefetchKnowledge, prefetchRelatedRoutes]);

  // Prefetch on browser idle (when user is not actively interacting)
  useEffect(() => {
    if (!finalConfig.prefetchOnIdle || !userId || typeof window === 'undefined') return;

    let idleTimeout: NodeJS.Timeout;

    const handleUserActivity = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        // User idle for 3 seconds, prefetch likely data
        const behavior = behaviorRef.current;
        if (behavior.chatInteractions > behavior.knowledgeViews) {
          prefetchChats();
        } else {
          prefetchKnowledge();
        }
      }, 3000);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      clearTimeout(idleTimeout);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [finalConfig.prefetchOnIdle, userId, prefetchChats, prefetchKnowledge]);

  return {
    prefetchChats,
    prefetchKnowledge,
    prefetchRoute,
    prefetchOnHover,
    prefetchImage,
    prefetchImages,
    behavior: behaviorRef.current,
  };
}

// Hook for prefetching specific items on hover
export function usePrefetchOnHover<T extends HTMLElement = HTMLElement>(
  prefetchFn: () => Promise<void>,
  enabled = true
) {
  const elementRef = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => {
        prefetchFn().catch(console.error);
      }, 200);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [prefetchFn, enabled]);

  return elementRef;
}
