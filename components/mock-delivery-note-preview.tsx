import React from "react";
import { Barcode, generateCode128SvgString, generateCode39SvgString, getBarcodeValue } from "@/lib/barcode";

interface MockDeliveryNotePreviewProps {
  scale?: number;
  isLandscape?: boolean;
  data?: {
    customer?: string;
    packageName?: string;
    deliveryNoteMode?: string;
    barcodeContent?: string;
  };
  rows?: any[];
  layoutImage?: string;
  layoutMappings?: any;
}

export function MockDeliveryNotePreview({
  scale = 1,
  isLandscape = false,
  data,
  rows,
  layoutImage,
  layoutMappings,
}: MockDeliveryNotePreviewProps) {
  const customer = data?.customer || "PREVIEW";
  const mode = data?.deliveryNoteMode || "By Delivery No.";
  const rawBarcodeType = data?.barcodeContent || "Code128";
  const barcodeType = /39|3-9/i.test(rawBarcodeType)
    ? "Code39"
    : /qr|q-r/i.test(rawBarcodeType)
      ? "QR Code"
      : "Code128";

  const firstRow = rows && rows.length > 0 ? rows[0] : null;
  
  const getFieldValue = (regex: RegExp, fallback: string) => {
    if (!firstRow) return fallback;
    const key = Object.keys(firstRow).find(k => regex.test(k));
    return key ? String(firstRow[key] || "").trim() : fallback;
  };

  const poNumber = getFieldValue(/po|purchase\s*order|order\s*no|po\s*no|采购|合同|订单/i, "PO-88319-A");
  const docNo = getFieldValue(/delivery\s*no|dn|invoice|manifest|doc|交货|送货|发货|单号/i, "DN-2026-08912");
  const carrier = getFieldValue(/carrier|shipper|logistics|承运|货运|物流|快递/i, "DHL Freight");
  const date = getFieldValue(/date|日期/i, "2026-05-21");
  const weight = getFieldValue(/weight|重量/i, "1,420 kg");
  const pallets = getFieldValue(/pallet|托盘/i, "4 Units");

  // Find column keys for part, desc, qty, uom
  const keys = firstRow ? Object.keys(firstRow) : [];
  const partKey = keys.find(k => /part|item\s*code|sku|material|no|code|物料|商品|编码/i.test(k) && !/po|order/i.test(k)) || keys[0] || "";
  const descKey = keys.find(k => /desc|name|title|product|品名|名称|规格|描述/i.test(k)) || keys[1] || "";
  const qtyKey = keys.find(k => /qty|quantity|pcs|pieces|count|数量|件数/i.test(k)) || keys[2] || "";
  const uomKey = keys.find(k => /uom|unit|单位/i.test(k)) || "";

  const itemsToRender = rows && rows.length > 0 
    ? rows 
    : [
        { part: "PART-9921-A1", desc: "Model 3 Rear Axle Mount Bushing", qty: "1,200", uom: "PCS" },
        { part: "PART-0043-B2", desc: "Model Y Side Pillar Reinforcement Plate", qty: "800", uom: "PCS" },
        { part: "PART-1150-C1", desc: "CyberTruck Body Panel Clip", qty: "5,000", uom: "PCS" }
      ];

  if (layoutMappings?.htmlTemplate) {
    // Build the table rows HTML
    let tableRowsHtml = "";
    itemsToRender.forEach((item, idx) => {
      const part = firstRow ? String(item[partKey] || "") : item.part;
      const desc = firstRow ? String(item[descKey] || "") : item.desc;
      const qty = firstRow ? String(item[qtyKey] || "") : item.qty;
      const uom = firstRow ? (uomKey ? String(item[uomKey] || "") : "PCS") : item.uom;

      if (layoutMappings.rowTemplate) {
        let rowTemp = layoutMappings.rowTemplate;

        // 1. Process barcode placeholders first to prevent literal column substitutions
        // ColumnName specific barcodes: {{Barcode:ColumnName}} or {{条码:ColumnName}}
        const barcodeColRegex = /\{\{\s*(Barcode|条码)\s*:\s*([^}]+)\s*\}\}/gi;
        rowTemp = rowTemp.replace(barcodeColRegex, (match: string, type: string, columnName: string) => {
          const col = columnName.trim();
          const valKey = Object.keys(item).find(k => k.toLowerCase() === col.toLowerCase()) || col;
          const val = String(item[valKey] ?? "").trim();
          if (!val) return "";
          const svg = barcodeType === "Code39"
            ? generateCode39SvgString(val, { height: 18, factor: 1.2, background: "transparent" })
            : generateCode128SvgString(val, { height: 18, factor: 1.2, background: "transparent" });
          return `
            <div style="width: 100%; max-width: 100px; height: 18px; display: flex; flex-direction: column; align-items: stretch; justify-content: center; box-sizing: border-box; overflow: hidden; margin: 0 auto;">
              ${svg}
            </div>
          `;
        });

        // Simple row barcode: {{Barcode}} or {{条码}}
        const simpleBarcodeRegex = /\{\{\s*(Barcode|条码)\s*\}\}/gi;
        rowTemp = rowTemp.replace(simpleBarcodeRegex, (match: string) => {
          const barcodeValue = getBarcodeValue(item, rawBarcodeType, part);
          if (!barcodeValue) return "";
          const svg = barcodeType === "Code39"
            ? generateCode39SvgString(barcodeValue, { height: 18, factor: 1.2, background: "transparent" })
            : generateCode128SvgString(barcodeValue, { height: 18, factor: 1.2, background: "transparent" });
          return `
            <div style="width: 100%; max-width: 100px; height: 18px; display: flex; flex-direction: column; align-items: stretch; justify-content: center; box-sizing: border-box; overflow: hidden; margin: 0 auto;">
              ${svg}
            </div>
          `;
        });

        // Replace dynamic Excel columns from the item object
        Object.keys(item).forEach((colName) => {
          const val = String(item[colName] ?? "");
          const regex = new RegExp(`\\{\\{\\s*${colName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*\\}\\}`, 'gi');
          rowTemp = rowTemp.replace(regex, val);
        });

        rowTemp = rowTemp
          .replace(/\{\{Index\}\}/g, String(idx + 1))
          .replace(/\{\{part\}\}/gi, part)
          .replace(/\{\{desc\}\}/gi, desc)
          .replace(/\{\{qty\}\}/gi, qty)
          .replace(/\{\{uom\}\}/gi, uom);
        
        tableRowsHtml += rowTemp;
      } else {
        tableRowsHtml += `
          <tr style="border-bottom: 1px solid #e4e4e7;">
            <td style="padding: 8px 4px; font-weight: bold; text-align: left;">${idx + 1}</td>
            <td style="padding: 8px 4px;">
              <span style="font-weight: bold; display: block; color: #27272a;">${part}</span>
              <span style="color: #71717a; font-size: 10px; display: block;">${desc}</span>
            </td>
            <td style="padding: 8px 4px; text-align: right; font-weight: 600;">${qty}</td>
            <td style="padding: 8px 4px; text-align: right; color: #71717a;">${uom}</td>
          </tr>
        `;
      }
    });

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
          ? generateCode39SvgString(val, { height: 24, factor: 1.2, background: "white" })
          : generateCode128SvgString(val, { height: 24, factor: 1.2, background: "white" });
        return `
          <div style="width: 100%; max-width: 110px; min-width: 50px; height: 24px; display: flex; flex-direction: column; align-items: stretch; justify-content: center; box-sizing: border-box; overflow: hidden; margin: 0 auto;">
            ${svg}
          </div>
        `;
      });
    }

    // Simple sheet-level barcode: {{Barcode}} or {{条码}}
    const simpleBarcodeRegex = /\{\{\s*(Barcode|条码)\s*\}\}/gi;
    renderedHtml = renderedHtml.replace(simpleBarcodeRegex, (match: string) => {
      const barcodeValue = getBarcodeValue(firstRow, rawBarcodeType, docNo);
      const svg = barcodeType === "Code39"
        ? generateCode39SvgString(barcodeValue, { height: 24, factor: 1.2, background: "white" })
        : generateCode128SvgString(barcodeValue, { height: 24, factor: 1.2, background: "white" });
      return `
        <div style="width: 100%; max-width: 110px; min-width: 50px; height: 24px; display: flex; flex-direction: column; align-items: stretch; justify-content: center; box-sizing: border-box; overflow: hidden; margin: 0 auto;">
          ${svg}
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
      .replace(/\{\{TableRows\}\}/gi, tableRowsHtml)
      .replace(/\{\{Items\}\}/gi, tableRowsHtml)
      .replace(/\{\{Customer\}\}/gi, customer)
      .replace(/\{\{Customer Name\}\}/gi, customer)
      .replace(/\{\{DocNo\}\}/gi, docNo)
      .replace(/\{\{Doc No\}\}/gi, docNo)
      .replace(/\{\{Date\}\}/gi, date)
      .replace(/\{\{PONumber\}\}/gi, poNumber)
      .replace(/\{\{PO Number\}\}/gi, poNumber)
      .replace(/\{\{Carrier\}\}/gi, carrier);

    const transformStyle = scale && scale !== 1 ? {
      transform: `scale(${scale})`,
      transformOrigin: "top center" as const,
    } : {};

    return (
      <div className="min-w-full w-fit flex justify-center py-4 bg-muted/20  rounded-xl">
        <div
          id="print-dn-content"
          className="bg-white text-zinc-900 rounded-lg shadow-sm relative"
          style={{
            width: isLandscape ? "1123px" : "794px",
            height: isLandscape ? "794px" : "1123px",
            ...transformStyle,
            padding: 0,
            boxSizing: "border-box",
            overflow: "hidden",
            fontSize: "11px",
            lineHeight: "1.4",
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
    <div className="min-w-full w-fit flex justify-center py-4 bg-muted/20  rounded-xl">
      <div 
        id="print-dn-content"
        className="bg-white text-zinc-900 rounded-lg shadow-sm font-sans relative"
        style={{
          width: isLandscape ? "1123px" : "794px",
          minHeight: isLandscape ? "794px" : "1123px",
          ...transformStyle,
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
            <p className="text-zinc-650">Shenzhen, GD, China</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider mb-1">Ship To (Customer)</h3>
            <p className="font-bold">{customer.toUpperCase()} GIGAFACTORY</p>
            <p className="text-zinc-660">Receiving Dock 4, Building A</p>
            <p className="text-zinc-670">Austin, TX, USA</p>
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
            {/* Dynamic delivery note barcode */}
            {(() => {
              const sheetBarcodeValue = getBarcodeValue(firstRow, rawBarcodeType, docNo);
              return (
                <>
                  <Barcode 
                    value={sheetBarcodeValue} 
                    height={32} 
                    factor={1.5} 
                    responsive={false} 
                    className="w-auto h-8 border border-zinc-200 rounded overflow-hidden" 
                    format={barcodeType}
                  />
                  <span className="text-[9px] text-zinc-500 font-mono">*{sheetBarcodeValue}*</span>
                </>
              );
            })()}
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 font-medium">
            Generated automatically by PrintForm AI Engine. Certified template locked.
          </p>
        </div>
      </div>
    </div>
  );
}
