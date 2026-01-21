/**
 * @deprecated Use chat-with-tessa-secure instead
 * This legacy function lacks server-side rate limiting and should be removed.
 * Migration: Update client code to call chat-with-tessa-secure endpoint.
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, chatId } = await req.json();
    console.log('Chat request:', { message, chatId, userId: user.id });

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store user message
    const { error: userMessageError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chatId,
        content: message,
        role: 'user'
      });

    if (userMessageError) {
      console.error('Error storing user message:', userMessageError);
      return new Response(JSON.stringify({ error: 'Failed to store message' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's knowledge base for context
    const { data: knowledgeData } = await supabaseClient
      .from('knowledge_base')
      .select('title, content, type')
      .eq('user_id', user.id)
      .limit(5);

    const contextContent = knowledgeData?.map(item => 
      `[${item.type}] ${item.title}: ${item.content.slice(0, 300)}...`
    ).join('\n\n') || '';

    // Prepare system prompt with context
    const systemPrompt = `You are Tessa, an advanced AI assistant with powerful analytical capabilities. You help users manage their knowledge, analyze information, and make connections between ideas.

Your capabilities include:
- Advanced reasoning and multi-step analysis
- Pattern recognition across large datasets  
- Real-time information synthesis
- Contextual understanding and memory
- Creative problem-solving
- Strategic planning and decision support

${contextContent ? `User's Knowledge Base Context:\n${contextContent}\n\n` : ''}

Respond in a helpful, intelligent manner that demonstrates your advanced capabilities. Be concise but thorough.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message.content;

    // Store assistant message
    const { error: assistantMessageError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chatId,
        content: assistantMessage,
        role: 'assistant'
      });

    if (assistantMessageError) {
      console.error('Error storing assistant message:', assistantMessageError);
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});