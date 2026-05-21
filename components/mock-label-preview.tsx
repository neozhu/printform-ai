import React from "react";

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
  const customer = data?.customer || "Tesla Motors";
  const barcodeType = data?.barcodeContent || "Code128";
  const qtyRule = data?.labelQuantityRule || "One label per row";

  const firstRow = rows && rows.length > 0 ? rows[0] : null;

  const keys = firstRow ? Object.keys(firstRow) : [];
  const partKey = keys.find(k => /part|item\s*code|sku|material|no|code/i.test(k) && !/po|order/i.test(k)) || keys[0] || "";
  const descKey = keys.find(k => /desc|name|title|product/i.test(k)) || keys[1] || "";
  const qtyKey = keys.find(k => /qty|quantity|pcs|pieces|count/i.test(k)) || keys[2] || "";
  const poKey = keys.find(k => /po|purchase\s*order|order\s*no|po\s*no/i.test(k)) || "";

  const partNumber = firstRow ? String(firstRow[partKey] || "").trim() : "PART-9921-A1";
  const description = firstRow ? String(firstRow[descKey] || "").trim() : "Rear Axle Bushing (Model 3)";
  const qtyVal = firstRow ? String(firstRow[qtyKey] || "").trim() : "1,200";
  
  const unitKey = keys.find(k => /uom|unit/i.test(k));
  const qtyUnit = firstRow && unitKey ? String(firstRow[unitKey] || "").trim() : "PCS";
  const qty = firstRow ? `${qtyVal} ${qtyUnit}` : "1,200 PCS";
  const poNumber = firstRow && poKey ? String(firstRow[poKey] || "").trim() : "PO-88319-A";

  if (layoutMappings?.htmlTemplate) {
    // Generate Barcode HTML
    let barcodeHtml = "";
    if (barcodeType === "QR Code") {
      barcodeHtml = `
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
    } else {
      barcodeHtml = `
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; margin: 0 auto;">
          <div style="width: 192px; height: 36px; background-color: #18181b; display: flex; flex-direction: column; align-items: stretch; justify-content: center; padding: 2px; border-radius: 4px; box-sizing: border-box; overflow: hidden;">
            <div style="height: 100%; background-color: white; display: flex; align-items: center; justify-content: space-around;">
              ${Array.from({ length: 30 }).map((_, i) => `
                <div style="height: 100%; background-color: black; width: ${(i % 4 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px;"></div>
              `).join('')}
            </div>
          </div>
          <span style="font-size: 8px; color: #71717a; font-family: monospace; margin-top: 4px;">*${partNumber}*</span>
        </div>
      `;
    }

    // Replace placeholders in htmlTemplate
    let renderedHtml = layoutMappings.htmlTemplate;

    // Replace dynamic Excel columns in the htmlTemplate from the first item row if available
    if (firstRow) {
      Object.keys(firstRow).forEach((colName) => {
        const val = String(firstRow[colName] ?? "");
        const regex = new RegExp(`\\{\\{\\s*${colName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*\\}\\}`, 'gi');
        renderedHtml = renderedHtml.replace(regex, val);
      });
    }

    renderedHtml = renderedHtml
      .replace(/\{\{Barcode\}\}/gi, barcodeHtml)
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
          className="bg-white text-zinc-900 border border-zinc-200 rounded-lg shadow-sm font-sans relative"
          style={{
            width: "300px",
            height: "300px",
            ...transformStyle,
            padding: 0,
            boxSizing: "border-box",
            overflow: "hidden"
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
            /* Mock Code128 Barcode */
            <div className="w-full flex flex-col items-center">
              <div className="w-48 h-9 bg-zinc-900 flex flex-col items-stretch justify-center p-0.5 rounded overflow-hidden">
                <div className="h-full bg-white flex items-center justify-around">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full bg-black"
                      style={{ width: `${(i % 4 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[8px] text-zinc-500 font-mono mt-1 truncate max-w-[240px] text-center">*{partNumber}*</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
