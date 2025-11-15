import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('System status check initiated');

    const services: any[] = [];
    const startTime = Date.now();

    // Check Auth
    try {
      const authStart = Date.now();
      const { error: authError } = await supabase.auth.getSession();
      services.push({
        service: 'Supabase Auth',
        status: authError ? 'down' : 'healthy',
        responseTime: Date.now() - authStart,
        lastCheck: new Date().toISOString(),
        error: authError?.message,
      });
    } catch (error) {
      services.push({
        service: 'Supabase Auth',
        status: 'down',
        lastCheck: new Date().toISOString(),
        error: error.message,
      });
    }

    // Check Database
    try {
      const dbStart = Date.now();
      const { error: dbError } = await supabase
        .from('chats')
        .select('id')
        .limit(1);
      services.push({
        service: 'Supabase Database',
        status: dbError ? 'down' : 'healthy',
        responseTime: Date.now() - dbStart,
        lastCheck: new Date().toISOString(),
        error: dbError?.message,
      });
    } catch (error) {
      services.push({
        service: 'Supabase Database',
        status: 'down',
        lastCheck: new Date().toISOString(),
        error: error.message,
      });
    }

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

    // Determine overall status
    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    const overall = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

    const response = {
      overall,
      services,
      timestamp: new Date().toISOString(),
      totalResponseTime: Date.now() - startTime,
    };

    console.log('System status check completed:', overall);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in system-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
