/**
 * Error Handling Utilities
 * Centralized error parsing and handling
 */

import { ERROR_MESSAGES } from '@/constants';

// ============================================
// Error Types
// ============================================

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  originalError?: unknown;
}

export class ApplicationError extends Error {
  code?: string;
  status?: number;
  originalError?: unknown;

  constructor(message: string, options?: Omit<AppError, 'message'>) {
    super(message);
    this.name = 'ApplicationError';
    this.code = options?.code;
    this.status = options?.status;
    this.originalError = options?.originalError;
  }
}

// ============================================
// Error Parsing
// ============================================

/**
 * Safely extracts an error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    // Check for common error object shapes
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error;
    }
    if ('msg' in error && typeof error.msg === 'string') {
      return error.msg;
    }
  }
  
  return ERROR_MESSAGES.GENERIC;
}

/**
 * Parses any error into a standardized AppError format
 */
export function parseError(error: unknown): AppError {
  if (error instanceof ApplicationError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      originalError: error.originalError,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
    };
  }

  return {
    message: getErrorMessage(error),
    originalError: error,
  };
}

// ============================================
// Error Type Guards
// ============================================

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('failed to fetch') ||
      message.includes('connection') ||
      message.includes('offline')
    );
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('status' in error && (error.status === 401 || error.status === 403)) {
      return true;
    }
    if ('code' in error && typeof error.code === 'string') {
      const code = error.code.toLowerCase();
      return code.includes('auth') || code.includes('unauthorized');
    }
  }
  return false;
}

export function isValidationError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('status' in error && error.status === 400) {
      return true;
    }
    if ('code' in error && typeof error.code === 'string') {
      const code = error.code.toLowerCase();
      return code.includes('validation') || code.includes('invalid');
    }
  }
  return false;
}

export function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('status' in error && error.status === 429) {
      return true;
    }
    if ('code' in error && typeof error.code === 'string') {
      return error.code.toLowerCase().includes('rate_limit');
    }
  }
  return false;
}

// ============================================
// User-Friendly Error Messages
// ============================================

export function getUserFriendlyError(error: unknown): string {
  if (isNetworkError(error)) {
    return ERROR_MESSAGES.NETWORK;
  }
  
  if (isAuthError(error)) {
    return ERROR_MESSAGES.UNAUTHORIZED;
  }
  
  if (isValidationError(error)) {
    return ERROR_MESSAGES.VALIDATION;
  }
  
  if (isRateLimitError(error)) {
    return ERROR_MESSAGES.RATE_LIMITED;
  }
  
  const message = getErrorMessage(error);
  
  // Don't expose internal error details to users
  if (message.includes('500') || message.includes('Internal')) {
    return ERROR_MESSAGES.GENERIC;
  }
  
  return message;
}

// ============================================
// Async Error Wrapper
// ============================================

/**
 * Wraps an async function with standardized error handling
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('Operation failed:', parseError(error));
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}
