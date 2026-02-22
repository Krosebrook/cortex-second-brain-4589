/**
 * Admin Service
 * Handles admin-related operations
 * Note: Several tables (failed_login_attempts, blocked_ips, rate_limit_config, security_events) 
 * are not yet created — methods return empty/default data
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';
import type { RateLimitConfig as RateLimitConfigType, FailedLoginAttempt } from '@/types/security';

class AdminServiceImpl extends BaseService {
  constructor() {
    super('AdminService');
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalChats: number;
    totalKnowledge: number;
    failedLogins24h: number;
    blockedIPs: number;
  }> {
    return this.executeWithRetry('getDashboardStats', async () => {
      const [usersResult, chatsResult, knowledgeResult] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('chats').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      ]);

      return {
        totalUsers: usersResult.count ?? 0,
        totalChats: chatsResult.count ?? 0,
        totalKnowledge: knowledgeResult.count ?? 0,
        failedLogins24h: 0,
        blockedIPs: 0,
      };
    });
  }

  async getFailedLoginAttempts(options: { limit?: number; offset?: number } = {}): Promise<{ data: FailedLoginAttempt[]; count: number }> {
    return { data: [], count: 0 };
  }

  async getRateLimitConfig(configKey: string = 'failed_login'): Promise<RateLimitConfigType | null> {
    return null;
  }

  async updateRateLimitConfig(configKey: string, updates: Partial<RateLimitConfigType>): Promise<RateLimitConfigType> {
    throw new Error('rate_limit_config table not yet created');
  }

  async getBlockedIPs(options: { limit?: number; offset?: number } = {}): Promise<Array<{
    id: string; ip_address: unknown; reason: string; blocked_until: string | null; permanent: boolean; created_at: string;
  }>> {
    return [];
  }

  async unblockIP(ipId: string): Promise<void> {
    console.warn('blocked_ips table not yet created');
  }

  async blockIP(ipAddress: string, reason: string, options: { permanent?: boolean; durationMinutes?: number } = {}): Promise<void> {
    console.warn('blocked_ips table not yet created');
  }

  async getSecurityEvents(options: { limit?: number; severity?: string } = {}): Promise<Array<{
    id: string; event_type: string; severity: string; event_data: unknown; created_at: string;
  }>> {
    return [];
  }

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

export const AdminService = new AdminServiceImpl();
export { AdminServiceImpl };
