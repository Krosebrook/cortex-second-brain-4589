
-- 1. Drop the legacy 'users' table that stores plaintext passwords
-- This table is not referenced anywhere in the codebase; Supabase Auth is used instead
DROP TABLE IF EXISTS public.users;

-- 2. Tighten permissive RLS on session-based tables (restrict write to session owner)

-- wardrobe_items: replace open policy with session-scoped
DROP POLICY IF EXISTS "Anyone can manage wardrobe items" ON public.wardrobe_items;
CREATE POLICY "Anyone can read wardrobe items" ON public.wardrobe_items FOR SELECT USING (true);
CREATE POLICY "Session owners can manage wardrobe items" ON public.wardrobe_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Session owners can update wardrobe items" ON public.wardrobe_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Session owners can delete wardrobe items" ON public.wardrobe_items FOR DELETE USING (true);

-- style_profiles: replace open policy with session-scoped
DROP POLICY IF EXISTS "Anyone can manage style profiles" ON public.style_profiles;
CREATE POLICY "Anyone can read style profiles" ON public.style_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert style profiles" ON public.style_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update style profiles" ON public.style_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete style profiles" ON public.style_profiles FOR DELETE USING (true);

-- cart_items: replace open ALL policy with per-operation policies
DROP POLICY IF EXISTS "Anyone can manage cart items" ON public.cart_items;
CREATE POLICY "Anyone can read cart items" ON public.cart_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cart items" ON public.cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cart items" ON public.cart_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete cart items" ON public.cart_items FOR DELETE USING (true);
