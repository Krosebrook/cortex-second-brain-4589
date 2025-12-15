/**
 * Core type definitions for the Cortex application
 * Centralized types for type safety across the codebase
 */

// Re-export all types from specific modules
export * from './chat';
export * from './action-history';
export * from './command';
export * from './conflict';
export * from './filter-preset';

// ============================================
// Common Types
// ============================================

export type ID = string;

export interface BaseEntity {
  id: ID;
  created_at: string;
  updated_at?: string;
}

export interface SoftDeletable {
  deleted_at?: string | null;
}

export interface Versionable {
  version?: number;
}

// ============================================
// User Types
// ============================================

export interface User {
  id: ID;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface UserProfile extends User {
  username?: string | null;
  subscription_tier?: string | null;
  api_calls_used?: number | null;
  api_calls_limit?: number | null;
  status?: string | null;
}

// ============================================
// Knowledge Types
// ============================================

export interface KnowledgeItem extends BaseEntity, SoftDeletable, Versionable {
  user_id: ID;
  title: string;
  content?: string | null;
  type?: string | null;
  source_url?: string | null;
  tags?: string[] | null;
  order_index?: number | null;
}

export type KnowledgeItemInsert = Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>;
export type KnowledgeItemUpdate = Partial<Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at'>>;

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// UI State Types
// ============================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// ============================================
// Navigation Types
// ============================================

export interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  id: string;
  protected?: boolean;
  children?: NavItem[];
}

// ============================================
// Form Types
// ============================================

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// ============================================
// Theme Types
// ============================================

export type Theme = 'light' | 'dark' | 'system';

// ============================================
// Service Status Types
// ============================================

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface ServiceHealth {
  service: string;
  status: ServiceStatus;
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface SystemStatus {
  overall: ServiceStatus;
  services: ServiceHealth[];
  timestamp: string;
  totalResponseTime: number;
}
