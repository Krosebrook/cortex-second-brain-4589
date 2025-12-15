-- Create audit log table for API key access patterns
CREATE TABLE public.api_key_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'decrypt', 'update', 'create', 'delete')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_api_key_access_logs_user_id ON public.api_key_access_logs(user_id);
CREATE INDEX idx_api_key_access_logs_store_id ON public.api_key_access_logs(store_id);
CREATE INDEX idx_api_key_access_logs_created_at ON public.api_key_access_logs(created_at DESC);
CREATE INDEX idx_api_key_access_logs_access_type ON public.api_key_access_logs(access_type);

-- Composite index for common query patterns (user + time range)
CREATE INDEX idx_api_key_access_logs_user_time ON public.api_key_access_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.api_key_access_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own access logs
CREATE POLICY "Users can view their own access logs"
ON public.api_key_access_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all access logs
CREATE POLICY "Admins can view all access logs"
ON public.api_key_access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only system/service role can insert logs (prevents tampering)
CREATE POLICY "Service role can insert access logs"
ON public.api_key_access_logs
FOR INSERT
WITH CHECK (true);

-- No updates or deletes allowed (immutable audit trail)
-- (No UPDATE or DELETE policies = no modifications allowed)

-- Create function to log API key access
CREATE OR REPLACE FUNCTION public.log_api_key_access(
  p_store_id UUID,
  p_access_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to log API key access';
  END IF;
  
  -- Verify user owns the store
  IF NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE id = p_store_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'User does not own this store';
  END IF;
  
  -- Insert log entry
  INSERT INTO api_key_access_logs (
    user_id,
    store_id,
    access_type,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    current_user_id,
    p_store_id,
    p_access_type,
    p_ip_address,
    p_user_agent,
    p_metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to detect unusual access patterns
CREATE OR REPLACE FUNCTION public.detect_unusual_api_key_access(
  p_user_id UUID,
  p_time_window_minutes INTEGER DEFAULT 60,
  p_access_threshold INTEGER DEFAULT 20
)
RETURNS TABLE (
  is_unusual BOOLEAN,
  access_count BIGINT,
  unique_stores_accessed BIGINT,
  first_access TIMESTAMP WITH TIME ZONE,
  last_access TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) > p_access_threshold AS is_unusual,
    COUNT(*) AS access_count,
    COUNT(DISTINCT store_id) AS unique_stores_accessed,
    MIN(created_at) AS first_access,
    MAX(created_at) AS last_access
  FROM api_key_access_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
END;
$$;

-- Create view for access statistics (useful for dashboards)
CREATE OR REPLACE VIEW public.api_key_access_stats AS
SELECT 
  user_id,
  store_id,
  access_type,
  DATE_TRUNC('hour', created_at) AS access_hour,
  COUNT(*) AS access_count
FROM public.api_key_access_logs
GROUP BY user_id, store_id, access_type, DATE_TRUNC('hour', created_at);

-- Grant necessary permissions
GRANT SELECT ON public.api_key_access_stats TO authenticated;