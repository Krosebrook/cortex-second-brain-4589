import { useState, useCallback, useRef, useEffect } from 'react';

interface UseKeyboardNavigationOptions {
  items: any[];
  onSelect: (index: number) => void;
  onActivate?: (index: number) => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  items,
  onSelect,
  onActivate,
  enabled = true,
}: UseKeyboardNavigationOptions) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Reset focused index when items change
  useEffect(() => {
    if (focusedIndex >= items.length) {
      setFocusedIndex(items.length > 0 ? items.length - 1 : -1);
    }
  }, [items.length, focusedIndex]);

  const scrollToIndex = useCallback((index: number) => {
    itemRefs.current[index]?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, []);

  const handleArrowDown = useCallback(() => {
    if (!enabled || items.length === 0) return;

    setFocusedIndex((prev) => {
      const newIndex = prev < items.length - 1 ? prev + 1 : 0;
      scrollToIndex(newIndex);
      onSelect(newIndex);
      return newIndex;
    });
  }, [enabled, items.length, scrollToIndex, onSelect]);

  const handleArrowUp = useCallback(() => {
    if (!enabled || items.length === 0) return;

    setFocusedIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : items.length - 1;
      scrollToIndex(newIndex);
      onSelect(newIndex);
      return newIndex;
    });
  }, [enabled, items.length, scrollToIndex, onSelect]);

  const handleHome = useCallback(() => {
    if (!enabled || items.length === 0) return;

    setFocusedIndex(0);
    scrollToIndex(0);
    onSelect(0);
  }, [enabled, items.length, scrollToIndex, onSelect]);

  const handleEnd = useCallback(() => {
    if (!enabled || items.length === 0) return;

    const lastIndex = items.length - 1;
    setFocusedIndex(lastIndex);
    scrollToIndex(lastIndex);
    onSelect(lastIndex);
  }, [enabled, items.length, scrollToIndex, onSelect]);

  const handleEnter = useCallback(() => {
    if (!enabled || focusedIndex === -1) return;

    onActivate?.(focusedIndex);
  }, [enabled, focusedIndex, onActivate]);

  const setItemRef = useCallback((index: number, ref: HTMLElement | null) => {
    itemRefs.current[index] = ref;
  }, []);

  const resetFocus = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  return {
    focusedIndex,
    setFocusedIndex,
    handleArrowDown,
    handleArrowUp,
    handleHome,
    handleEnd,
    handleEnter,
    setItemRef,
    resetFocus,
  };
};
