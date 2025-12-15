-- Create tables for synced e-commerce data

-- Products table
CREATE TABLE public.synced_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  product_type TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  images JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  price_min NUMERIC,
  price_max NUMERIC,
  inventory_quantity INTEGER DEFAULT 0,
  external_url TEXT,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, external_id)
);

-- Orders table
CREATE TABLE public.synced_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  order_number TEXT,
  customer_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  financial_status TEXT,
  fulfillment_status TEXT,
  total_price NUMERIC,
  subtotal_price NUMERIC,
  total_tax NUMERIC,
  total_shipping NUMERIC,
  currency TEXT DEFAULT 'USD',
  line_items JSONB DEFAULT '[]'::jsonb,
  shipping_address JSONB,
  billing_address JSONB,
  order_date TIMESTAMP WITH TIME ZONE,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, external_id)
);

-- Customers table
CREATE TABLE public.synced_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  tags TEXT[],
  default_address JSONB,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, external_id)
);

-- Inventory table
CREATE TABLE public.synced_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.synced_products(id) ON DELETE CASCADE,
  external_product_id TEXT NOT NULL,
  external_variant_id TEXT,
  sku TEXT,
  quantity INTEGER DEFAULT 0,
  location TEXT,
  raw_data JSONB,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, external_variant_id)
);

-- Sync logs table
CREATE TABLE public.store_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.synced_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synced_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for synced_products
CREATE POLICY "Users can view their own synced products"
ON public.synced_products FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = synced_products.store_id
  AND stores.user_id = auth.uid()
));

CREATE POLICY "Service role can manage synced products"
ON public.synced_products FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for synced_orders
CREATE POLICY "Users can view their own synced orders"
ON public.synced_orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = synced_orders.store_id
  AND stores.user_id = auth.uid()
));

CREATE POLICY "Service role can manage synced orders"
ON public.synced_orders FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for synced_customers
CREATE POLICY "Users can view their own synced customers"
ON public.synced_customers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = synced_customers.store_id
  AND stores.user_id = auth.uid()
));

CREATE POLICY "Service role can manage synced customers"
ON public.synced_customers FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for synced_inventory
CREATE POLICY "Users can view their own synced inventory"
ON public.synced_inventory FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = synced_inventory.store_id
  AND stores.user_id = auth.uid()
));

CREATE POLICY "Service role can manage synced inventory"
ON public.synced_inventory FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for store_sync_logs
CREATE POLICY "Users can view their own sync logs"
ON public.store_sync_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_sync_logs.store_id
  AND stores.user_id = auth.uid()
));

CREATE POLICY "Service role can manage sync logs"
ON public.store_sync_logs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_synced_products_store_id ON public.synced_products(store_id);
CREATE INDEX idx_synced_orders_store_id ON public.synced_orders(store_id);
CREATE INDEX idx_synced_orders_order_date ON public.synced_orders(order_date DESC);
CREATE INDEX idx_synced_customers_store_id ON public.synced_customers(store_id);
CREATE INDEX idx_synced_inventory_store_id ON public.synced_inventory(store_id);
CREATE INDEX idx_store_sync_logs_store_id ON public.store_sync_logs(store_id);

-- Add updated_at triggers
CREATE TRIGGER update_synced_products_updated_at
  BEFORE UPDATE ON public.synced_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_synced_orders_updated_at
  BEFORE UPDATE ON public.synced_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_synced_customers_updated_at
  BEFORE UPDATE ON public.synced_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_synced_inventory_updated_at
  BEFORE UPDATE ON public.synced_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();