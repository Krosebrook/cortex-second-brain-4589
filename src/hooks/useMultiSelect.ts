import { useState, useCallback } from 'react';

export const useMultiSelect = <T extends string = string>() => {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const toggleSelect = useCallback((id: T) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      // Exit multi-select mode if no items selected
      if (next.size === 0) {
        setIsMultiSelectMode(false);
      } else if (!isMultiSelectMode) {
        setIsMultiSelectMode(true);
      }
      
      return next;
    });
  }, [isMultiSelectMode]);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
    setIsMultiSelectMode(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsMultiSelectMode(false);
  }, []);

  const isSelected = useCallback((id: T) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    isMultiSelectMode,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
  };
};
