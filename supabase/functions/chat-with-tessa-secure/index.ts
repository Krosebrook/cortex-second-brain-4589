import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestData {
  message: string;
  chatId: string;
}

// Rate limiting storage
const rateLimitStore = new Map<string, number[]>();

// Rate limiting function
function isRateLimited(userId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  
  // Remove old requests
  const validRequests = userRequests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return true;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(userId, validRequests);
  
  return false;
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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

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

    // Rate limiting check
    if (isRateLimited(user.id, 20, 60000)) { // 20 requests per minute
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please wait before sending another message.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
    });

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
        message: aiMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

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