import { useState, useCallback } from 'react';
import { FilterPreset, FilterPresetInput } from '@/types/filter-preset';

/**
 * Hook to manage filter presets
 * Note: filter_presets table not yet created — uses local state only
 */
export function useFilterPresets(scope: 'knowledge' | 'chats', userId?: string) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const createPreset = useCallback(async (input: FilterPresetInput) => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: input.name,
      scope: input.scope,
      filters: input.filters,
      is_default: input.is_default ?? false,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: userId || '',
    };
    setPresets(prev => [newPreset, ...prev]);
    return newPreset;
  }, [userId]);

  const updatePreset = useCallback(async (id: string, updates: Partial<FilterPresetInput>) => {
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...updates } as FilterPreset : p));
    return null;
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
  }, [activePresetId]);

  const setDefaultPreset = useCallback(async (id: string) => {
    setPresets(prev => prev.map(p => ({ ...p, is_default: p.id === id })));
    return null;
  }, []);

  const duplicatePreset = useCallback(async (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return null;
    const dup: FilterPreset = { ...preset, id: crypto.randomUUID(), name: `${preset.name} (Copy)`, is_default: false };
    setPresets(prev => [dup, ...prev]);
    return dup;
  }, [presets]);

  return {
    presets,
    loading,
    activePresetId,
    setActivePresetId,
    createPreset,
    updatePreset,
    deletePreset,
    duplicatePreset,
    setDefaultPreset,
    refetch: () => {},
  };
}
