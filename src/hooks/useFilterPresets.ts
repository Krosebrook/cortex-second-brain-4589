import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FilterPreset, FilterPresetInput, FilterOptions } from '@/types/filter-preset';
import { toast } from '@/hooks/use-toast';

export function useFilterPresets(scope: 'knowledge' | 'chats', userId?: string) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const fetchPresets = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .eq('user_id', userId)
        .eq('scope', scope)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPresets((data || []).map(preset => ({
        ...preset,
        scope: preset.scope as 'knowledge' | 'chats',
        filters: preset.filters as FilterOptions,
      })));
      
      // Set default preset as active if exists
      const defaultPreset = data?.find(p => p.is_default);
      if (defaultPreset) {
        setActivePresetId(defaultPreset.id);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, scope]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const createPreset = useCallback(async (input: FilterPresetInput) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('filter_presets')
        .insert({
          user_id: userId,
          ...input,
          filters: input.filters as any,
        })
        .select()
        .single();

      if (error) throw error;

      setPresets(prev => [{
        ...data,
        scope: data.scope as 'knowledge' | 'chats',
        filters: data.filters as FilterOptions,
      }, ...prev]);
      
      toast({
        title: 'Preset saved',
        description: `"${input.name}" saved successfully`,
      });

      return data;
    } catch (error) {
      toast({
        title: 'Failed to save preset',
        description: 'Could not save filter preset',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId]);

  const updatePreset = useCallback(async (id: string, updates: Partial<FilterPresetInput>) => {
    try {
      const { data, error } = await supabase
        .from('filter_presets')
        .update({
          ...updates,
          filters: updates.filters as any,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPresets(prev => prev.map(p => p.id === id ? {
        ...data,
        scope: data.scope as 'knowledge' | 'chats',
        filters: data.filters as FilterOptions,
      } : p));
      
      toast({
        title: 'Preset updated',
        description: 'Filter preset updated successfully',
      });

      return data;
    } catch (error) {
      toast({
        title: 'Failed to update preset',
        description: 'Could not update filter preset',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('filter_presets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPresets(prev => prev.filter(p => p.id !== id));
      
      if (activePresetId === id) {
        setActivePresetId(null);
      }
      
      toast({
        title: 'Preset deleted',
        description: 'Filter preset deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete preset',
        description: 'Could not delete filter preset',
        variant: 'destructive',
      });
    }
  }, [activePresetId]);

  const setDefaultPreset = useCallback(async (id: string) => {
    try {
      // First, unset all defaults for this scope
      await supabase
        .from('filter_presets')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('scope', scope);

      // Then set the new default
      const { data, error } = await supabase
        .from('filter_presets')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPresets(prev => prev.map(p => ({
        ...p,
        is_default: p.id === id,
      })));
      
      toast({
        title: 'Default preset set',
        description: 'This preset will be applied by default',
      });

      return data;
    } catch (error) {
      toast({
        title: 'Failed to set default',
        description: 'Could not set default preset',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, scope]);

  return {
    presets,
    loading,
    activePresetId,
    setActivePresetId,
    createPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
    refetch: fetchPresets,
  };
}
