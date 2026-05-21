"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface UploadDropzoneProps {
  accept: string;
  title: string;
  subtitle?: string;
  onUpload: (fileName: string, fileDataUrl?: string) => void;
  onExcelParsed?: (data: { sheetName: string; columns: string[]; rows: any[] }) => void;
}

export function UploadDropzone({ accept, title, subtitle, onUpload, onExcelParsed }: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setUploading(true);
    setUploadedFile(null);

    const isExcelOrCsv = 
      file.name.endsWith(".xlsx") || 
      file.name.endsWith(".xls") || 
      file.name.endsWith(".csv") ||
      file.type === "text/csv" ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel";

    if (isExcelOrCsv && onExcelParsed) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error("Could not read file data");
          }
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get headers (columns)
          const headers: string[] = [];
          if (worksheet["!ref"]) {
            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            const R = range.s.r; // start row index
            for (let c = range.s.c; c <= range.e.c; ++c) {
              const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: c })];
              let hdr = "";
              if (cell && cell.t !== undefined) {
                hdr = XLSX.utils.format_cell(cell).trim();
              }
              if (!hdr) {
                hdr = `Column_${c + 1}`;
              }
              headers.push(hdr);
            }
          }
          
          // Get row data
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          // Clean keys and values
          const parsedRows = rows.map((row: any) => {
            const cleanRow: any = {};
            Object.keys(row).forEach((k) => {
              cleanRow[k.trim()] = typeof row[k] === "string" ? row[k].trim() : row[k];
            });
            return cleanRow;
          });

          // Callback with sheet data
          onExcelParsed({
            sheetName: firstSheetName,
            columns: headers,
            rows: parsedRows,
          });

          setUploading(false);
          setUploadedFile(file.name);
          onUpload(file.name);
        } catch (error) {
          console.error("Excel parsing failed:", error);
          setUploading(false);
          alert("Failed to parse Excel file. Please make sure it is a valid spreadsheet.");
        }
      };
      reader.onerror = () => {
        setUploading(false);
        alert("Failed to read file.");
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Read file as Data URL and upload
      const dataReader = new FileReader();
      dataReader.onload = (e) => {
        const result = e.target?.result as string;
        setUploading(false);
        setUploadedFile(file.name);
        onUpload(file.name, result);
      };
      dataReader.onerror = () => {
        setUploading(false);
        alert("Failed to read file.");
      };
      dataReader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const isExcel = accept.includes("xls") || accept.includes("xlsx");

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-250 ${
        isDragActive 
          ? "border-foreground bg-muted/60 scale-[0.99]" 
          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
      
      {uploading ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          <p className="text-sm font-semibold text-foreground">Uploading and analyzing document...</p>
        </div>
      ) : uploadedFile ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{uploadedFile}</p>
            <p className="text-xs text-muted-foreground mt-1">Click or drag to replace file</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
            {isExcel ? (
              <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
            ) : (
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={(e) => {
            e.stopPropagation();
            onButtonClick();
          }}>
            Select File
          </Button>
        </div>
      )}
    </div>
  );
}
