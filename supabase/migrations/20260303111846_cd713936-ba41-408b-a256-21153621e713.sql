
-- Enable RLS on all unprotected tables and add policies
-- (Products RLS already enabled from failed migration partial apply - use IF NOT EXISTS pattern)

-- 1. products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Anyone can read products') THEN
    CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='Admins can manage products') THEN
    CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 2. orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='Admins can manage orders') THEN
    CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 3. order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='Admins can manage order items') THEN
    CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 4. marketplace_listings
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketplace_listings' AND policyname='Admins can manage listings') THEN
    CREATE POLICY "Admins can manage listings" ON public.marketplace_listings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 5. publishing_queue
ALTER TABLE public.publishing_queue ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='publishing_queue' AND policyname='Admins can manage publishing queue') THEN
    CREATE POLICY "Admins can manage publishing queue" ON public.publishing_queue FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 6. categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Anyone can read categories') THEN
    CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='categories' AND policyname='Admins can manage categories') THEN
    CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 7. subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_plans' AND policyname='Anyone can read plans') THEN
    CREATE POLICY "Anyone can read plans" ON public.subscription_plans FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_plans' AND policyname='Admins can manage plans') THEN
    CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 8. subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Users can view own subscription') THEN
    CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Admins can manage subscriptions') THEN
    CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 9. teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='teams' AND policyname='Owners can manage own teams') THEN
    CREATE POLICY "Owners can manage own teams" ON public.teams FOR ALL TO authenticated USING (auth.uid()::text = owner_id) WITH CHECK (auth.uid()::text = owner_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='teams' AND policyname='Admins can manage all teams') THEN
    CREATE POLICY "Admins can manage all teams" ON public.teams FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 10. team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_members' AND policyname='Users can view own memberships') THEN
    CREATE POLICY "Users can view own memberships" ON public.team_members FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='team_members' AND policyname='Admins can manage team members') THEN
    CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 11. ai_generations
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_generations' AND policyname='Admins can manage ai generations') THEN
    CREATE POLICY "Admins can manage ai generations" ON public.ai_generations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 12. brand_profiles
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='brand_profiles' AND policyname='Anyone can read brand profiles') THEN
    CREATE POLICY "Anyone can read brand profiles" ON public.brand_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='brand_profiles' AND policyname='Admins can manage brand profiles') THEN
    CREATE POLICY "Admins can manage brand profiles" ON public.brand_profiles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 13. brand_voice_profiles
ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='brand_voice_profiles' AND policyname='Users can manage own voice profiles') THEN
    CREATE POLICY "Users can manage own voice profiles" ON public.brand_voice_profiles FOR ALL TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- 14. content_library
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='content_library' AND policyname='Admins can manage content library') THEN
    CREATE POLICY "Admins can manage content library" ON public.content_library FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 15. product_concepts
ALTER TABLE public.product_concepts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='product_concepts' AND policyname='Users can manage own concepts') THEN
    CREATE POLICY "Users can manage own concepts" ON public.product_concepts FOR ALL TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- 16. marketing_campaigns
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='marketing_campaigns' AND policyname='Users can manage own campaigns') THEN
    CREATE POLICY "Users can manage own campaigns" ON public.marketing_campaigns FOR ALL TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- 17. social_platforms
ALTER TABLE public.social_platforms ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_platforms' AND policyname='Users can manage own platforms') THEN
    CREATE POLICY "Users can manage own platforms" ON public.social_platforms FOR ALL TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- 18. social_content
ALTER TABLE public.social_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_content' AND policyname='Users can manage own social content') THEN
    CREATE POLICY "Users can manage own social content" ON public.social_content FOR ALL TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- 19. social_analytics
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_analytics' AND policyname='Users can manage own analytics') THEN
    CREATE POLICY "Users can manage own analytics" ON public.social_analytics FOR ALL TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

-- 20. password_reset_tokens (service role only)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 21. users (legacy)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='Users can view own record') THEN
    CREATE POLICY "Users can view own record" ON public.users FOR SELECT TO authenticated USING (auth.uid()::text = id);
  END IF;
END $$;

-- 22. cart_items (session-based anonymous carts)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cart_items' AND policyname='Anyone can manage cart items') THEN
    CREATE POLICY "Anyone can manage cart items" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 23. style_profiles (session-based)
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='style_profiles' AND policyname='Anyone can manage style profiles') THEN
    CREATE POLICY "Anyone can manage style profiles" ON public.style_profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 24. wardrobe_items (session-based)
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wardrobe_items' AND policyname='Anyone can manage wardrobe items') THEN
    CREATE POLICY "Anyone can manage wardrobe items" ON public.wardrobe_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
