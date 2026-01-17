-- Create function to check failed login attempts and auto-block IPs
-- This runs after each failed login attempt insert

CREATE OR REPLACE FUNCTION public.check_and_block_ip()
RETURNS TRIGGER AS $$
DECLARE
  attempt_count INTEGER;
  time_window INTERVAL := INTERVAL '15 minutes';
  max_attempts INTEGER := 5;
BEGIN
  -- Count recent failed attempts from this IP
  SELECT COUNT(*) INTO attempt_count
  FROM public.failed_login_attempts
  WHERE ip_address = NEW.ip_address
    AND attempted_at > NOW() - time_window;
  
  -- If threshold exceeded, block the IP
  IF attempt_count >= max_attempts THEN
    -- Check if IP is not already blocked
    IF NOT EXISTS (
      SELECT 1 FROM public.blocked_ips 
      WHERE ip_address = NEW.ip_address
        AND (permanent = true OR blocked_until > NOW())
    ) THEN
      INSERT INTO public.blocked_ips (
        ip_address, 
        reason, 
        permanent, 
        blocked_until
      ) VALUES (
        NEW.ip_address,
        'Auto-blocked: Too many failed login attempts (' || attempt_count || ' in 15 minutes)',
        false,
        NOW() + INTERVAL '1 hour'
      );
      
      -- Log security event
      PERFORM public.log_security_event(
        'auto_ip_block',
        'high',
        jsonb_build_object(
          'ip_address', NEW.ip_address::text,
          'failed_attempts', attempt_count,
          'block_duration', '1 hour'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-blocking
DROP TRIGGER IF EXISTS trigger_check_and_block_ip ON public.failed_login_attempts;
CREATE TRIGGER trigger_check_and_block_ip
  AFTER INSERT ON public.failed_login_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_block_ip();

-- Function to check if an IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(check_ip inet)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_ips
    WHERE ip_address = check_ip
      AND (permanent = true OR blocked_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a failed login attempt (callable without auth)
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  ip inet;
  is_blocked BOOLEAN;
BEGIN
  -- Validate and convert IP
  BEGIN
    ip := p_ip_address::inet;
  EXCEPTION WHEN OTHERS THEN
    ip := '0.0.0.0'::inet;
  END;
  
  -- Check if already blocked
  is_blocked := public.is_ip_blocked(ip);
  
  IF NOT is_blocked THEN
    -- Insert the failed attempt
    INSERT INTO public.failed_login_attempts (email, ip_address, user_agent)
    VALUES (p_email, ip, p_user_agent);
  END IF;
  
  RETURN jsonb_build_object(
    'blocked', is_blocked,
    'recorded', NOT is_blocked
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.is_ip_blocked(inet) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_login(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Allow service role to insert failed login attempts (for the trigger)
DROP POLICY IF EXISTS "Service role can insert failed login attempts" ON public.failed_login_attempts;
CREATE POLICY "Service role can insert failed login attempts"
ON public.failed_login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow the security definer function to insert
DROP POLICY IF EXISTS "Function can insert failed login attempts" ON public.failed_login_attempts;
CREATE POLICY "Function can insert failed login attempts"
ON public.failed_login_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);