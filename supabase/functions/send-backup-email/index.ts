import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BackupEmailRequest {
  email: string;
  backupData: {
    chats: any[];
    messages: any[];
    knowledge: any[];
  };
  format: 'json' | 'summary';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      'https://gcqfqzhgludrzkfajljp.supabase.co',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, backupData, format }: BackupEmailRequest = await req.json();

    const backupDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate summary statistics
    const stats = {
      chats: backupData.chats?.length || 0,
      messages: backupData.messages?.length || 0,
      knowledge: backupData.knowledge?.length || 0,
    };

    // Create the email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .stat-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #667eea; }
          .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🧠 Cortex Weekly Backup</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${backupDate}</p>
          </div>
          <div class="content">
            <h2>Your Data Summary</h2>
            <div class="stat-box">
              <div class="stat-number">${stats.chats}</div>
              <div>Chat Conversations</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${stats.messages}</div>
              <div>Total Messages</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">${stats.knowledge}</div>
              <div>Knowledge Items</div>
            </div>
            
            <p style="margin-top: 20px;">
              ${format === 'json' 
                ? 'Your full backup data is attached to this email as a JSON file. You can use this file to restore your data at any time.'
                : 'This is a summary of your Cortex data. To download the full backup, visit your Settings page.'}
            </p>
            
            <p style="color: #666; font-size: 14px;">
              This automated backup helps ensure your second brain is always safe and recoverable.
            </p>
          </div>
          <div class="footer">
            <p>Cortex - Your Digital Second Brain</p>
            <p>You're receiving this because you enabled email backups in your settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare attachments if full backup requested
    const attachments = format === 'json' ? [
      {
        filename: `cortex-backup-${new Date().toISOString().split('T')[0]}.json`,
        content: btoa(JSON.stringify(backupData, null, 2)),
      }
    ] : undefined;

    const emailResponse = await resend.emails.send({
      from: "Cortex <onboarding@resend.dev>",
      to: [email],
      subject: `🧠 Your Cortex Backup - ${backupDate}`,
      html: emailHtml,
      attachments,
    });

    console.log("Backup email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-backup-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
