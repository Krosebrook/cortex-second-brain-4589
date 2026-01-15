/**
 * Performance optimization utilities for achieving Lighthouse scores >90
 */

// Image lazy loading with Intersection Observer
export function setupImageLazyLoading(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
          }
          imageObserver.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  );

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
}

// Defer non-critical CSS
export function deferNonCriticalCSS(href: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = () => {
    link.media = 'all';
  };
  document.head.appendChild(link);
}

// Preload critical resources
export function preloadResource(href: string, as: string, type?: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  if (as === 'font') link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Request Idle Callback polyfill
export function requestIdleCallbackPolyfill(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window === 'undefined') {
    return 0;
  }
  
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  const start = Date.now();
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, 1) as unknown as number;
}

// Defer non-critical JavaScript execution
export function deferExecution(fn: () => void, priority: 'high' | 'low' = 'low'): void {
  if (typeof window === 'undefined') return;

  if (priority === 'high') {
    // Use microtask for high priority
    queueMicrotask(fn);
  } else {
    // Use requestIdleCallback for low priority
    requestIdleCallbackPolyfill(fn, { timeout: 2000 });
  }
}

interface SchedulerWithYield {
  yield: () => Promise<void>;
}

// Optimize long tasks by yielding to main thread
export async function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && 'scheduler' in window) {
      const scheduler = window.scheduler as SchedulerWithYield | undefined;
      if (scheduler && 'yield' in scheduler) {
        // Use scheduler.yield() if available
        scheduler.yield().then(resolve);
        return;
      }
    }
    // Fallback to setTimeout
    setTimeout(resolve, 0);
  });
}

// Chunk large operations to prevent blocking
export async function processInChunks<T>(
  items: T[],
  processFn: (item: T) => void,
  chunkSize = 5,
  yieldBetweenChunks = true
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    chunk.forEach(processFn);
    
    if (yieldBetweenChunks && i + chunkSize < items.length) {
      await yieldToMain();
    }
  }
}

// Debounce function for performance
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle function for performance
export function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Check if device has reduced motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Memory-efficient event listener management
export class EventListenerManager {
  private listeners: Map<string, { element: Element | Window; handler: EventListener }[]> = new Map();

  add(element: Element | Window, event: string, handler: EventListener, options?: AddEventListenerOptions): void {
    element.addEventListener(event, handler, options);
    
    const key = event;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push({ element, handler });
  }

  removeAll(): void {
    this.listeners.forEach((listeners, event) => {
      listeners.forEach(({ element, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();
  }
}

// Connection-aware resource loading
export function getConnectionType(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'medium';
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return 'medium';

  const effectiveType = connection.effectiveType;
  
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
  if (effectiveType === '3g') return 'medium';
  return 'fast';
}

interface NetworkInformation {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// Adaptive loading based on network conditions
export function shouldLoadHighQuality(): boolean {
  const connectionType = getConnectionType();
  
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData) return false;
  }
  
  return connectionType === 'fast';
}
