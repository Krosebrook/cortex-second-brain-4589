import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FailedLoginAttempt } from '@/types/security';

interface UseFailedLoginAttemptsOptions {
  limit?: number;
  refetchInterval?: number;
}

/**
 * Hook to fetch and display failed login attempts with geolocation
 */
export function useFailedLoginAttempts(options: UseFailedLoginAttemptsOptions = {}) {
  const { limit = 50, refetchInterval = 30000 } = options;

  const { data: attempts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['failed-login-attempts', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(attempt => ({
        ...attempt,
        ip_address: String(attempt.ip_address),
      })) as FailedLoginAttempt[];
    },
    refetchInterval,
  });

  return {
    attempts,
    isLoading,
    error,
    refetch,
  };
}
