import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatTimeAgo, getStartOfToday } from '@/lib/time-utils';
import type { 
  SecurityAlert, 
  BlockedIP, 
  ThreatResponse, 
  UserActivity, 
  SecurityStats 
} from '@/types/security';

const STALE_TIME = 30000; // 30 seconds

export function useAdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

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

  // Fetch security stats
  const statsQuery = useQuery({
    queryKey: ['admin-security-stats'],
    queryFn: async (): Promise<SecurityStats> => {
      const todayStart = getStartOfToday();

      const [alertsResult, criticalResult, blockedResult, threatsResult, activitiesResult] = await Promise.all([
        supabase.from('security_alerts').select('id', { count: 'exact', head: true }),
        supabase.from('security_alerts').select('id', { count: 'exact', head: true }).eq('severity', 'critical'),
        supabase.from('blocked_ips').select('id', { count: 'exact', head: true }),
        supabase.from('threat_responses').select('id', { count: 'exact', head: true }).eq('success', true),
        supabase.from('user_activity').select('id', { count: 'exact', head: true }).gte('created_at', todayStart)
      ]);

      return {
        totalAlerts: alertsResult.count || 0,
        criticalAlerts: criticalResult.count || 0,
        blockedIPs: blockedResult.count || 0,
        activeThreats: threatsResult.count || 0,
        recentActivities: activitiesResult.count || 0
      };
    },
    enabled: isAdmin,
    staleTime: STALE_TIME,
  });

  // Fetch security alerts
  const alertsQuery = useQuery({
    queryKey: ['admin-security-alerts'],
    queryFn: async (): Promise<SecurityAlert[]> => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map(alert => ({
        ...alert,
        ip_address: String(alert.ip_address),
        event_data: alert.event_data as Record<string, unknown>
      })) as SecurityAlert[];
    },
    enabled: isAdmin,
    staleTime: STALE_TIME,
  });

  // Fetch blocked IPs
  const blockedIPsQuery = useQuery({
    queryKey: ['admin-blocked-ips'],
    queryFn: async (): Promise<BlockedIP[]> => {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(ip => ({
        ...ip,
        ip_address: String(ip.ip_address)
      }));
    },
    enabled: isAdmin,
    staleTime: STALE_TIME,
  });

  // Fetch threat responses
  const threatResponsesQuery = useQuery({
    queryKey: ['admin-threat-responses'],
    queryFn: async (): Promise<ThreatResponse[]> => {
      const { data, error } = await supabase
        .from('threat_responses')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
    staleTime: STALE_TIME,
  });

  // Fetch user activity
  const userActivityQuery = useQuery({
    queryKey: ['admin-user-activity'],
    queryFn: async (): Promise<UserActivity[]> => {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map(activity => ({
        ...activity,
        ip_address: String(activity.ip_address),
        activity_data: activity.activity_data as Record<string, unknown>
      }));
    },
    enabled: isAdmin,
    staleTime: STALE_TIME,
  });

  // Block IP mutation
  const blockIPMutation = useMutation({
    mutationFn: async ({ ipAddress, reason, permanent = false, blockedUntil }: {
      ipAddress: string;
      reason: string;
      permanent?: boolean;
      blockedUntil?: string;
    }) => {
      const { error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: ipAddress,
          reason,
          permanent,
          blocked_until: blockedUntil || null,
          blocked_by_user_id: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['admin-security-stats'] });
      toast.success('IP address blocked successfully');
    },
    onError: (error) => {
      console.error('Failed to block IP:', error);
      toast.error('Failed to block IP address');
    }
  });

  // Unblock IP mutation
  const unblockIPMutation = useMutation({
    mutationFn: async (ipId: string) => {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', ipId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blocked-ips'] });
      queryClient.invalidateQueries({ queryKey: ['admin-security-stats'] });
      toast.success('IP address unblocked');
    },
    onError: (error) => {
      console.error('Failed to unblock IP:', error);
      toast.error('Failed to unblock IP address');
    }
  });

  const refetchAll = () => {
    statsQuery.refetch();
    alertsQuery.refetch();
    blockedIPsQuery.refetch();
    threatResponsesQuery.refetch();
    userActivityQuery.refetch();
  };

  return {
    isAdmin,
    isCheckingAdmin: isAdminQuery.isLoading,
    stats: statsQuery.data || {
      totalAlerts: 0,
      criticalAlerts: 0,
      blockedIPs: 0,
      activeThreats: 0,
      recentActivities: 0
    },
    alerts: alertsQuery.data || [],
    blockedIPs: blockedIPsQuery.data || [],
    threatResponses: threatResponsesQuery.data || [],
    userActivity: userActivityQuery.data || [],
    isLoading: statsQuery.isLoading || alertsQuery.isLoading,
    error: statsQuery.error || alertsQuery.error,
    blockIP: blockIPMutation.mutate,
    unblockIP: unblockIPMutation.mutate,
    isBlocking: blockIPMutation.isPending,
    isUnblocking: unblockIPMutation.isPending,
    formatTimeAgo,
    refetch: refetchAll
  };
}

// Re-export types for convenience
export type { SecurityAlert, BlockedIP, ThreatResponse, UserActivity, SecurityStats };
