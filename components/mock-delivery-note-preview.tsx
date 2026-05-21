import React from "react";

interface MockDeliveryNotePreviewProps {
  scale?: number;
  isLandscape?: boolean;
  data?: {
    customer?: string;
    packageName?: string;
    deliveryNoteMode?: string;
  };
  rows?: any[];
}

export function MockDeliveryNotePreview({ scale = 1, isLandscape = false, data, rows }: MockDeliveryNotePreviewProps) {
  const customer = data?.customer || "Tesla Motors";
  const mode = data?.deliveryNoteMode || "By Delivery No.";

  const firstRow = rows && rows.length > 0 ? rows[0] : null;
  
  const getFieldValue = (regex: RegExp, fallback: string) => {
    if (!firstRow) return fallback;
    const key = Object.keys(firstRow).find(k => regex.test(k));
    return key ? String(firstRow[key] || "").trim() : fallback;
  };

  const poNumber = getFieldValue(/po|purchase\s*order|order\s*no|po\s*no/i, "PO-88319-A");
  const docNo = getFieldValue(/delivery\s*no|dn|invoice|manifest|doc/i, "DN-2026-08912");
  const carrier = getFieldValue(/carrier|shipper|logistics/i, "DHL Freight");
  const date = getFieldValue(/date/i, "2026-05-21");
  const weight = getFieldValue(/weight/i, "1,420 kg");
  const pallets = getFieldValue(/pallet/i, "4 Units");

  // Find column keys for part, desc, qty, uom
  const keys = firstRow ? Object.keys(firstRow) : [];
  const partKey = keys.find(k => /part|item\s*code|sku|material|no|code/i.test(k) && !/po|order/i.test(k)) || keys[0] || "";
  const descKey = keys.find(k => /desc|name|title|product/i.test(k)) || keys[1] || "";
  const qtyKey = keys.find(k => /qty|quantity|pcs|pieces|count/i.test(k)) || keys[2] || "";
  const uomKey = keys.find(k => /uom|unit/i.test(k)) || "";

  const itemsToRender = rows && rows.length > 0 
    ? rows.slice(0, 4) 
    : [
        { part: "PART-9921-A1", desc: "Model 3 Rear Axle Mount Bushing", qty: "1,200", uom: "PCS" },
        { part: "PART-0043-B2", desc: "Model Y Side Pillar Reinforcement Plate", qty: "800", uom: "PCS" },
        { part: "PART-1150-C1", desc: "CyberTruck Body Panel Clip", qty: "5,000", uom: "PCS" }
      ];

  return (
    <div className="w-full flex justify-center py-4 bg-muted/20 border border-border rounded-xl overflow-hidden">
      <div 
        id="print-dn-content"
        className="bg-white text-zinc-900 border border-zinc-200 rounded-lg shadow-sm font-sans relative"
        style={{
          width: isLandscape ? "820px" : "595px",
          minHeight: isLandscape ? "595px" : "820px",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          padding: isLandscape ? "28px" : "36px",
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
            <p className="font-bold text-sm">Doc No: {docNo}</p>
            <p className="text-zinc-500 mt-0.5">Date: {date}</p>
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
            <span className="font-semibold text-zinc-800 truncate block" title={poNumber}>{poNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Carrier</span>
            <span className="font-semibold text-zinc-800 truncate block" title={carrier}>{carrier}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Weight</span>
            <span className="font-semibold text-zinc-800 truncate block" title={weight}>{weight}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">Pallets</span>
            <span className="font-semibold text-zinc-800 truncate block" title={pallets}>{pallets}</span>
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
            {itemsToRender.map((item: any, idx) => {
              const part = firstRow ? String(item[partKey] || "") : item.part;
              const desc = firstRow ? String(item[descKey] || "") : item.desc;
              const qty = firstRow ? String(item[qtyKey] || "") : item.qty;
              const uom = firstRow ? (uomKey ? String(item[uomKey] || "") : "PCS") : item.uom;
              
              return (
                <tr key={idx}>
                  <td className="py-2.5 font-bold">{idx + 1}</td>
                  <td className="py-2.5 max-w-[300px] truncate">
                    <span className="font-bold block text-zinc-850 truncate">{part}</span>
                    <span className="text-zinc-500 text-[10px] block truncate">{desc}</span>
                  </td>
                  <td className="py-2.5 text-right font-semibold">{qty}</td>
                  <td className="py-2.5 text-right text-zinc-500">{uom}</td>
                </tr>
              );
            })}
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
                    className="h-full bg-black" 
                    style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }} 
                  />
                ))}
              </div>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">*{docNo}*</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 font-medium">
            Generated automatically by PrintForm AI Engine. Certified template locked.
          </p>
        </div>
      </div>
    </div>
  );
}
