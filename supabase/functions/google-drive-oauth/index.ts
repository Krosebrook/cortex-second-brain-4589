import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface UserInfo {
  email: string;
  name?: string;
  picture?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    
    // Get Supabase client from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Action: Get OAuth URL for authorization
    if (action === "get-auth-url") {
      const redirectUri = url.searchParams.get("redirect_uri");
      if (!redirectUri) {
        throw new Error("Missing redirect_uri");
      }

      if (!GOOGLE_CLIENT_ID) {
        throw new Error("Google OAuth not configured. Please add GOOGLE_CLIENT_ID secret.");
      }

      const scopes = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
      ].join(" ");

      const state = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Exchange code for tokens
    if (action === "exchange-code") {
      const body = await req.json();
      const { code, redirect_uri } = body;

      if (!code || !redirect_uri) {
        throw new Error("Missing code or redirect_uri");
      }

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        throw new Error("Google OAuth not configured");
      }

      // Exchange authorization code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("Token exchange failed:", error);
        throw new Error("Failed to exchange authorization code");
      }

      const tokens: TokenResponse = await tokenResponse.json();

      // Get user info
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (!userInfoResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const userInfo: UserInfo = await userInfoResponse.json();

      // Create or get backup folder
      const folderId = await getOrCreateBackupFolder(tokens.access_token);

      return new Response(
        JSON.stringify({
          success: true,
          email: userInfo.email,
          name: userInfo.name,
          folderId,
          expiresIn: tokens.expires_in,
          // Don't send tokens to client - store them server-side if needed
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Refresh token
    if (action === "refresh-token") {
      const body = await req.json();
      const { refresh_token } = body;

      if (!refresh_token) {
        throw new Error("Missing refresh_token");
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to refresh token");
      }

      const tokens: TokenResponse = await tokenResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          expiresIn: tokens.expires_in,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Upload backup file
    if (action === "upload-backup") {
      const body = await req.json();
      const { access_token, folder_id, filename, data } = body;

      if (!access_token || !folder_id || !filename || !data) {
        throw new Error("Missing required parameters");
      }

      const fileContent = JSON.stringify(data, null, 2);
      const boundary = "-------cortex-backup-boundary";
      
      const metadata = {
        name: filename,
        parents: [folder_id],
        mimeType: "application/json"
      };

      const multipartBody = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify(metadata),
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        fileContent,
        `--${boundary}--`
      ].join('\r\n');

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        console.error("Upload failed:", error);
        throw new Error("Failed to upload backup");
      }

      const fileData = await uploadResponse.json();

      return new Response(
        JSON.stringify({
          success: true,
          fileId: fileData.id,
          fileName: fileData.name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to get or create backup folder
async function getOrCreateBackupFolder(accessToken: string): Promise<string> {
  const folderName = "Cortex Backups";

  // Search for existing folder
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create new folder
  const createResponse = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    }
  );

  if (!createResponse.ok) {
    throw new Error("Failed to create backup folder");
  }

  const folderData = await createResponse.json();
  return folderData.id;
}
