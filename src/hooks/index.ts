/**
 * Centralized Hooks Index
 * Export all custom hooks for cleaner imports across the codebase
 * 
 * Usage: import { useDebounce, useLocalStorage, useChat } from '@/hooks';
 */

// Core utility hooks
export { useDebounce } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, usePrefersReducedMotion, usePrefersDarkMode } from './useMediaQuery';
export { useIsMobile as useIsMobileBreakpoint } from './use-mobile';

// Async and state management hooks
export { useAsyncAction } from './useAsyncAction';
export { useOptimistic } from './useOptimistic';
export { useConfirmation } from './useConfirmation';

// Network and offline hooks
export { useNetworkStatus } from './useNetworkStatus';
export { useConflictDetection } from './useConflictDetection';

// UI interaction hooks
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useKeyboardNavigation } from './useKeyboardNavigation';
export { useShortcutHelp } from './useShortcutHelp';
export { useShortcutTracking } from './useShortcutTracking';
export { useDragAndDrop } from './useDragAndDrop';
export { useRangeSelection } from './useRangeSelection';
export { useVirtualScroll } from './useVirtualScroll';
export { useCommandPalette } from './useCommandPalette';

// Data hooks
export { useChat } from './useChat';
export { useKnowledge } from './useKnowledge';
export { useProfile } from './useProfile';


// Filter and search hooks
export { useSearchFilter } from './useSearchFilter';
export { useFilterPresets } from './useFilterPresets';
export { usePresetReorder } from './usePresetReorder';
export { useTagAutocomplete } from './useTagAutocomplete';
export { useMultiSelect } from './useMultiSelect';

// Undo/Redo hooks
export { useUndoRedo } from './useUndoRedo';
export { useUndoHistory } from './useUndoHistory';

// Performance hooks
export { usePrefetch, usePrefetchOnHover } from './usePrefetch';
export { useWebVitals } from './useWebVitals';
export { useBackgroundSync } from './useBackgroundSync';
export { useConflictResolution } from './useConflictResolution';

// Toast hook (re-export from shadcn)
export { useToast, toast } from './use-toast';

// Type exports
export type { KeyboardShortcut } from './useKeyboardShortcuts';
export type { ConfirmationOptions, ConfirmationState } from './useConfirmation';
