-- =====================================================
-- COMPREHENSIVE RLS FIX: Block Anonymous Access
-- =====================================================
-- Issue: Tables have RLS policies for authenticated users but no 
-- explicit denial of anonymous access. This migration adds restrictive
-- policies to ensure unauthenticated users cannot access any data.
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 2. USER_PROFILES TABLE - Block anonymous access  
-- =====================================================
CREATE POLICY "Block anonymous access to user_profiles"
  ON public.user_profiles FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 3. FAILED_LOGIN_ATTEMPTS - Add admin view, block anon
-- =====================================================
CREATE POLICY "Admins can view failed login attempts"
  ON public.failed_login_attempts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block anonymous access to failed_login_attempts"
  ON public.failed_login_attempts FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 4. ERROR_LOGS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to error_logs"
  ON public.error_logs FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 5. USER_ACTIVITY - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to user_activity"
  ON public.user_activity FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 6. PROFILE_ACCESS_LOGS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to profile_access_logs"
  ON public.profile_access_logs FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 7. SECURITY_ALERTS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to security_alerts"
  ON public.security_alerts FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 8. SECURITY_EVENTS - Add admin view, block anon
-- =====================================================
CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block anonymous access to security_events"
  ON public.security_events FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 9. ADMIN_ACTIONS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to admin_actions"
  ON public.admin_actions FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 10. BLOCKED_IPS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to blocked_ips"
  ON public.blocked_ips FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 11. SECURITY_WHITELIST - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to security_whitelist"
  ON public.security_whitelist FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 12. IP_GEOLOCATION - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to ip_geolocation"
  ON public.ip_geolocation FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 13. THREAT_RESPONSES - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to threat_responses"
  ON public.threat_responses FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 14. THREAT_RESPONSE_RULES - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to threat_response_rules"
  ON public.threat_response_rules FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 15. SECURITY_ALERT_RULES - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to security_alert_rules"
  ON public.security_alert_rules FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 16. USER_API_KEYS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to user_api_keys"
  ON public.user_api_keys FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 17. SUBSCRIPTION_HISTORY - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to subscription_history"
  ON public.subscription_history FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 18. AI_USAGE_LOGS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to ai_usage_logs"
  ON public.ai_usage_logs FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 19. KV_STORE_C7A988F8 - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to kv_store_c7a988f8"
  ON public.kv_store_c7a988f8 FOR ALL
  TO anon
  USING (false);

-- =====================================================
-- 20. KV_STORE_E259A3BB - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to kv_store_e259a3bb"
  ON public.kv_store_e259a3bb FOR ALL
  TO anon
  USING (false);

-- =====================================================
-- 21. ERROR_NOTIFICATIONS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to error_notifications"
  ON public.error_notifications FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 22. ERROR_ALERT_CONFIGS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to error_alert_configs"
  ON public.error_alert_configs FOR SELECT
  TO anon
  USING (false);

-- =====================================================
-- 23. SCHEDULED_REPORTS - Block anonymous access
-- =====================================================
CREATE POLICY "Block anonymous access to scheduled_reports"
  ON public.scheduled_reports FOR SELECT
  TO anon
  USING (false);