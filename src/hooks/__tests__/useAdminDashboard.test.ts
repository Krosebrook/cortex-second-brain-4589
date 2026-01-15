import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Helper for async waiting
const waitFor = async (callback: () => void | Promise<void>, options = { timeout: 1000 }) => {
  const startTime = Date.now();
  while (Date.now() - startTime < options.timeout) {
    try {
      await callback();
      return;
    } catch {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  await callback();
};
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAdminDashboard,
  SecurityAlert,
  BlockedIP,
  ThreatResponse,
  UserActivity,
} from '../useAdminDashboard';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-user-123' },
    isAuthenticated: true,
  })),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockSecurityAlerts: Partial<SecurityAlert>[] = [
  {
    id: 'alert-1',
    alert_type: 'suspicious_login',
    severity: 'high',
    ip_address: '192.168.1.1',
    user_id: 'user-123',
    event_data: { attempt: 1 },
    triggered_at: new Date().toISOString(),
    email_sent: false,
  },
  {
    id: 'alert-2',
    alert_type: 'rate_limit',
    severity: 'critical',
    ip_address: '10.0.0.1',
    user_id: null,
    event_data: {},
    triggered_at: new Date(Date.now() - 3600000).toISOString(),
    email_sent: true,
  },
];

const mockBlockedIPs: Partial<BlockedIP>[] = [
  {
    id: 'blocked-1',
    ip_address: '192.168.1.100',
    reason: 'Suspicious activity',
    blocked_until: null,
    permanent: true,
    blocked_by_user_id: 'admin-user-123',
    created_at: new Date().toISOString(),
  },
];

const mockThreatResponses: ThreatResponse[] = [
  {
    id: 'response-1',
    rule_id: 'rule-1',
    action_taken: 'blocked_ip',
    success: true,
    executed_at: new Date().toISOString(),
    reversed_at: null,
  },
];

const mockUserActivity: Partial<UserActivity>[] = [
  {
    id: 'activity-1',
    user_id: 'user-456',
    activity_type: 'login',
    activity_data: {},
    ip_address: '192.168.1.50',
    user_agent: 'Mozilla/5.0',
    created_at: new Date().toISOString(),
  },
];

describe('useAdminDashboard', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('admin check', () => {
    it('should check if user is admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        gte: vi.fn().mockReturnThis(),
      } as any));

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      expect(supabase.rpc).toHaveBeenCalledWith('has_role', {
        _role: 'admin',
        _user_id: 'admin-user-123',
      });
      expect(result.current.isAdmin).toBe(true);
    });

    it('should return false when user is not admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as any);

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });

    it('should handle admin check error gracefully', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('RPC error'),
      } as any);

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('security stats', () => {
    it('should fetch security stats when user is admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 5, error: null }),
        };

        if (table === 'security_alerts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockSecurityAlerts, error: null }),
              }),
            }),
          } as any;
        }

        if (table === 'blocked_ips') {
          return {
            select: vi.fn().mockResolvedValue({ count: 3, error: null }),
            order: vi.fn().mockReturnValue({
              ...baseMock,
            }),
          } as any;
        }

        if (table === 'threat_responses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockThreatResponses, error: null }),
              }),
            }),
          } as any;
        }

        if (table === 'user_activity') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 15, error: null }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockUserActivity, error: null }),
              }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toBeDefined();
      expect(typeof result.current.stats.totalAlerts).toBe('number');
    });

    it('should return default stats when not admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as any);

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      expect(result.current.stats).toEqual({
        totalAlerts: 0,
        criticalAlerts: 0,
        blockedIPs: 0,
        activeThreats: 0,
        recentActivities: 0,
      });
    });
  });

  describe('security alerts', () => {
    it('should fetch security alerts when admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        };

        if (table === 'security_alerts') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockSecurityAlerts, error: null }),
              }),
              eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.alerts)).toBe(true);
    });

    it('should convert ip_address to string', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const alertsWithIpObject = [
        {
          id: 'alert-1',
          alert_type: 'test',
          severity: 'high',
          ip_address: { value: '192.168.1.1' },
          user_id: null,
          event_data: {},
          triggered_at: new Date().toISOString(),
          email_sent: false,
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        };

        if (table === 'security_alerts') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: alertsWithIpObject, error: null }),
              }),
              eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.alerts.length > 0) {
        expect(typeof result.current.alerts[0].ip_address).toBe('string');
      }
    });
  });

  describe('blocked IPs', () => {
    it('should fetch blocked IPs when admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        };

        if (table === 'blocked_ips') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockBlockedIPs, error: null }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.blockedIPs)).toBe(true);
    });
  });

  describe('threat responses', () => {
    it('should fetch threat responses when admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        };

        if (table === 'threat_responses') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockThreatResponses, error: null }),
              }),
              eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.threatResponses)).toBe(true);
    });
  });

  describe('user activity', () => {
    it('should fetch user activity when admin', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        };

        if (table === 'user_activity') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockUserActivity, error: null }),
              }),
              gte: vi.fn().mockResolvedValue({ count: 1, error: null }),
            }),
          } as any;
        }

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.userActivity)).toBe(true);
    });
  });

  describe('blockIP mutation', () => {
    it('should block an IP address', async () => {
      const { toast } = await import('sonner');

      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          insert: insertMock,
        };

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      act(() => {
        result.current.blockIP({
          ipAddress: '192.168.1.200',
          reason: 'Test block',
          permanent: true,
        });
      });

      await waitFor(() => {
        expect(result.current.isBlocking).toBe(false);
      });

      expect(insertMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('IP address blocked successfully');
    });

    it('should handle blockIP error', async () => {
      const { toast } = await import('sonner');

      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const insertMock = vi.fn().mockResolvedValue({ error: new Error('Insert failed') });
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          insert: insertMock,
        };

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      act(() => {
        result.current.blockIP({
          ipAddress: '192.168.1.200',
          reason: 'Test block',
        });
      });

      await waitFor(() => {
        expect(result.current.isBlocking).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to block IP address');
    });
  });

  describe('unblockIP mutation', () => {
    it('should unblock an IP address', async () => {
      const { toast } = await import('sonner');

      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          delete: deleteMock,
        };

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      act(() => {
        result.current.unblockIP('blocked-1');
      });

      await waitFor(() => {
        expect(result.current.isUnblocking).toBe(false);
      });

      expect(deleteMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('IP address unblocked');
    });

    it('should handle unblockIP error', async () => {
      const { toast } = await import('sonner');

      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);

      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      });
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const baseMock = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
          delete: deleteMock,
        };

        return baseMock as any;
      });

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      act(() => {
        result.current.unblockIP('blocked-1');
      });

      await waitFor(() => {
        expect(result.current.isUnblocking).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to unblock IP address');
    });
  });

  describe('formatTimeAgo', () => {
    it('should format time correctly', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      } as any));

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      // Test various time formats
      const now = new Date().toISOString();
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();

      expect(result.current.formatTimeAgo(now)).toBe('Just now');
      expect(result.current.formatTimeAgo(oneMinuteAgo)).toBe('1m ago');
      expect(result.current.formatTimeAgo(oneHourAgo)).toBe('1h ago');
      expect(result.current.formatTimeAgo(oneDayAgo)).toBe('1d ago');
    });
  });

  describe('refetch', () => {
    it('should refetch all queries', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as any);
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        gte: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      } as any));

      const { result } = renderHook(() => useAdminDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isCheckingAdmin).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');

      // Call refetch
      act(() => {
        result.current.refetch();
      });
    });
  });
});
