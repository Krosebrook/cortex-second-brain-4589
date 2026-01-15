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
import { useNotifications, Notification } from '../useNotifications';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  })),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'user-123',
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info',
    category: 'general',
    is_read: false,
    read_at: null,
    action_url: '/test',
    metadata: {},
    created_at: new Date().toISOString(),
    expires_at: null,
  },
  {
    id: 'notif-2',
    user_id: 'user-123',
    title: 'Read Notification',
    message: 'This notification has been read',
    type: 'success',
    category: 'chat',
    is_read: true,
    read_at: new Date().toISOString(),
    action_url: null,
    metadata: { key: 'value' },
    created_at: new Date(Date.now() - 60000).toISOString(),
    expires_at: null,
  },
  {
    id: 'notif-3',
    user_id: 'user-123',
    title: 'Security Alert',
    message: 'Security event occurred',
    type: 'security',
    category: 'security',
    is_read: false,
    read_at: null,
    action_url: '/security',
    metadata: {},
    created_at: new Date(Date.now() - 3600000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  },
];

describe('useNotifications', () => {
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

    // Setup default mock for channel subscriptions
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    } as any);
    vi.mocked(supabase.removeChannel).mockResolvedValue({ status: 'ok' } as any);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('fetching notifications', () => {
    it('should fetch notifications successfully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.notifications[0].title).toBe('Test Notification');
    });

    it('should calculate unread count correctly', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 2 unread notifications (notif-1 and notif-3)
      expect(result.current.unreadCount).toBe(2);
    });

    it('should handle empty notifications', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle fetch error gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
      } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should respect custom limit option', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: mockNotifications.slice(0, 2), error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: mockFn,
      } as any);

      const { result } = renderHook(() => useNotifications({ limit: 2 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFn).toHaveBeenCalledWith(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.markAsRead('notif-1');
      });

      await waitFor(() => {
        expect(result.current.isMarkingRead).toBe(false);
      });

      expect(supabase.rpc).toHaveBeenCalledWith('mark_notification_read', {
        notification_id: 'notif-1',
      });
    });

    it('should handle markAsRead error', async () => {
      const { toast } = await import('sonner');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('RPC failed'),
      } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.markAsRead('notif-1');
      });

      await waitFor(() => {
        expect(result.current.isMarkingRead).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to update notification');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const { toast } = await import('sonner');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.markAllAsRead();
      });

      await waitFor(() => {
        expect(result.current.isMarkingAllRead).toBe(false);
      });

      expect(supabase.rpc).toHaveBeenCalledWith('mark_all_notifications_read');
      expect(toast.success).toHaveBeenCalledWith('All notifications marked as read');
    });

    it('should handle markAllAsRead error', async () => {
      const { toast } = await import('sonner');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('RPC failed'),
      } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.markAllAsRead();
      });

      await waitFor(() => {
        expect(result.current.isMarkingAllRead).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to update notifications');
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
            delete: vi.fn().mockReturnThis(),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteNotification('notif-1');
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });
    });

    it('should handle delete error', async () => {
      const { toast } = await import('sonner');

      const deleteEqMock = vi.fn().mockResolvedValue({ error: new Error('Delete failed') });
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'notifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: deleteEqMock,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteNotification('notif-1');
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to delete notification');
    });
  });

  describe('realtime subscription', () => {
    it('should setup realtime subscription on mount', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      renderHook(() => useNotifications(), { wrapper });

      expect(supabase.channel).toHaveBeenCalledWith('notifications-changes');
    });

    it('should cleanup subscription on unmount', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      const { unmount } = renderHook(() => useNotifications(), { wrapper });

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('should disable toast on new notifications when showToastOnNew is false', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      const { result } = renderHook(
        () => useNotifications({ showToastOnNew: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(3);
    });
  });

  describe('hasNewNotifications', () => {
    it('should track new notifications correctly', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockNotifications, error: null }),
      } as any);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially should be false as count matches previous
      expect(result.current.hasNewNotifications).toBe(false);
    });
  });
});
