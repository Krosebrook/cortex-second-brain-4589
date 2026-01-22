-- 1. Fix design_templates: Restrict premium templates to owners only
DROP POLICY IF EXISTS "Public templates are viewable by everyone" ON public.design_templates;

CREATE POLICY "Public templates viewable, premium restricted to owner"
ON public.design_templates
FOR SELECT
USING (
  is_premium = false 
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Fix profiles: Tighten SELECT to only own profile (remove ambiguous id check)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with strict user_id check only
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix user_api_keys: Add proper RLS policies if missing
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Block anonymous access to user_api_keys" ON public.user_api_keys;

-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
ON public.user_api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys"
ON public.user_api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
ON public.user_api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys"
ON public.user_api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all API keys for security auditing
CREATE POLICY "Admins can view all API keys"
ON public.user_api_keys
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));