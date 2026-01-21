import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Security Headers Edge Function
 * Returns recommended security headers for the application
 * Can be used as a middleware or for header inspection
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content Security Policy - adjust based on your needs
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'", // unsafe-eval needed for some React features
  "style-src 'self' 'unsafe-inline'", // unsafe-inline for Tailwind/styled components
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://gcqfqzhgludrzkfajljp.supabase.co https://api.openai.com wss://gcqfqzhgludrzkfajljp.supabase.co",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

// Security headers to apply
const securityHeaders: Record<string, string> = {
  // Prevent XSS attacks
  'Content-Security-Policy': CSP_DIRECTIVES,
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filter in older browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Enforce HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Control browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  
  // Prevent DNS prefetching
  'X-DNS-Prefetch-Control': 'off',
  
  // Control download behavior
  'X-Download-Options': 'noopen',
  
  // Prevent Adobe Flash/PDF from loading content
  'X-Permitted-Cross-Domain-Policies': 'none',
};

interface SecurityHeadersResponse {
  headers: Record<string, string>;
  cspDirectives: string[];
  recommendations: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get';

    if (action === 'get') {
      // Return the security headers configuration
      const response: SecurityHeadersResponse = {
        headers: securityHeaders,
        cspDirectives: CSP_DIRECTIVES.split('; '),
        recommendations: [
          'Apply these headers at the CDN/reverse proxy level for best performance',
          'Test CSP in report-only mode before enforcing',
          'Regularly audit and update CSP directives as your app evolves',
          'Consider using nonces or hashes for inline scripts/styles',
        ],
      };

      return new Response(JSON.stringify(response), {
        headers: {
          ...corsHeaders,
          ...securityHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    if (action === 'test') {
      // Test endpoint - returns headers applied to this response
      return new Response(
        JSON.stringify({
          message: 'Security headers applied successfully',
          timestamp: new Date().toISOString(),
          headersApplied: Object.keys(securityHeaders),
        }),
        {
          headers: {
            ...corsHeaders,
            ...securityHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=get or ?action=test' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[SecurityHeaders] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
