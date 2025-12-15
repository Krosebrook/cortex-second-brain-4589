/**
 * Base Service
 * Abstract base class for all services with common functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { withRetry, parseSupabaseError, RetryConfig, DEFAULT_RETRY_CONFIG } from '@/lib/api-utils';
import { ApplicationError, ErrorCode, createAppError } from '@/lib/error-handling';

export interface ServiceConfig {
  retryConfig?: Partial<RetryConfig>;
  enableLogging?: boolean;
}

const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  retryConfig: DEFAULT_RETRY_CONFIG,
  enableLogging: import.meta.env.DEV,
};

export abstract class BaseService {
  protected config: ServiceConfig;
  protected serviceName: string;

  constructor(serviceName: string, config: Partial<ServiceConfig> = {}) {
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_SERVICE_CONFIG, ...config };
  }

  /**
   * Log service operations in development
   */
  protected log(operation: string, data?: unknown): void {
    if (this.config.enableLogging) {
      console.log(`[${this.serviceName}] ${operation}`, data ?? '');
    }
  }

  /**
   * Log errors
   */
  protected logError(operation: string, error: unknown): void {
    console.error(`[${this.serviceName}] ${operation} failed:`, error);
  }

  /**
   * Execute a database operation with retry logic and error handling
   */
  protected async executeWithRetry<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.log(operation, 'started');

    try {
      const result = await withRetry(fn, this.config.retryConfig);
      this.log(operation, 'completed');
      return result;
    } catch (error) {
      this.logError(operation, error);
      throw error instanceof ApplicationError ? error : parseSupabaseError(error);
    }
  }

  /**
   * Get current authenticated user ID
   */
  protected async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw createAppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
    }

    return user.id;
  }

  /**
   * Validate that a user ID matches the current user
   */
  protected async validateUserOwnership(userId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    
    if (currentUserId !== userId) {
      throw createAppError(ErrorCode.FORBIDDEN, 'Access denied');
    }
  }
}

/**
 * Helper to handle Supabase query results
 */
export function handleSupabaseResult<T>(
  result: { data: T | null; error: unknown }
): T {
  if (result.error) {
    throw parseSupabaseError(result.error);
  }

  if (result.data === null) {
    throw createAppError(ErrorCode.NOT_FOUND, 'Resource not found');
  }

  return result.data;
}

/**
 * Helper to handle Supabase query results that may return empty arrays
 */
export function handleSupabaseArrayResult<T>(
  result: { data: T[] | null; error: unknown }
): T[] {
  if (result.error) {
    throw parseSupabaseError(result.error);
  }

  return result.data ?? [];
}
