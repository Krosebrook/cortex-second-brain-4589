import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdminClient = SupabaseClient<any, "public", any>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestData {
  message: string;
  chatId: string;
}

interface RateLimitConfig {
  max_attempts: number;
  time_window_minutes: number;
  block_duration_minutes: number;
  enabled: boolean;
}

// Database-backed rate limiting that persists across function instances
async function checkRateLimit(
  supabaseAdmin: SupabaseAdminClient,
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remainingRequests: number; resetAt: Date | null }> {
  if (!config.enabled) {
    return { allowed: true, remainingRequests: config.max_attempts, resetAt: null };
  }

  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.time_window_minutes);

  // Count requests in the time window using usage_tracking table
  const { count, error } = await supabaseAdmin
    .from('usage_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('feature', 'chat_api')
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Error checking rate limit:', error);
    // Fail open - allow request if rate limiting check fails
    return { allowed: true, remainingRequests: config.max_attempts, resetAt: null };
  }

  const requestCount = count || 0;
  const allowed = requestCount < config.max_attempts;
  const remainingRequests = Math.max(0, config.max_attempts - requestCount);

  // Calculate reset time
  let resetAt: Date | null = null;
  if (!allowed) {
    resetAt = new Date();
    resetAt.setMinutes(resetAt.getMinutes() + config.block_duration_minutes);
  }

  return { allowed, remainingRequests, resetAt };
}

// Record rate limit hit in database
async function recordRateLimitHit(
  supabaseAdmin: SupabaseAdminClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabaseAdmin
    .from('usage_tracking')
    .insert({
      user_id: userId,
      feature: 'chat_api',
      date: today,
      usage_count: 1,
      metadata: { timestamp: new Date().toISOString() }
    });

  if (error) {
    console.error('Error recording rate limit hit:', error);
  }
}

// Get rate limit configuration from database
async function getRateLimitConfig(
  supabaseAdmin: SupabaseAdminClient
): Promise<RateLimitConfig> {
  const defaultConfig: RateLimitConfig = {
    max_attempts: 20,
    time_window_minutes: 1,
    block_duration_minutes: 5,
    enabled: true
  };

  const { data, error } = await supabaseAdmin
    .from('rate_limit_config')
    .select('*')
    .eq('config_key', 'chat_api')
    .single();

  if (error || !data) {
    return defaultConfig;
  }

  return {
    max_attempts: (data.max_attempts as number) ?? defaultConfig.max_attempts,
    time_window_minutes: (data.time_window_minutes as number) ?? defaultConfig.time_window_minutes,
    block_duration_minutes: (data.block_duration_minutes as number) ?? defaultConfig.block_duration_minutes,
    enabled: (data.enabled as boolean) ?? defaultConfig.enabled
  };
}

// Input validation and sanitization
function validateAndSanitizeInput(message: string): { isValid: boolean; sanitized?: string; error?: string } {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required and must be a string' };
  }
  
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 4000) {
    return { isValid: false, error: 'Message is too long (max 4000 characters)' };
  }
  
  // Basic sanitization - remove potentially dangerous patterns
  const sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return { isValid: true, sanitized };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Admin client for rate limiting operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the request
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get rate limit config from database
    const rateLimitConfig = await getRateLimitConfig(supabaseAdmin);

    // Database-backed rate limiting check
    const { allowed, remainingRequests, resetAt } = await checkRateLimit(
      supabaseAdmin,
      user.id,
      rateLimitConfig
    );

    if (!allowed) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please wait before sending another message.',
          retryAfter: resetAt?.toISOString(),
          remainingRequests: 0
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt?.toISOString() || ''
          } 
        }
      );
    }

    // Record this request for rate limiting
    await recordRateLimitHit(supabaseAdmin, user.id);

    // Parse and validate request data
    const requestData: RequestData = await req.json();
    
    const validation = validateAndSanitizeInput(requestData.message);
    if (!validation.isValid) {
      console.warn(`Invalid input from user ${user.id}: ${validation.error}`);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const sanitizedMessage = validation.sanitized!;
    
    // Validate chatId
    if (!requestData.chatId || typeof requestData.chatId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid chat ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify chat ownership
    const { data: chatData, error: chatError } = await supabaseClient
      .from('chats')
      .select('user_id')
      .eq('id', requestData.chatId)
      .single();

    if (chatError || !chatData || chatData.user_id !== user.id) {
      console.warn(`Unauthorized chat access attempt by user ${user.id} for chat ${requestData.chatId}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Chat not found or access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Store user message
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: requestData.chatId,
        content: sanitizedMessage,
        role: 'user'
      });

    if (messageError) {
      console.error('Error storing user message:', messageError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to store message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user's knowledge base for context
    const { data: knowledgeData } = await supabaseClient
      .from('knowledge_base')
      .select('title, content, type')
      .eq('user_id', user.id)
      .limit(10);

    // Prepare context for AI
    let contextString = '';
    if (knowledgeData && knowledgeData.length > 0) {
      contextString = knowledgeData.map(kb => 
        `${kb.type}: ${kb.title}\n${kb.content}`
      ).join('\n\n');
    }

    // Call OpenAI API with enhanced security
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not available' }),
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `You are Tessa, an AI assistant helping users manage their knowledge and have productive conversations.

${contextString ? `Here is some context from the user's knowledge base:
${contextString}

` : ''}Please provide helpful, accurate responses based on the user's question and any relevant context from their knowledge base. Keep responses focused and conversational.`;

    // Add timeout to OpenAI request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitizedMessage }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!openAIResponse.ok) {
        const errorText = await openAIResponse.text();
        console.error('OpenAI API error:', openAIResponse.status, errorText);
        return new Response(
          JSON.stringify({ success: false, error: 'AI service temporarily unavailable' }),
          { 
            status: 503, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const openAIData = await openAIResponse.json();
      const aiMessage = openAIData.choices[0]?.message?.content;

      if (!aiMessage) {
        console.error('No AI response received');
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate response' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Store AI response
      const { error: aiMessageError } = await supabaseClient
        .from('messages')
        .insert({
          chat_id: requestData.chatId,
          content: aiMessage,
          role: 'assistant'
        });

      if (aiMessageError) {
        console.error('Error storing AI message:', aiMessageError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to store AI response' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Log successful interaction for monitoring
      console.log(`Successful chat interaction for user ${user.id} in chat ${requestData.chatId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: aiMessage,
          remainingRequests: remainingRequests - 1
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(remainingRequests - 1)
          } 
        }
      );
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('OpenAI request timed out');
        return new Response(
          JSON.stringify({ success: false, error: 'AI service request timed out' }),
          { 
            status: 504, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Unexpected error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
