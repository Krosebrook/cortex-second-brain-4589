-- Fix SECURITY DEFINER functions missing SET search_path
-- This prevents search path manipulation attacks

-- Fix current_tenant function
CREATE OR REPLACE FUNCTION public.current_tenant()
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  select (auth.jwt() ->> 'tenant_id')::uuid;
$function$;

-- Fix enforce_kv_store_owner function
CREATE OR REPLACE FUNCTION public.enforce_kv_store_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if tg_op = 'INSERT' then
    new.user_id := (select auth.uid());
  elsif tg_op = 'UPDATE' then
    if old.user_id is distinct from new.user_id then
      raise exception 'user_id is immutable';
    end if;
  end if;
  return new;
end;
$function$;