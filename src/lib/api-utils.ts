/**
 * API Utilities
 * Centralized utilities for API calls including retry logic, error handling, and response normalization
 */

import { AppError, ApplicationError, ErrorCode, createAppError } from './error-handling';

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorCode[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT],
};

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: true;
}

export interface ApiError {
  error: AppError;
  success: false;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: AppError, config: RetryConfig): boolean {
  return config.retryableErrors.includes(error.code);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof ApplicationError 
        ? error 
        : createAppError(
            ErrorCode.UNKNOWN,
            error instanceof Error ? error.message : 'Unknown error',
            { originalError: error }
          );

      const isLastAttempt = attempt === fullConfig.maxRetries;
      const shouldRetry = !isLastAttempt && isRetryableError(lastError, fullConfig);

      if (!shouldRetry) {
        throw lastError;
      }

      const delay = calculateDelay(attempt, fullConfig);
      console.warn(`Retry attempt ${attempt + 1}/${fullConfig.maxRetries} after ${delay}ms`, {
        error: lastError.message,
        code: lastError.code,
      });
      
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Wrap an async function to return ApiResult instead of throwing
 */
export async function safeExecute<T>(
  fn: () => Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await fn();
    return { data, success: true };
  } catch (error) {
    const appError = error instanceof ApplicationError
      ? error
      : createAppError(
          ErrorCode.UNKNOWN,
          error instanceof Error ? error.message : 'Unknown error',
          { originalError: error }
        );
    return { error: appError, success: false };
  }
}

/**
 * Parse Supabase error into AppError
 */
export function parseSupabaseError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  const errorObj = error as { code?: string; message?: string; details?: string };
  const message = errorObj?.message || 'Database operation failed';
  const code = errorObj?.code;

  // Map Supabase error codes to our error codes
  if (code === 'PGRST116') {
    return createAppError(ErrorCode.NOT_FOUND, 'Resource not found');
  }
  if (code === '23505') {
    return createAppError(ErrorCode.VALIDATION, 'Duplicate entry');
  }
  if (code === '23503') {
    return createAppError(ErrorCode.VALIDATION, 'Referenced resource not found');
  }
  if (code === '42501' || code === 'PGRST301') {
    return createAppError(ErrorCode.UNAUTHORIZED, 'Permission denied');
  }
  if (code === 'PGRST000' || message.includes('network')) {
    return createAppError(ErrorCode.NETWORK_ERROR, 'Network error');
  }

  return createAppError(ErrorCode.DATABASE, message, { originalCode: code });
}

/**
 * Type guard for successful API result
 */
export function isSuccess<T>(result: ApiResult<T>): result is ApiResponse<T> {
  return result.success === true;
}

/**
 * Type guard for failed API result
 */
export function isError<T>(result: ApiResult<T>): result is ApiError {
  return result.success === false;
}
