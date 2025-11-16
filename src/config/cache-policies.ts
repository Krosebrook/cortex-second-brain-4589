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

// Initialize cache policies
export function initializeCachePolicies() {
  cacheManager.setPolicy('chats', CACHE_POLICIES.CHATS);
  cacheManager.setPolicy('messages', CACHE_POLICIES.MESSAGES);
  cacheManager.setPolicy('knowledge', CACHE_POLICIES.KNOWLEDGE);
  cacheManager.setPolicy('profile', CACHE_POLICIES.PROFILE);
}
