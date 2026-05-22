import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { templateCorrectionResponseSchema } from "@/lib/ai/schema";
import { TEMPLATE_CORRECTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, currentSetup, excelColumns, excelRows } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = serverEnv.OPENAI_API_KEY;
    const modelName = serverEnv.OPENAI_MODEL || "gpt-5-mini";

    // Only attempt real AI SDK request if a real sk- key is provided
    if (apiKey && apiKey.startsWith("sk-")) {
      try {
        const openai = createOpenAI({ apiKey });
        
        let promptText = `User message requesting correction: "${message}"\n\nCurrent recommended setup:\n${JSON.stringify(
          currentSetup,
          null,
          2
        )}`;
        
        if (currentSetup?.layoutMappings) {
          promptText += `\n\nCurrent HTML/CSS template mappings:\n${JSON.stringify(currentSetup.layoutMappings, null, 2)}`;
        }
        if (excelColumns && excelColumns.length > 0) {
          promptText += `\n\nAvailable spreadsheet columns: ${JSON.stringify(excelColumns)}`;
        }
        if (excelRows && excelRows.length > 0) {
          promptText += `\n\nSample spreadsheet row data (first 5 rows): ${JSON.stringify(excelRows)}`;
        }

        const { object } = await generateObject({
          model: openai(modelName),
          schema: templateCorrectionResponseSchema,
          system: TEMPLATE_CORRECTION_SYSTEM_PROMPT,
          prompt: promptText,
        });
        return NextResponse.json(object);
      } catch (aiError: any) {
        console.error("Vercel AI SDK error, falling back to mock:", aiError);
      }
    }

    // Deterministic mock response that matches templateCorrectionResponseSchema structure
    // We map common keywords to return context-aware mocked rules.
    const lowerMessage = message.toLowerCase();
    
    let deliveryNoteMode = currentSetup?.deliveryNoteMode || "One document";
    let labelQuantityRule = currentSetup?.labelQuantityRule || "One label per row";
    let barcodeContent = currentSetup?.barcodeContent || "Code128";
    let headerFields = currentSetup?.headerFields || ["Customer", "PO Number", "Date"];
    let lineRule = currentSetup?.lineRule || "Standard row output";

    if (lowerMessage.includes("po") || lowerMessage.includes("订单")) {
      deliveryNoteMode = "By PO No.";
      barcodeContent = "PO Number + Item Code";
    } else if (lowerMessage.includes("delivery") || lowerMessage.includes("交货")) {
      deliveryNoteMode = "By Delivery No.";
    } else if (lowerMessage.includes("one document") || lowerMessage.includes("单张")) {
      deliveryNoteMode = "One document";
    }

    if (lowerMessage.includes("pallet") || lowerMessage.includes("托盘")) {
      labelQuantityRule = "By pallet count";
    } else if (lowerMessage.includes("row") || lowerMessage.includes("行")) {
      labelQuantityRule = "One label per row";
    } else if (lowerMessage.includes("package") || lowerMessage.includes("包装") || lowerMessage.includes("件")) {
      labelQuantityRule = "By package count";
    }

    let customBarcodeFormula = "";
    const normalizedMessage = message.replace(/[‘“]/g, "'").replace(/[’”]/g, "'");
    const customBarcodeRegex = /(?:条码字段|条码|barcode)\s*(?:用|使用|use)\s*(.+?)\s*(?:的组合|生成|的组合键|$)/i;
    const match = normalizedMessage.match(customBarcodeRegex);
    
    if (match) {
      const formulaCandidate = match[1].trim();
      if (formulaCandidate.includes("+") || (excelColumns && excelColumns.some((col: string) => formulaCandidate.includes(col)))) {
        customBarcodeFormula = formulaCandidate;
      }
    } else if (normalizedMessage.includes("+")) {
      const plusRegex = /([a-zA-Z0-9\u4e00-\u9fa5_\s+''"“‘”’]+)\s*(?:生成|作为|组合)/;
      const plusMatch = normalizedMessage.match(plusRegex);
      if (plusMatch) {
        customBarcodeFormula = plusMatch[1].trim();
      }
    }

    if (customBarcodeFormula) {
      if (lowerMessage.includes("39") || lowerMessage.includes("code39")) {
        barcodeContent = `${customBarcodeFormula} (Code39)`;
      } else if (lowerMessage.includes("qr") || lowerMessage.includes("二维码")) {
        barcodeContent = `${customBarcodeFormula} (QR Code)`;
      } else {
        barcodeContent = customBarcodeFormula;
      }
    } else {
      if (lowerMessage.includes("qr") || lowerMessage.includes("二维码")) {
        barcodeContent = "QR Code";
      } else if (lowerMessage.includes("code128") || lowerMessage.includes("一维码")) {
        barcodeContent = "Code128";
      } else if (lowerMessage.includes("39") || lowerMessage.includes("code39")) {
        barcodeContent = "Code39";
      }
    }

    let layoutMappings = currentSetup?.layoutMappings ? { ...currentSetup.layoutMappings } : null;

    if (layoutMappings) {
      let html = layoutMappings.htmlTemplate || "";
      let row = layoutMappings.rowTemplate || "";

      // 1. Text align adjustments (centering)
      if (lowerMessage.includes("居中") || lowerMessage.includes("center")) {
        html = html.replace(/text-align:\s*left/g, "text-align: center");
        html = html.replace(/text-align:\s*right/g, "text-align: center");
      }
      
      // 2. Font size adjustments (smaller)
      if (lowerMessage.includes("小") || lowerMessage.includes("smaller") || lowerMessage.includes("reduce font") || lowerMessage.includes("字体")) {
        html = html.replace(/font-size:\s*11px/g, "font-size: 8px");
        html = html.replace(/font-size:\s*12px/g, "font-size: 9px");
        html = html.replace(/font-size:\s*14px/g, "font-size: 11px");
        html = html.replace(/font-size:\s*24px/g, "font-size: 18px");
        if (row) {
          row = row.replace(/font-size:\s*11px/g, "font-size: 8px");
          row = row.replace(/font-size:\s*10px/g, "font-size: 8px");
        }
      }

      // 3. Font size adjustments (larger)
      if (lowerMessage.includes("大") || lowerMessage.includes("larger") || lowerMessage.includes("increase font")) {
        html = html.replace(/font-size:\s*11px/g, "font-size: 13px");
        html = html.replace(/font-size:\s*12px/g, "font-size: 14px");
        html = html.replace(/font-size:\s*14px/g, "font-size: 16px");
        if (row) {
          row = row.replace(/font-size:\s*11px/g, "font-size: 13px");
        }
      }

      // 4. Border adjustments
      if (lowerMessage.includes("边框") || lowerMessage.includes("border")) {
        html = html.replace(/border-bottom:\s*[^;]+/g, "border: 1.5px solid #18181b");
        if (row) {
          row = row.replace(/border-bottom:\s*[^;]+/g, "border: 1px solid #18181b");
        }
      }

      // 5. Margin/Padding/Border spacing adjustments
      if (lowerMessage.includes("边距") || lowerMessage.includes("margin") || lowerMessage.includes("padding")) {
        html = html.replace(/padding:\s*40px\s*48px/g, "padding: 20px 24px");
      }

      // 6. Header line-height and padding compression
      if (
        lowerMessage.includes("行高") || 
        lowerMessage.includes("压缩") || 
        lowerMessage.includes("头部") || 
        lowerMessage.includes("紧凑") || 
        lowerMessage.includes("height") || 
        lowerMessage.includes("spacing") || 
        lowerMessage.includes("line-height")
      ) {
        // Compress line height from 1.4/1.3 to 1.15
        html = html.replace(/line-height:\s*1\.[34]/g, "line-height: 1.15");
        // Compress padding-bottom of Header Table from 16px to 6px
        html = html.replace(/padding-bottom:\s*16px/g, "padding-bottom: 6px");
        // Compress margin-bottom of tables from 24px/32px to 10px/14px
        html = html.replace(/margin-bottom:\s*24px/g, "margin-bottom: 10px");
        html = html.replace(/margin-bottom:\s*32px/g, "margin-bottom: 14px");
        // Compress padding-bottom of Addresses Table from 24px to 10px
        html = html.replace(/padding-bottom:\s*24px/g, "padding-bottom: 10px");
        // Compress padding in Meta Table cells from 12px to 6px
        html = html.replace(/padding:\s*12px/g, "padding: 6px");
        // Compress main outer padding from 40px to 15px
        html = html.replace(/padding:\s*40px/g, "padding: 15px");
        
        if (row) {
          row = row.replace(/line-height:\s*1\.[34]/g, "line-height: 1.1");
          row = row.replace(/padding:\s*8px/g, "padding: 4px");
        }
      }

      // 7. Target element style changes (e.g. "第一行" / "first row" line spacing/padding compression)
      if (
        lowerMessage.includes("第一行") || 
        lowerMessage.includes("首行") || 
        lowerMessage.includes("first row")
      ) {
        if (
          lowerMessage.includes("行高") || 
          lowerMessage.includes("压缩") || 
          lowerMessage.includes("紧凑") || 
          lowerMessage.includes("padding") || 
          lowerMessage.includes("间距")
        ) {
          // Adjust table header row cells padding from 8px to 3px
          html = html.replace(/<th style="padding:\s*8px/g, '<th style="padding: 3px');
          // Inject line-height on header elements or first table row cells
          html = html.replace(/<tr style="border-bottom: 1px solid #27272a;[^>]*>/, (match: string) => {
            if (match.includes("line-height")) {
              return match.replace(/line-height:\s*[^;]+/g, "line-height: 1.1");
            } else {
              return match.replace(/style="/, 'style="line-height: 1.1; ');
            }
          });
          // Adjust items row template padding to 3px to compact it
          if (row) {
            row = row.replace(/padding:\s*10px\s*0/gi, "padding: 3px 0");
            row = row.replace(/line-height:\s*[^;]+/g, "line-height: 1.1");
          }
        }
      }

      layoutMappings.htmlTemplate = html;
      layoutMappings.rowTemplate = row || null;
    }

    const mockResponse = {
      explanation: `AI Correction: Configured setup to use "${deliveryNoteMode}" for delivery notes, "${labelQuantityRule}" for labels, and "${barcodeContent}" for barcodes based on your instruction: "${message}".`,
      recommendedSetup: {
        deliveryNoteMode,
        headerFields,
        lineRule,
        labelQuantityRule,
        barcodeContent,
        layoutMappings,
      },
      command: {
        type: "update_rules",
        payload: {
          updatedAt: new Date().toISOString(),
          source: "natural-language-correction",
        },
      },
    };

    return NextResponse.json(mockResponse);
  } catch (error: any) {
    console.error("Error in template-correction endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process template correction request" },
      { status: 500 }
    );
  }
}
