import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  storeId: string;
  syncTypes?: ('products' | 'orders' | 'customers' | 'inventory')[];
}

interface Store {
  id: string;
  platform: string;
  store_url: string | null;
  api_key_encrypted: string | null;
}

// Platform-specific API adapters
interface PlatformAdapter {
  fetchProducts(storeUrl: string, apiKey: string): Promise<any[]>;
  fetchOrders(storeUrl: string, apiKey: string): Promise<any[]>;
  fetchCustomers(storeUrl: string, apiKey: string): Promise<any[]>;
  fetchInventory(storeUrl: string, apiKey: string): Promise<any[]>;
  normalizeProduct(product: any): any;
  normalizeOrder(order: any): any;
  normalizeCustomer(customer: any): any;
  normalizeInventoryItem(item: any, productId: string): any;
}

// Shopify Adapter
const shopifyAdapter: PlatformAdapter = {
  async fetchProducts(storeUrl: string, apiKey: string): Promise<any[]> {
    const baseUrl = storeUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/admin/api/2024-01/products.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Shopify products fetch failed: ${response.status}`);
    }
    const data = await response.json();
    return data.products || [];
  },

  async fetchOrders(storeUrl: string, apiKey: string): Promise<any[]> {
    const baseUrl = storeUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/admin/api/2024-01/orders.json?status=any&limit=250`, {
      headers: {
        'X-Shopify-Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Shopify orders fetch failed: ${response.status}`);
    }
    const data = await response.json();
    return data.orders || [];
  },

  async fetchCustomers(storeUrl: string, apiKey: string): Promise<any[]> {
    const baseUrl = storeUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/admin/api/2024-01/customers.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Shopify customers fetch failed: ${response.status}`);
    }
    const data = await response.json();
    return data.customers || [];
  },

  async fetchInventory(storeUrl: string, apiKey: string): Promise<any[]> {
    // Fetch inventory levels from Shopify
    const baseUrl = storeUrl.replace(/\/$/, '');
    const locationsResponse = await fetch(`${baseUrl}/admin/api/2024-01/locations.json`, {
      headers: {
        'X-Shopify-Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
    });
    if (!locationsResponse.ok) {
      return [];
    }
    const locationsData = await locationsResponse.json();
    const locations = locationsData.locations || [];
    
    const allInventory: any[] = [];
    for (const location of locations) {
      const response = await fetch(
        `${baseUrl}/admin/api/2024-01/inventory_levels.json?location_ids=${location.id}&limit=250`,
        {
          headers: {
            'X-Shopify-Access-Token': apiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        allInventory.push(...(data.inventory_levels || []).map((item: any) => ({
          ...item,
          location_name: location.name,
        })));
      }
    }
    return allInventory;
  },

  normalizeProduct(product: any): any {
    const variants = product.variants || [];
    const prices = variants.map((v: any) => parseFloat(v.price || 0));
    return {
      external_id: String(product.id),
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      status: product.status,
      tags: product.tags ? product.tags.split(', ') : [],
      images: (product.images || []).map((img: any) => ({ src: img.src, alt: img.alt })),
      variants: variants.map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        inventory_quantity: v.inventory_quantity,
      })),
      price_min: prices.length ? Math.min(...prices) : null,
      price_max: prices.length ? Math.max(...prices) : null,
      inventory_quantity: variants.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0),
      external_url: `https://${product.handle}`,
      raw_data: product,
    };
  },

  normalizeOrder(order: any): any {
    return {
      external_id: String(order.id),
      order_number: order.name || order.order_number,
      customer_id: order.customer?.id ? String(order.customer.id) : null,
      customer_email: order.email || order.customer?.email,
      customer_name: order.customer 
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
        : null,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      total_price: parseFloat(order.total_price || 0),
      subtotal_price: parseFloat(order.subtotal_price || 0),
      total_tax: parseFloat(order.total_tax || 0),
      total_shipping: order.shipping_lines?.reduce(
        (sum: number, line: any) => sum + parseFloat(line.price || 0), 0
      ) || 0,
      currency: order.currency,
      line_items: (order.line_items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku,
      })),
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      order_date: order.created_at,
      raw_data: order,
    };
  },

  normalizeCustomer(customer: any): any {
    return {
      external_id: String(customer.id),
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      orders_count: customer.orders_count || 0,
      total_spent: parseFloat(customer.total_spent || 0),
      tags: customer.tags ? customer.tags.split(', ') : [],
      default_address: customer.default_address,
      raw_data: customer,
    };
  },

  normalizeInventoryItem(item: any, productId: string): any {
    return {
      external_product_id: productId,
      external_variant_id: String(item.inventory_item_id),
      quantity: item.available || 0,
      location: item.location_name,
      raw_data: item,
    };
  },
};

// WooCommerce Adapter
const woocommerceAdapter: PlatformAdapter = {
  async fetchProducts(storeUrl: string, apiKey: string): Promise<any[]> {
    // API key format: consumer_key:consumer_secret
    const [consumerKey, consumerSecret] = apiKey.split(':');
    const baseUrl = storeUrl.replace(/\/$/, '');
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=100`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`WooCommerce products fetch failed: ${response.status}`);
    }
    return await response.json();
  },

  async fetchOrders(storeUrl: string, apiKey: string): Promise<any[]> {
    const [consumerKey, consumerSecret] = apiKey.split(':');
    const baseUrl = storeUrl.replace(/\/$/, '');
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders?per_page=100`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`WooCommerce orders fetch failed: ${response.status}`);
    }
    return await response.json();
  },

  async fetchCustomers(storeUrl: string, apiKey: string): Promise<any[]> {
    const [consumerKey, consumerSecret] = apiKey.split(':');
    const baseUrl = storeUrl.replace(/\/$/, '');
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/customers?per_page=100`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`WooCommerce customers fetch failed: ${response.status}`);
    }
    return await response.json();
  },

  async fetchInventory(storeUrl: string, apiKey: string): Promise<any[]> {
    // WooCommerce doesn't have separate inventory endpoint - it's in products
    return [];
  },

  normalizeProduct(product: any): any {
    const prices = [parseFloat(product.price || 0)];
    return {
      external_id: String(product.id),
      title: product.name,
      description: product.description,
      vendor: null,
      product_type: product.type,
      status: product.status,
      tags: (product.tags || []).map((t: any) => t.name),
      images: (product.images || []).map((img: any) => ({ src: img.src, alt: img.alt })),
      variants: product.variations?.length ? product.variations : [{
        id: product.id,
        title: product.name,
        sku: product.sku,
        price: product.price,
        inventory_quantity: product.stock_quantity,
      }],
      price_min: Math.min(...prices),
      price_max: Math.max(...prices),
      inventory_quantity: product.stock_quantity || 0,
      external_url: product.permalink,
      raw_data: product,
    };
  },

  normalizeOrder(order: any): any {
    return {
      external_id: String(order.id),
      order_number: order.number,
      customer_id: order.customer_id ? String(order.customer_id) : null,
      customer_email: order.billing?.email,
      customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
      financial_status: order.status,
      fulfillment_status: order.status,
      total_price: parseFloat(order.total || 0),
      subtotal_price: parseFloat(order.subtotal || 0),
      total_tax: parseFloat(order.total_tax || 0),
      total_shipping: parseFloat(order.shipping_total || 0),
      currency: order.currency,
      line_items: (order.line_items || []).map((item: any) => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku,
      })),
      shipping_address: order.shipping,
      billing_address: order.billing,
      order_date: order.date_created,
      raw_data: order,
    };
  },

  normalizeCustomer(customer: any): any {
    return {
      external_id: String(customer.id),
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.billing?.phone,
      orders_count: customer.orders_count || 0,
      total_spent: parseFloat(customer.total_spent || 0),
      tags: [],
      default_address: customer.billing,
      raw_data: customer,
    };
  },

  normalizeInventoryItem(item: any, productId: string): any {
    return {
      external_product_id: productId,
      external_variant_id: String(item.id),
      quantity: item.stock_quantity || 0,
      location: 'default',
      raw_data: item,
    };
  },
};

// BigCommerce Adapter
const bigcommerceAdapter: PlatformAdapter = {
  async fetchProducts(storeUrl: string, apiKey: string): Promise<any[]> {
    // API key format: store_hash:access_token
    const [storeHash, accessToken] = apiKey.split(':');
    
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?include=variants,images`,
      {
        headers: {
          'X-Auth-Token': accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`BigCommerce products fetch failed: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  },

  async fetchOrders(storeUrl: string, apiKey: string): Promise<any[]> {
    const [storeHash, accessToken] = apiKey.split(':');
    
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${storeHash}/v2/orders`,
      {
        headers: {
          'X-Auth-Token': accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`BigCommerce orders fetch failed: ${response.status}`);
    }
    return await response.json();
  },

  async fetchCustomers(storeUrl: string, apiKey: string): Promise<any[]> {
    const [storeHash, accessToken] = apiKey.split(':');
    
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${storeHash}/v3/customers`,
      {
        headers: {
          'X-Auth-Token': accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`BigCommerce customers fetch failed: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  },

  async fetchInventory(storeUrl: string, apiKey: string): Promise<any[]> {
    return [];
  },

  normalizeProduct(product: any): any {
    const variants = product.variants || [];
    const prices = variants.map((v: any) => v.price).filter(Boolean);
    if (!prices.length) prices.push(product.price);
    
    return {
      external_id: String(product.id),
      title: product.name,
      description: product.description,
      vendor: product.brand_id ? String(product.brand_id) : null,
      product_type: product.type,
      status: product.is_visible ? 'active' : 'draft',
      tags: [],
      images: (product.images || []).map((img: any) => ({ src: img.url_standard, alt: img.description })),
      variants: variants.map((v: any) => ({
        id: v.id,
        title: v.option_values?.map((o: any) => o.label).join(' / ') || product.name,
        sku: v.sku,
        price: v.price,
        inventory_quantity: v.inventory_level,
      })),
      price_min: Math.min(...prices),
      price_max: Math.max(...prices),
      inventory_quantity: product.inventory_level || 0,
      external_url: product.custom_url?.url,
      raw_data: product,
    };
  },

  normalizeOrder(order: any): any {
    return {
      external_id: String(order.id),
      order_number: String(order.id),
      customer_id: order.customer_id ? String(order.customer_id) : null,
      customer_email: order.billing_address?.email,
      customer_name: `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim(),
      financial_status: order.payment_status,
      fulfillment_status: order.status,
      total_price: parseFloat(order.total_inc_tax || 0),
      subtotal_price: parseFloat(order.subtotal_inc_tax || 0),
      total_tax: parseFloat(order.total_tax || 0),
      total_shipping: parseFloat(order.shipping_cost_inc_tax || 0),
      currency: order.currency_code,
      line_items: (order.products || []).map((item: any) => ({
        id: item.id,
        title: item.name,
        quantity: item.quantity,
        price: item.base_price,
        sku: item.sku,
      })),
      shipping_address: order.shipping_addresses?.[0],
      billing_address: order.billing_address,
      order_date: order.date_created,
      raw_data: order,
    };
  },

  normalizeCustomer(customer: any): any {
    return {
      external_id: String(customer.id),
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      orders_count: customer.orders_count || 0,
      total_spent: 0,
      tags: [],
      default_address: customer.addresses?.[0],
      raw_data: customer,
    };
  },

  normalizeInventoryItem(item: any, productId: string): any {
    return {
      external_product_id: productId,
      external_variant_id: String(item.id),
      quantity: item.inventory_level || 0,
      location: 'default',
      raw_data: item,
    };
  },
};

function getAdapter(platform: string): PlatformAdapter {
  switch (platform.toLowerCase()) {
    case 'shopify':
      return shopifyAdapter;
    case 'woocommerce':
      return woocommerceAdapter;
    case 'bigcommerce':
      return bigcommerceAdapter;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header for user verification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { storeId, syncTypes = ['products', 'orders', 'customers', 'inventory'] } = 
      await req.json() as SyncRequest;

    console.log(`[sync-store] Starting sync for store ${storeId}, types: ${syncTypes.join(', ')}`);

    // Fetch store details
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      console.error('[sync-store] Store not found:', storeError);
      return new Response(
        JSON.stringify({ error: 'Store not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!store.api_key_encrypted || !store.store_url) {
      return new Response(
        JSON.stringify({ error: 'Store API key or URL not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log
    const { data: syncLog, error: logError } = await supabase
      .from('store_sync_logs')
      .insert({
        store_id: storeId,
        sync_type: syncTypes.join(','),
        status: 'in_progress',
        metadata: { user_id: user.id, sync_types: syncTypes },
      })
      .select()
      .single();

    if (logError) {
      console.error('[sync-store] Failed to create sync log:', logError);
    }

    const adapter = getAdapter(store.platform);
    const results: Record<string, { synced: number; failed: number; errors: string[] }> = {};
    let totalSynced = 0;
    let totalFailed = 0;

    // Sync Products
    if (syncTypes.includes('products')) {
      console.log('[sync-store] Syncing products...');
      try {
        const products = await adapter.fetchProducts(store.store_url, store.api_key_encrypted);
        console.log(`[sync-store] Fetched ${products.length} products`);
        
        let synced = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const product of products) {
          try {
            const normalized = adapter.normalizeProduct(product);
            const { error } = await supabase
              .from('synced_products')
              .upsert({
                store_id: storeId,
                ...normalized,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'store_id,external_id' });

            if (error) {
              failed++;
              errors.push(`Product ${normalized.external_id}: ${error.message}`);
            } else {
              synced++;
            }
          } catch (e) {
            failed++;
            errors.push(`Product processing error: ${e.message}`);
          }
        }

        results.products = { synced, failed, errors: errors.slice(0, 5) };
        totalSynced += synced;
        totalFailed += failed;
      } catch (e) {
        console.error('[sync-store] Products sync error:', e);
        results.products = { synced: 0, failed: 0, errors: [e.message] };
      }
    }

    // Sync Orders
    if (syncTypes.includes('orders')) {
      console.log('[sync-store] Syncing orders...');
      try {
        const orders = await adapter.fetchOrders(store.store_url, store.api_key_encrypted);
        console.log(`[sync-store] Fetched ${orders.length} orders`);
        
        let synced = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const order of orders) {
          try {
            const normalized = adapter.normalizeOrder(order);
            const { error } = await supabase
              .from('synced_orders')
              .upsert({
                store_id: storeId,
                ...normalized,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'store_id,external_id' });

            if (error) {
              failed++;
              errors.push(`Order ${normalized.external_id}: ${error.message}`);
            } else {
              synced++;
            }
          } catch (e) {
            failed++;
            errors.push(`Order processing error: ${e.message}`);
          }
        }

        results.orders = { synced, failed, errors: errors.slice(0, 5) };
        totalSynced += synced;
        totalFailed += failed;
      } catch (e) {
        console.error('[sync-store] Orders sync error:', e);
        results.orders = { synced: 0, failed: 0, errors: [e.message] };
      }
    }

    // Sync Customers
    if (syncTypes.includes('customers')) {
      console.log('[sync-store] Syncing customers...');
      try {
        const customers = await adapter.fetchCustomers(store.store_url, store.api_key_encrypted);
        console.log(`[sync-store] Fetched ${customers.length} customers`);
        
        let synced = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const customer of customers) {
          try {
            const normalized = adapter.normalizeCustomer(customer);
            const { error } = await supabase
              .from('synced_customers')
              .upsert({
                store_id: storeId,
                ...normalized,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'store_id,external_id' });

            if (error) {
              failed++;
              errors.push(`Customer ${normalized.external_id}: ${error.message}`);
            } else {
              synced++;
            }
          } catch (e) {
            failed++;
            errors.push(`Customer processing error: ${e.message}`);
          }
        }

        results.customers = { synced, failed, errors: errors.slice(0, 5) };
        totalSynced += synced;
        totalFailed += failed;
      } catch (e) {
        console.error('[sync-store] Customers sync error:', e);
        results.customers = { synced: 0, failed: 0, errors: [e.message] };
      }
    }

    // Sync Inventory
    if (syncTypes.includes('inventory')) {
      console.log('[sync-store] Syncing inventory...');
      try {
        const inventory = await adapter.fetchInventory(store.store_url, store.api_key_encrypted);
        console.log(`[sync-store] Fetched ${inventory.length} inventory items`);
        
        let synced = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const item of inventory) {
          try {
            const normalized = adapter.normalizeInventoryItem(item, item.inventory_item_id || item.id);
            const { error } = await supabase
              .from('synced_inventory')
              .upsert({
                store_id: storeId,
                ...normalized,
                synced_at: new Date().toISOString(),
              }, { onConflict: 'store_id,external_variant_id' });

            if (error) {
              failed++;
              errors.push(`Inventory item: ${error.message}`);
            } else {
              synced++;
            }
          } catch (e) {
            failed++;
            errors.push(`Inventory processing error: ${e.message}`);
          }
        }

        results.inventory = { synced, failed, errors: errors.slice(0, 5) };
        totalSynced += synced;
        totalFailed += failed;
      } catch (e) {
        console.error('[sync-store] Inventory sync error:', e);
        results.inventory = { synced: 0, failed: 0, errors: [e.message] };
      }
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from('store_sync_logs')
        .update({
          status: totalFailed > 0 ? 'completed_with_errors' : 'completed',
          items_synced: totalSynced,
          items_failed: totalFailed,
          completed_at: new Date().toISOString(),
          metadata: { ...syncLog.metadata, results },
        })
        .eq('id', syncLog.id);
    }

    // Update store last_sync_at
    await supabase
      .from('stores')
      .update({
        last_sync_at: new Date().toISOString(),
        is_connected: true,
      })
      .eq('id', storeId);

    console.log(`[sync-store] Sync completed. Synced: ${totalSynced}, Failed: ${totalFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total_synced: totalSynced,
          total_failed: totalFailed,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-store] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
