import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReorderablePreset {
  id: string;
  sort_order?: number;
  [key: string]: any;
}

export const usePresetReorder = <T extends ReorderablePreset>(initialPresets: T[]) => {
  const [orderedPresets, setOrderedPresets] = useState<T[]>(
    [...initialPresets].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  );

  const reorder = useCallback(async (fromIndex: number, toIndex: number) => {
    const reordered = [...orderedPresets];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Update local state immediately
    setOrderedPresets(reordered);

    try {
      // Batch update sort_order for all presets
      const updates = reordered.map((preset, index) => 
        supabase
          .from('filter_presets')
          .update({ sort_order: index })
          .eq('id', preset.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering presets:', error);
      toast({
        title: 'Reorder failed',
        description: 'Could not save new preset order',
        variant: 'destructive',
      });
      // Revert on error
      setOrderedPresets(initialPresets);
    }
  }, [orderedPresets, initialPresets]);

  return {
    orderedPresets,
    reorder,
    setOrderedPresets,
  };
};
