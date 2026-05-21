import { z } from "zod";

/**
 * Zod schema for structured template correction/recommendation outputs.
 * This represents the structured contract returned by the AI route.
 */
export const templateCorrectionResponseSchema = z.object({
  explanation: z.string().describe("Explanation of the changes or actions taken"),
  recommendedSetup: z.object({
    deliveryNoteMode: z.string().describe("Mode for delivery note (e.g., 'One document', 'By PO No.', 'By Delivery No.')"),
    headerFields: z.array(z.string()).describe("Header fields to extract"),
    lineRule: z.string().describe("Rule for line item grouping or creation"),
    labelQuantityRule: z.string().describe("Rule for label quantity generation (e.g., 'One label per row', 'By pallet count', 'By package count')"),
    barcodeContent: z.string().describe("Content of the barcode"),
  }),
  command: z.object({
    type: z.enum(["update_rules", "unrecognized_request"]),
    payload: z.record(z.string(), z.any()).describe("Payload containing rule changes"),
  }).describe("Structured command for the UI engine to execute"),
});

export type TemplateCorrectionResponse = z.infer<typeof templateCorrectionResponseSchema>;
