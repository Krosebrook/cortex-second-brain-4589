/**
 * Audit Logging Service
 * Handles security audit logging for sensitive operations
 * Note: This service provides client-side logging utilities.
 * For production, audit logs should be stored in a proper audit_logs table.
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';

export enum AuditEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  SESSION_EXPIRED = 'auth.session.expired',
  PASSWORD_CHANGE = 'auth.password.change',
  PASSWORD_RESET = 'auth.password.reset',
  MFA_ENABLED = 'auth.mfa.enabled',
  MFA_DISABLED = 'auth.mfa.disabled',
  
  // Profile Events
  PROFILE_UPDATE = 'profile.update',
  PROFILE_VIEW = 'profile.view',
  PROFILE_DELETE = 'profile.delete',
  AVATAR_UPLOAD = 'profile.avatar.upload',
  PREFERENCES_UPDATE = 'profile.preferences.update',
  
  // Admin Events
  ADMIN_ACCESS = 'admin.access',
  ADMIN_ACTION = 'admin.action',
  IP_BLOCKED = 'admin.ip.blocked',
  IP_UNBLOCKED = 'admin.ip.unblocked',
  RATE_LIMIT_CONFIG_UPDATE = 'admin.rate_limit.config.update',
  USER_ROLE_CHANGE = 'admin.user.role.change',
  
  // Data Events
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_DELETE = 'data.delete',
  BACKUP_CREATED = 'data.backup.created',
  BACKUP_RESTORED = 'data.backup.restored',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
  PERMISSION_DENIED = 'security.permission.denied',
  API_KEY_CREATED = 'security.api_key.created',
  API_KEY_REVOKED = 'security.api_key.revoked',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditLogEntry {
  id?: string;
  user_id?: string | null;
  event_type: AuditEventType;
  severity: AuditSeverity;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface AuditLogFilter {
  user_id?: string;
  event_type?: AuditEventType | AuditEventType[];
  severity?: AuditSeverity | AuditSeverity[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// In-memory storage for audit logs (for demo/development purposes)
// In production, these would be stored in a dedicated audit_logs table
const inMemoryAuditLogs: AuditLogEntry[] = [];

class AuditLoggingServiceImpl extends BaseService {
  private browserInfo: {
    ipAddress?: string;
    userAgent?: string;
  } = {};

  constructor() {
    super('AuditLoggingService');
    this.initializeBrowserInfo();
  }

  /**
   * Initialize browser information for audit logs
   */
  private initializeBrowserInfo(): void {
    try {
      this.browserInfo.userAgent = navigator.userAgent;
      // Note: IP address should be obtained server-side in production
      this.browserInfo.ipAddress = 'client-detected';
    } catch (error) {
      console.warn('Could not initialize browser info for audit logging:', error);
    }
  }

  /**
   * Log an audit event
   */
  async log(
    eventType: AuditEventType,
    description: string,
    options: {
      severity?: AuditSeverity;
      metadata?: Record<string, unknown>;
      userId?: string | null;
    } = {}
  ): Promise<void> {
    return this.executeWithRetry('log', async () => {
      const { severity = AuditSeverity.INFO, metadata, userId } = options;

      // Get current user if not provided
      let targetUserId = userId;
      if (targetUserId === undefined) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id || null;
      }

      const entry: AuditLogEntry = {
        id: crypto.randomUUID(),
        user_id: targetUserId,
        event_type: eventType,
        severity,
        description,
        ip_address: this.browserInfo.ipAddress,
        user_agent: this.browserInfo.userAgent,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          client: 'web',
        },
        created_at: new Date().toISOString(),
      };

      // Store in memory (in production, this would insert to a database table)
      inMemoryAuditLogs.unshift(entry);
      
      // Keep only last 1000 entries in memory
      if (inMemoryAuditLogs.length > 1000) {
        inMemoryAuditLogs.pop();
      }

      // For critical events, also log to console
      if (severity === AuditSeverity.CRITICAL || severity === AuditSeverity.ERROR) {
        console.warn(`[AUDIT ${severity.toUpperCase()}] ${eventType}: ${description}`, metadata);
      }
    });
  }

  /**
   * Log authentication success
   */
  async logLoginSuccess(userId: string, method: string = 'password'): Promise<void> {
    return this.log(
      AuditEventType.LOGIN_SUCCESS,
      `User logged in successfully via ${method}`,
      {
        severity: AuditSeverity.INFO,
        userId,
        metadata: { method },
      }
    );
  }

  /**
   * Log authentication failure
   */
  async logLoginFailure(email: string, reason: string): Promise<void> {
    return this.log(
      AuditEventType.LOGIN_FAILURE,
      `Login attempt failed for ${email}: ${reason}`,
      {
        severity: AuditSeverity.WARNING,
        userId: null,
        metadata: { email, reason },
      }
    );
  }

  /**
   * Log profile update
   */
  async logProfileUpdate(changes: string[]): Promise<void> {
    return this.log(
      AuditEventType.PROFILE_UPDATE,
      `Profile updated: ${changes.join(', ')}`,
      {
        severity: AuditSeverity.INFO,
        metadata: { changes },
      }
    );
  }

  /**
   * Log admin action
   */
  async logAdminAction(action: string, target?: string): Promise<void> {
    return this.log(
      AuditEventType.ADMIN_ACTION,
      `Admin action: ${action}${target ? ` on ${target}` : ''}`,
      {
        severity: AuditSeverity.WARNING,
        metadata: { action, target },
      }
    );
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(description: string, details?: Record<string, unknown>): Promise<void> {
    return this.log(
      AuditEventType.SUSPICIOUS_ACTIVITY,
      description,
      {
        severity: AuditSeverity.CRITICAL,
        metadata: details,
      }
    );
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(resource: string, limit: number): Promise<void> {
    return this.log(
      AuditEventType.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded for ${resource}`,
      {
        severity: AuditSeverity.WARNING,
        metadata: { resource, limit },
      }
    );
  }

  /**
   * Get audit logs with filtering (from in-memory storage)
   */
  async getAuditLogs(
    filter: AuditLogFilter = {},
    page: number = 1,
    perPage: number = 50
  ): Promise<{
    data: AuditLogEntry[];
    total: number;
    page: number;
    perPage: number;
  }> {
    return this.executeWithRetry('getAuditLogs', async () => {
      let filteredLogs = [...inMemoryAuditLogs];

      // Apply filters
      if (filter.user_id) {
        filteredLogs = filteredLogs.filter(log => log.user_id === filter.user_id);
      }

      if (filter.event_type) {
        const eventTypes = Array.isArray(filter.event_type) ? filter.event_type : [filter.event_type];
        filteredLogs = filteredLogs.filter(log => eventTypes.includes(log.event_type));
      }

      if (filter.severity) {
        const severities = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
        filteredLogs = filteredLogs.filter(log => severities.includes(log.severity));
      }

      if (filter.dateFrom) {
        filteredLogs = filteredLogs.filter(log => 
          log.created_at && new Date(log.created_at) >= new Date(filter.dateFrom!)
        );
      }

      if (filter.dateTo) {
        filteredLogs = filteredLogs.filter(log => 
          log.created_at && new Date(log.created_at) <= new Date(filter.dateTo!)
        );
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.description.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const offset = (page - 1) * perPage;
      const paginatedLogs = filteredLogs.slice(offset, offset + perPage);

      return {
        data: paginatedLogs,
        total: filteredLogs.length,
        page,
        perPage,
      };
    });
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(dateFrom?: string, dateTo?: string): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    topUsers: Array<{ user_id: string; count: number }>;
  }> {
    return this.executeWithRetry('getAuditStats', async () => {
      let logs = [...inMemoryAuditLogs];

      if (dateFrom) {
        logs = logs.filter(log => 
          log.created_at && new Date(log.created_at) >= new Date(dateFrom)
        );
      }
      if (dateTo) {
        logs = logs.filter(log => 
          log.created_at && new Date(log.created_at) <= new Date(dateTo)
        );
      }

      // Calculate statistics
      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const userCounts: Record<string, number> = {};

      logs.forEach((log) => {
        byType[log.event_type] = (byType[log.event_type] || 0) + 1;
        bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
        
        if (log.user_id) {
          userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
        }
      });

      const topUsers = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([user_id, count]) => ({ user_id, count }));

      return {
        totalEvents: logs.length,
        byType,
        bySeverity,
        topUsers,
      };
    });
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    return this.executeWithRetry('cleanupOldLogs', async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const initialCount = inMemoryAuditLogs.length;
      
      // Remove logs older than cutoff date
      const remainingLogs = inMemoryAuditLogs.filter(log => 
        log.created_at && new Date(log.created_at) >= cutoffDate
      );

      // Update the array in place
      inMemoryAuditLogs.length = 0;
      inMemoryAuditLogs.push(...remainingLogs);

      return initialCount - remainingLogs.length;
    });
  }
}

// Export singleton instance
export const AuditLoggingService = new AuditLoggingServiceImpl();
export default AuditLoggingService;
