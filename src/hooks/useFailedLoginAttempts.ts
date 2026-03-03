import type { FailedLoginAttempt } from '@/types/security';

interface UseFailedLoginAttemptsOptions {
  limit?: number;
  refetchInterval?: number;
}

/**
 * Hook to fetch and display failed login attempts with geolocation
 * Note: failed_login_attempts table not yet created — returns empty data
 */
export function useFailedLoginAttempts(options: UseFailedLoginAttemptsOptions = {}) {

  return {
    attempts: [] as FailedLoginAttempt[],
    isLoading: false,
    error: null as Error | null,
    refetch: () => {},
  };
}
