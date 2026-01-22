import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdminClient = SupabaseClient<any, "public", any>;

/**
 * Account Lockout Edge Function
 * Implements server-side account lockout after failed login attempts
 * 
 * Features:
 * - Blocks accounts after configurable number of failed attempts
 * - Progressive lockout durations
 * - IP-based and email-based tracking
 * - Automatic unlock after lockout period
 * - Admin override capability
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LockoutConfig {
  maxAttempts: number;
  lockoutDurationMinutes: number;
  progressiveLockout: boolean;
  trackByIp: boolean;
  trackByEmail: boolean;
}

interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutUntil: string | null;
  lockoutReason: string | null;
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  lockoutDurationMinutes: 15,
  progressiveLockout: true,
  trackByIp: true,
  trackByEmail: true,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'check';

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || '0.0.0.0';

    if (action === 'check') {
      // Check if account is locked
      const { email } = await req.json() as { email: string };
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const status = await checkLockoutStatus(supabaseAdmin, email, clientIp, DEFAULT_CONFIG);
      
      return new Response(
        JSON.stringify(status),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record-failure') {
      // Record a failed login attempt
      const { email, reason } = await req.json() as { email: string; reason?: string };
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userAgent = req.headers.get('user-agent') || 'unknown';
      const result = await recordFailedAttempt(supabaseAdmin, email, clientIp, userAgent, reason);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: result.isLocked ? 423 : 200, // 423 Locked
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (action === 'record-success') {
      // Clear failed attempts on successful login
      const { email } = await req.json() as { email: string };
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await clearFailedAttempts(supabaseAdmin, email, clientIp);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Login attempts cleared' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'unlock') {
      // Admin unlock - requires authorization
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { email, ip } = await req.json() as { email?: string; ip?: string };
      
      if (!email && !ip) {
        return new Response(
          JSON.stringify({ error: 'Email or IP is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await adminUnlock(supabaseAdmin, email, ip);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Account unlocked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use check, record-failure, record-success, or unlock' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AccountLockout] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkLockoutStatus(
  supabase: SupabaseAdminClient,
  email: string,
  ip: string,
  config: LockoutConfig
): Promise<LockoutStatus> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.lockoutDurationMinutes);

  // Check for active IP blocks
  const { data: blockedIp } = await supabase
    .from('blocked_ips')
    .select('*')
    .eq('ip_address', ip)
    .or(`blocked_until.is.null,blocked_until.gt.${new Date().toISOString()}`)
    .single();

  if (blockedIp) {
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutUntil: blockedIp.blocked_until as string | null,
      lockoutReason: blockedIp.reason as string | null,
    };
  }

  // Count recent failed attempts
  const { count } = await supabase
    .from('failed_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .gte('attempted_at', windowStart.toISOString());

  const attemptCount = count || 0;
  const remainingAttempts = Math.max(0, config.maxAttempts - attemptCount);

  if (attemptCount >= config.maxAttempts) {
    // Calculate lockout end time
    const lockoutDuration = config.progressiveLockout 
      ? config.lockoutDurationMinutes * Math.pow(2, Math.floor(attemptCount / config.maxAttempts) - 1)
      : config.lockoutDurationMinutes;
    
    const lockoutUntil = new Date();
    lockoutUntil.setMinutes(lockoutUntil.getMinutes() + lockoutDuration);

    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutUntil: lockoutUntil.toISOString(),
      lockoutReason: `Too many failed login attempts (${attemptCount})`,
    };
  }

  return {
    isLocked: false,
    remainingAttempts,
    lockoutUntil: null,
    lockoutReason: null,
  };
}

async function recordFailedAttempt(
  supabase: SupabaseAdminClient,
  email: string,
  ip: string,
  userAgent: string,
  reason?: string
): Promise<LockoutStatus & { message: string }> {
  // Record the failed attempt
  await supabase.from('failed_login_attempts').insert({
    email: email.toLowerCase(),
    ip_address: ip,
    user_agent: userAgent,
    attempted_at: new Date().toISOString(),
  });

  // Check if we should block the IP
  const { count: ipAttempts } = await supabase
    .from('failed_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('attempted_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

  // Auto-block IP after 10 failed attempts from same IP in 1 hour
  if ((ipAttempts || 0) >= 10) {
    const blockedUntil = new Date();
    blockedUntil.setHours(blockedUntil.getHours() + 1);

    await supabase.from('blocked_ips').upsert({
      ip_address: ip,
      reason: reason || 'Automatic block: Too many failed login attempts',
      blocked_until: blockedUntil.toISOString(),
      permanent: false,
    });

    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutUntil: blockedUntil.toISOString(),
      lockoutReason: 'IP temporarily blocked due to suspicious activity',
      message: 'Your IP has been temporarily blocked. Please try again later.',
    };
  }

  // Get regular lockout status
  const status = await checkLockoutStatus(supabase, email, ip, DEFAULT_CONFIG);
  
  return {
    ...status,
    message: status.isLocked 
      ? `Account locked. Please try again after ${status.lockoutUntil}`
      : `Login failed. ${status.remainingAttempts} attempts remaining.`,
  };
}

async function clearFailedAttempts(
  supabase: SupabaseAdminClient,
  email: string,
  ip: string
): Promise<void> {
  // Clear failed attempts for this email
  await supabase
    .from('failed_login_attempts')
    .delete()
    .eq('email', email.toLowerCase());

  // Remove any temporary IP blocks (keep permanent ones)
  await supabase
    .from('blocked_ips')
    .delete()
    .eq('ip_address', ip)
    .eq('permanent', false);

  console.log(`[AccountLockout] Cleared failed attempts for ${email}`);
}

async function adminUnlock(
  supabase: SupabaseAdminClient,
  email?: string,
  ip?: string
): Promise<void> {
  if (email) {
    await supabase
      .from('failed_login_attempts')
      .delete()
      .eq('email', email.toLowerCase());
  }

  if (ip) {
    await supabase
      .from('blocked_ips')
      .delete()
      .eq('ip_address', ip);
  }

  console.log(`[AccountLockout] Admin unlocked: email=${email}, ip=${ip}`);
}
