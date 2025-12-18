/**
 * Application-wide constants
 * Centralized configuration for consistency
 */

// ============================================
// Application Metadata
// ============================================

export const APP_NAME = 'Cortex';
export const APP_DESCRIPTION = 'Your AI-powered second brain';
export const APP_VERSION = '1.0.0';

// ============================================
// Routes
// ============================================

export const ROUTES = {
  HOME: '/',
  WHY: '/why',
  HOW: '/how',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  MANAGE: '/manage',
  PROFILE: '/profile',
  IMPORT: '/import',
  SEARCH: '/search',
  TESSA: '/tessa',
  STATUS: '/status',
  SETTINGS: '/settings',
  INSTALL: '/install',
  OFFLINE: '/offline',
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.WHY,
  ROUTES.HOW,
  ROUTES.AUTH,
  ROUTES.STATUS,
  ROUTES.INSTALL,
  ROUTES.OFFLINE,
] as const;

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.MANAGE,
  ROUTES.PROFILE,
  ROUTES.IMPORT,
  ROUTES.SEARCH,
  ROUTES.TESSA,
  ROUTES.SETTINGS,
] as const;

// ============================================
// API Configuration
// ============================================

export const API = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// ============================================
// Validation Limits
// ============================================

export const VALIDATION = {
  TAG_MAX_LENGTH: 50,
  TAG_PATTERN: /^[a-zA-Z0-9_-]+$/,
  CHAT_MESSAGE_MAX_LENGTH: 4000,
  KNOWLEDGE_CONTENT_MAX_LENGTH: 10000,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  FULL_NAME_MAX_LENGTH: 100,
} as const;

// ============================================
// UI Configuration
// ============================================

export const UI = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  VIRTUAL_SCROLL_THRESHOLD: 50,
  SIDEBAR_WIDTH: 240,
  SIDEBAR_COLLAPSED_WIDTH: 56,
} as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  THEME: 'cortex-theme',
  AUTH_TOKEN: 'cortex-auth-token',
  OFFLINE_QUEUE: 'cortex-offline-queue',
  CACHE_PREFIX: 'cortex-cache',
  FILTER_PRESETS: 'cortex-filter-presets',
} as const;

// ============================================
// Rate Limiting
// ============================================

export const RATE_LIMITS = {
  CHAT_MESSAGES_PER_MINUTE: 20,
  API_REQUESTS_PER_MINUTE: 60,
  KNOWLEDGE_UPDATES_PER_MINUTE: 30,
} as const;

// ============================================
// Feature Flags
// ============================================

export const FEATURES = {
  OFFLINE_MODE: true,
  PWA_INSTALL: true,
  KEYBOARD_SHORTCUTS: true,
  COMMAND_PALETTE: true,
  VIRTUAL_SCROLLING: true,
  UNDO_REDO: true,
} as const;

// ============================================
// Keyboard Shortcuts
// ============================================

export const SHORTCUTS = {
  COMMAND_PALETTE: { key: 'k', ctrlKey: true, label: 'Open command palette' },
  HELP: { key: '?', label: 'Show shortcuts help' },
  SEARCH: { key: '/', ctrlKey: true, label: 'Focus search' },
  NEW_CHAT: { key: 'n', ctrlKey: true, label: 'New chat' },
  UNDO: { key: 'z', ctrlKey: true, label: 'Undo' },
  REDO: { key: 'z', ctrlKey: true, shiftKey: true, label: 'Redo' },
  ESCAPE: { key: 'Escape', label: 'Close/Cancel' },
} as const;

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
} as const;

// ============================================
// Success Messages
// ============================================

export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  DELETED: 'Item deleted successfully.',
  CREATED: 'Item created successfully.',
  UPDATED: 'Item updated successfully.',
  COPIED: 'Copied to clipboard.',
} as const;
