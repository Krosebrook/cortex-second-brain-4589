/**
 * Security-related type definitions
 */

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  user_id: string | null;
  event_data: Record<string, unknown>;
  triggered_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_until: string | null;
  permanent: boolean;
  blocked_by_user_id: string | null;
  created_at: string;
}

export interface ThreatResponse {
  id: string;
  rule_id: string | null;
  event_id: string | null;
  action_taken: string;
  success: boolean;
  executed_at: string;
  reversed_at: string | null;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: Record<string, unknown>;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
}

export interface FailedLoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  user_agent: string | null;
  attempted_at: string;
  country: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
}

export interface RateLimitConfig {
  id: string;
  config_key: string;
  max_attempts: number;
  time_window_minutes: number;
  block_duration_minutes: number;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface SecurityStats {
  totalAlerts: number;
  criticalAlerts: number;
  blockedIPs: number;
  activeThreats: number;
  recentActivities: number;
}

export interface GeolocationData {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  cached?: boolean;
}
