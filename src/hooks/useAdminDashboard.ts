import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '@/lib/time-utils';
import type { 
  SecurityAlert, 
  BlockedIP, 
  ThreatResponse, 
  UserActivity, 
  SecurityStats 
} from '@/types/security';

export function useAdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  // Check if user is admin
  const isAdminQuery = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .rpc('has_role', { _role: 'admin', _user_id: user.id });
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return data as boolean;
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const isAdmin = isAdminQuery.data ?? false;

  // These admin security tables don't exist yet — return empty data
  const emptyStats: SecurityStats = {
    totalAlerts: 0,
    criticalAlerts: 0,
    blockedIPs: 0,
    activeThreats: 0,
    recentActivities: 0,
  };

  return {
    isAdmin,
    isCheckingAdmin: isAdminQuery.isLoading,
    stats: emptyStats,
    alerts: [] as SecurityAlert[],
    blockedIPs: [] as BlockedIP[],
    threatResponses: [] as ThreatResponse[],
    userActivity: [] as UserActivity[],
    isLoading: isAdminQuery.isLoading,
    error: null as Error | null,
    blockIP: (_args: { ipAddress: string; reason: string; permanent?: boolean; blockedUntil?: string }) => {
      console.warn('blockIP: security_alerts table not yet created');
    },
    unblockIP: (_id: string) => {
      console.warn('unblockIP: blocked_ips table not yet created');
    },
    isBlocking: false,
    isUnblocking: false,
    formatTimeAgo,
    refetch: () => { isAdminQuery.refetch(); },
  };
}

// Re-export types for convenience
export type { SecurityAlert, BlockedIP, ThreatResponse, UserActivity, SecurityStats };
