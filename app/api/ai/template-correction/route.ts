import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { templateCorrectionResponseSchema } from "@/lib/ai/schema";
import { TEMPLATE_CORRECTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, currentSetup } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = serverEnv.OPENAI_API_KEY;
    const modelName = serverEnv.OPENAI_MODEL || "gpt-5-mini";

    // Only attempt real AI SDK request if a real sk- key is provided
    if (apiKey && apiKey.startsWith("sk-")) {
      try {
        const openai = createOpenAI({ apiKey });
        const { object } = await generateObject({
          model: openai(modelName),
          schema: templateCorrectionResponseSchema,
          system: TEMPLATE_CORRECTION_SYSTEM_PROMPT,
          prompt: `User message requesting correction: "${message}"\n\nCurrent recommended setup:\n${JSON.stringify(
            currentSetup,
            null,
            2
          )}`,
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

    if (lowerMessage.includes("qr") || lowerMessage.includes("二维码")) {
      barcodeContent = "QR Code";
    } else if (lowerMessage.includes("code128") || lowerMessage.includes("一维码")) {
      barcodeContent = "Code128";
    }

    const mockResponse = {
      explanation: `AI Correction: Configured setup to use "${deliveryNoteMode}" for delivery notes, "${labelQuantityRule}" for labels, and "${barcodeContent}" for barcodes based on your instruction: "${message}".`,
      recommendedSetup: {
        deliveryNoteMode,
        headerFields,
        lineRule,
        labelQuantityRule,
        barcodeContent,
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
