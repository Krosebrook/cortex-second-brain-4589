import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple PDF text extraction without external dependencies
function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const text: string[] = [];
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const raw = decoder.decode(bytes);

  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
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

  if (text.length === 0) {
    const printableRegex = /[\x20-\x7E]{4,}/g;
    let printMatch;
    const seen = new Set<string>();
    while ((printMatch = printableRegex.exec(raw)) !== null) {
      const s = printMatch[0].trim();
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

// OCR fallback using Lovable AI (Gemini vision) for scanned/image-based PDFs
async function ocrWithAI(pdfBase64: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured — cannot perform OCR");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an OCR assistant. Extract ALL text content from the provided PDF document. Return ONLY the extracted text, preserving paragraph structure. Do not add commentary or summaries.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text from this PDF document. Return only the raw text content.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("AI OCR error:", response.status, errText);
    throw new Error(`AI OCR failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
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

    const contentType = req.headers.get("content-type") || "";
    let pdfBytes: Uint8Array;
    let fileName = "document.pdf";
    let rawBase64 = "";

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
      rawBase64 = base64Encode(pdfBytes);
    } else {
      const body = await req.json();
      if (!body.file_base64) {
        return new Response(
          JSON.stringify({ error: "No file_base64 provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      fileName = body.file_name || fileName;
      rawBase64 = body.file_base64;

      const binaryString = atob(body.file_base64);
      pdfBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pdfBytes[i] = binaryString.charCodeAt(i);
      }
    }

    if (pdfBytes.length < 5 || String.fromCharCode(...pdfBytes.slice(0, 5)) !== "%PDF-") {
      return new Response(
        JSON.stringify({ error: "Invalid PDF file" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (pdfBytes.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Try basic text extraction
    let extractedText = extractTextFromPdfBytes(pdfBytes);
    let method = "text-extraction";

    // Step 2: If no text found, try OCR via AI
    if (!extractedText) {
      try {
        console.log("No text extracted, attempting OCR via AI...");
        extractedText = await ocrWithAI(rawBase64);
        method = "ai-ocr";
      } catch (ocrError) {
        console.error("OCR fallback failed:", ocrError);
      }
    }

    if (!extractedText) {
      return new Response(
        JSON.stringify({
          text: "",
          file_name: fileName,
          method,
          warning: "No text could be extracted. The PDF may contain only images with unsupported encoding.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        text: extractedText,
        file_name: fileName,
        char_count: extractedText.length,
        method,
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
