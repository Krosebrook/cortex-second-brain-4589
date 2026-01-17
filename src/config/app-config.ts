/**
 * Application Configuration
 * Centralized, environment-variable-driven configuration for all app settings
 * 
 * @module config/app-config
 */

// API Configuration
export const ApiConfig = {
  /** Maximum number of retry attempts for failed requests */
  maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES || '3', 10),
  
  /** Base delay in ms for exponential backoff */
  baseRetryDelay: parseInt(import.meta.env.VITE_RETRY_DELAY || '1000', 10),
  
  /** Maximum delay in ms for exponential backoff */
  maxRetryDelay: parseInt(import.meta.env.VITE_MAX_RETRY_DELAY || '10000', 10),
  
  /** Default timeout for API requests in ms */
  requestTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  
  /** Backoff multiplier for retry delays */
  backoffMultiplier: parseFloat(import.meta.env.VITE_BACKOFF_MULTIPLIER || '2'),
} as const;

// Cache Configuration
export const CacheConfig = {
  /** Default TTL for cached items in ms */
  defaultTTL: parseInt(import.meta.env.VITE_CACHE_TTL || '600000', 10),
  
  /** Maximum number of items to cache */
  maxCacheSize: parseInt(import.meta.env.VITE_MAX_CACHE_SIZE || '1000', 10),
  
  /** Whether to enable service worker caching */
  serviceWorkerEnabled: import.meta.env.VITE_SW_CACHE_ENABLED !== 'false',
} as const;

// Rate Limiting Configuration
export const RateLimitConfig = {
  /** Default max requests per window */
  defaultMaxRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX || '60', 10),
  
  /** Default window size in ms */
  defaultWindowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW || '60000', 10),
} as const;

// Feature Flags
export const FeatureFlags = {
  /** Enable prefetching of data */
  prefetchEnabled: import.meta.env.VITE_PREFETCH_ENABLED !== 'false',
  
  /** Enable offline mode support */
  offlineModeEnabled: import.meta.env.VITE_OFFLINE_MODE !== 'false',
  
  /** Enable performance monitoring */
  performanceMonitoringEnabled: import.meta.env.VITE_PERF_MONITORING !== 'false',
  
  /** Enable debug logging in development */
  debugLoggingEnabled: import.meta.env.DEV && import.meta.env.VITE_DEBUG !== 'false',
  
  /** Enable virtual scrolling for long lists */
  virtualScrollEnabled: import.meta.env.VITE_VIRTUAL_SCROLL !== 'false',
} as const;

// UI Configuration
export const UIConfig = {
  /** Default page size for paginated lists */
  defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || '50', 10),
  
  /** Maximum page size allowed */
  maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || '200', 10),
  
  /** Debounce delay for search inputs in ms */
  searchDebounceMs: parseInt(import.meta.env.VITE_SEARCH_DEBOUNCE || '300', 10),
  
  /** Toast notification duration in ms */
  toastDurationMs: parseInt(import.meta.env.VITE_TOAST_DURATION || '5000', 10),
} as const;

// Background Sync Configuration
export const SyncConfig = {
  /** Maximum retry attempts for failed sync operations */
  maxSyncRetries: parseInt(import.meta.env.VITE_SYNC_MAX_RETRIES || '5', 10),
  
  /** Initial retry delay in ms */
  syncRetryDelay: parseInt(import.meta.env.VITE_SYNC_RETRY_DELAY || '1000', 10),
  
  /** Maximum retry delay in ms */
  syncMaxDelay: parseInt(import.meta.env.VITE_SYNC_MAX_DELAY || '300000', 10),
  
  /** Debounce time for sync queue processing in ms */
  syncDebounceMs: parseInt(import.meta.env.VITE_SYNC_DEBOUNCE || '500', 10),
} as const;

// Batch Operation Configuration
export const BatchConfig = {
  /** Default batch size for bulk operations */
  defaultBatchSize: parseInt(import.meta.env.VITE_BATCH_SIZE || '50', 10),
  
  /** Maximum batch size allowed */
  maxBatchSize: parseInt(import.meta.env.VITE_MAX_BATCH_SIZE || '200', 10),
  
  /** Delay between batches in ms */
  batchDelayMs: parseInt(import.meta.env.VITE_BATCH_DELAY || '100', 10),
} as const;

// External API Configuration
export const ExternalApiConfig = {
  /** Timeout for OpenAI API calls in ms */
  openAITimeout: parseInt(import.meta.env.VITE_OPENAI_TIMEOUT || '60000', 10),
  
  /** Timeout for geolocation API calls in ms */
  geoLocationTimeout: parseInt(import.meta.env.VITE_GEO_TIMEOUT || '5000', 10),
} as const;

// Combined App Configuration
export const AppConfig = {
  api: ApiConfig,
  cache: CacheConfig,
  rateLimit: RateLimitConfig,
  features: FeatureFlags,
  ui: UIConfig,
  sync: SyncConfig,
  batch: BatchConfig,
  external: ExternalApiConfig,
} as const;

export type AppConfigType = typeof AppConfig;

export default AppConfig;
