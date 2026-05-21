import React from "react";

interface MockLabelPreviewProps {
  scale?: number;
  data?: {
    customer?: string;
    packageName?: string;
    barcodeContent?: string;
    labelQuantityRule?: string;
  };
}

export function MockLabelPreview({ scale = 1, data }: MockLabelPreviewProps) {
  const customer = data?.customer || "Tesla Motors";
  const barcodeType = data?.barcodeContent || "Code128";
  const qtyRule = data?.labelQuantityRule || "One label per row";

  return (
    <div className="w-full flex justify-center py-4 bg-muted/20 border border-border rounded-xl overflow-hidden">
      <div
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
          <span className="font-bold text-xs uppercase tracking-wider">{customer} Parts</span>
          <span className="text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono border border-zinc-200 uppercase">
            {qtyRule.replace("By ", "").replace("One ", "")}
          </span>
        </div>

        {/* Part details */}
        <div className="space-y-1 mb-2.5">
          <div>
            <span className="text-[9px] text-zinc-450 font-bold block uppercase leading-none">Part Number</span>
            <span className="font-black text-sm tracking-wide text-zinc-900">PART-9921-A1</span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-450 font-bold block uppercase leading-none">Description</span>
            <span className="font-bold text-zinc-800">Rear Axle Bushing (Model 3)</span>
          </div>
        </div>

        {/* Quantities & PO */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-zinc-50 p-1.5 rounded border border-zinc-200">
          <div>
            <span className="text-[8px] text-zinc-400 font-bold block uppercase leading-none">Qty</span>
            <span className="font-black text-xs text-zinc-900">1,200 PCS</span>
          </div>
          <div>
            <span className="text-[8px] text-zinc-400 font-bold block uppercase leading-none">PO Number</span>
            <span className="font-black text-xs text-zinc-900">PO-88319-A</span>
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
                  <div className="h-0.5 bg-white animate-pulse" />
                  <div className="h-0.5 bg-white" />
                  <div className="h-0.5 bg-white animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between h-4">
                <div className="w-4 bg-black border-2 border-white" />
                <div className="w-4 bg-black/40 border-2 border-white animate-pulse" />
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
                      className="h-full bg-black animate-pulse"
                      style={{ width: `${(i % 4 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[8px] text-zinc-500 font-mono mt-1">*PART-9921-A1*</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
