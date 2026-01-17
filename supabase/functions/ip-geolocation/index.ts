import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeolocationResponse {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

async function lookupIP(ip: string): Promise<GeolocationResponse | null> {
  try {
    // Using ip-api.com (free, no API key required, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon`);
    
    if (!response.ok) {
      console.error("IP lookup failed:", response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === "fail") {
      console.log("IP lookup returned fail status for:", ip);
      return null;
    }
    
    return {
      ip,
      country: data.country || "Unknown",
      country_code: data.countryCode || "XX",
      region: data.regionName || data.region || "Unknown",
      city: data.city || "Unknown",
      latitude: data.lat || 0,
      longitude: data.lon || 0,
    };
  } catch (error) {
    console.error("Error looking up IP:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip_address, cache = true } = await req.json();
    
    if (!ip_address) {
      return new Response(
        JSON.stringify({ error: "ip_address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Skip private/local IPs
    const privateIPPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^0\./,
      /^localhost$/i,
    ];
    
    if (privateIPPatterns.some(pattern => pattern.test(ip_address))) {
      console.log("Skipping private IP:", ip_address);
      return new Response(
        JSON.stringify({ 
          ip: ip_address,
          country: "Private Network",
          country_code: "XX",
          region: "Local",
          city: "Local",
          latitude: 0,
          longitude: 0,
          cached: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );
    
    // Check cache first
    if (cache) {
      const { data: cached } = await supabaseClient
        .from("ip_geolocation")
        .select("*")
        .eq("ip_address", ip_address)
        .single();
      
      if (cached) {
        console.log("Returning cached geolocation for:", ip_address);
        return new Response(
          JSON.stringify({ ...cached, cached: true }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }
    
    // Lookup IP
    const geoData = await lookupIP(ip_address);
    
    if (!geoData) {
      return new Response(
        JSON.stringify({ 
          ip: ip_address,
          country: "Unknown",
          country_code: "XX",
          region: "Unknown",
          city: "Unknown",
          latitude: 0,
          longitude: 0,
          cached: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    // Cache the result
    if (cache) {
      await supabaseClient.rpc("cache_ip_geolocation", {
        p_ip_address: ip_address,
        p_country: geoData.country,
        p_country_code: geoData.country_code,
        p_region: geoData.region,
        p_city: geoData.city,
        p_latitude: geoData.latitude,
        p_longitude: geoData.longitude,
      });
    }
    
    console.log("Looked up and cached geolocation for:", ip_address, geoData.country);
    
    return new Response(
      JSON.stringify({ ...geoData, cached: false }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in ip-geolocation function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
