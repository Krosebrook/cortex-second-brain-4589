-- Create a secure view that excludes sensitive token columns
CREATE OR REPLACE VIEW public.social_platforms_safe AS
SELECT 
  id, user_id, platform, username, display_name, avatar,
  follower_count, connected, connected_at, token_expires_at,
  created_at, updated_at
FROM public.social_platforms;

-- Revoke direct table access from anon and authenticated roles
REVOKE SELECT ON public.social_platforms FROM anon, authenticated;

-- Grant access to the safe view instead
GRANT SELECT ON public.social_platforms_safe TO authenticated;

-- Keep INSERT/UPDATE/DELETE on the original table (for write operations)
-- but ensure tokens can only be written, never read back by clients
