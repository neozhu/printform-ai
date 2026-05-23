import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// Shared constants for print-safe typography and styling
const PRINT_FONT_STACK = `'Segoe UI', 'Noto Sans SC', 'Helvetica Neue', Arial, sans-serif`;
const PRINT_BASE_STYLES = [
  "width: 100%",
  "height: 100%",
  "border-collapse: collapse",
  `font-family: ${PRINT_FONT_STACK}`,
  "font-size: 10px",
  "line-height: 1.4",
  "color: #18181b",
  "background-color: white",
  "box-sizing: border-box",
  "-webkit-print-color-adjust: exact",
  "print-color-adjust: exact",
].join("; ");

function removeInventedA4FooterBarcode<T extends { mappings?: { htmlTemplate?: string; barcodeArea?: unknown } }>(
  response: T,
  isLabel: boolean
): T {
  if (isLabel || !response.mappings?.htmlTemplate) {
    return response;
  }

  const emptyRowsIndex = response.mappings.htmlTemplate.search(/\{\{EmptyRows\}\}/i);
  const barcodeIndex = response.mappings.htmlTemplate.search(/\{\{Barcode\}\}/i);

  if (emptyRowsIndex >= 0 && barcodeIndex > emptyRowsIndex) {
    response.mappings.htmlTemplate = response.mappings.htmlTemplate.replace(
      /(\{\{EmptyRows\}\}[\s\S]*?)\{\{\s*Barcode\s*\}\}/i,
      "$1&nbsp;"
    );
    response.mappings.barcodeArea = null;
  }

  return response;
}

function normalizeA4FallbackBarcode<T extends { htmlTemplate: string; barcodeArea?: unknown }>(
  mappings: T,
  isLabel: boolean
): T {
  if (isLabel) {
    return mappings;
  }

  return {
    ...mappings,
    htmlTemplate: mappings.htmlTemplate
      .replace(/\s*\{\{\s*Barcode\s*\}\}\s*/gi, "&nbsp;")
      .replace(/\s*<span style="font-size: 8px; color: #71717a; font-family: monospace; display: block; margin-top: 3px; letter-spacing: 0.05em;">\*\{\{DocNo\}\}\*<\/span>/i, ""),
    barcodeArea: null,
  };
}

// Zod schema for validation and structured output
const layoutAnalysisResponseSchema = z.object({
  packageName: z.string().describe("A suggested short package name for this template layout based on the text/document features found in the image. Keep it concise, e.g. 'Standard Parts Labeling', 'Chassis Parts Delivery Note', 'Electronics Pack Slip'").nullable(),
  mappings: z.object({
    // The direct HTML layout generated from the target document
    htmlTemplate: z.string(),
    rowTemplate: z.string().nullable(),

    // Legacy/backwards compatibility coordinate mappings
    headerFields: z.array(
      z.object({
        name: z.string(),
        col: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      })
    ),
    tableArea: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      columns: z.array(
        z.object({
          name: z.string(),
          headerName: z.string(),
          col: z.string(),
          x: z.number(),
          width: z.number(),
        })
      ),
    }).nullable(),
    barcodeArea: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    }).nullable(),
  })
});

export async function POST(req: Request) {
  try {
    const { layoutImage, excelColumns, outputType } = await req.json();

    if (!layoutImage) {
      return NextResponse.json({ error: "Layout image is required" }, { status: 400 });
    }

    const columns = excelColumns || [];
    const isLabel = outputType === "Custom Size";

    // Standard local fallback generator in case AI fails or is not available
    const generateFallbackMappings = () => {
      const findCol = (regex: RegExp, fallback: string) => {
        const match = columns.find((c: string) => regex.test(c));
        return match || fallback;
      };

      const customerCol = findCol(/customer|client|buyer|company|ship\s*to|客户/i, "Customer");
      const poCol = findCol(/po|purchase|order|contract|订单/i, "PO Number");
      const dateCol = findCol(/date|日期/i, "Date");
      const partCol = findCol(/part|sku|material|item|code|物料|零件/i, "Part Code");
      const descCol = findCol(/desc|product|item|name|描述|品名/i, "Description");
      const qtyCol = findCol(/qty|quantity|count|pcs|数量/i, "Quantity");
      const uomCol = findCol(/uom|unit|单位/i, "Unit");
      const docNoCol = findCol(/delivery\s*no|dn|invoice|manifest|单号/i, "Doc No");
      const carrierCol = findCol(/carrier|shipper|logistics|承运/i, "Carrier");

      if (isLabel) {
        // ── Custom Size / Label Fallback Template ──
        const htmlTemplate = `
<table style="${PRINT_BASE_STYLES}; border: 1px solid #d4d4d8;">
  <tr>
    <td style="padding: 16px; vertical-align: top;">
      <!-- Label Header -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #18181b; margin-bottom: 8px;">
        <tr>
          <td style="font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; padding-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{Customer}}
          </td>
          <td style="text-align: right; padding-bottom: 6px; font-size: 8px; font-weight: 700; color: #71717a; text-transform: uppercase;">
            LABEL
          </td>
        </tr>
      </table>

      <!-- Part Details -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
          <td style="padding-bottom: 4px;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">Part Number</span>
            <span style="font-weight: 700; font-size: 12px; letter-spacing: 0.02em; color: #18181b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{PartNumber}}</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 2px;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">Description</span>
            <span style="font-weight: 600; color: #27272a; font-size: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{Description}}</span>
          </td>
        </tr>
      </table>

      <!-- Qty and PO -->
      <table style="width: 100%; border-collapse: collapse; background-color: #f8f8f8; border: 0.5px solid #d4d4d8; margin-bottom: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <tr>
          <td style="width: 50%; padding: 5px 6px; vertical-align: top; border-right: 0.5px solid #d4d4d8;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">Qty</span>
            <span style="font-weight: 700; font-size: 12px; color: #18181b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{Qty}}</span>
          </td>
          <td style="width: 50%; padding: 5px 6px; vertical-align: top;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">PO Number</span>
            <span style="font-weight: 700; font-size: 10px; color: #18181b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; word-break: break-all;">{{PONumber}}</span>
          </td>
        </tr>
      </table>

      <!-- Barcode Area -->
      <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #d4d4d8;">
        <tr>
          <td style="text-align: center; padding-top: 8px;">
            {{Barcode}}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
        `.trim();

        return {
          htmlTemplate,
          rowTemplate: null,
          headerFields: [
            { name: "Customer", col: customerCol, x: 10, y: 10, width: 80, height: 8 },
            { name: "Part Number", col: partCol, x: 10, y: 22, width: 80, height: 8 },
            { name: "Description", col: descCol, x: 10, y: 35, width: 80, height: 12 },
            { name: "Qty", col: qtyCol, x: 10, y: 52, width: 38, height: 8 },
            { name: "PO Number", col: poCol, x: 52, y: 52, width: 38, height: 8 }
          ],
          barcodeArea: { x: 10, y: 66, width: 80, height: 22 }
        };
      } else {
        // ── A4 Delivery Note Fallback Template ──
        const htmlTemplate = `
<table style="${PRINT_BASE_STYLES};">
  <tr>
    <td style="padding: 40px 48px; vertical-align: top;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #18181b; margin-bottom: 20px;">
        <tr>
          <td style="vertical-align: bottom; padding-bottom: 12px;">
            <span style="font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; display: block; line-height: 1;">Delivery Note</span>
            <span style="color: #71717a; font-weight: 600; font-size: 10px; display: block; margin-top: 4px;">Client: {{Customer}}</span>
          </td>
          <td style="vertical-align: bottom; text-align: right; padding-bottom: 12px;">
            <span style="font-weight: 700; font-size: 12px; display: block;">No. {{DocNo}}</span>
            <span style="color: #71717a; font-size: 10px; display: block; margin-top: 2px;">Date: {{Date}}</span>
          </td>
        </tr>
      </table>

      <!-- Addresses -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 16px; padding-bottom: 12px;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px;">From (Supplier)</span>
            <span style="font-weight: 600; font-size: 10px; display: block; color: #18181b;">PRINTFORM AI AUTO PARTS LTD</span>
            <span style="color: #52525b; font-size: 10px; display: block;">Industrial Park, Building 4B</span>
            <span style="color: #52525b; font-size: 10px; display: block;">Shenzhen, GD, China</span>
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 16px; padding-bottom: 12px;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px;">Ship To (Customer)</span>
            <span style="font-weight: 600; font-size: 10px; display: block; color: #18181b;">{{Customer}}</span>
            <span style="color: #52525b; font-size: 10px; display: block;">Receiving Dock 4, Building A</span>
            <span style="color: #52525b; font-size: 10px; display: block;">Austin, TX, USA</span>
          </td>
        </tr>
      </table>

      <!-- Metadata Row -->
      <table style="width: 100%; border-collapse: collapse; border: 0.5px solid #d4d4d8; margin-bottom: 20px; background-color: #f8f8f8; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <tr>
          <td style="width: 25%; padding: 8px 10px; vertical-align: top; border-right: 0.5px solid #d4d4d8;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">PO Number</span>
            <span style="font-weight: 600; font-size: 10px; color: #18181b; display: block; overflow-wrap: anywhere;">{{PONumber}}</span>
          </td>
          <td style="width: 25%; padding: 8px 10px; vertical-align: top; border-right: 0.5px solid #d4d4d8;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">Carrier</span>
            <span style="font-weight: 600; font-size: 10px; color: #18181b; display: block; overflow-wrap: anywhere;">{{Carrier}}</span>
          </td>
          <td style="width: 25%; padding: 8px 10px; vertical-align: top; border-right: 0.5px solid #d4d4d8;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">Weight</span>
            <span style="font-weight: 600; font-size: 10px; color: #18181b; display: block;">—</span>
          </td>
          <td style="width: 25%; padding: 8px 10px; vertical-align: top;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">Pallets</span>
            <span style="font-weight: 600; font-size: 10px; color: #18181b; display: block;">—</span>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 1px solid #18181b;">
            <th style="padding: 6px 4px; text-align: left; width: 8%; font-size: 8px; font-weight: 700; color: #71717a; text-transform: uppercase;">No.</th>
            <th style="padding: 6px 4px; text-align: left; width: 22%; font-size: 8px; font-weight: 700; color: #71717a; text-transform: uppercase;">Part Number</th>
            <th style="padding: 6px 4px; text-align: left; width: 42%; font-size: 8px; font-weight: 700; color: #71717a; text-transform: uppercase;">Description</th>
            <th style="padding: 6px 4px; text-align: right; width: 14%; font-size: 8px; font-weight: 700; color: #71717a; text-transform: uppercase;">Qty</th>
            <th style="padding: 6px 4px; text-align: right; width: 14%; font-size: 8px; font-weight: 700; color: #71717a; text-transform: uppercase;">UOM</th>
          </tr>
        </thead>
        <tbody>
          {{TableRows}}
        </tbody>
        <tbody>
          {{EmptyRows}}
        </tbody>

      <!-- Footer / Barcode -->
      <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #18181b;">
        <tr>
          <td style="padding-top: 16px; text-align: center;">
            {{Barcode}}
            <span style="font-size: 8px; color: #71717a; font-family: monospace; display: block; margin-top: 3px; letter-spacing: 0.05em;">*{{DocNo}}*</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 12px; text-align: center;">
            <span style="font-size: 8px; color: #a1a1aa; font-weight: 500;">Generated by PrintForm AI Engine</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
        `.trim();

        const rowTemplate = `
<tr style="border-bottom: 0.5px solid #d4d4d8; page-break-inside: avoid;">
  <td style="padding: 6px 4px; font-weight: 600; font-size: 10px; text-align: left; vertical-align: top; width: 8%;">{{Index}}</td>
  <td style="padding: 6px 4px; font-size: 10px; font-weight: 600; text-align: left; vertical-align: top; width: 22%; overflow-wrap: anywhere; word-break: break-all;">{{part}}</td>
  <td style="padding: 6px 4px; font-size: 10px; text-align: left; vertical-align: top; width: 42%; color: #27272a;">{{desc}}</td>
  <td style="padding: 6px 4px; font-size: 10px; font-weight: 600; text-align: right; vertical-align: top; width: 14%;">{{qty}}</td>
  <td style="padding: 6px 4px; font-size: 10px; text-align: right; vertical-align: top; width: 14%; color: #52525b;">{{uom}}</td>
</tr>
        `.trim();

        return {
          htmlTemplate,
          rowTemplate,
          headerFields: [
            { name: "Customer", col: customerCol, x: 10, y: 14, width: 45, height: 4 },
            { name: "Doc No", col: docNoCol, x: 65, y: 11, width: 25, height: 3 },
            { name: "Date", col: dateCol, x: 65, y: 15, width: 25, height: 3 },
            { name: "PO Number", col: poCol, x: 10, y: 24, width: 22, height: 3.5 },
            { name: "Carrier", col: carrierCol, x: 35, y: 24, width: 22, height: 3.5 }
          ],
          tableArea: {
            x: 10,
            y: 32,
            width: 80,
            height: 48,
            columns: [
              { name: "part", headerName: "Part Number", col: partCol, x: 0, width: 25 },
              { name: "desc", headerName: "Description", col: descCol, x: 25, width: 45 },
              { name: "qty", headerName: "Qty", col: qtyCol, x: 70, width: 15 },
              { name: "uom", headerName: "UoM", col: uomCol, x: 85, width: 15 }
            ]
          },
          barcodeArea: { x: 65, y: 20, width: 25, height: 7 }
        };
      }
    };

    // If API Key is present, try OpenAI Vision API
    const apiKey = serverEnv.OPENAI_API_KEY;
    const configuredModel = serverEnv.OPENAI_MODEL || "gpt-5-mini";

    if (apiKey && apiKey.startsWith("sk-")) {
      // Extract base64 image content and media type
      let base64Image = layoutImage;
      let mediaType = "image/png";

      if (layoutImage.startsWith("data:")) {
        const parts = layoutImage.split(",");
        if (parts.length === 2) {
          const meta = parts[0];
          base64Image = parts[1];
          const mimeMatch = meta.match(/data:([^;]+)/);
          if (mimeMatch) {
            mediaType = mimeMatch[1];
          }
        }
      }

      // We only analyze using vision if it's an image.
      const isSupportedImage = mediaType.startsWith("image/");

      if (isSupportedImage) {
        // Try configured model, fallback to gpt-4o, fallback to gpt-4o-mini
        const modelsToTry = [configuredModel, "gpt-4o", "gpt-4o-mini"];
        const openai = createOpenAI({ apiKey });

        for (const modelName of modelsToTry) {
          try {
            console.log(`Analyzing template layout image with OpenAI model: ${modelName}`);
            
            const promptText = buildAnalysisPrompt(outputType, columns);

            const { object } = await generateObject({
              model: openai(modelName),
              schema: layoutAnalysisResponseSchema,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: promptText },
                    {
                      type: "image",
                      image: base64Image,
                      mediaType: mediaType,
                    },
                  ],
                },
              ],
            });

            console.log("Successfully parsed layout coordinates & HTML template via AI:", JSON.stringify(object.mappings));
            return NextResponse.json(removeInventedA4FooterBarcode(object, isLabel));
          } catch (modelError: any) {
            console.warn(`Failed to generate layout mappings with model ${modelName}:`, modelError.message);
            // Continue to next model in list
          }
        }
      } else {
        console.warn(`Uploaded file with mediaType ${mediaType} is not a supported image. Falling back to deterministic mapping.`);
      }
    }

    // Fallback if API keys are missing or all models failed
    console.log("Using deterministic fallback mappings");
    return NextResponse.json({
      packageName: outputType === "Custom Size" ? "Standard Parts Labeling" : "Standard Parts Delivery Note",
      mappings: normalizeA4FallbackBarcode(generateFallbackMappings(), isLabel)
    });
  } catch (err: any) {
    console.error("AI Layout Analysis API error:", err);
    return NextResponse.json({ error: "Failed to analyze layout image" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Prompt Builder
// ─────────────────────────────────────────────────────────────────────────────

function buildAnalysisPrompt(outputType: string, columns: string[]): string {
  const columnsJson = JSON.stringify(columns);

  return `
You are an expert document layout engineer specializing in converting scanned/photographed form images into pixel-perfect, print-ready HTML templates using pure table-based layouts.

Your task: Analyze the uploaded template image and produce a high-fidelity HTML/CSS reproduction that is optimized for physical printing.

═══════════════════════════════════════════════════════════════
INPUTS
═══════════════════════════════════════════════════════════════
- Output Size/Type: ${outputType} (one of: "A4 Portrait", "A4 Landscape", "Custom Size")
- Available Excel columns from user data: ${columnsJson}

═══════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════
You must produce:
1. A \`packageName\` (root-level field): A concise name describing the template, e.g. "Standard Parts Labeling", "Chassis Parts Delivery Note", "Electronics Pack Slip".
2. \`mappings.htmlTemplate\`: A complete, self-contained HTML string using ONLY inline styles that visually reproduces the uploaded document image.
3. \`mappings.rowTemplate\`: A single \`<tr>\` HTML string for the data table row template (null for Custom Size / labels).
4. \`mappings.headerFields\`, \`mappings.tableArea\`, \`mappings.barcodeArea\`: Legacy coordinate-based mappings (percentage 0-100 relative to container).

═══════════════════════════════════════════════════════════════
RULE 1: HIGH-FIDELITY LAYOUT REPRODUCTION (CRITICAL)
═══════════════════════════════════════════════════════════════
You MUST faithfully reproduce the visual layout of the uploaded image. This is the most important requirement.

- **SINGLE CONTINUOUS TABLE (CRITICAL)**: The ENTIRE document — title, header fields, metadata, data table, and footer — MUST be rows within ONE single \`<table>\` element. There must be NO visual gaps or white space between sections. All rows share the same grid of borders with no interruption. This is how real printed forms look: one seamless bordered grid from top to bottom.
- **NO MARGIN / NO PADDING between sections**: Do NOT use \`margin-bottom\`, \`margin-top\`, \`padding-bottom\`, or any spacing between sections that would create visible gaps. The border lines between adjacent rows should touch/merge seamlessly.
  - **Zone-by-zone matching**: Examine each visual zone in the image (header, addresses, metadata bar, line-item table, footer/signature area) and reproduce its exact position, size ratio, and arrangement — all as rows within the same single table.
- **Border fidelity**: Reproduce the exact border style from the image:
  - If the image shows a full grid table with borders on every cell, you MUST add \`border: 0.5px solid #18181b;\` (or \`#a1a1aa\` for lighter borders) on every \`<td>\` and \`<th>\`.
  - If the image shows only horizontal rules between rows, use \`border-bottom\` only.
  - If the image shows a thick outer border with thin inner lines, replicate that pattern.
  - If the image shows double-line borders, use \`border: 3px double #18181b;\`.
  - NEVER invent borders that don't exist in the image. NEVER omit borders that DO exist.
- **Column width proportions**: Carefully observe the relative widths of each column in the image and map them to percentage widths that sum to 100%. For example, if a table has 5 columns and the first column visually occupies about 1/10 of the width, set it to \`width: 10%;\`.
- **Row height proportions**: Do NOT set fixed pixel heights on data rows. Let content determine height naturally with padding.
- **No invented decorations**: Do NOT add visual elements (shadows, gradients, rounded corners, colored backgrounds) that are not present in the original image.
- **Preserve all text labels**: Every static text label visible in the image (e.g., "送货单", "DELIVERY NOTE", "物料号", "Item", "Qty") must appear in the HTML output at the same relative position.
- **Reproduce the document title**: Match the title text, size, and position from the image exactly.

═══════════════════════════════════════════════════════════════
RULE 2: SINGLE CONTINUOUS TABLE LAYOUT (MANDATORY)
═══════════════════════════════════════════════════════════════
The entire HTML template MUST be ONE single \`<table>\` with all sections as rows within it.
Use \`colspan\` to create wide sections (like the title row spanning all columns).
Do NOT create separate/nested tables for different sections — this causes visible gaps between them.

THE STRUCTURE MUST BE:
\`\`\`
Outermost <table> (page wrapper with padding)
  └─ <tr><td> (single cell wrapper)
       └─ ONE <table> (the entire form)
            ├─ <tr> Title row (colspan=N to span full width)
            ├─ <tr> Header label row (e.g., "Supplier Name" | "Delivery Note No.")
            ├─ <tr> Header value row (e.g., {{Customer}} | {{DocNo}})
            ├─ <tr> Metadata label row (e.g., "Project No." | "Contact" | "PO No." | "Purchaser")
            ├─ <tr> Metadata value row
            ├─ <tr> Table header row (<th> for each column)
            ├─ <tbody> {{TableRows}} (data rows)
            ├─ <tbody> {{EmptyRows}} (empty padding rows)
            └─ <tr> Footer row (signature / sender info / blank cells exactly as seen)
\`\`\`

CRITICAL RULES:
- The form content table must have a FIXED number of columns (the maximum number of columns in the data table, e.g., 20 for a 20-column table).
- Header/title/metadata/footer rows that have fewer visual cells MUST use \`colspan\` to merge cells so they still span the full table width.
- ALL rows share the same column grid. Borders between rows are seamless — no gaps.
- \`<span>\` is allowed for inline text styling within a \`<td>\`.

ALLOWED:
- \`<table>\`, \`<tr>\`, \`<td>\`, \`<th>\`, \`<tbody>\`, \`<span>\`
- \`colspan\` and \`rowspan\` for merged cells
- Table-cell styling: \`width\`, \`height\`, \`text-align\`, \`vertical-align\`, \`padding\`, \`border\`

STRICTLY FORBIDDEN (will cause print failures):
- \`<div>\`, \`<section>\`, \`<article>\`, \`<header>\`, \`<footer>\`, \`<main>\`, \`<nav>\`
- \`<h1>\` through \`<h6>\`, \`<p>\`, \`<ul>\`, \`<ol>\`, \`<li>\`
- \`display: flex\`, \`display: grid\`, \`display: inline-block\`
- \`position: absolute\`, \`position: relative\`, \`position: fixed\`
- \`top\`, \`left\`, \`right\`, \`bottom\`, \`transform\`, \`translate\`
- \`float\`, \`clear\`
- \`box-shadow\`, \`border-radius\`, \`opacity\`, \`rgba()\` colors
- \`margin-top\`, \`margin-bottom\` on table rows or cells (causes gaps)
- Any CSS that requires a separate \`<style>\` block
- \`<thead>\` (browsers auto-hoist it to the top of the table, breaking layout)
- **Nested \`<table>\` elements inside cells** — use \`colspan\` instead

═══════════════════════════════════════════════════════════════
RULE 3: PAGE SIZE & PRINT MARGINS
═══════════════════════════════════════════════════════════════
The outermost element MUST be a single \`<table>\` that fills the page.

**A4 Portrait** (794px × 1123px at 96 DPI):
- Outermost \`<table>\`: \`style="width: 100%; height: 100%; ..."\`
- Single \`<tr><td>\` wrapper with \`padding: 40px 48px;\` (print-safe margin ~12mm)
- Content area: ~698px × 1043px

**A4 Landscape** (1123px × 794px at 96 DPI):
- Same structure, same \`padding: 40px 48px;\`
- Content area: ~1027px × 714px

**Custom Size / Label** (300px × 300px):
- Outermost wrapper \`<td>\` with \`padding: 15px;\`
- Content area: ~270px × 270px

═══════════════════════════════════════════════════════════════
RULE 4: TYPOGRAPHY — STRICT 4-LEVEL HIERARCHY
═══════════════════════════════════════════════════════════════
The outermost \`<table>\` element MUST set base typography:
\`style="width: 100%; height: 100%; border-collapse: collapse; font-family: 'Segoe UI', 'Noto Sans SC', 'Helvetica Neue', Arial, sans-serif; font-size: 10px; line-height: 1.4; color: #18181b; background-color: white; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact;"\`

Every text element must use EXACTLY one of these 4 levels:

| Level | Usage | Font Size | Weight | Color | Extra |
|-------|-------|-----------|--------|-------|-------|
| L1 — Title | Document title only ("DELIVERY NOTE", "送货单") | 18px | 700 | #18181b | text-transform: uppercase; letter-spacing: 0.04em |
| L2 — Subtitle | Section headers, doc number labels ("No.", "From:", "Ship To") | 12px | 700 | #18181b | — |
| L3 — Body | All data values, addresses, descriptions, row content | 10px | 400–600 | #18181b or #27272a | — |
| L4 — Label | Meta-key labels, column headers, captions ("PO NUMBER", "DATE") | 8px | 700 | #71717a | text-transform: uppercase |

RULES:
- Do NOT use any font-size outside this scale (no 9px, 11px, 14px, 16px, 20px, 24px, etc.)
- Title (L1) should appear ONCE in the document
- For **Custom Size / Label** templates, scale down: L1=12px, L2=10px, L3=10px, L4=8px
- For **dense tables with 10+ columns**, scale down table text: headers=8px, data=8px, line-height=1.2

═══════════════════════════════════════════════════════════════
RULE 5: PRINT OUTPUT OPTIMIZATION
═══════════════════════════════════════════════════════════════
These rules ensure the template prints with professional quality:

1. **Force background printing**: Add on outermost \`<table>\` AND on any cell with background-color:
   \`-webkit-print-color-adjust: exact; print-color-adjust: exact;\`

2. **Prevent row splitting across pages**: Add on EVERY \`<tr>\` in the data table:
   \`page-break-inside: avoid;\`

3. **Fine-line borders for print**: Use \`0.5px\` borders instead of \`1px\` for inner grid lines. Printers render 0.5px as crisp hairlines. Use \`1px\` or \`1.5px\` only for major section dividers.

4. **No transparency / RGBA**: Use only solid hex colors (#18181b, #71717a, #d4d4d8, #f8f8f8). Never use rgba(), hsla(), or opacity.

5. **High contrast**: Minimum text color is #71717a (for labels). Body text must be #18181b or #27272a. Background tints must be very light (#f8f8f8 maximum).

6. **Overflow protection**: Add \`overflow-wrap: anywhere; word-break: break-all;\` on cells that may contain long codes (part numbers, PO numbers, barcodes, SAP codes).

7. **Cell padding consistency**: Use \`padding: 4px 6px;\` for normal density, \`padding: 2px 4px;\` for dense tables. Never use 0 padding.

8. **NO gaps between sections**: Since the entire form is one continuous table, there must be NO \`margin-bottom\`, \`margin-top\`, or extra spacing between sections. Borders between rows should be seamless and continuous.

═══════════════════════════════════════════════════════════════
RULE 6: PLACEHOLDER TOKENS
═══════════════════════════════════════════════════════════════
Replace ALL dynamic values with double curly-brace placeholders:
- Customer name → {{Customer}}
- Purchase Order / PO Number → {{PONumber}}
- Document Number / DN → {{DocNo}}
- Date → {{Date}}
- Carrier / Shipper → {{Carrier}}

**Barcode rule is strict: DO NOT invent barcodes.**
- Only output {{Barcode}} if the uploaded image visibly contains a real barcode/QR graphic, a clearly labeled barcode/QR reserved area, or a table column whose header explicitly says "Barcode" / "条码".
- If the footer/bottom area is blank or only contains signature/sender/date text, preserve it as blank/text. Do NOT place {{Barcode}} there.
- If the image has a barcode table column, put {{Barcode}} only inside that rowTemplate column. Do NOT also add a footer barcode.
- If no barcode/QR appears in the uploaded image, set mappings.barcodeArea to null and do not include {{Barcode}} anywhere in htmlTemplate or rowTemplate.

For label templates (Custom Size), also use:
- {{PartNumber}}, {{Description}}, {{Qty}}

═══════════════════════════════════════════════════════════════
RULE 7: TABLE ROWS, EMPTY ROW PADDING & EXCEL COLUMN MAPPING (A4 only)
═══════════════════════════════════════════════════════════════
For A4 Portrait / A4 Landscape:

**In the htmlTemplate:**
1. The data table header row is a plain \`<tr>\` row (NOT wrapped in \`<thead>\`) in the same single table as the rest of the form. Use \`<th>\` cells for column headers. **CRITICAL: Do NOT use \`<thead>\` because browsers auto-hoist \`<thead>\` to the top of the \`<table>\`, breaking the layout.**
2. Each \`<th>\` MUST have an explicit \`width\` percentage that matches the visual column width in the image. All widths must sum to ~100%.
3. After the header row, place data and empty row placeholders in \`<tbody>\` sections:
   - First \`<tbody>\`: contains \`{{TableRows}}\` — this is where data rows will be inserted at runtime.
   - Second \`<tbody>\`: contains \`{{EmptyRows}}\` — this is where empty padding rows will be inserted at runtime to fill the remaining page space.
4. The \`{{EmptyRows}}\` placeholder is REQUIRED. It ensures that when there are fewer data rows than the form can fit, empty bordered rows fill the remaining vertical space so the form looks complete with all grid lines.

**In the rowTemplate (separate field):**
1. Output a single \`<tr>\` with the same number of \`<td>\` cells as the \`<thead>\` columns.
2. Each \`<td>\` MUST have the same \`width\`, \`text-align\`, and \`font-size\` as its corresponding \`<th>\`.
3. Add \`page-break-inside: avoid;\` on the \`<tr>\`.
4. Map each cell to an Excel column using the BEST MATCHING column name from: ${columnsJson}
   - Use the Excel column name as placeholder: e.g., \`{{物料号}}\`, \`{{交货数量}}\`, \`{{Description}}\`
   - Also add standard fallback placeholders for common fields:
     - Row index: {{Index}}
     - Part code / material: {{part}}
     - Description: {{desc}}
     - Quantity: {{qty}}
     - Unit / UOM: {{uom}}
   - If an Excel column exactly matches, prefer the Excel name. For cells without a matching Excel column, use the standard placeholder.

═══════════════════════════════════════════════════════════════
RULE 8: LABEL FIELDS (Custom Size only)
═══════════════════════════════════════════════════════════════
For Custom Size templates:
- There is NO line-item table. Set \`rowTemplate\` to null.
- Reproduce only the label fields visibly present in the uploaded image. Include Barcode only when the label image visibly has a barcode/QR or a clearly labeled barcode area.
- Map fields to Excel columns when possible: ${columnsJson}
- Fallback placeholders: {{Customer}}, {{PartNumber}}, {{Description}}, {{Qty}}, {{PONumber}}. Use {{Barcode}} only when the image explicitly shows a barcode/QR area.

═══════════════════════════════════════════════════════════════
RULE 9: LEGACY COORDINATE MAPPINGS (required for backwards compatibility)
═══════════════════════════════════════════════════════════════
In addition to the HTML template, provide percentage-based coordinate mappings (0–100 relative to the template container):

For **A4 Portrait / A4 Landscape**: Return headerFields, tableArea (with columns), and barcodeArea.
- headerFields names: "Customer", "Doc No", "Date", "PO Number", "Carrier"
- barcodeArea MUST be null unless the uploaded image visibly contains a barcode/QR area outside the normal data table. A table column named Barcode / 条码 is represented in tableArea columns, not barcodeArea.

For **Custom Size (Label)**: Return headerFields and barcodeArea (tableArea = null).
- headerFields names: "Customer", "Part Number", "Description", "Qty", "PO Number"
- barcodeArea MUST be null if the label image does not visibly contain a barcode/QR area.

Map each field's \`col\` to the best matching Excel column from: ${columnsJson}

═══════════════════════════════════════════════════════════════
FINAL CHECKLIST (verify before responding)
═══════════════════════════════════════════════════════════════
□ The form is ONE SINGLE CONTINUOUS TABLE — no nested tables, no gaps between sections
□ Header/title/metadata/footer rows use colspan to span the full table width
□ NO margin-top, margin-bottom, or spacing between sections — borders are seamless
□ {{EmptyRows}} placeholder is present after {{TableRows}} in a separate <tbody>
□ HTML uses ONLY <table>, <tr>, <td>, <th>, <tbody>, <span> elements
□ No <div>, <p>, <h1-h6>, <ul>, <ol>, <section>, <header>, <footer>, <thead>
□ No display:flex, display:grid, position:absolute/relative/fixed
□ No box-shadow, border-radius, opacity, rgba() colors
□ Font sizes are exactly 18px, 12px, 10px, or 8px (no other values)
□ All styles are inline (no <style> blocks)
□ Outermost table has -webkit-print-color-adjust: exact; print-color-adjust: exact
□ Data table rows have page-break-inside: avoid
□ All <th> and <td> in data table have explicit width percentages
□ Border style matches the uploaded image faithfully
□ Column count and header text match the uploaded image exactly
□ rowTemplate cell count matches thead column count
□ overflow-wrap: anywhere on cells with potential long text
□ No {{Barcode}} was added to a blank footer or blank bottom area
□ mappings.barcodeArea is null when no visible barcode/QR area exists in the uploaded image
`;
}
