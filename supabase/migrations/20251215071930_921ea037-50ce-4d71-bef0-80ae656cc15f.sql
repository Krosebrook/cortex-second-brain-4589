-- Drop the security definer view and recreate as regular view
DROP VIEW IF EXISTS public.api_key_access_stats;

-- Recreate as a regular view (not security definer)
-- Users will only see data they have access to via RLS on the underlying table
CREATE VIEW public.api_key_access_stats 
WITH (security_invoker = true)
AS
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