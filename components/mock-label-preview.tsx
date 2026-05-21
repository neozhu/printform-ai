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
}

export function MockLabelPreview({ scale = 1, data, rows }: MockLabelPreviewProps) {
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

  return (
    <div className="w-full flex justify-center py-4 bg-muted/20 border border-border rounded-xl overflow-hidden">
      <div
        id="print-lbl-content"
        className="bg-white text-zinc-900 border border-zinc-200 rounded-lg shadow-sm font-sans relative"
        style={{
          width: "300px",
          height: "300px",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
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
