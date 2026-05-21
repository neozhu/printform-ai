import React from "react";

interface MockDeliveryNotePreviewProps {
  scale?: number;
  data?: {
    customer?: string;
    packageName?: string;
    deliveryNoteMode?: string;
  };
}

export function MockDeliveryNotePreview({ scale = 1, data }: MockDeliveryNotePreviewProps) {
  const customer = data?.customer || "Tesla Motors";
  const mode = data?.deliveryNoteMode || "By Delivery No.";

  return (
    <div className="w-full flex justify-center py-4 bg-muted/20 border border-border rounded-xl overflow-hidden">
      <div 
        className="bg-white text-zinc-900 border border-zinc-200 rounded-lg shadow-sm font-sans relative"
        style={{
          width: "595px",
          minHeight: "820px",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          padding: "36px",
          fontSize: "12px",
          lineHeight: "1.5",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide">Delivery Note</h1>
            <p className="text-zinc-500 font-semibold mt-1">Client: {customer}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-sm">Doc No: DN-2026-08912</p>
            <p className="text-zinc-500 mt-0.5">Date: 2026-05-21</p>
            <p className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded inline-block font-semibold mt-1 border border-zinc-200">
              Mode: {mode}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-6 border-b border-zinc-200 pb-6">
          <div>
            <h3 className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider mb-1">From (Supplier)</h3>
            <p className="font-bold">PRINTFORM AI AUTO PARTS LTD</p>
            <p className="text-zinc-600">Industrial Park, Building 4B</p>
            <p className="text-zinc-600">Shenzhen, GD, China</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider mb-1">Ship To (Customer)</h3>
            <p className="font-bold">{customer.toUpperCase()} GIGAFACTORY</p>
            <p className="text-zinc-600">Receiving Dock 4, Building A</p>
            <p className="text-zinc-600">Austin, TX, USA</p>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-4 gap-4 bg-zinc-50 p-3 rounded mb-6 border border-zinc-200">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">PO Number</span>
            <span className="font-semibold text-zinc-800">PO-88319-A</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Carrier</span>
            <span className="font-semibold text-zinc-800">DHL Freight</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Weight</span>
            <span className="font-semibold text-zinc-800">1,420 kg</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Pallets</span>
            <span className="font-semibold text-zinc-800">4 Units</span>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase">
              <th className="py-2">Item</th>
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">UOM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            <tr>
              <td className="py-2.5 font-bold">1</td>
              <td className="py-2.5">
                <span className="font-bold block text-zinc-850">PART-9921-A1</span>
                <span className="text-zinc-500 text-[10px]">Model 3 Rear Axle Mount Bushing</span>
              </td>
              <td className="py-2.5 text-right font-semibold">1,200</td>
              <td className="py-2.5 text-right text-zinc-500">PCS</td>
            </tr>
            <tr>
              <td className="py-2.5 font-bold">2</td>
              <td className="py-2.5">
                <span className="font-bold block text-zinc-850">PART-0043-B2</span>
                <span className="text-zinc-500 text-[10px]">Model Y Side Pillar Reinforcement Plate</span>
              </td>
              <td className="py-2.5 text-right font-semibold">800</td>
              <td className="py-2.5 text-right text-zinc-500">PCS</td>
            </tr>
            <tr>
              <td className="py-2.5 font-bold">3</td>
              <td className="py-2.5">
                <span className="font-bold block text-zinc-850">PART-1150-C1</span>
                <span className="text-zinc-500 text-[10px]">CyberTruck Body Panel Clip</span>
              </td>
              <td className="py-2.5 text-right font-semibold">5,000</td>
              <td className="py-2.5 text-right text-zinc-500">PCS</td>
            </tr>
          </tbody>
        </table>

        {/* Footer message / barcodes */}
        <div className="absolute bottom-10 left-9 right-9 pt-6 border-t border-zinc-200 text-center">
          <div className="flex flex-col items-center gap-1">
            {/* Mock delivery note barcode */}
            <div className="w-48 h-8 bg-zinc-950 flex flex-col items-stretch justify-center p-0.5 rounded overflow-hidden">
              <div className="h-full bg-white flex items-center justify-around">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="h-full bg-black animate-pulse" 
                    style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }} 
                  />
                ))}
              </div>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">*DN-2026-08912*</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 font-medium">
            Generated automatically by PrintForm AI Engine. Certified template locked.
          </p>
        </div>
      </div>
    </div>
  );
}
