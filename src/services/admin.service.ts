/**
 * Admin Service
 * Handles all admin-related operations with proper error handling and retry logic
 * 
 * @module services/admin.service
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService, handleSupabaseResult } from './base.service';
import type { RateLimitConfig as RateLimitConfigType, FailedLoginAttempt } from '@/types/security';

class AdminServiceImpl extends BaseService {
  constructor() {
    super('AdminService');
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalChats: number;
    totalKnowledge: number;
    failedLogins24h: number;
    blockedIPs: number;
  }> {
    return this.executeWithRetry('getDashboardStats', async () => {
      const [usersResult, chatsResult, knowledgeResult, failedLoginsResult, blockedIPsResult] = 
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('chats').select('id', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('failed_login_attempts')
            .select('id', { count: 'exact', head: true })
            .gte('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('blocked_ips').select('id', { count: 'exact', head: true }),
        ]);

      return {
        totalUsers: usersResult.count ?? 0,
        totalChats: chatsResult.count ?? 0,
        totalKnowledge: knowledgeResult.count ?? 0,
        failedLogins24h: failedLoginsResult.count ?? 0,
        blockedIPs: blockedIPsResult.count ?? 0,
      };
    });
  }

  /**
   * Get recent failed login attempts with pagination
   */
  async getFailedLoginAttempts(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: FailedLoginAttempt[]; count: number }> {
    const { limit = 50, offset = 0 } = options;

    return this.executeWithRetry('getFailedLoginAttempts', async () => {
      const { data, error, count } = await supabase
        .from('failed_login_attempts')
        .select('*', { count: 'exact' })
        .order('attempted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: (data ?? []) as FailedLoginAttempt[],
        count: count ?? 0,
      };
    });
  }

  /**
   * Get rate limit configuration
   */
  async getRateLimitConfig(configKey: string = 'failed_login'): Promise<RateLimitConfigType | null> {
    return this.executeWithRetry('getRateLimitConfig', async () => {
      const result = await supabase
        .from('rate_limit_config')
        .select('*')
        .eq('config_key', configKey)
        .maybeSingle();

      if (result.error) throw result.error;
      return result.data as RateLimitConfigType | null;
    });
  }

  /**
   * Update rate limit configuration
   */
  async updateRateLimitConfig(
    configKey: string,
    updates: Partial<RateLimitConfigType>
  ): Promise<RateLimitConfigType> {
    return this.executeWithRetry('updateRateLimitConfig', async () => {
      const userId = await this.getCurrentUserId();

      const result = await supabase
        .from('rate_limit_config')
        .update({
          ...updates,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', configKey)
        .select()
        .single();

      return handleSupabaseResult(result) as RateLimitConfigType;
    });
  }

  /**
   * Get blocked IPs
   */
  async getBlockedIPs(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Array<{
    id: string;
    ip_address: unknown;
    reason: string;
    blocked_until: string | null;
    permanent: boolean;
    created_at: string;
  }>> {
    const { limit = 50, offset = 0 } = options;

    return this.executeWithRetry('getBlockedIPs', async () => {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data ?? [];
    });
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ipId: string): Promise<void> {
    return this.executeWithRetry('unblockIP', async () => {
      const { error } = await supabase
        .from('blocked_ips')
        .delete()
        .eq('id', ipId);

      if (error) throw error;
    });
  }

  /**
   * Block an IP address
   */
  async blockIP(
    ipAddress: string,
    reason: string,
    options: { permanent?: boolean; durationMinutes?: number } = {}
  ): Promise<void> {
    return this.executeWithRetry('blockIP', async () => {
      const userId = await this.getCurrentUserId();
      const { permanent = false, durationMinutes = 60 } = options;

      const blockedUntil = permanent 
        ? null 
        : new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('blocked_ips')
        .insert({
          ip_address: ipAddress,
          reason,
          permanent,
          blocked_until: blockedUntil,
          blocked_by_user_id: userId,
        });

      if (error) throw error;
    });
  }

  /**
   * Get security events
   */
  async getSecurityEvents(options: {
    limit?: number;
    severity?: string;
  } = {}): Promise<Array<{
    id: string;
    event_type: string;
    severity: string;
    event_data: unknown;
    created_at: string;
  }>> {
    const { limit = 100, severity } = options;

    return this.executeWithRetry('getSecurityEvents', async () => {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    });
  }

  /**
   * Get user roles for a specific user
   */
  async getUserRole(userId: string): Promise<string | null> {
    return this.executeWithRetry('getUserRole', async () => {
      const result = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (result.error) throw result.error;
      return result.data?.role ?? null;
    });
  }

  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      const role = await this.getUserRole(userId);
      return role === 'admin';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const AdminService = new AdminServiceImpl();

// Also export the class for testing
export { AdminServiceImpl };
