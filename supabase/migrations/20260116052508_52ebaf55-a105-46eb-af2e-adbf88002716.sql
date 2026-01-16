-- =============================================================
-- FIX TABLES WITH RLS ENABLED BUT NO POLICIES
-- =============================================================

-- kv_store_128bd8cd - Add admin-only policies
CREATE POLICY "Admins can manage kv_store_128bd8cd"
ON public.kv_store_128bd8cd
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- kv_store_8aff499e - Add admin-only policies
CREATE POLICY "Admins can manage kv_store_8aff499e"
ON public.kv_store_8aff499e
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));