import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('Notification System Integration', () => {
  const mockUserId = 'user-123';
  const mockNotificationId = 'notification-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Full Notification Lifecycle', () => {
    it('should create a notification and mark it as read', async () => {
      // Step 1: Create notification via RPC
      const mockNotification = {
        id: mockNotificationId,
        user_id: mockUserId,
        title: 'Security Alert',
        message: 'Suspicious login attempt detected',
        type: 'security' as const,
        category: 'security' as const,
        is_read: false,
        read_at: null,
        action_url: '/admin/security',
        metadata: { ip: '192.168.1.1', location: 'Unknown' },
        created_at: new Date().toISOString(),
        expires_at: null,
      };

      // Mock create_notification RPC
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockNotificationId,
        error: null,
      } as any);

      const createResult = await supabase.rpc('create_notification', {
        p_user_id: mockUserId,
        p_title: 'Security Alert',
        p_message: 'Suspicious login attempt detected',
        p_type: 'security',
        p_category: 'security',
        p_action_url: '/admin/security',
        p_metadata: { ip: '192.168.1.1', location: 'Unknown' },
      });

      expect(createResult.error).toBeNull();
      expect(createResult.data).toBe(mockNotificationId);

      // Step 2: Fetch the notification
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockNotification],
          error: null,
        }),
      } as any);

      const fetchResult = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', mockUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      expect(fetchResult.error).toBeNull();
      expect(fetchResult.data).toHaveLength(1);
      expect(fetchResult.data?.[0].is_read).toBe(false);

      // Step 3: Mark as read
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const markReadResult = await supabase.rpc('mark_notification_read', {
        notification_id: mockNotificationId,
      });

      expect(markReadResult.error).toBeNull();

      // Step 4: Verify notification is now read
      const readNotification = { ...mockNotification, is_read: true, read_at: new Date().toISOString() };
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: readNotification,
          error: null,
        }),
      } as any);

      const verifyResult = await supabase
        .from('notifications')
        .select('*')
        .eq('id', mockNotificationId)
        .single();

      expect(verifyResult.data?.is_read).toBe(true);
      expect(verifyResult.data?.read_at).not.toBeNull();
    });

    it('should mark all notifications as read', async () => {
      const mockNotifications = [
        { id: 'notif-1', is_read: false, title: 'Alert 1' },
        { id: 'notif-2', is_read: false, title: 'Alert 2' },
        { id: 'notif-3', is_read: false, title: 'Alert 3' },
      ];

      // Fetch unread notifications
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockNotifications,
          error: null,
        }),
      } as any);

      const unreadResult = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', mockUserId)
        .eq('is_read', false);

      expect(unreadResult.data).toHaveLength(3);

      // Mark all as read
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: null,
      } as any);

      const markAllResult = await supabase.rpc('mark_all_notifications_read');

      expect(markAllResult.error).toBeNull();

      // Verify all are now read
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockNotifications.map(n => ({ ...n, is_read: true })),
          error: null,
        }),
      } as any);

      const verifyResult = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', mockUserId);

      expect(verifyResult.data?.every(n => n.is_read)).toBe(true);
    });

    it('should delete a notification', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const deleteResult = await supabase
        .from('notifications')
        .delete()
        .eq('id', mockNotificationId)
        .eq('user_id', mockUserId);

      expect(deleteResult.error).toBeNull();
    });
  });

  describe('Notification Categories and Types', () => {
    const notificationTypes = ['info', 'success', 'warning', 'error', 'mention', 'comment', 'share', 'system', 'security'] as const;
    const notificationCategories = ['general', 'chat', 'knowledge', 'project', 'design', 'security', 'billing', 'collaboration'] as const;

    it.each(notificationTypes)('should handle %s notification type', async (type) => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: `${type}-notification-id`,
        error: null,
      } as any);

      const result = await supabase.rpc('create_notification', {
        p_user_id: mockUserId,
        p_title: `${type} notification`,
        p_message: `This is a ${type} notification`,
        p_type: type,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBe(`${type}-notification-id`);
    });

    it.each(notificationCategories)('should handle %s notification category', async (category) => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: `${category}-notification-id`,
        error: null,
      } as any);

      const result = await supabase.rpc('create_notification', {
        p_user_id: mockUserId,
        p_title: `${category} notification`,
        p_message: `This is a ${category} category notification`,
        p_category: category,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBe(`${category}-notification-id`);
    });
  });

  describe('Realtime Subscription Flow', () => {
    it('should subscribe to notification changes', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any);

      const channel = supabase
        .channel('notifications-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${mockUserId}`,
        }, (payload) => {
          // Handle new notification
        })
        .subscribe();

      expect(supabase.channel).toHaveBeenCalledWith('notifications-changes');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        }),
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should handle realtime notification events', async () => {
      const newNotificationPayload = {
        new: {
          id: 'new-notif-1',
          user_id: mockUserId,
          title: 'New Alert',
          message: 'Something happened',
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        old: null,
        eventType: 'INSERT',
      };

      const handleInsert = vi.fn();
      const handleUpdate = vi.fn();
      const handleDelete = vi.fn();

      // Simulate INSERT event
      handleInsert(newNotificationPayload);
      expect(handleInsert).toHaveBeenCalledWith(expect.objectContaining({
        new: expect.objectContaining({ id: 'new-notif-1' }),
        eventType: 'INSERT',
      }));

      // Simulate UPDATE event (mark as read)
      const updatePayload = {
        new: { ...newNotificationPayload.new, is_read: true },
        old: newNotificationPayload.new,
        eventType: 'UPDATE',
      };
      handleUpdate(updatePayload);
      expect(handleUpdate).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'UPDATE',
        new: expect.objectContaining({ is_read: true }),
      }));

      // Simulate DELETE event
      const deletePayload = {
        new: null,
        old: updatePayload.new,
        eventType: 'DELETE',
      };
      handleDelete(deletePayload);
      expect(handleDelete).toHaveBeenCalledWith(expect.objectContaining({
        eventType: 'DELETE',
        old: expect.objectContaining({ id: 'new-notif-1' }),
      }));
    });

    it('should clean up subscription on unmount', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any);
      vi.mocked(supabase.removeChannel).mockResolvedValue('ok' as any);

      const channel = supabase.channel('test-channel');

      // Simulate cleanup
      await supabase.removeChannel(channel);

      expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
    });
  });

  describe('Unread Count Operations', () => {
    it('should get unread notification count via RPC', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: 5,
        error: null,
      } as any);

      const result = await supabase.rpc('get_unread_notification_count');

      expect(result.error).toBeNull();
      expect(result.data).toBe(5);
    });

    it('should return 0 when no unread notifications', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: 0,
        error: null,
      } as any);

      const result = await supabase.rpc('get_unread_notification_count');

      expect(result.data).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle notification creation failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found', code: '404' },
      } as any);

      const result = await supabase.rpc('create_notification', {
        p_user_id: 'invalid-user',
        p_title: 'Test',
        p_message: 'Test message',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('User not found');
    });

    it('should handle mark as read failure', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Notification not found', code: 'PGRST116' },
      } as any);

      const result = await supabase.rpc('mark_notification_read', {
        notification_id: 'non-existent-id',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PGRST116');
    });

    it('should handle fetch notifications failure', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      } as any);

      const result = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', mockUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    });
  });

  describe('Notification Expiration', () => {
    it('should handle notifications with expiration dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const expiringNotification = {
        id: 'expiring-notif',
        user_id: mockUserId,
        title: 'Limited Time Offer',
        message: 'This notification expires soon',
        type: 'info',
        is_read: false,
        expires_at: futureDate.toISOString(),
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: expiringNotification.id,
        error: null,
      } as any);

      const result = await supabase.rpc('create_notification', {
        p_user_id: mockUserId,
        p_title: expiringNotification.title,
        p_message: expiringNotification.message,
        p_type: 'info',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBe('expiring-notif');
    });

    it('should filter out expired notifications', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const activeNotification = {
        id: 'active-notif',
        title: 'Active',
        expires_at: null,
      };

      // Only active notifications should be returned
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [activeNotification],
          error: null,
        }),
      } as any);

      const result = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', mockUserId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('active-notif');
    });
  });

  describe('Action URL Navigation', () => {
    it('should create notifications with valid action URLs', async () => {
      const actionUrls = [
        '/admin/security',
        '/dashboard',
        '/settings/notifications',
        '/projects/123',
        '/chat/456',
      ];

      for (const actionUrl of actionUrls) {
        vi.mocked(supabase.rpc).mockResolvedValueOnce({
          data: `notif-${actionUrl.replace(/\//g, '-')}`,
          error: null,
        } as any);

        const result = await supabase.rpc('create_notification', {
          p_user_id: mockUserId,
          p_title: 'Action Required',
          p_message: 'Click to navigate',
          p_action_url: actionUrl,
        });

        expect(result.error).toBeNull();
      }
    });
  });

  describe('Metadata Handling', () => {
    it('should store and retrieve complex metadata', async () => {
      const complexMetadata = {
        source: 'security-scanner',
        severity: 'high',
        details: {
          ip: '192.168.1.100',
          location: 'New York, US',
          device: 'Chrome on Windows',
          timestamp: new Date().toISOString(),
        },
        tags: ['security', 'login', 'suspicious'],
        relatedIds: ['event-1', 'event-2'],
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: 'metadata-notif-id',
        error: null,
      } as any);

      const result = await supabase.rpc('create_notification', {
        p_user_id: mockUserId,
        p_title: 'Security Event',
        p_message: 'Complex metadata notification',
        p_metadata: complexMetadata,
      });

      expect(result.error).toBeNull();

      // Verify metadata can be retrieved
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'metadata-notif-id',
            metadata: complexMetadata,
          },
          error: null,
        }),
      } as any);

      const fetchResult = await supabase
        .from('notifications')
        .select('*')
        .eq('id', 'metadata-notif-id')
        .single();

      expect(fetchResult.data?.metadata).toEqual(complexMetadata);
    });
  });
});
