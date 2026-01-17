/**
 * Request Utilities
 * Utilities for making HTTP requests with timeouts and proper error handling
 * 
 * @module lib/request-utils
 */

import { ApiConfig, ExternalApiConfig } from '@/config/app-config';
import { createAppError, ErrorCode } from './error-handling';

export interface FetchWithTimeoutOptions extends RequestInit {
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Fetch with timeout support
 * Wraps native fetch with AbortController for timeout handling
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = ApiConfig.requestTimeout, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createAppError(
        ErrorCode.TIMEOUT,
        `Request timed out after ${timeout}ms`,
        { url: url.toString() }
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch JSON with timeout and automatic parsing
 */
export async function fetchJsonWithTimeout<T>(
  url: string | URL,
  options: FetchWithTimeoutOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw createAppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `HTTP ${response.status}: ${errorText}`,
      { url: url.toString(), status: response.status }
    );
  }

  return response.json();
}

/**
 * Create a request with OpenAI-specific timeout
 */
export async function fetchOpenAI<T>(
  endpoint: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<T> {
  const response = await fetchWithTimeout(`https://api.openai.com/v1${endpoint}`, {
    method: 'POST',
    timeout: ExternalApiConfig.openAITimeout,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw createAppError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `OpenAI API error: ${errorData.error?.message || response.statusText}`,
      { status: response.status, error: errorData }
    );
  }

  return response.json();
}

/**
 * Create a request with geolocation API timeout
 */
export async function fetchGeoLocation<T>(url: string | URL): Promise<T> {
  return fetchJsonWithTimeout<T>(url, {
    timeout: ExternalApiConfig.geoLocationTimeout,
  });
}

/**
 * Retry a fetch request with exponential backoff
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    retryOn?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = ApiConfig.maxRetries,
    baseDelay = ApiConfig.baseRetryDelay,
    maxDelay = ApiConfig.maxRetryDelay,
    retryOn = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries || !retryOn(lastError)) {
        throw lastError;
      }

      const delay = Math.min(
        baseDelay * Math.pow(ApiConfig.backoffMultiplier, attempt) + Math.random() * 1000,
        maxDelay
      );

      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`, {
        error: lastError.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
