interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CachePolicy {
  ttl: number; // milliseconds
  maxSize?: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private policies: Map<string, CachePolicy> = new Map();

  setPolicy(key: string, policy: CachePolicy) {
    this.policies.set(key, policy);
  }

  set<T>(key: string, data: T, customTTL?: number): void {
    const policy = this.policies.get(key) || { ttl: 3600000, strategy: 'lru' };
    const ttl = customTTL || policy.ttl;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    this.enforceMaxSize(policy);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  private enforceMaxSize(policy: CachePolicy): void {
    if (!policy.maxSize || this.cache.size <= policy.maxSize) {
      return;
    }

    const entries = Array.from(this.cache.entries());

    // Sort based on strategy
    switch (policy.strategy) {
      case 'lru':
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case 'lfu':
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'fifo':
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
    }

    // Remove oldest entries
    const toRemove = entries.slice(0, this.cache.size - policy.maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  getStats() {
    return {
      size: this.cache.size,
      policies: Array.from(this.policies.entries()),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        accessCount: entry.accessCount,
      })),
    };
  }
}

export const cacheManager = new CacheManager();
