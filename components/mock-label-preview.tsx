import { Barcode, generateCode128SvgString, generateCode39SvgString, getBarcodeValue } from "@/lib/barcode";

interface MockLabelPreviewProps {
  scale?: number;
  data?: {
    customer?: string;
    packageName?: string;
    barcodeContent?: string;
    labelQuantityRule?: string;
  };
  rows?: any[];
  layoutImage?: string;
  layoutMappings?: any;
}

export function MockLabelPreview({
  scale = 1,
  data,
  rows,
  layoutImage,
  layoutMappings,
}: MockLabelPreviewProps) {
  const customer = data?.customer || "PREVIEW";
  const rawBarcodeType = data?.barcodeContent || "Code128";
  const barcodeType = /39|3-9/i.test(rawBarcodeType)
    ? "Code39"
    : /qr|q-r/i.test(rawBarcodeType)
      ? "QR Code"
      : "Code128";
  const qtyRule = data?.labelQuantityRule || "One label per row";

  const firstRow = rows && rows.length > 0 ? rows[0] : null;

  const keys = firstRow ? Object.keys(firstRow) : [];
  const partKey = keys.find(k => /part|item\s*code|sku|material|no|code|物料|商品|编码/i.test(k) && !/po|order/i.test(k)) || keys[0] || "";
  const descKey = keys.find(k => /desc|name|title|product|品名|名称|规格|描述/i.test(k)) || keys[1] || "";
  const qtyKey = keys.find(k => /qty|quantity|pcs|pieces|count|数量|件数/i.test(k)) || keys[2] || "";
  const poKey = keys.find(k => /po|purchase\s*order|order\s*no|po\s*no|采购|合同|订单/i.test(k)) || "";

  const partNumber = firstRow ? String(firstRow[partKey] || "").trim() : "PART-9921-A1";
  const description = firstRow ? String(firstRow[descKey] || "").trim() : "Rear Axle Bushing (Model 3)";
  const qtyVal = firstRow ? String(firstRow[qtyKey] || "").trim() : "1,200";
  
  const unitKey = keys.find(k => /uom|unit|单位/i.test(k));
  const qtyUnit = firstRow && unitKey ? String(firstRow[unitKey] || "").trim() : "PCS";
  const qty = firstRow ? `${qtyVal} ${qtyUnit}` : "1,200 PCS";
  const poNumber = firstRow && poKey ? String(firstRow[poKey] || "").trim() : "PO-88319-A";
  const labelBarcodeValue = getBarcodeValue(firstRow, rawBarcodeType, partNumber);

  if (layoutMappings?.htmlTemplate) {
    // Replace placeholders in htmlTemplate
    let renderedHtml = layoutMappings.htmlTemplate;

    // 1. Process barcode placeholders first to prevent literal column substitutions
    if (firstRow) {
      // ColumnName specific barcodes: {{Barcode:ColumnName}} or {{条码:ColumnName}}
      const barcodeColRegex = /\{\{\s*(Barcode|条码)\s*:\s*([^}]+)\s*\}\}/gi;
      renderedHtml = renderedHtml.replace(barcodeColRegex, (match: string, type: string, columnName: string) => {
        const col = columnName.trim();
        const valKey = Object.keys(firstRow).find(k => k.toLowerCase() === col.toLowerCase()) || col;
        const val = String(firstRow[valKey] ?? "").trim();
        if (!val) return "";
        const svg = barcodeType === "Code39"
          ? generateCode39SvgString(val, { height: 36, factor: 1.5, background: "white" })
          : generateCode128SvgString(val, { height: 36, factor: 1.5, background: "white" });
        return `
          <div style="width: 100%; display: flex; flex-direction: column; align-items: center; margin: 0 auto;">
            <div style="width: 192px; height: 36px; display: flex; flex-direction: column; align-items: stretch; justify-content: center; box-sizing: border-box; overflow: hidden;">
              ${svg}
            </div>
            <span style="font-size: 8px; color: #71717a; font-family: monospace; margin-top: 4px;">*${val}*</span>
          </div>
        `;
      });
    }

    // Simple sheet-level barcode: {{Barcode}} or {{条码}}
    const simpleBarcodeRegex = /\{\{\s*(Barcode|条码)\s*\}\}/gi;
    renderedHtml = renderedHtml.replace(simpleBarcodeRegex, (match: string) => {
      if (barcodeType === "QR Code") {
        return `
          <div style="width: 64px; height: 64px; border: 1px solid #18181b; padding: 2px; background-color: white; display: flex; flex-direction: column; justify-content: space-between; align-items: stretch; box-sizing: border-box; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; height: 33%;">
              <div style="width: 33%; background-color: black; border: 2px solid white;"></div>
              <div style="width: 33%; background-color: black; border: 2px solid white;"></div>
            </div>
            <div style="display: flex; justify-content: center; flex: 1; margin: 2px 0;">
              <div style="width: 50%; background-color: #18181b; display: flex; flex-direction: column; justify-content: space-around; padding: 2px;">
                <div style="height: 2px; background-color: white;"></div>
                <div style="height: 2px; background-color: white;"></div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; height: 33%;">
              <div style="width: 33%; background-color: black; border: 2px solid white;"></div>
              <div style="width: 33%; background-color: rgba(0,0,0,0.4); border: 2px solid white;"></div>
            </div>
          </div>
        `;
      }

      const barcodeValue = getBarcodeValue(firstRow, rawBarcodeType, partNumber);
      const svg = barcodeType === "Code39"
        ? generateCode39SvgString(barcodeValue, { height: 36, factor: 1.5, background: "white" })
        : generateCode128SvgString(barcodeValue, { height: 36, factor: 1.5, background: "white" });
      return `
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; margin: 0 auto;">
          <div style="width: 192px; height: 36px; display: flex; flex-direction: column; align-items: stretch; justify-content: center; box-sizing: border-box; overflow: hidden;">
            ${svg}
          </div>
          <span style="font-size: 8px; color: #71717a; font-family: monospace; margin-top: 4px;">*${barcodeValue}*</span>
        </div>
      `;
    });

    // Replace dynamic Excel columns in the htmlTemplate from the first item row if available
    if (firstRow) {
      Object.keys(firstRow).forEach((colName) => {
        const val = String(firstRow[colName] ?? "");
        const regex = new RegExp(`\\{\\{\\s*${colName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*\\}\\}`, 'gi');
        renderedHtml = renderedHtml.replace(regex, val);
      });
    }

    renderedHtml = renderedHtml
      .replace(/\{\{Customer\}\}/gi, customer)
      .replace(/\{\{Customer Name\}\}/gi, customer)
      .replace(/\{\{PartNumber\}\}/gi, partNumber)
      .replace(/\{\{Part Number\}\}/gi, partNumber)
      .replace(/\{\{part\}\}/gi, partNumber)
      .replace(/\{\{Description\}\}/gi, description)
      .replace(/\{\{desc\}\}/gi, description)
      .replace(/\{\{Qty\}\}/gi, qty)
      .replace(/\{\{qty\}\}/gi, qty)
      .replace(/\{\{Quantity\}\}/gi, qty)
      .replace(/\{\{PONumber\}\}/gi, poNumber)
      .replace(/\{\{PO Number\}\}/gi, poNumber);

    const transformStyle = scale && scale !== 1 ? {
      transform: `scale(${scale})`,
      transformOrigin: "top center" as const,
    } : {};

    return (
      <div className="min-w-full w-fit flex justify-center py-4 bg-muted/20 border border-border rounded-xl">
        <div
          id="print-lbl-content"
          className="bg-white text-zinc-900 border border-zinc-200 rounded-lg shadow-sm relative"
          style={{
            width: "300px",
            height: "300px",
            ...transformStyle,
            padding: 0,
            boxSizing: "border-box",
            overflow: "hidden",
            fontSize: "11px",
            lineHeight: "1.3",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            color: "#18181b"
          }}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    );
  }

  const transformStyle = scale && scale !== 1 ? {
    transform: `scale(${scale})`,
    transformOrigin: "top center" as const,
  } : {};

  return (
    <div className="min-w-full w-fit flex justify-center py-4 bg-muted/20 border border-border rounded-xl">
      <div
        id="print-lbl-content"
        className="bg-white text-zinc-900 border border-zinc-200 rounded-lg shadow-sm font-sans relative"
        style={{
          width: "300px",
          height: "300px",
          ...transformStyle,
          padding: "20px",
          fontSize: "11px",
          lineHeight: "1.4",
        }}
      >
        {/* Label header */}
        <div className="flex justify-between items-center border-b-2 border-zinc-950 pb-1.5 mb-2.5">
          <span className="font-bold text-xs uppercase tracking-wider truncate max-w-[170px]" title={customer}>{customer} Parts</span>
          <span className="text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono border border-zinc-200 uppercase truncate max-w-[90px]">
            {qtyRule.replace("By ", "").replace("One ", "")}
          </span>
        </div>

        {/* Part details */}
        <div className="space-y-1 mb-2.5">
          <div>
            <span className="text-[9px] text-zinc-450 font-bold block uppercase leading-none">Part Number</span>
            <span className="font-black text-sm tracking-wide text-zinc-900 truncate block" title={partNumber}>{partNumber}</span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-450 font-bold block uppercase leading-none">Description</span>
            <span className="font-bold text-zinc-800 line-clamp-2" title={description}>{description}</span>
          </div>
        </div>

        {/* Quantities & PO */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-zinc-50 p-1.5 rounded border border-zinc-200">
          <div>
            <span className="text-[8px] text-zinc-400 font-bold block uppercase leading-none">Qty</span>
            <span className="font-black text-xs text-zinc-900 truncate block" title={qty}>{qty}</span>
          </div>
          <div>
            <span className="text-[8px] text-zinc-400 font-bold block uppercase leading-none">PO Number</span>
            <span className="font-black text-xs text-zinc-900 truncate block" title={poNumber}>{poNumber}</span>
          </div>
        </div>

        {/* Barcode/QR code block */}
        <div className="flex flex-col items-center justify-center pt-2.5 border-t border-dashed border-zinc-300">
          {barcodeType === "QR Code" ? (
            /* Mock QR Code */
            <div className="w-16 h-16 border border-zinc-900 p-1 bg-white flex flex-col justify-between items-stretch">
              <div className="flex justify-between h-4">
                <div className="w-4 bg-black border-2 border-white" />
                <div className="w-4 bg-black border-2 border-white" />
              </div>
              <div className="flex justify-center flex-1 my-1">
                <div className="w-8 bg-zinc-900 flex flex-col justify-around p-0.5">
                  <div className="h-0.5 bg-white" />
                  <div className="h-0.5 bg-white" />
                  <div className="h-0.5 bg-white" />
                </div>
              </div>
              <div className="flex justify-between h-4">
                <div className="w-4 bg-black border-2 border-white" />
                <div className="w-4 bg-black/40 border-2 border-white" />
              </div>
            </div>
          ) : (
            /* Dynamic Code128 Barcode */
            <div className="w-full flex flex-col items-center">
              <Barcode 
                value={labelBarcodeValue} 
                height={36} 
                factor={1.5} 
                responsive={false} 
                format={barcodeType}
                className="w-auto h-9 border border-zinc-200 rounded overflow-hidden" 
              />
              <span className="text-[8px] text-zinc-500 font-mono mt-1 truncate max-w-[240px] text-center">*{labelBarcodeValue}*</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
