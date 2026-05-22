import React from "react";

// Code 128 character patterns (widths of bars and spaces)
const rawPatterns = "212222222122222221121223121322131222122213122312132212221213221312231212112232122132122231113222123122123221223211221132221231213212223112312131311222321122321221312212322112322211212123212321232121111323131123131321112313132113132311211313231113231311112133112331132131113123113321133121313121211331231131213113213311213131311123311321331121312113312311332111314111221411431111111224111422121124121421141122141221112214112412122114122411142112142211241211221114413111241112134111111242121142121241114212124112124211411212421112421211212141214121412121111143111341131141114113114311411113411311113141114131311141411131";
const patterns = rawPatterns.split(/(\d{6})/).filter(Boolean);

const lookup: { [key: string]: [number, string] } = {};
for (let i = 32; i < 127; i++) {
  lookup[String.fromCharCode(i)] = [i - 32, patterns[i - 32]];
}

export interface BarcodeOptions {
  height?: number;
  factor?: number;
  background?: string;
  fillColor?: string;
  responsive?: boolean;
}

/**
 * Generates an SVG string of a Code 128 barcode.
 */
export function generateCode128SvgString(value: string, options: BarcodeOptions = {}): string {
  const {
    height = 50,
    factor = 2,
    background = "white",
    fillColor = "black",
    responsive = true,
  } = options;

  // Sanitize input to only printable ASCII
  const sanitized = value.replace(/[^\x20-\x7E]/g, "");
  if (!sanitized) return "";

  let svgRects = "";
  let x = 10 * factor;
  let sum = 104; // Start B

  function draw(pattern: string) {
    if (!pattern) return;
    pattern.split("").forEach((n, idx) => {
      const width = parseInt(n, 10) * factor;
      if (idx % 2 === 0) {
        // Draw black bar
        svgRects += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="${fillColor}" />`;
      }
      x += width;
    });
  }

  // Draw Start Code B
  draw("211214");

  // Draw Data
  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const item = lookup[char];
    if (item) {
      sum += item[0] * (i + 1);
      draw(item[1]);
    }
  }

  // Draw Checksum
  const checksumIndex = sum % 103;
  draw(patterns[checksumIndex]);

  // Draw Stop Pattern (2331112)
  draw("2331112");

  const totalWidth = x + 10 * factor;
  const widthAttr = responsive ? "100%" : `${totalWidth}px`;
  const heightAttr = responsive ? "100%" : `${height}px`;

  return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${widthAttr}" height="${heightAttr}" viewBox="0 0 ${totalWidth} ${height}" preserveAspectRatio="none">
    ${background !== "transparent" ? `<rect width="100%" height="100%" fill="${background}" />` : ""}
    ${svgRects}
  </svg>`;
}

const code39Map: { [key: string]: string } = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
  "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
  "8": "100100100", "9": "001100100", "A": "100001001", "B": "001001001",
  "C": "101001000", "D": "000011001", "E": "100011000", "F": "001011000",
  "G": "000001101", "H": "100001100", "I": "001001100", "J": "000011100",
  "K": "100000011", "L": "001000011", "M": "101000010", "N": "000010011",
  "O": "100010010", "P": "001010010", "Q": "000000111", "R": "100000110",
  "S": "001000110", "T": "000010110", "U": "110000001", "V": "011000001",
  "W": "111000000", "X": "010010001", "Y": "110010000", "Z": "011010000",
  "-": "010000101", ".": "110000100", " ": "011000100", "$": "010101000",
  "/": "010100010", "+": "010001010", "%": "000101010", "*": "010010100"
};

/**
 * Generates an SVG string of a Code 39 barcode.
 */
export function generateCode39SvgString(value: string, options: BarcodeOptions = {}): string {
  const {
    height = 50,
    factor = 2,
    background = "white",
    fillColor = "black",
    responsive = true,
  } = options;

  let clean = value.toUpperCase();
  // Strip existing asterisks at start/end so we don't duplicate them
  if (clean.startsWith("*")) clean = clean.slice(1);
  if (clean.endsWith("*")) clean = clean.slice(0, -1);
  
  // Wrap with start/stop character
  const finalValue = `*${clean}*`;
  
  let svgRects = "";
  const narrowWidth = factor * 1;
  const wideWidth = factor * 2.5; // ratio is 2.5:1
  
  let x = 10 * factor; // Left padding
  
  for (let i = 0; i < finalValue.length; i++) {
    const char = finalValue[i];
    const pattern = code39Map[char];
    if (!pattern) continue; // Skip unsupported characters
    
    // Draw the 9 elements (5 bars, 4 spaces)
    for (let j = 0; j < 9; j++) {
      const isWide = pattern[j] === "1";
      const width = isWide ? wideWidth : narrowWidth;
      
      const isBar = j % 2 === 0;
      if (isBar) {
        // Draw black bar
        svgRects += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="${fillColor}" />`;
      }
      x += width;
    }
    
    // Add inter-character gap (narrow space) after each character, except the last one
    if (i < finalValue.length - 1) {
      x += narrowWidth;
    }
  }
  
  const totalWidth = x + 10 * factor;
  const widthAttr = responsive ? "100%" : `${totalWidth}px`;
  const heightAttr = responsive ? "100%" : `${height}px`;

  return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${widthAttr}" height="${heightAttr}" viewBox="0 0 ${totalWidth} ${height}" preserveAspectRatio="none">
    ${background !== "transparent" ? `<rect width="100%" height="100%" fill="${background}" />` : ""}
    ${svgRects}
  </svg>`;
}

/**
 * Barcode React component to display dynamic barcodes (Code 128 / Code 39).
 */
export function Barcode({
  value,
  height = 50,
  factor = 2,
  background = "white",
  fillColor = "black",
  responsive = true,
  className,
  style,
  format = "Code128",
}: {
  value: string;
  height?: number;
  factor?: number;
  background?: string;
  fillColor?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  format?: string;
}) {
  const svgString = format === "Code39"
    ? generateCode39SvgString(value, {
        height,
        factor,
        background,
        fillColor,
        responsive,
      })
    : generateCode128SvgString(value, {
        height,
        factor,
        background,
        fillColor,
        responsive,
      });

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        width: responsive ? "100%" : "auto",
        height: responsive ? "100%" : `${height}px`,
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}

/**
 * Resolves a dynamic barcode value from Excel row data based on a content instruction/formula.
 * Supports formulas like "采购合同序号 + ' ' + 位号" or "PO Number + '-' + Item Code".
 */
export function getBarcodeValue(
  row: any,
  barcodeContent: string | undefined,
  fallbackValue: string
): string {
  if (!row) return fallbackValue;
  if (!barcodeContent) return fallbackValue;

  const lowerContent = barcodeContent.toLowerCase().trim();
  const isStandardBarcodeType = 
    lowerContent === "code128" || 
    lowerContent === "code39" || 
    lowerContent === "qr code" ||
    lowerContent === "qr" ||
    lowerContent === "条码" ||
    lowerContent === "barcode";
  
  if (isStandardBarcodeType) {
    const barcodeKey = Object.keys(row).find(k => /barcode|条码/i.test(k));
    if (barcodeKey) {
      return String(row[barcodeKey] ?? "").trim();
    }
    return fallbackValue;
  }

  // Split formula on '+'
  const tokens = barcodeContent.split("+");
  let combined = "";
  let hasValidColumn = false;

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    // Check if it is a quoted literal string
    const matchQuoted = trimmed.match(/^['"“‘](.*)['"”’]$/);
    if (matchQuoted) {
      combined += matchQuoted[1];
    } else if (trimmed === "' '" || trimmed === '" "') {
      combined += " ";
    } else {
      // Find row key case-insensitively
      const rowKey = Object.keys(row).find(
        k => k.toLowerCase().trim() === trimmed.toLowerCase()
      );
      if (rowKey) {
        combined += String(row[rowKey] ?? "").trim();
        hasValidColumn = true;
      } else {
        // Substring match
        const subRowKey = Object.keys(row).find(
          k => trimmed.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(trimmed.toLowerCase())
        );
        if (subRowKey) {
          combined += String(row[subRowKey] ?? "").trim();
          hasValidColumn = true;
        } else {
          // If no columns are found and it looks like a non-alphanumeric delimiter (e.g. "-", "/", etc.)
          if (/^[^a-zA-Z0-9\u4e00-\u9fa5]+$/.test(trimmed)) {
            combined += trimmed;
          }
        }
      }
    }
  }

  if (hasValidColumn) {
    return combined;
  }

  // Fallback: search row keys in the entire barcodeContent
  const sortedKeys = Object.keys(row).sort((a, b) => b.length - a.length);
  let substituted = barcodeContent;
  let matchedKeys: string[] = [];
  for (const key of sortedKeys) {
    if (key && substituted.toLowerCase().includes(key.toLowerCase())) {
      const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
      substituted = substituted.replace(regex, `__VAL_${key}__`);
      matchedKeys.push(key);
    }
  }

  if (matchedKeys.length > 0) {
    let finalVal = substituted;
    for (const key of matchedKeys) {
      const val = String(row[key] ?? "").trim();
      finalVal = finalVal.replace(new RegExp(`__VAL_${key}__`, 'g'), val);
    }
    // Remove quotes and plus signs, then clean spaces
    finalVal = finalVal.replace(/['"“‘”’]/g, '');
    finalVal = finalVal.replace(/\+/g, '');
    finalVal = finalVal.trim();
    return finalVal;
  }

  return fallbackValue;
}

