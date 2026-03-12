import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Check if caller is authenticated (and optionally admin for detailed view)
    const authHeader = req.headers.get('Authorization');
    let isAdmin = false;

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data, error } = await userClient.auth.getUser();
      if (!error && data?.user) {
        // Check admin role for detailed response
        const { data: roleData } = await userClient.rpc('has_role', {
          _user_id: data.user.id,
          _role: 'admin',
        });
        isAdmin = roleData === true;
      }
    }

    // Public response: only overall status, no details
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();

    // Check if this is just a ping
    const { ping } = await req.json().catch(() => ({ ping: false }));
    if (ping) {
      return new Response(
        JSON.stringify({ pong: true, timestamp: new Date().toISOString() }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let authHealthy = true;
    let dbHealthy = true;
    let authResponseTime = 0;
    let dbResponseTime = 0;

    // Check Auth
    try {
      const authStart = Date.now();
      const { error: authError } = await serviceClient.auth.getSession();
      authResponseTime = Date.now() - authStart;
      if (authError) authHealthy = false;
    } catch {
      authHealthy = false;
    }

    // Check Database
    try {
      const dbStart = Date.now();
      const { error: dbError } = await serviceClient
        .from('chats')
        .select('id')
        .limit(1);
      dbResponseTime = Date.now() - dbStart;
      if (dbError) dbHealthy = false;
    } catch {
      dbHealthy = false;
    }

    const overall = !authHealthy || !dbHealthy ? 'down' : 'healthy';

    // Public: only overall status
    if (!isAdmin) {
      return new Response(
        JSON.stringify({
          overall,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Admin: full details
    const response = {
      overall,
      services: [
        {
          service: 'Auth',
          status: authHealthy ? 'healthy' : 'down',
          responseTime: authResponseTime,
          lastCheck: new Date().toISOString(),
        },
        {
          service: 'Database',
          status: dbHealthy ? 'healthy' : 'down',
          responseTime: dbResponseTime,
          lastCheck: new Date().toISOString(),
        },
      ],
      timestamp: new Date().toISOString(),
      totalResponseTime: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Error in system-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Service unavailable' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
