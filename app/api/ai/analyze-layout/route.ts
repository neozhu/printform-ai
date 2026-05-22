import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

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

      const customerCol = findCol(/customer|client|buyer|company|ship\s*to/i, "Customer");
      const poCol = findCol(/po|purchase|order|contract/i, "PO Number");
      const dateCol = findCol(/date/i, "Date");
      const partCol = findCol(/part|sku|material|item|code/i, "Part Code");
      const descCol = findCol(/desc|product|item|name/i, "Description");
      const qtyCol = findCol(/qty|quantity|count|pcs/i, "Quantity");
      const uomCol = findCol(/uom|unit/i, "Unit");
      const docNoCol = findCol(/delivery\s*no|dn|invoice|manifest/i, "Doc No");
      const carrierCol = findCol(/carrier|shipper|logistics/i, "Carrier");

      if (isLabel) {
        const htmlTemplate = `
<table style="width: 100%; height: 100%; border-collapse: collapse; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.3; background-color: white; color: #18181b; box-sizing: border-box; border: 1px solid #e4e4e7; border-radius: 6px;">
  <tr>
    <td style="padding: 20px; vertical-align: top;">
      <!-- Label Header -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #18181b; margin-bottom: 10px;">
        <tr>
          <td style="font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">
            {{Customer}} Parts
          </td>
          <td style="text-align: right; padding-bottom: 6px; font-size: 9px;">
            <span style="background-color: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid #e4e4e7; text-transform: uppercase;">Standard Label</span>
          </td>
        </tr>
      </table>

      <!-- Part Details -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <tr>
          <td style="padding-bottom: 4px;">
            <span style="font-size: 9px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">Part Number</span>
            <span style="font-weight: 900; font-size: 14px; letter-spacing: 0.02em; color: #18181b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{PartNumber}}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span style="font-size: 9px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">Description</span>
            <span style="font-weight: 700; color: #27272a; font-size: 11px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{Description}}</span>
          </td>
        </tr>
      </table>

      <!-- Qty and PO -->
      <table style="width: 100%; border-collapse: collapse; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 4px; margin-bottom: 12px;">
        <tr>
          <td style="width: 50%; padding: 6px; vertical-align: top;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">Qty</span>
            <span style="font-weight: 900; font-size: 12px; color: #18181b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{Qty}}</span>
          </td>
          <td style="width: 50%; padding: 6px; vertical-align: top;">
            <span style="font-size: 8px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase; line-height: 1;">PO Number</span>
            <span style="font-weight: 900; font-size: 12px; color: #18181b; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{PONumber}}</span>
          </td>
        </tr>
      </table>

      <!-- Barcode Area -->
      <table style="width: 100%; border-collapse: collapse; border-top: 1px dashed #d4d4d8; padding-top: 10px;">
        <tr>
          <td style="text-align: center; padding-top: 10px;">
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
        const htmlTemplate = `
<table style="width: 100%; border-collapse: collapse; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.4; background-color: white; color: #18181b; box-sizing: border-box;">
  <tr>
    <td style="padding: 40px; vertical-align: top;">
      <!-- Header Table -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
        <tr>
          <td style="vertical-align: top; padding-bottom: 16px;">
            <h1 style="font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Delivery Note</h1>
            <p style="color: #71717a; font-weight: 600; font-size: 11px; margin: 4px 0 0 0;">Client: {{Customer}}</p>
          </td>
          <td style="vertical-align: top; text-align: right; padding-bottom: 16px;">
            <p style="font-weight: 700; font-size: 14px; margin: 0;">Doc No: {{DocNo}}</p>
            <p style="color: #71717a; font-size: 11px; margin: 2px 0 0 0;">Date: {{Date}}</p>
          </td>
        </tr>
      </table>

      <!-- Addresses Table -->
      <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #e4e4e7; padding-bottom: 24px; margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-bottom: 24px; padding-right: 16px;">
            <h3 style="font-weight: 700; color: #a1a1aa; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; margin: 0 0 4px 0;">From (Supplier)</h3>
            <p style="font-weight: 700; font-size: 11px; margin: 0 0 2px 0;">PRINTFORM AI AUTO PARTS LTD</p>
            <p style="color: #52525b; font-size: 11px; margin: 0 0 2px 0;">Industrial Park, Building 4B</p>
            <p style="color: #52525b; font-size: 11px; margin: 0;">Shenzhen, GD, China</p>
          </td>
          <td style="width: 50%; vertical-align: top; padding-bottom: 24px; padding-left: 16px;">
            <h3 style="font-weight: 700; color: #a1a1aa; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; margin: 0 0 4px 0;">Ship To (Customer)</h3>
            <p style="font-weight: 700; font-size: 11px; margin: 0 0 2px 0;">{{Customer}} GIGAFACTORY</p>
            <p style="color: #52525b; font-size: 11px; margin: 0 0 2px 0;">Receiving Dock 4, Building A</p>
            <p style="color: #52525b; font-size: 11px; margin: 0;">Austin, TX, USA</p>
          </td>
        </tr>
      </table>

      <!-- Meta Table -->
      <table style="width: 100%; border-collapse: collapse; background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 6px; margin-bottom: 24px;">
        <tr>
          <td style="width: 25%; padding: 12px; vertical-align: top;">
            <span style="font-size: 10px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">PO Number</span>
            <span style="font-weight: 600; font-size: 11px; color: #27272a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">{{PONumber}}</span>
          </td>
          <td style="width: 25%; padding: 12px; vertical-align: top;">
            <span style="font-size: 10px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">Carrier</span>
            <span style="font-weight: 600; font-size: 11px; color: #27272a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">{{Carrier}}</span>
          </td>
          <td style="width: 25%; padding: 12px; vertical-align: top;">
            <span style="font-size: 10px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">Weight</span>
            <span style="font-weight: 600; font-size: 11px; color: #27272a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">1,420 kg</span>
          </td>
          <td style="width: 25%; padding: 12px; vertical-align: top;">
            <span style="font-size: 10px; color: #71717a; font-weight: 700; display: block; text-transform: uppercase;">Pallets</span>
            <span style="font-weight: 600; font-size: 11px; color: #27272a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">4 Units</span>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="width: 100%; text-align: left; margin-bottom: 32px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #27272a; font-size: 10px; font-weight: 700; color: #71717a; text-transform: uppercase;">
            <th style="padding: 8px 0; text-align: left; width: 10%;">Item</th>
            <th style="padding: 8px 0; text-align: left; width: 60%;">Description</th>
            <th style="padding: 8px 0; text-align: right; width: 15%;">Qty</th>
            <th style="padding: 8px 0; text-align: right; width: 15%;">UOM</th>
          </tr>
        </thead>
        <tbody style="border-bottom: 1px solid #e4e4e7;">
          {{TableRows}}
        </tbody>
      </table>

      <!-- Footer Table -->
      <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #e4e4e7; margin-top: 24px; padding-top: 24px; text-align: center;">
        <tr>
          <td style="padding-top: 24px; text-align: center;">
            <div style="display: inline-block; text-align: center;">
              {{Barcode}}
              <span style="font-size: 9px; color: #71717a; font-family: monospace; display: block; margin-top: 4px;">*{{DocNo}}*</span>
            </div>
            <p style="font-size: 10px; color: #a1a1aa; margin: 16px 0 0 0; font-weight: 500;">
              Generated automatically by PrintForm AI Engine. Certified template locked.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
        `.trim();

        const rowTemplate = `
<tr style="border-bottom: 1px solid #e4e4e7;">
  <td style="padding: 10px 0; font-weight: 700; font-size: 11px; text-align: left; vertical-align: middle;">{{Index}}</td>
  <td style="padding: 10px 0; vertical-align: middle;">
    <span style="font-weight: 700; font-size: 11px; display: block; color: #27272a;">{{part}}</span>
    <span style="color: #71717a; font-size: 10px; display: block;">{{desc}}</span>
  </td>
  <td style="padding: 10px 0; text-align: right; font-weight: 600; font-size: 11px; vertical-align: middle;">{{qty}}</td>
  <td style="padding: 10px 0; text-align: right; font-size: 11px; color: #71717a; vertical-align: middle;">{{uom}}</td>
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
            
            const promptText = `
You are an AI specialized in converting document layout images into high-fidelity, clean HTML/CSS templates.
We need to analyze an uploaded template image and generate:
1. A suggested short package name for this template layout based on the text/document features found in the image. Keep it concise, e.g. 'Standard Parts Labeling', 'Chassis Parts Delivery Note', 'Electronics Pack Slip' and set it in the root-level 'packageName' field.
2. A complete, self-contained HTML/CSS structure (using inline style attributes) that visually matches the document layout in the image.
3. A single row HTML template for the items table (if applicable).
4. The coordinate-based mappings for backwards compatibility.

Inputs:
- Output Size/Type: ${outputType} (can be "A4 Portrait", "A4 Landscape", "Custom Size")
- Available Excel columns from user upload: ${JSON.stringify(columns)}

Instructions for generating the HTML/CSS Template:
1. Target Document Dimensions & Print Safety Margins (at 96 DPI):
   - For "A4 Portrait": The template should fit exactly inside a container of width 794px and height 1123px.
     - You MUST wrap the entire template in an outermost \`<table>\` element.
     - The outermost \`<td>\` cell wrapper MUST have \`padding: 40px 48px;\` (approximately 10mm-15mm) to act as a print-safe margin, ensuring physical printers do not clip text/borders and the layout has comfortable breathing room.
     - Use \`box-sizing: border-box;\` and ensure no content overflows.
   - For "A4 Landscape": The template should fit exactly inside a container of width 1123px and height 794px.
     - The outermost wrapper cell MUST have \`padding: 40px 48px;\` for print margin safety.
   - For "Custom Size": The template should fit exactly inside a container of width 300px and height 300px.
     - The outermost wrapper cell MUST have a small padding of \`15px\` to \`20px;\`.
2. Unified Table-based Layout Standard:
   - You MUST structure the overall document layout using HTML \`<table>\` elements (using nested \`<table>\`, \`<tr>\`, \`<td>\`, and \`<th>\` tags).
   - Position and align all fields, header sections, address blocks, metadata key-value pairs, tables, and barcode elements exclusively inside table cells (\`<td>\`/\`<th>\`).
   - Use table-specific attributes and styles like \`colspan\`, \`rowspan\`, \`width\`, \`height\`, \`text-align\`, \`vertical-align\`, and cell \`padding\` to control positions, dimensions, and gaps.
   - NEVER use CSS absolute or relative positioning (\`position: absolute;\`, \`position: relative;\`, \`left\`, \`top\`, \`right\`, \`bottom\`) to layout or place any elements. Everything must flow naturally within the table rows and cells.
   - Do NOT use specific \`x-y\` coordinates, fixed widths/heights, or translate styling on blocks to control positioning.
3. Typography Standardization & Spacing (Preventing Bloat/Crowding):
   - **Base Style on Outermost Table**: The outermost \`<table>\` element MUST have base typography styles applied explicitly:
     \`style="width: 100%; height: 100%; border-collapse: collapse; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #18181b; background-color: white; box-sizing: border-box;"\`
   - **Explicit Font Sizes on All Elements**: Every text element in the template must either inherit from the 11px base, or have an explicit font-size style. Maintain a neat, clean, and uniform 4-level typography scale. Do NOT use random font sizes.
     - **Document Title / Main Headers**: 20px - 24px (bold, e.g., "DELIVERY NOTE", "INVOICE")
     - **Section Subheaders / Doc Numbers**: 12px - 14px (bold, e.g., "From", "Ship To", "Doc No:")
     - **Main Content / Body Texts / Row Data**: 10px - 11px (normal/semibold, e.g., addresses, item values, description, part numbers, PO number value, date value, etc.)
     - **Labels / Meta-keys / Captions / Small Notes**: 8px - 9px (bold, uppercase, muted color like \`#71717a\`, e.g., "PO NUMBER", "CARRIER", "DATE")
    - **Breathing Room, Borders & No Crowding**:
      - Set \`border-collapse: collapse;\` on all tables.
      - **Borders Compliance**: Closely match the border style of the input document. If the document uses a full grid table, make sure to add explicit borders to every single table cell (\`border: 1px solid #18181b;\` or \`border: 1px solid #a1a1aa;\`). Do NOT omit cell borders or use inconsistent line colors.
      - **Preventing Text Overlap & Overflow**: Set \`word-break: break-all;\` or \`overflow-wrap: anywhere;\` inline styles on every cell that might contain long alphanumeric strings (like SAP part numbers, PO items, WBS codes, dates, barcode tokens).
      - **Column Width Alignment**: You MUST specify explicit inline percentage widths (e.g. \`width: 5%;\`) on every \`<th>\` in the headers and the corresponding \`<td>\` in the row template. Ensure column widths are proportional and prevent any column from collapsing to zero width.
      - **Handling Dense/Multi-column Tables (10+ Columns)**: If the table has a large number of columns (such as 10 to 20 columns), the base typography scale MUST be scaled down. Set font-size on all cell text and header text in the table to \`8px\` or \`9px\`, and line-height to \`1.2\` to fit text without clipping or wrapping excessively.
      - **Barcode Column Space**: Set the barcode column width to at least \`8%\` to \`12%\` to ensure that the barcode fit is readable and does not overlap adjacent columns.
      - Ensure data cells and header cells have clean, consistent padding (e.g. \`padding: 4px;\` or \`padding: 2px 4px;\` for dense tables).
      - Avoid squishing elements. Do not set hard/restrictive height dimensions on text blocks or rows containing text (like description or addresses) to allow them to expand naturally. Use padding and row margin/gaps to create breathing room.
      - Add clean vertical space between tables using margin-bottom/padding on structural rows or wrapper cells (e.g. \`margin-bottom: 24px;\` or \`padding-bottom: 16px;\`).
    - The design must look premium, harmoniously aligned, and extremely professional. Keep background colors transparent or white.
4. Placeholder Tokens:
   - Replace any dynamic values with double curly-brace placeholder tokens:
     - Customer name: {{Customer}}
     - Purchase Order/PO Number: {{PONumber}}
     - Document Number/DN Number: {{DocNo}}
     - Date: {{Date}}
     - Carrier/Shipper: {{Carrier}}
     - Barcode or QR Code placeholder: {{Barcode}}
5. Table Rows (for A4 Portrait/Landscape):
   - Locate the item list / line items table in the layout image.
   - Replicate the table headers exactly. Ensure that the generated table header columns in the thead match the column headers in the image.
   - In the table body (tbody), place a single placeholder token: {{TableRows}}
   - You must ALSO output a separate 'rowTemplate' string containing the HTML structure of a single row (tr). Inside 'rowTemplate', the number, alignment, style, and width of cells (td) must match the headers in the thead exactly.
   - Map each cell in the 'rowTemplate' to the corresponding available Excel column from this list: ${JSON.stringify(columns)} by using the column name as placeholder enclosed in double curly braces, e.g. {{物料号}} or {{交货数量}}.
   - Use {{Index}} for the cell representing the item index/sequence number.
   - For cells representing part code, description, quantity, or UOM, you may also use standard placeholders:
     - Part Code / Part Number: {{part}}
     - Description: {{desc}}
     - Quantity: {{qty}}
     - UOM / Unit: {{uom}}
6. Label Fields (for Custom Size):
   - A label does not have a line item table. Replicate the fields on the label (Customer, Part Number, Description, Qty, PO Number, Barcode) as a table-based layout (nested standard table cells and rows).
   - Map the fields using the available Excel columns when possible: ${JSON.stringify(columns)}, or fallback to the placeholders: {{Customer}}, {{PartNumber}}, {{Description}}, {{Qty}}, {{PONumber}}, and {{Barcode}}.
7. The HTML code must be clean, semantic, and validate correctly. Avoid generic placeholders - make sure the layout matches the visual design of the uploaded template.

Legacy coordinate mappings instruction (still required in response):
1. Identify the percentage coordinates (0 to 100 relative to the template container) of the dynamic fields for backwards compatibility.
2. For A4 Portrait/Landscape, return coordinate-based headerFields, tableArea, and barcodeArea. For Custom Size, return headerFields and barcodeArea. Set names exactly as:
   - For A4 Portrait / A4 Landscape: "Customer", "Doc No", "Date", "PO Number", "Carrier"
   - For Custom Size (Label): "Customer", "Part Number", "Description", "Qty", "PO Number"
`;

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
            return NextResponse.json(object);
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
      mappings: generateFallbackMappings()
    });
  } catch (err: any) {
    console.error("AI Layout Analysis API error:", err);
    return NextResponse.json({ error: "Failed to analyze layout image" }, { status: 500 });
  }
}
