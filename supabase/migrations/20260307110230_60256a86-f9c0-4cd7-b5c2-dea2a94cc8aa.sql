-- Fix the security definer view issue by setting it to security invoker
ALTER VIEW public.social_platforms_safe SET (security_invoker = on);
