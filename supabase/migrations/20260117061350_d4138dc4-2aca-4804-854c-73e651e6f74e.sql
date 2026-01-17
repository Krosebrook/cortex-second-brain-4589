-- Create rate limit configuration table
CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  max_attempts integer NOT NULL DEFAULT 5,
  time_window_minutes integer NOT NULL DEFAULT 15,
  block_duration_minutes integer NOT NULL DEFAULT 60,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage rate limit config"
ON public.rate_limit_config
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow reading config for the trigger function
CREATE POLICY "Service role can read rate limit config"
ON public.rate_limit_config
FOR SELECT
TO service_role
USING (true);

-- Insert default configuration
INSERT INTO public.rate_limit_config (config_key, max_attempts, time_window_minutes, block_duration_minutes)
VALUES ('failed_login', 5, 15, 60)
ON CONFLICT (config_key) DO NOTHING;

-- Add geolocation columns to failed_login_attempts if not exists
ALTER TABLE public.failed_login_attempts 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS country_code text;

-- Update check_and_block_ip function to use configurable settings
CREATE OR REPLACE FUNCTION public.check_and_block_ip()
RETURNS TRIGGER AS $$
DECLARE
  attempt_count INTEGER;
  config RECORD;
BEGIN
  -- Get rate limit configuration
  SELECT max_attempts, time_window_minutes, block_duration_minutes, enabled
  INTO config
  FROM public.rate_limit_config
  WHERE config_key = 'failed_login';
  
  -- Use defaults if no config found
  IF NOT FOUND THEN
    config.max_attempts := 5;
    config.time_window_minutes := 15;
    config.block_duration_minutes := 60;
    config.enabled := true;
  END IF;
  
  -- Skip if rate limiting is disabled
  IF NOT config.enabled THEN
    RETURN NEW;
  END IF;
  
  -- Count recent failed attempts from this IP
  SELECT COUNT(*) INTO attempt_count
  FROM public.failed_login_attempts
  WHERE ip_address = NEW.ip_address
    AND attempted_at > NOW() - (config.time_window_minutes || ' minutes')::interval;
  
  -- If threshold exceeded, block the IP
  IF attempt_count >= config.max_attempts THEN
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
        'Auto-blocked: Too many failed login attempts (' || attempt_count || ' in ' || config.time_window_minutes || ' minutes)',
        false,
        NOW() + (config.block_duration_minutes || ' minutes')::interval
      );
      
      -- Log security event
      PERFORM public.log_security_event(
        'auto_ip_block',
        'high',
        jsonb_build_object(
          'ip_address', NEW.ip_address::text,
          'failed_attempts', attempt_count,
          'block_duration_minutes', config.block_duration_minutes,
          'country', NEW.country,
          'city', NEW.city
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to lookup and cache IP geolocation (called from edge function)
CREATE OR REPLACE FUNCTION public.cache_ip_geolocation(
  p_ip_address TEXT,
  p_country TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  ip inet;
BEGIN
  -- Validate IP
  BEGIN
    ip := p_ip_address::inet;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;
  
  -- Upsert geolocation data
  INSERT INTO public.ip_geolocation (ip_address, country, country_code, region, city, latitude, longitude, cached_at)
  VALUES (ip, p_country, p_country_code, p_region, p_city, p_latitude, p_longitude, NOW())
  ON CONFLICT (ip_address) DO UPDATE SET
    country = EXCLUDED.country,
    country_code = EXCLUDED.country_code,
    region = EXCLUDED.region,
    city = EXCLUDED.city,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    cached_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cache_ip_geolocation(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO service_role;

-- Update record_failed_login to include geolocation
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL
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
    -- Insert the failed attempt with geolocation
    INSERT INTO public.failed_login_attempts (email, ip_address, user_agent, country, city, region, country_code)
    VALUES (p_email, ip, p_user_agent, p_country, p_city, p_region, p_country_code);
  END IF;
  
  RETURN jsonb_build_object(
    'blocked', is_blocked,
    'recorded', NOT is_blocked
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.record_failed_login(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;