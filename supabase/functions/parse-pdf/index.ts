import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple PDF text extraction without external dependencies
// Handles both text-based PDFs by extracting readable strings
function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const text: string[] = [];
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const raw = decoder.decode(bytes);

  // Extract text between BT (Begin Text) and ET (End Text) operators
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];

    // Match Tj (show string) and TJ (show strings array) operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/gi;

    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const decoded = decodePdfString(tjMatch[1]);
      if (decoded.trim()) text.push(decoded);
    }

    while ((tjMatch = tjArrayRegex.exec(block)) !== null) {
      const arrayContent = tjMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      const parts: string[] = [];
      while ((strMatch = strRegex.exec(arrayContent)) !== null) {
        parts.push(decodePdfString(strMatch[1]));
      }
      if (parts.join("").trim()) text.push(parts.join(""));
    }
  }

  // Also try to extract text from streams (for some PDF encoders)
  if (text.length === 0) {
    // Fallback: extract any printable ASCII sequences of reasonable length
    const printableRegex = /[\x20-\x7E]{4,}/g;
    let printMatch;
    const seen = new Set<string>();
    while ((printMatch = printableRegex.exec(raw)) !== null) {
      const s = printMatch[0].trim();
      // Filter out PDF operators and metadata
      if (
        s.length > 10 &&
        !s.startsWith("/") &&
        !s.startsWith("<<") &&
        !s.includes("stream") &&
        !s.includes("endobj") &&
        !s.includes("xref") &&
        !seen.has(s)
      ) {
        seen.add(s);
        text.push(s);
      }
    }
  }

  return text.join("\n").trim();
}

function decodePdfString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const contentType = req.headers.get("content-type") || "";
    let pdfBytes: Uint8Array;
    let fileName = "document.pdf";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      fileName = file.name;
      pdfBytes = new Uint8Array(await file.arrayBuffer());
    } else {
      // Expect JSON with base64-encoded PDF
      const body = await req.json();
      if (!body.file_base64) {
        return new Response(
          JSON.stringify({ error: "No file_base64 provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      fileName = body.file_name || fileName;
      
      // Decode base64
      const binaryString = atob(body.file_base64);
      pdfBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pdfBytes[i] = binaryString.charCodeAt(i);
      }
    }

    // Validate it's a PDF (check magic bytes)
    if (pdfBytes.length < 5 || String.fromCharCode(...pdfBytes.slice(0, 5)) !== "%PDF-") {
      return new Response(
        JSON.stringify({ error: "Invalid PDF file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit file size to 10MB
    if (pdfBytes.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract text
    const extractedText = extractTextFromPdfBytes(pdfBytes);

    if (!extractedText) {
      return new Response(
        JSON.stringify({
          text: "",
          file_name: fileName,
          warning: "No text could be extracted. The PDF may contain only images or use unsupported encoding.",
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
    console.error("PDF parsing error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to parse PDF", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
