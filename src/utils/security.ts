import DOMPurify from 'dompurify';
import { z } from 'zod';

// Tag validation schema
export const tagSchema = z.string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(50, "Tag too long (max 50 characters)")
  .regex(/^[a-zA-Z0-9\s\-_]+$/, "Only letters, numbers, spaces, hyphens, and underscores allowed");

export const validateTag = (tag: string): { isValid: boolean; error?: string } => {
  const result = tagSchema.safeParse(tag);
  if (!result.success) {
    return { isValid: false, error: result.error.errors[0].message };
  }
  return { isValid: true };
};

// Enhanced XSS protection with DOMPurify
export const sanitizeContent = (content: string): string => {
  // Configure DOMPurify to be more restrictive
  const cleanContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
  
  return cleanContent.trim();
};

// Content validation with length limits
export const validateChatMessage = (content: string): { isValid: boolean; error?: string } => {
  if (!content.trim()) {
    return { isValid: false, error: "Message cannot be empty" };
  }
  
  if (content.length > 4000) {
    return { isValid: false, error: "Message is too long (max 4000 characters)" };
  }
  
  return { isValid: true };
};

export const validateKnowledgeBaseContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content.trim()) {
    return { isValid: false, error: "Content cannot be empty" };
  }
  
  if (content.length > 10000) {
    return { isValid: false, error: "Content is too long (max 10,000 characters)" };
  }
  
  return { isValid: true };
};

export const validateUserProfile = (field: string, value: string): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: `${field} cannot be empty` };
  }
  
  switch (field) {
    case 'username':
      if (value.length > 50) {
        return { isValid: false, error: "Username is too long (max 50 characters)" };
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
        return { isValid: false, error: "Username contains invalid characters" };
      }
      break;
    case 'full_name':
      if (value.length > 100) {
        return { isValid: false, error: "Full name is too long (max 100 characters)" };
      }
      break;
    case 'avatar_url':
      if (value.length > 500) {
        return { isValid: false, error: "Avatar URL is too long (max 500 characters)" };
      }
      try {
        new URL(value);
      } catch {
        return { isValid: false, error: "Invalid URL format" };
      }
      break;
  }
  
  return { isValid: true };
};

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Re-export secure storage from crypto module for backward compatibility
// Note: The old secureStorage used Base64 encoding (insecure)
// New code should use secureStorageV2 from '@/utils/crypto'
export { secureStorageV2 as secureStorage } from './crypto';

// Legacy secureStorage is deprecated - kept for reference only
// DO NOT USE - insecure Base64 encoding
export const legacySecureStorage = {
  /** @deprecated Use secureStorageV2 from '@/utils/crypto' instead */
  setItem: (key: string, value: unknown, expirationHours: number = 24) => {
    console.warn('[DEPRECATED] legacySecureStorage.setItem - use secureStorageV2 instead');
    const item = {
      value,
      timestamp: Date.now(),
      expiration: Date.now() + (expirationHours * 60 * 60 * 1000)
    };
    const encoded = btoa(JSON.stringify(item));
    localStorage.setItem(key, encoded);
  },
  
  /** @deprecated Use secureStorageV2 from '@/utils/crypto' instead */
  getItem: (key: string) => {
    console.warn('[DEPRECATED] legacySecureStorage.getItem - use secureStorageV2 instead');
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      
      const item = JSON.parse(atob(encoded));
      if (Date.now() > item.expiration) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },
  
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  }
};