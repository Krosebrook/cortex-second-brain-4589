import { useState, useCallback } from 'react';

export const useRangeSelection = <T extends string = string>() => {
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const handleClick = useCallback(
    (
      index: number,
      id: T,
      isShiftKey: boolean,
      items: T[],
      isSelected: (id: T) => boolean,
      toggleSelect: (id: T) => void,
      selectAll: (ids: T[]) => void
    ) => {
      if (isShiftKey && lastClickedIndex !== null) {
        // Range selection
        const start = Math.min(lastClickedIndex, index);
        const end = Math.max(lastClickedIndex, index);
        const rangeIds = items.slice(start, end + 1);
        
        // If the clicked item is selected, select the range, otherwise deselect
        const shouldSelect = !isSelected(id);
        
        if (shouldSelect) {
          selectAll(rangeIds);
        } else {
          // Deselect range
          rangeIds.forEach(rangeId => {
            if (isSelected(rangeId)) {
              toggleSelect(rangeId);
            }
          });
        }
      } else {
        // Normal click
        toggleSelect(id);
        setLastClickedIndex(index);
      }
    },
    [lastClickedIndex]
  );

  const resetLastClicked = useCallback(() => {
    setLastClickedIndex(null);
  }, []);

  return {
    handleClick,
    resetLastClicked,
    lastClickedIndex,
  };
};
