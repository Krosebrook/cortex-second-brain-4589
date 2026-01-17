-- Fix function search path for security
ALTER FUNCTION public.check_and_block_ip() SET search_path = public;
ALTER FUNCTION public.is_ip_blocked(inet) SET search_path = public;
ALTER FUNCTION public.record_failed_login(TEXT, TEXT, TEXT) SET search_path = public;

-- Drop the overly permissive policy and replace with a more restrictive one
DROP POLICY IF EXISTS "Function can insert failed login attempts" ON public.failed_login_attempts;