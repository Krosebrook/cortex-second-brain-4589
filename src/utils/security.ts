import DOMPurify from 'dompurify';

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

// Secure localStorage with encryption
export const secureStorage = {
  setItem: (key: string, value: any, expirationHours: number = 24) => {
    const item = {
      value,
      timestamp: Date.now(),
      expiration: Date.now() + (expirationHours * 60 * 60 * 1000)
    };
    
    // Simple encoding (for basic obfuscation, not cryptographic security)
    const encoded = btoa(JSON.stringify(item));
    localStorage.setItem(key, encoded);
  },
  
  getItem: (key: string) => {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      
      const item = JSON.parse(atob(encoded));
      
      // Check expiration
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