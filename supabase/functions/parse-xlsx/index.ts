import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// @deno-types="https://deno.land/x/zipjs@v2.7.34/index.d.ts"
import { BlobReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.34/index.js";

// Parse shared strings XML
function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let siMatch;
  while ((siMatch = siRegex.exec(xml)) !== null) {
    const tRegex = /<t[^>]*>([^<]*)<\/t>/g;
    let tMatch;
    const parts: string[] = [];
    while ((tMatch = tRegex.exec(siMatch[1])) !== null) {
      parts.push(tMatch[1]);
    }
    strings.push(parts.join(""));
  }
  return strings;
}

// Parse cell reference to column index (A=0, B=1, ..., Z=25, AA=26, etc.)
function colIndex(ref: string): number {
  const col = ref.replace(/[0-9]/g, "");
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1;
}

// Parse a single sheet XML into rows of strings
function parseSheetXml(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const cells: { col: number; value: string }[] = [];
    const cellRegex = /<c\s+r="([^"]+)"[^>]*(?:t="([^"]*)")?[^>]*>[\s\S]*?<v>([^<]*)<\/v>[\s\S]*?<\/c>/g;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const ref = cellMatch[1];
      const type = cellMatch[2] || "";
      const rawVal = cellMatch[3];
      const col = colIndex(ref);
      let value = rawVal;

      if (type === "s") {
        // Shared string index
        const idx = parseInt(rawVal, 10);
        value = sharedStrings[idx] ?? rawVal;
      }

      cells.push({ col, value });
    }

    if (cells.length > 0) {
      const maxCol = Math.max(...cells.map((c) => c.col));
      const row = new Array(maxCol + 1).fill("");
      for (const c of cells) {
        row[c.col] = c.value;
      }
      rows.push(row);
    }
  }

  return rows;
}

// Convert rows to CSV text
function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => {
        if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(",")
    )
    .join("\n");
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

    const fileName = body.file_name || "spreadsheet.xlsx";
    const binaryString = atob(body.file_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    if (bytes.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // XLSX is a ZIP — extract shared strings and sheets
    const blob = new Blob([bytes]);
    const zipReader = new ZipReader(new BlobReader(blob));
    const entries = await zipReader.getEntries();

    let sharedStringsXml = "";
    const sheetXmls: { name: string; xml: string }[] = [];

    for (const entry of entries) {
      if (!entry.getData) continue;
      const writer = new TextWriter();
      if (entry.filename === "xl/sharedStrings.xml") {
        sharedStringsXml = await entry.getData(writer);
      } else if (entry.filename.startsWith("xl/worksheets/sheet") && entry.filename.endsWith(".xml")) {
        const xml = await entry.getData(writer);
        sheetXmls.push({ name: entry.filename, xml });
      }
    }
    await zipReader.close();

    if (sheetXmls.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid XLSX file — no worksheets found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sharedStrings = parseSharedStrings(sharedStringsXml);

    // Parse all sheets and combine
    const allText: string[] = [];
    sheetXmls.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < sheetXmls.length; i++) {
      const rows = parseSheetXml(sheetXmls[i].xml, sharedStrings);
      if (rows.length > 0) {
        if (sheetXmls.length > 1) {
          allText.push(`--- Sheet ${i + 1} ---`);
        }
        allText.push(rowsToCsv(rows));
      }
    }

    const extractedText = allText.join("\n\n");

    if (!extractedText) {
      return new Response(
        JSON.stringify({
          text: "",
          file_name: fileName,
          warning: "No data could be extracted from the XLSX file.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        text: extractedText,
        file_name: fileName,
        char_count: extractedText.length,
        sheet_count: sheetXmls.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("XLSX parsing error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to parse XLSX", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
