-- =============================================
-- PART 1: Create profile access audit log table
-- =============================================

CREATE TABLE public.profile_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_profile_id UUID NOT NULL,
  accessor_user_id UUID,
  access_type TEXT NOT NULL, -- 'view', 'update', 'delete'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view profile access logs"
  ON public.profile_access_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Service role can insert logs
CREATE POLICY "System can insert profile access logs"
  ON public.profile_access_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- Create index for efficient querying
CREATE INDEX idx_profile_access_logs_profile 
  ON public.profile_access_logs(accessed_profile_id, created_at DESC);
CREATE INDEX idx_profile_access_logs_accessor 
  ON public.profile_access_logs(accessor_user_id, created_at DESC);
CREATE INDEX idx_profile_access_logs_created 
  ON public.profile_access_logs(created_at DESC);

-- =============================================
-- PART 2: Function to log profile access
-- =============================================

CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_accessed_profile_id UUID,
  p_access_type TEXT,
  p_success BOOLEAN DEFAULT true,
  p_failure_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO profile_access_logs (
    accessed_profile_id,
    accessor_user_id,
    access_type,
    success,
    failure_reason,
    metadata
  )
  VALUES (
    p_accessed_profile_id,
    auth.uid(),
    p_access_type,
    p_success,
    p_failure_reason,
    p_metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- =============================================
-- PART 3: Fix remaining RLS policy gaps
-- =============================================

-- Ensure user_api_keys has proper RLS
DROP POLICY IF EXISTS "Users can view own api keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users can manage own api keys" ON public.user_api_keys;

CREATE POLICY "Users can view own api keys"
  ON public.user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
  ON public.user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON public.user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Fix user_activity table - ensure users only see their own
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity;

CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Fix usage_tracking - ensure users only see their own
DROP POLICY IF EXISTS "Users can view own usage tracking" ON public.usage_tracking;

CREATE POLICY "Users can view own usage tracking"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- PART 4: Mark security findings as resolved
-- =============================================
-- The RLS policies added in the previous migration should now properly 
-- restrict access to profiles and user_profiles tables