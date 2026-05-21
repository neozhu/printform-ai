export type TemplateStatus = "draft" | "locked" | "archived";

export interface RecommendedSetup {
  deliveryNoteMode: string;
  headerFields: string[];
  lineRule: string;
  labelQuantityRule: string;
  barcodeContent: string;
}

export interface TemplatePackage {
  id: string;
  customerName: string;
  packageName: string;
  outputs: ("Delivery Note" | "Label")[];
  status: TemplateStatus;
  version: string;
  updatedAt: string;
  recommendedSetup: RecommendedSetup;
}

export interface PrintSession {
  id: string;
  templateId: string;
  packageName: string;
  customerName: string;
  fileName: string;
  printedAt: string;
  documentCount: number;
  labelCount: number;
  rowCount: number;
}

export const mockTemplatePackages: TemplatePackage[] = [
  {
    id: "tp-1",
    customerName: "Tesla Motors",
    packageName: "Standard Parts Labeling",
    outputs: ["Delivery Note", "Label"],
    status: "locked",
    version: "v1.2",
    updatedAt: "2026-05-18T14:30:00Z",
    recommendedSetup: {
      deliveryNoteMode: "By Delivery No.",
      headerFields: ["Delivery No.", "Supplier Code", "Ship To", "PO Number"],
      lineRule: "One row per part item code, sum quantities of matching parts",
      labelQuantityRule: "One label per row",
      barcodeContent: "Part Number + Serial Code",
    },
  },
  {
    id: "tp-2",
    customerName: "Apple Inc.",
    packageName: "Retail Packaging Flow",
    outputs: ["Label"],
    status: "draft",
    version: "v1.0-draft",
    updatedAt: "2026-05-20T09:15:00Z",
    recommendedSetup: {
      deliveryNoteMode: "One document",
      headerFields: ["Order ID", "Store Name", "Carrier ID"],
      lineRule: "Split line items by product variant",
      labelQuantityRule: "By pallet count",
      barcodeContent: "QR Code (Order ID + Store Code)",
    },
  },
  {
    id: "tp-3",
    customerName: "ASML Holding",
    packageName: "Precision Tooling Delivery",
    outputs: ["Delivery Note", "Label"],
    status: "locked",
    version: "v2.0",
    updatedAt: "2026-05-15T11:00:00Z",
    recommendedSetup: {
      deliveryNoteMode: "By PO No.",
      headerFields: ["PO Number", "Project Code", "Origin Dept"],
      lineRule: "Group by line code, list serial numbers",
      labelQuantityRule: "One label per row",
      barcodeContent: "Part Number + PO Number",
    },
  },
  {
    id: "tp-4",
    customerName: "Toyota Corp",
    packageName: "Just-In-Time Kanban",
    outputs: ["Label"],
    status: "archived",
    version: "v1.1",
    updatedAt: "2026-04-10T16:45:00Z",
    recommendedSetup: {
      deliveryNoteMode: "One document",
      headerFields: ["Kanban ID", "Dock Number", "Supplier ID"],
      lineRule: "Group by dock, aggregate quantity",
      labelQuantityRule: "By package count",
      barcodeContent: "Kanban Barcode",
    },
  },
];

export const mockPrintSessions: PrintSession[] = [
  {
    id: "ps-1",
    templateId: "tp-1",
    customerName: "Tesla Motors",
    packageName: "Standard Parts Labeling",
    fileName: "tesla_parts_may21.xlsx",
    printedAt: "2026-05-21T10:12:00Z",
    rowCount: 142,
    documentCount: 8,
    labelCount: 142,
  },
  {
    id: "ps-2",
    templateId: "tp-3",
    customerName: "ASML Holding",
    packageName: "Precision Tooling Delivery",
    fileName: "asml_tools_v3_manifest.xlsx",
    printedAt: "2026-05-20T16:40:00Z",
    rowCount: 24,
    documentCount: 2,
    labelCount: 24,
  },
  {
    id: "ps-3",
    templateId: "tp-1",
    customerName: "Tesla Motors",
    packageName: "Standard Parts Labeling",
    fileName: "tesla_urgent_replenish.xlsx",
    printedAt: "2026-05-19T08:05:00Z",
    rowCount: 15,
    documentCount: 1,
    labelCount: 15,
  },
];

export const mockStats = {
  lockedCount: mockTemplatePackages.filter((tp) => tp.status === "locked").length,
  draftCount: mockTemplatePackages.filter((tp) => tp.status === "draft").length,
  totalPrintSessions: mockPrintSessions.length,
};
