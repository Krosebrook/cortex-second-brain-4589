-- =============================================================
-- COMPREHENSIVE RLS SECURITY FIX
-- Fixes: failed_login_attempts, profiles, kv_store tables
-- =============================================================

-- =============================================================
-- 1. FIX failed_login_attempts - ADMIN ONLY ACCESS
-- =============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Block anonymous access to failed_login_attempts" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "Admins can view failed login attempts" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "Service role can manage failed login attempts" ON public.failed_login_attempts;

-- Create PERMISSIVE admin-only policies (no anonymous access possible without auth.uid())
CREATE POLICY "Admins can view failed login attempts"
ON public.failed_login_attempts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert failed login attempts"
ON public.failed_login_attempts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete failed login attempts"
ON public.failed_login_attempts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- 2. FIX profiles - CONVERT TO PERMISSIVE WITH EXPLICIT CHECKS
-- =============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Create PERMISSIVE policies with explicit user_id checks (requires auth.uid())
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = id));

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) OR (auth.uid() = id));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = id))
WITH CHECK ((auth.uid() = user_id) OR (auth.uid() = id));

CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = id));

-- Admin access to all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- 3. FIX kv_store_8c5e19c9 - ADD AUTHENTICATION REQUIREMENT
-- =============================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage kv_store_8c5e19c9" ON public.kv_store_8c5e19c9;

-- Create authenticated-only read access (for public config) and admin write access
CREATE POLICY "Authenticated users can read kv_store_8c5e19c9"
ON public.kv_store_8c5e19c9
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage kv_store_8c5e19c9"
ON public.kv_store_8c5e19c9
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- 4. FIX kv_store_e259a3bb - SIMPLIFY CONFLICTING POLICIES
-- =============================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Block anonymous access to kv_store_e259a3bb" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "read_own" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "insert_own" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "update_own" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "delete_own" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "tenant_read" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "tenant_write" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "tenant_update" ON public.kv_store_e259a3bb;
DROP POLICY IF EXISTS "tenant_delete" ON public.kv_store_e259a3bb;

-- Create clean PERMISSIVE policies with OR conditions
CREATE POLICY "Users can read own or tenant data"
ON public.kv_store_e259a3bb
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR (tenant_id = current_tenant()));

CREATE POLICY "Users can insert own or tenant data"
ON public.kv_store_e259a3bb
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = user_id) OR (tenant_id = current_tenant()));

CREATE POLICY "Users can update own or tenant data"
ON public.kv_store_e259a3bb
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) OR (tenant_id = current_tenant()))
WITH CHECK ((auth.uid() = user_id) OR (tenant_id = current_tenant()));

CREATE POLICY "Users can delete own or tenant data"
ON public.kv_store_e259a3bb
FOR DELETE
TO authenticated
USING ((auth.uid() = user_id) OR (tenant_id = current_tenant()));

-- =============================================================
-- 5. FIX other kv_stores with overly permissive USING (true)
-- =============================================================

-- kv_store_2c46ec52
DROP POLICY IF EXISTS "Service role can manage kv_store_2c46ec52" ON public.kv_store_2c46ec52;
CREATE POLICY "Admins can manage kv_store_2c46ec52"
ON public.kv_store_2c46ec52
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- kv_store_88829a40
DROP POLICY IF EXISTS "Service role can manage kv_store_88829a40" ON public.kv_store_88829a40;
CREATE POLICY "Admins can manage kv_store_88829a40"
ON public.kv_store_88829a40
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- kv_store_9e168049
DROP POLICY IF EXISTS "Service role can manage kv_store_9e168049" ON public.kv_store_9e168049;
CREATE POLICY "Admins can manage kv_store_9e168049"
ON public.kv_store_9e168049
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- kv_store_9f867aa4
DROP POLICY IF EXISTS "Service role can manage kv_store_9f867aa4" ON public.kv_store_9f867aa4;
CREATE POLICY "Admins can manage kv_store_9f867aa4"
ON public.kv_store_9f867aa4
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- kv_store_e6e09e19
DROP POLICY IF EXISTS "Service role can manage kv_store_e6e09e19" ON public.kv_store_e6e09e19;
CREATE POLICY "Admins can manage kv_store_e6e09e19"
ON public.kv_store_e6e09e19
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- kv_store_f091804d
DROP POLICY IF EXISTS "Service role can manage kv_store_f091804d" ON public.kv_store_f091804d;
CREATE POLICY "Admins can manage kv_store_f091804d"
ON public.kv_store_f091804d
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- 6. FIX security_events - overly permissive service role policy
-- =============================================================

DROP POLICY IF EXISTS "Service role can manage security events" ON public.security_events;
CREATE POLICY "Admins can manage security events"
ON public.security_events
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================
-- 7. FIX ip_geolocation - overly permissive service role policy
-- =============================================================

DROP POLICY IF EXISTS "Service role can manage geolocation" ON public.ip_geolocation;
CREATE POLICY "Admins can manage geolocation"
ON public.ip_geolocation
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));