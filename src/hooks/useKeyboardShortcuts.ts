import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  callback: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  ignoreInputs?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, ignoreInputs = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when typing in inputs, textareas, or contenteditable elements
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const metaMatches = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
        const shiftMatches = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;

        // For Ctrl+A, accept both Ctrl and Meta (Cmd on Mac)
        const modifierMatches = shortcut.ctrlKey
          ? event.ctrlKey || event.metaKey
          : ctrlMatches && metaMatches;

        return keyMatches && modifierMatches && shiftMatches;
      });

      if (matchingShortcut) {
        if (matchingShortcut.preventDefault !== false) {
          event.preventDefault();
        }
        matchingShortcut.callback(event);
      }
    },
    [shortcuts, enabled, ignoreInputs]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};
