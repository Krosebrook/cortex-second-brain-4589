import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RateLimitConfig } from '@/types/security';

/**
 * Hook to manage rate limit configuration settings
 */
export function useRateLimitConfig(configKey: string = 'failed_login') {
  const queryClient = useQueryClient();
  const [localChanges, setLocalChanges] = useState<Partial<RateLimitConfig>>({});

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['rate-limit-config', configKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rate_limit_config')
        .select('*')
        .eq('config_key', configKey)
        .single();

      if (error) throw error;
      return data as RateLimitConfig;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<RateLimitConfig>) => {
      if (!config?.id) throw new Error('No config found');

      const { error } = await supabase
        .from('rate_limit_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limit-config', configKey] });
      setLocalChanges({});
      toast.success('Rate limit settings updated');
    },
    onError: (error) => {
      console.error('Failed to update rate limit config:', error);
      toast.error('Failed to update settings');
    },
  });

  const getValue = <K extends keyof RateLimitConfig>(key: K): RateLimitConfig[K] | undefined => {
    return (localChanges[key] ?? config?.[key]) as RateLimitConfig[K] | undefined;
  };

  const setValue = <K extends keyof RateLimitConfig>(key: K, value: RateLimitConfig[K]) => {
    setLocalChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveChanges = () => {
    if (Object.keys(localChanges).length > 0) {
      updateMutation.mutate(localChanges);
    }
  };

  const resetChanges = () => {
    setLocalChanges({});
  };

  return {
    config,
    isLoading,
    error,
    hasChanges: Object.keys(localChanges).length > 0,
    isSaving: updateMutation.isPending,
    getValue,
    setValue,
    saveChanges,
    resetChanges,
  };
}
