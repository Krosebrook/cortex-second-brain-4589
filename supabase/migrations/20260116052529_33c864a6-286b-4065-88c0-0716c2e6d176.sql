-- =============================================================
-- FIX SERVICE ROLE INSERT POLICIES - RESTRICT TO SERVICE ROLE
-- These policies use WITH CHECK (true) but should check for service_role
-- =============================================================

-- admin_actions - Fix service role insert policy
DROP POLICY IF EXISTS "Service role can insert admin actions" ON public.admin_actions;
CREATE POLICY "Service role can insert admin actions"
ON public.admin_actions
FOR INSERT
TO service_role
WITH CHECK (true);

-- notifications - Fix service role insert policy  
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- security_alerts - Fix service role insert policy
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.security_alerts;
CREATE POLICY "Service role can insert alerts"
ON public.security_alerts
FOR INSERT
TO service_role
WITH CHECK (true);

-- threat_responses - Fix service role insert policy
DROP POLICY IF EXISTS "Service role can insert threat responses" ON public.threat_responses;
CREATE POLICY "Service role can insert threat responses"
ON public.threat_responses
FOR INSERT
TO service_role
WITH CHECK (true);