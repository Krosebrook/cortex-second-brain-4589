import { useState, useCallback } from 'react';

export interface ReorderablePreset {
  id: string;
  sort_order?: number;
  [key: string]: any;
}

/**
 * Hook to reorder presets locally
 * Note: filter_presets table not yet created — reorder is local only
 */
export const usePresetReorder = <T extends ReorderablePreset>(initialPresets: T[]) => {
  const [orderedPresets, setOrderedPresets] = useState<T[]>(
    [...initialPresets].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  );

  const reorder = useCallback(async (fromIndex: number, toIndex: number) => {
    const reordered = [...orderedPresets];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setOrderedPresets(reordered);
  }, [orderedPresets]);

  return {
    orderedPresets,
    reorder,
    setOrderedPresets,
  };
};
