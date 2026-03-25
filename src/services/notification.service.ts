/**
 * Notification Service
 * Handles all notification-related operations with proper error handling and retry logic
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';
import type { Notification } from '@/hooks/useNotifications';

export interface NotificationFilters {
  isRead?: boolean;
  type?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedNotifications {
  data: Notification[];
  count: number;
  hasMore: boolean;
}

class NotificationServiceImpl extends BaseService {
  constructor() {
    super('NotificationService');
  }

  async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<PaginatedNotifications> {
    const { isRead, type, category, limit = 50, offset = 0 } = filters;

    return this.executeWithRetry('getNotifications', async () => {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (typeof isRead === 'boolean') {
        query = query.eq('is_read', isRead);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data ?? []) as Notification[],
        count: count ?? 0,
        hasMore: (count ?? 0) > offset + limit,
      };
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.executeWithRetry('getUnreadCount', async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    return this.executeWithRetry('markAsRead', async () => {
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId,
      });
      if (error) throw error;
    });
  }

  async markAllAsRead(): Promise<void> {
    return this.executeWithRetry('markAllAsRead', async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    return this.executeWithRetry('deleteNotification', async () => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);
      if (error) throw error;
    });
  }

  async deleteNotifications(notificationIds: string[], userId: string): Promise<void> {
    return this.executeWithRetry('deleteNotifications', async () => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', userId);
      if (error) throw error;
    });
  }

  async createNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    category?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.executeWithRetry('createNotification', async () => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          category: notification.category || 'general',
          action_url: notification.actionUrl || null,
          metadata: notification.metadata || {},
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    });
  }

  subscribeToNotifications(
    userId: string,
    callbacks: {
      onInsert?: (notification: Notification) => void;
      onUpdate?: (notification: Notification) => void;
      onDelete?: (notificationId: string) => void;
    }
  ): () => void {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => { callbacks.onInsert?.(payload.new as Notification); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => { callbacks.onUpdate?.(payload.new as Notification); })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => { const old = payload.old as { id?: string }; if (old?.id) callbacks.onDelete?.(old.id); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }
}

export const NotificationService = new NotificationServiceImpl();
export { NotificationServiceImpl };
