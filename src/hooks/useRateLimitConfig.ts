import { useState } from 'react';
import type { RateLimitConfig } from '@/types/security';

/**
 * Hook to manage rate limit configuration settings
 * Note: rate_limit_config table not yet created — uses defaults
 */
export function useRateLimitConfig(configKey: string = 'failed_login') {
  const [localChanges, setLocalChanges] = useState<Partial<RateLimitConfig>>({});

  const defaultConfig: RateLimitConfig = {
    id: 'default',
    config_key: configKey,
    max_attempts: 5,
    time_window_minutes: 15,
    block_duration_minutes: 30,
    enabled: true,
    updated_at: new Date().toISOString(),
    updated_by: null,
  };

  const getValue = <K extends keyof RateLimitConfig>(key: K): RateLimitConfig[K] | undefined => {
    return (localChanges[key] ?? defaultConfig[key]) as RateLimitConfig[K] | undefined;
  };

  const setValue = <K extends keyof RateLimitConfig>(key: K, value: RateLimitConfig[K]) => {
    setLocalChanges(prev => ({ ...prev, [key]: value }));
  };

  return {
    config: defaultConfig,
    isLoading: false,
    error: null as Error | null,
    hasChanges: Object.keys(localChanges).length > 0,
    isSaving: false,
    getValue,
    setValue,
    saveChanges: () => { console.warn('rate_limit_config table not yet created'); },
    resetChanges: () => { setLocalChanges({}); },
  };
}
