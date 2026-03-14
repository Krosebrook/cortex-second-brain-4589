import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="https://deno.land/x/zipjs@v2.7.34/index.d.ts"
import { BlobReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.34/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract text from DOCX XML content
function extractTextFromDocxXml(xml: string): string {
  // Remove XML tags but preserve paragraph breaks
  // DOCX stores text in <w:t> tags within <w:p> (paragraph) elements
  const paragraphs: string[] = [];

  // Split by paragraph markers
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch;

  while ((pMatch = pRegex.exec(xml)) !== null) {
    const para = pMatch[0];
    // Extract all <w:t> text within this paragraph
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    const texts: string[] = [];

    while ((tMatch = tRegex.exec(para)) !== null) {
      texts.push(tMatch[1]);
    }

    const line = texts.join("").trim();
    if (line) {
      paragraphs.push(line);
    }
  }

  return paragraphs.join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    if (!body.file_base64) {
      return new Response(
        JSON.stringify({ error: "No file_base64 provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = body.file_name || "document.docx";

    // Decode base64 to bytes
    const binaryString = atob(body.file_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Limit file size to 10MB
    if (bytes.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DOCX is a ZIP file — extract word/document.xml
    const blob = new Blob([bytes]);
    const zipReader = new ZipReader(new BlobReader(blob));
    const entries = await zipReader.getEntries();

    let documentXml = "";
    for (const entry of entries) {
      if (entry.filename === "word/document.xml" && entry.getData) {
        const writer = new TextWriter();
        documentXml = await entry.getData(writer);
        break;
      }
    }
    await zipReader.close();

    if (!documentXml) {
      return new Response(
        JSON.stringify({ error: "Invalid DOCX file — word/document.xml not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedText = extractTextFromDocxXml(documentXml);

    if (!extractedText) {
      return new Response(
        JSON.stringify({
          text: "",
          file_name: fileName,
          warning: "No text could be extracted from the DOCX file.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        text: extractedText,
        file_name: fileName,
        char_count: extractedText.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("DOCX parsing error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to parse DOCX", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
